// FILINGS: a steel magnet cut in the shape of the logo, floating in the dark, and on it a thick coat
// of fine hot-pink filings standing up like fur — the way filings bristle on a magnet, leaning
// outwards over every edge. Brush it with a finger and the fur parts and lies down the way you
// stroke it, then slowly springs back up; drag in the space round it and the magnet turns; a tap
// knocks it and the whole coat shivers.
// The lean of each filing at rest comes from the field: the gradient of the strokes, blurred, so the
// ones near an edge tip out over it and the ones in the middle stand straight.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { haptic } from '../core/haptic'
import { logoBars } from '../core/logo-bars'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './filings.css'

const LOOK = {
  hairs: { phone: 16000, wide: 24000 },
  length: [0.028, 0.06], // a filing, in mark widths
  thick: 0.0016,
  depth: 0.1, // the magnet's thickness
  pink: 0xff1f8e,
  markXs: 0.72, // the mark's width / the screen's width
  markLg: 0.34,
  brush: 0.075, // the finger's reach in the fur
  rest: { x: -0.42, y: 0.38 }, // radians: tilted so the fur and the walls show
}

const canvas = document.getElementById('filings') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(0x000000, 1)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50)
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture
const key = new THREE.DirectionalLight(0xffffff, 1.6)
key.position.set(-1, 1.4, 2)
scene.add(key)

const turn = new THREE.Group() // turned by dragging the space round it
scene.add(turn)
const body = new THREE.Group() // the magnet and its fur, in mark units: x right, y up, top face at z = 0
turn.add(body)

// --- the magnet: the logo's bars as boxes, polished steel --------------------------------------------
const k = 1 / LOGO_SPAN
const toX = (lx: number) => (lx - 300) * k
const toY = (ly: number) => (300 - ly) * k
const steel = new THREE.MeshPhysicalMaterial({ color: 0x7d8088, metalness: 1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.4 })
for (const s of logoBars()) {
  const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
  const box = new THREE.Mesh(new THREE.BoxGeometry(len * k, LOGO_STROKE * k, LOOK.depth), steel)
  box.position.set(toX((s.ax + s.bx) / 2), toY((s.ay + s.by) / 2), -LOOK.depth / 2)
  box.rotation.z = -Math.atan2(s.by - s.ay, s.bx - s.ax)
  body.add(box)
}

// --- the field over the top face: the strokes on a grid, a mask and a blurred charge ------------------
const N = 320
const mask = new Uint8Array(N * N)
const pot = new Float32Array(N * N)
{
  const c = document.createElement('canvas')
  c.width = c.height = N
  const x = c.getContext('2d', { willReadFrequently: true })!
  const layer = (blur: number) => {
    x.clearRect(0, 0, N, N)
    x.save()
    if (blur) x.filter = `blur(${blur}px)`
    x.scale(N / LOGO_SPAN, N / LOGO_SPAN)
    x.translate(-LOGO_MIN, -LOGO_MIN)
    x.lineWidth = LOGO_STROKE
    x.stroke(new Path2D(LOGO_PATH))
    x.restore()
    return x.getImageData(0, 0, N, N).data
  }
  const sharp = layer(0)
  const soft = layer(4)
  for (let i = 0; i < N * N; i++) {
    mask[i] = sharp[i * 4 + 3] > 200 ? 1 : 0
    pot[i] = soft[i * 4 + 3] / 255
  }
}
// grid cell of a point in mark units (the mark spans -0.5..0.5 around its centre)
const gridOf = (mx: number, my: number) => {
  const i = Math.floor((mx + (300 - LOGO_MIN) * k) * N)
  const j = Math.floor(((300 - LOGO_MIN) * k - my) * N)
  return i < 1 || j < 1 || i >= N - 1 || j >= N - 1 ? -1 : j * N + i
}

