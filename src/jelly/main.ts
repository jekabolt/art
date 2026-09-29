// JELLY (after ikeryou's sketch 258): the white logo printed on a sheet of jelly, pinned on all four
// sides. The pointer (a finger while it is down) pushes the sheet aside; the sheet springs back,
// wobbles and tilts toward the viewer, and wherever it moves fast the white burns into pink, red
// and yellow, then settles white again.
//
// Physics: a grid of Verlet particles joined to their neighbours by springs, the border pinned,
// a faint pull to the rest position so it always settles. Units are CSS pixels, steps are 1/60 s.
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { DoubleSide, LinearFilter, LinearMipmapLinearFilter } from 'three/src/constants'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './jelly.css'

const phone = () => window.innerWidth <= 768
const touch = window.matchMedia('(hover: none)').matches

/** The logo in white on a transparent power-of-two square, mipmapped (it is shown much smaller). */
function logoTexture(px: number): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const pad = px * 0.02 // the pinned border of the sheet stays clear of the ink
  const k = (px - 2 * pad) / LOGO_SPAN
  g.translate(pad, pad)
  g.scale(k, k)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
  const t = new CanvasTexture(c)
  t.minFilter = LinearMipmapLinearFilter
  t.magFilter = LinearFilter
  return t
}

const canvas = document.getElementById('jelly') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: true })
renderer.setClearColor(0x000000, 1)
const scene = new Scene()
const camera = new PerspectiveCamera(50, 1, 1, 20000)

const material = new ShaderMaterial({
  transparent: true,
  side: DoubleSide,
  depthTest: false,
  uniforms: { map: { value: logoTexture(2048) } },
  vertexShader: /* glsl */ `
    attribute vec2 rate; // |velocity| per step, x and y, in px
    varying vec2 vUv;
    varying vec3 vBurn;
    void main() {
      vUv = uv;
      // fast parts lose green and blue first: white → yellow → red / pink
      vBurn = vec3(0.0, rate.y * 2.0, rate.x + rate.y);
      // and lean toward the viewer the faster they move sideways
      vec3 p = vec3(position.xy, rate.x * 50.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    varying vec2 vUv;
    varying vec3 vBurn;
    void main() {
      vec4 c = texture2D(map, vUv);
      c.rgb = clamp(c.rgb - vBurn, 0.0, 1.0);
      gl_FragColor = c;
    }
  `,
})

// --- the sheet ------------------------------------------------------------------------------------
let n = 0 // particles per side
let rest = new Float32Array(0) // rest positions, xy
let pos = new Float32Array(0)
let prev = new Float32Array(0)
let pinned = new Uint8Array(0)
let spacing = 1
let mesh: Mesh | null = null
let rate = new Float32Array(0)

function build(side: number) {
  n = phone() ? 26 : 44
  spacing = side / (n - 1)
  const count = n * n
  rest = new Float32Array(count * 2)
  pinned = new Uint8Array(count)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c
      rest[i * 2] = -side / 2 + c * spacing
      rest[i * 2 + 1] = side / 2 - r * spacing // row 0 on top, as PlaneGeometry lays it out
      pinned[i] = r === 0 || c === 0 || r === n - 1 || c === n - 1 ? 1 : 0
    }
  }
  pos = rest.slice()
  prev = rest.slice()
  rate = new Float32Array(count * 2)

  if (mesh) {
    scene.remove(mesh)
    mesh.geometry.dispose()
  }
  const geo = new PlaneGeometry(1, 1, n - 1, n - 1)
  geo.setAttribute('rate', new BufferAttribute(rate, 2))
  mesh = new Mesh(geo, material)
  mesh.frustumCulled = false
  scene.add(mesh)
  writeGeometry()
}

function writeGeometry() {
  if (!mesh) return
  const p = mesh.geometry.attributes.position as BufferAttribute
  const arr = p.array as Float32Array
  for (let i = 0; i < n * n; i++) {
    arr[i * 3] = pos[i * 2]
    arr[i * 3 + 1] = pos[i * 2 + 1]
    arr[i * 3 + 2] = 0
  }
  p.needsUpdate = true
  ;(mesh.geometry.attributes.rate as BufferAttribute).needsUpdate = true
}

