// CLOTH: a square of shiny holographic film printed with the logo (2.5% border), floating in the dark. It is a
// real cloth: a grid of particles held by stretch, shear and bend springs (Verlet, a dozen passes of
// constraints a frame). Grab it with a finger and it follows and crumples; drag in the space round
// it and the whole sheet turns; a tap pokes it and a wave runs through. Left alone it slowly
// smooths itself back out, the way a sheet of foil half-remembers being flat.
// The film: a colour gradient with the logo in black, a clear lacquer reflecting a studio, and a
// thin-film shift — the colour slides through the spectrum with the angle you look at it from.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './cloth.css'

const LOOK = {
  nx: 36, // particles across
  ny: 36, // … and down (a square sheet)
  w: 1,
  h: 1,
  margin: 0.025, // the print's border round the logo, sheet widths
  passes: 12,
  damping: 0.985,
  memory: 0.0025, // pull back towards the sheet's resting drape, per frame
  sheetXs: 0.7, // sheet width / screen width on a phone
  sheetLg: 0.3,
}

// --- the print ---------------------------------------------------------------------------------------------
function print(): HTMLCanvasElement {
  const W = 1024
  const H = Math.round(W * (LOOK.h / LOOK.w))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#e9e4ff')
  grad.addColorStop(0.28, '#7d8cff')
  grad.addColorStop(0.55, '#a77cf2')
  grad.addColorStop(0.8, '#ff9f7a')
  grad.addColorStop(1, '#ffd9b8')
  g.fillStyle = grad
  g.fillRect(0, 0, W, H)
  // a soft bloom of light in one corner, as on a holographic foil
  const r = g.createRadialGradient(W * 0.25, H * 0.3, 0, W * 0.25, H * 0.3, W * 0.7)
  r.addColorStop(0, 'rgba(255,255,255,0.45)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, W, H)
  // the logo, edge to edge but for the border
  const m = W * LOOK.margin
  g.save()
  g.translate(m, m)
  g.scale((W - 2 * m) / LOGO_SPAN, (W - 2 * m) / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#0a0a0a'
  g.stroke(new Path2D(LOGO_PATH))
  g.restore()
  return c
}

// --- scene ------------------------------------------------------------------------------------------------
const canvas = document.getElementById('cloth') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setClearColor(0x000000, 1)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50)
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture

const tex = new THREE.CanvasTexture(print())
tex.encoding = THREE.sRGBEncoding
tex.anisotropy = 8

const material = new THREE.MeshPhysicalMaterial({
  map: tex,
  side: THREE.DoubleSide,
  roughness: 0.2,
  metalness: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.6,
})
// thin film: the colour slides through the spectrum with the angle of view (r137 has no iridescence)
material.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    /* glsl */ `
    {
      vec3 nv = normalize(normal);
      float facing = abs(dot(nv, normalize(vViewPosition)));
      vec3 film = 0.5 + 0.5 * cos(6.2831 * (facing * 1.6 + vec3(0.0, 0.33, 0.67)));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * (0.6 + film * 0.8), 0.28);
    }
    #include <dithering_fragment>`,
  )
}

// --- the cloth ---------------------------------------------------------------------------------------------
const { nx, ny } = LOOK
const N = nx * ny
const pos = new Float32Array(N * 3)
const prev = new Float32Array(N * 3)
const rest = new Float32Array(N * 3) // the flat sheet, about its centre
for (let j = 0; j < ny; j++) {
  for (let i = 0; i < nx; i++) {
    const k = (j * nx + i) * 3
    rest[k] = (i / (nx - 1) - 0.5) * LOOK.w
    rest[k + 1] = (0.5 - j / (ny - 1)) * LOOK.h
    // the drape it remembers: a couple of soft folds, never a flat card
    const x = rest[k]
    const y = rest[k + 1]
    rest[k + 2] = 0.07 * Math.sin(x * 3.4 + y * 1.2 + 0.6) + 0.05 * Math.cos(y * 4.1 - x * 0.8) + 0.03 * Math.sin((x + y) * 7.0)
  }
}
for (let n = 0; n < N; n++) {
  const k = n * 3
  const x = rest[k]
  const y = rest[k + 1]
  pos[k] = x
  pos[k + 1] = y
  pos[k + 2] = rest[k + 2]
}
prev.set(pos)

type Link = [number, number, number] // a, b, rest length
const links: Link[] = []
const id = (i: number, j: number) => j * nx + i
// spring lengths from the flat sheet (the drape is bent, not stretched)
const dist0 = (a: number, b: number) =>
  Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1])
const link = (a: number, b: number) => links.push([a, b, dist0(a, b)])
for (let j = 0; j < ny; j++) {
  for (let i = 0; i < nx; i++) {
    if (i + 1 < nx) link(id(i, j), id(i + 1, j))
    if (j + 1 < ny) link(id(i, j), id(i, j + 1))
    if (i + 1 < nx && j + 1 < ny) {
      link(id(i, j), id(i + 1, j + 1))
      link(id(i + 1, j), id(i, j + 1))
    }
    if (i + 2 < nx) link(id(i, j), id(i + 2, j)) // bend
    if (j + 2 < ny) link(id(i, j), id(i, j + 2))
  }
}

const geometry = new THREE.PlaneGeometry(LOOK.w, LOOK.h, nx - 1, ny - 1)
const posAttr = geometry.attributes.position as THREE.BufferAttribute
posAttr.setUsage(THREE.DynamicDrawUsage)
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// orientation of the sheet's memory (turning the sheet turns what it remembers too)
const memoryTurn = new THREE.Quaternion()