// --- the fur ----------------------------------------------------------------------------------------
const phone = Math.min(innerWidth, innerHeight) < 600
const COUNT = phone ? LOOK.hairs.phone : LOOK.hairs.wide
const hx = new Float32Array(COUNT) // root
const hy = new Float32Array(COUNT)
const len = new Float32Array(COUNT)
const rx = new Float32Array(COUNT) // lean at rest (tip offset per unit height)
const ry = new Float32Array(COUNT)
const ox = new Float32Array(COUNT) // lean now
const oy = new Float32Array(COUNT)
const vx = new Float32Array(COUNT) // … its speed
const vy = new Float32Array(COUNT)
const sx = new Float32Array(COUNT) // the lean it has been combed into, fading back to rest
const sy = new Float32Array(COUNT)
{
  let n = 0
  while (n < COUNT) {
    const mx = Math.random() - 0.5 // the mark spans -0.5..0.5
    const my = Math.random() - 0.5
    const g = gridOf(mx, my)
    if (g < 0 || !mask[g]) continue
    // the field: the charge's slope points into the stroke, the filings lean out along it
    const gx = (pot[g + 1] - pot[g - 1]) * 0.5
    const gy = -(pot[g + N] - pot[g - N]) * 0.5
    const m = Math.hypot(gx, gy)
    // they gather on the edges, where the pull is strongest
    if (Math.random() > 0.35 + 0.65 * Math.min(1, m * 8)) continue
    const lean = Math.min(1.1, m * 9)
    const jitter = 0.18
    rx[n] = m > 1e-4 ? (-gx / m) * lean : 0
    ry[n] = m > 1e-4 ? (-gy / m) * lean : 0
    rx[n] += (Math.random() - 0.5) * jitter
    ry[n] += (Math.random() - 0.5) * jitter
    hx[n] = mx
    hy[n] = my
    len[n] = LOOK.length[0] + Math.random() * (LOOK.length[1] - LOOK.length[0]) * (0.6 + 0.4 * Math.min(1, m * 8))
    ox[n] = sx[n] = rx[n]
    oy[n] = sy[n] = ry[n]
    n++
  }
}
// a filing: a thin square rod from the root up +z; darker at the root (the coat shades itself)
const rod = new THREE.BoxGeometry(LOOK.thick, LOOK.thick, 1)
rod.translate(0, 0, 0.5)
{
  const p = rod.attributes.position
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) col.fill(0.25 + 0.75 * p.getZ(i), i * 3, i * 3 + 3)
  rod.setAttribute('color', new THREE.BufferAttribute(col, 3))
}
const fur = new THREE.InstancedMesh(rod, new THREE.MeshStandardMaterial({ color: LOOK.pink, vertexColors: true, roughness: 0.55, metalness: 0, envMapIntensity: 0.55 }), COUNT)
fur.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
{
  const c = new THREE.Color()
  for (let i = 0; i < COUNT; i++) fur.setColorAt(i, c.setScalar(0.75 + Math.random() * 0.4))
}
fur.frustumCulled = false
body.add(fur)

// --- input: brush the fur, or turn the magnet ---------------------------------------------------------
const ray = new THREE.Raycaster()
const face = new THREE.Plane()
const hit = new THREE.Vector3()
const inv = new THREE.Matrix4()
// the pointer on the top face, in mark units, or null
function onFace(e: PointerEvent): { x: number; y: number } | null {
  const r = canvas.getBoundingClientRect()
  ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera)
  inv.copy(body.matrixWorld).invert()
  ray.ray.applyMatrix4(inv)
  face.set(new THREE.Vector3(0, 0, 1), 0)
  if (!ray.ray.intersectPlane(face, hit)) return null
  return { x: hit.x, y: hit.y }
}
const nearFur = (p: { x: number; y: number }) => {
  for (let a = 0; a < 8; a++) {
    const g = gridOf(p.x + Math.cos(a) * 0.03, p.y + Math.sin(a) * 0.03)
    if (g >= 0 && mask[g]) return true
  }
  const g = gridOf(p.x, p.y)
  return g >= 0 && mask[g] === 1
}