// --- pointer --------------------------------------------------------------------------------------
const pointer = { x: 0, y: 0, down: false, inside: false }
let radius = 20

function toScene(e: PointerEvent) {
  pointer.x = e.clientX - window.innerWidth / 2
  pointer.y = window.innerHeight / 2 - e.clientY
}
canvas.addEventListener('pointerdown', (e) => {
  toScene(e)
  pointer.down = true
  pointer.inside = true
})
canvas.addEventListener('pointermove', (e) => {
  toScene(e)
  pointer.inside = true
})
const up = () => {
  pointer.down = false
  if (touch) pointer.inside = false
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
canvas.addEventListener('pointerleave', () => (pointer.inside = false))

// --- step -----------------------------------------------------------------------------------------
const DAMP = 0.97 // velocity kept per step
const STIFF = 0.6 // spring correction per iteration
const HOME = 0.003 // pull toward the rest position per step
const ITER = 2

function step() {
  const count = n * n
  for (let i = 0; i < count; i++) {
    if (pinned[i]) continue
    const x = i * 2
    const y = x + 1
    const vx = (pos[x] - prev[x]) * DAMP
    const vy = (pos[y] - prev[y]) * DAMP
    prev[x] = pos[x]
    prev[y] = pos[y]
    pos[x] += vx + (rest[x] - pos[x]) * HOME
    pos[y] += vy + (rest[y] - pos[y]) * HOME
  }

  // the pointer: a round stamp that shoves the sheet out of its way
  const active = pointer.inside && (!touch || pointer.down)
  if (active) {
    const r2 = radius * radius
    for (let i = 0; i < count; i++) {
      if (pinned[i]) continue
      const dx = pos[i * 2] - pointer.x
      const dy = pos[i * 2 + 1] - pointer.y
      const d2 = dx * dx + dy * dy
      if (d2 < r2 && d2 > 1e-6) {
        const d = Math.sqrt(d2)
        pos[i * 2] = pointer.x + (dx / d) * radius
        pos[i * 2 + 1] = pointer.y + (dy / d) * radius
      }
    }
  }

  for (let it = 0; it < ITER; it++) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const i = r * n + c
        if (c < n - 1) spring(i, i + 1)
        if (r < n - 1) spring(i, i + n)
      }
    }
  }

  for (let i = 0; i < count; i++) {
    rate[i * 2] = Math.abs(pos[i * 2] - prev[i * 2])
    rate[i * 2 + 1] = Math.abs(pos[i * 2 + 1] - prev[i * 2 + 1])
  }
}

function spring(a: number, b: number) {
  const ax = a * 2
  const bx = b * 2
  const dx = pos[bx] - pos[ax]
  const dy = pos[bx + 1] - pos[ax + 1]
  const d = Math.sqrt(dx * dx + dy * dy) || 1e-6
  const k = ((d - spacing) / d) * STIFF
  const pa = pinned[a]
  const pb = pinned[b]
  if (pa && pb) return
  const wa = pa ? 0 : pb ? 1 : 0.5
  const wb = pb ? 0 : pa ? 1 : 0.5
  pos[ax] += dx * k * wa
  pos[ax + 1] += dy * k * wa
  pos[bx] -= dx * k * wb
  pos[bx + 1] -= dy * k * wb
}

// --- size and loop --------------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  // one scene unit = one CSS pixel at z = 0
  camera.position.z = h / 2 / Math.tan((camera.fov * Math.PI) / 360)
  camera.updateProjectionMatrix()
  // as wide as the mark on the logo pages
  const side = Math.min(phone() ? 0.6 * w : 0.3 * w, 0.6 * h)
  radius = side * (touch ? 0.08 : 0.06)
  build(side)
}

let last = performance.now()
let acc = 0
function frame(now: number) {
  acc += Math.min(100, now - last)
  last = now
  // fixed 60 Hz steps, so a 120 Hz screen and a slow phone wobble alike
  while (acc >= 1000 / 60) {
    step()
    acc -= 1000 / 60
  }
  writeGeometry()
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