// --- input ---------------------------------------------------------------------------------------------------
const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let grab: { n: number; plane: THREE.Plane; target: THREE.Vector3 } | null = null
let turn: { x: number; y: number } | null = null
let spin = { x: 0, y: 0 } // radians a frame, decaying
let press: { x: number; y: number; t: number; onCloth: boolean; hit?: THREE.Intersection } | null = null

const toNdc = (e: PointerEvent) => ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  ray.setFromCamera(toNdc(e), camera)
  const hit = ray.intersectObject(mesh)[0]
  press = { x: e.clientX, y: e.clientY, t: performance.now(), onCloth: !!hit, hit }
  if (hit && hit.face) {
    // the nearest particle of the hit triangle
    let best = hit.face.a
    let bd = Infinity
    for (const v of [hit.face.a, hit.face.b, hit.face.c]) {
      const d = hit.point.distanceToSquared(new THREE.Vector3(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]))
      if (d < bd) {
        bd = d
        best = v
      }
    }
    const normal = camera.getWorldDirection(new THREE.Vector3()).negate()
    grab = { n: best, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, hit.point), target: hit.point.clone() }
  } else {
    turn = { x: e.clientX, y: e.clientY }
  }
})
canvas.addEventListener('pointermove', (e) => {
  if (grab) {
    ray.setFromCamera(toNdc(e), camera)
    ray.ray.intersectPlane(grab.plane, grab.target)
  } else if (turn) {
    spin.y = (e.clientX - turn.x) * 0.006
    spin.x = (e.clientY - turn.y) * 0.006
    turn = { x: e.clientX, y: e.clientY }
  }
})
const up = (e: PointerEvent) => {
  const tap = press && e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 300
  if (tap && press!.onCloth && press!.hit) poke(press!.hit)
  grab = null
  turn = null
  press = null
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

/** A poke: the particles round the hit are pushed away from the eye; the springs carry it on. */
function poke(hit: THREE.Intersection) {
  const push = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.035)
  for (let n = 0; n < N; n++) {
    const k = n * 3
    const d = Math.hypot(pos[k] - hit.point.x, pos[k + 1] - hit.point.y, pos[k + 2] - hit.point.z)
    const f = Math.exp(-(d * d) / 0.012)
    prev[k] -= push.x * f
    prev[k + 1] -= push.y * f
    prev[k + 2] -= push.z * f
  }
}

// --- simulation -------------------------------------------------------------------------------------------
const centre = new THREE.Vector3()
const q = new THREE.Quaternion()
const e3 = new THREE.Euler()
const v = new THREE.Vector3()

function step(t: number) {
  // centroid
  centre.set(0, 0, 0)
  for (let n = 0; n < N; n++) centre.add(v.set(pos[n * 3], pos[n * 3 + 1], pos[n * 3 + 2]))
  centre.divideScalar(N)

  // turning: rotate the whole sheet (and its memory) about its centre
  if (!turn) {
    spin.x *= 0.92
    spin.y *= 0.92
  }
  const sx = spin.x + Math.sin(t * 0.4) * 0.0008
  const sy = spin.y + Math.sin(t * 0.27 + 1) * 0.0012
  q.setFromEuler(e3.set(sx, sy, 0))
  memoryTurn.premultiply(q)
  for (let n = 0; n < N; n++) {
    const k = n * 3
    for (const arr of [pos, prev]) {
      v.set(arr[k] - centre.x, arr[k + 1] - centre.y, arr[k + 2] - centre.z).applyQuaternion(q)
      arr[k] = v.x + centre.x
      arr[k + 1] = v.y + centre.y
      arr[k + 2] = v.z + centre.z
    }
  }

  // Verlet + memory (towards the flat sheet, turned as the sheet is) + a drift home to the middle
  for (let n = 0; n < N; n++) {
    const k = n * 3
    v.set(rest[k], rest[k + 1], rest[k + 2]).applyQuaternion(memoryTurn).add(centre)
    const flutter = Math.sin(t * 1.3 + rest[k] * 4.0 + rest[k + 1] * 3.0) * 0.00004
    for (let a = 0; a < 3; a++) {
      const p = pos[k + a]
      const vel = (p - prev[k + a]) * LOOK.damping
      prev[k + a] = p
      const home = (v.getComponent(a) - p) * LOOK.memory - centre.getComponent(a) * 0.002
      pos[k + a] = p + vel + home + (a === 2 ? flutter : 0)
    }
  }

  // springs
  for (let pass = 0; pass < LOOK.passes; pass++) {
    for (let l = 0; l < links.length; l++) {
      const [a, b, len] = links[l]
      const ka = a * 3
      const kb = b * 3
      const dx = pos[kb] - pos[ka]
      const dy = pos[kb + 1] - pos[ka + 1]
      const dz = pos[kb + 2] - pos[ka + 2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6
      const s = ((d - len) / d) * 0.5
      pos[ka] += dx * s
      pos[ka + 1] += dy * s
      pos[ka + 2] += dz * s
      pos[kb] -= dx * s
      pos[kb + 1] -= dy * s
      pos[kb + 2] -= dz * s
    }
    if (grab) {
      const k = grab.n * 3
      pos[k] = grab.target.x
      pos[k + 1] = grab.target.y
      pos[k + 2] = grab.target.z
    }
  }
}

function resize() {
  const w = innerWidth
  const h = innerHeight
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  const share = Math.min(w <= 768 ? LOOK.sheetXs : LOOK.sheetLg, (0.55 * h) / w)
  const visibleW = LOOK.w / share
  camera.position.set(0, 0, visibleW / camera.aspect / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

const t0 = performance.now()
function frame(now: number) {
  step((now - t0) / 1000)
  const arr = posAttr.array as Float32Array
  arr.set(pos)
  posAttr.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