let pose = { x: 0, y: 0 }
let spin = { x: 0, y: 0 }
let grip: { id: number; mode: 'brush' | 'turn'; x: number; y: number; t: number; sx: number; sy: number; at: { x: number; y: number } | null } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  const at = onFace(e)
  grip = { id: e.pointerId, mode: at && nearFur(at) ? 'brush' : 'turn', x: e.clientX, y: e.clientY, t: performance.now(), sx: e.clientX, sy: e.clientY, at }
})
canvas.addEventListener('pointermove', (e) => {
  if (!grip || e.pointerId !== grip.id) return
  if (grip.mode === 'turn') {
    spin.y = (e.clientX - grip.x) * 0.0035
    spin.x = (e.clientY - grip.y) * 0.0035
    pose.y = Math.max(-1.2, Math.min(1.2, pose.y + spin.y))
    pose.x = Math.max(-1.1, Math.min(1.1, pose.x + spin.x))
  } else {
    const at = onFace(e)
    if (at && grip.at) brush(grip.at, at)
    grip.at = at
  }
  grip.x = e.clientX
  grip.y = e.clientY
})
const release = (e: PointerEvent) => {
  if (!grip || e.pointerId !== grip.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - grip.sx, e.clientY - grip.sy) < 10 && performance.now() - grip.t < 280
  if (grip.mode === 'brush') pressAt = null
  grip = null
  if (tap) knock()
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// combing: the filings under the finger are pushed the way it moves and stay that way a while
let pressAt: { x: number; y: number } | null = null
function brush(a: { x: number; y: number }, b: { x: number; y: number }) {
  pressAt = b
  const dx = b.x - a.x
  const dy = b.y - a.y
  const R = LOOK.brush
  for (let i = 0; i < COUNT; i++) {
    // nearest point of the stroke a→b, so a fast swipe combs its whole path
    const ax = hx[i] - a.x
    const ay = hy[i] - a.y
    const l2 = dx * dx + dy * dy
    const t = l2 > 0 ? Math.max(0, Math.min(1, (ax * dx + ay * dy) / l2)) : 0
    const ex = ax - dx * t
    const ey = ay - dy * t
    const d = Math.hypot(ex, ey)
    if (d > R) continue
    const f = (1 - d / R) ** 2
    ox[i] += dx * f * 30
    oy[i] += dy * f * 30
    sx[i] += dx * f * 20
    sy[i] += dy * f * 20
    const m = Math.hypot(sx[i], sy[i])
    if (m > 1.3) {
      sx[i] *= 1.3 / m
      sy[i] *= 1.3 / m
    }
  }
}

function knock() {
  for (let i = 0; i < COUNT; i++) {
    vx[i] += (Math.random() - 0.5) * 9
    vy[i] += (Math.random() - 0.5) * 9
  }
  haptic([12, 25, 12, 25, 12])
}

// --- frame ------------------------------------------------------------------------------------------
function resize() {
  const w = innerWidth
  const h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  const share = w <= 768 ? LOOK.markXs : LOOK.markLg
  const visibleW = 1 / share
  const visibleH = Math.max(visibleW / camera.aspect, 1.5)
  camera.position.set(0, 0, visibleH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

const up = new THREE.Vector3(0, 0, 1)
const dir = new THREE.Vector3()
const q = new THREE.Quaternion()
const at = new THREE.Vector3()
const sc = new THREE.Vector3()
const mtx = new THREE.Matrix4()
let last = performance.now()
const t0 = last
function frame(now: number) {
  const dt = Math.min(0.04, (now - last) / 1000)
  last = now
  const t = (now - t0) / 1000

  if (!grip || grip.mode !== 'turn') {
    // let go: a little glide, then a slow drift back towards the rest pose
    pose.y = Math.max(-1.2, Math.min(1.2, pose.y + spin.y))
    pose.x = Math.max(-1.1, Math.min(1.1, pose.x + spin.x))
    spin.x *= 0.9
    spin.y *= 0.9
    pose.x *= 0.985
    pose.y *= 0.985
  }
  turn.rotation.set(LOOK.rest.x + pose.x + Math.sin(t * 0.3) * 0.04, LOOK.rest.y + pose.y + Math.sin(t * 0.23 + 1) * 0.06, 0)

  const fade = Math.exp(-dt * 0.18) // combed fur slowly stands back up
  const damp = Math.exp(-dt * 7)
  for (let i = 0; i < COUNT; i++) {
    sx[i] = rx[i] + (sx[i] - rx[i]) * fade
    sy[i] = ry[i] + (sy[i] - ry[i]) * fade
    // a finger held in the fur parts it round the fingertip
    if (pressAt) {
      const ex = hx[i] - pressAt.x
      const ey = hy[i] - pressAt.y
      const d = Math.hypot(ex, ey)
      if (d < LOOK.brush * 0.8 && d > 1e-5) {
        const f = (1 - d / (LOOK.brush * 0.8)) * dt * 6
        sx[i] += (ex / d) * f
        sy[i] += (ey / d) * f
      }
    }
    // springy: each filing swings about the lean it has been given
    vx[i] = (vx[i] + (sx[i] - ox[i]) * 160 * dt) * damp
    vy[i] = (vy[i] + (sy[i] - oy[i]) * 160 * dt) * damp
    ox[i] += vx[i] * dt
    oy[i] += vy[i] * dt
    dir.set(ox[i], oy[i], 1).normalize()
    q.setFromUnitVectors(up, dir)
    at.set(hx[i], hy[i], 0)
    sc.set(1, 1, len[i])
    mtx.compose(at, q, sc)
    fur.setMatrixAt(i, mtx)
  }
  fur.instanceMatrix.needsUpdate = true
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
