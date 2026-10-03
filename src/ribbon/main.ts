// RIBBON: rows of white paper ribbons stretched across a dark grey panel, the logo printed across
// them in black. At rest they lie flat and the print reads whole. A tap sends a front out from the
// finger that twists them — the middle row stays flat, every row out from it half a turn more, so the
// lenses multiply towards the top and bottom and the print is scattered into slivers — and the twist
// slowly turns. Tap again and they unwind back into the logo. A finger dragged across them twists them
// round itself as it passes.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './ribbon.css'

const LOOK = {
  rows: 19,
  segs: 360, // along a ribbon
  fill: 0.84, // a ribbon's width, a share of the row pitch
  art: 0.9, // the panel's side, a share of the screen's shorter side
  logo: 0.86, // the logo's width, a share of the panel
  grey: 0x5d5d5d,
}

// --- the print: the black logo on white paper, over the whole panel -------------------------------------
function printTexture() {
  const n = 2048
  const c = document.createElement('canvas')
  c.width = c.height = n
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, n, n)
  const s = n * LOOK.logo
  g.translate((n - s) / 2, (n - s) / 2)
  g.scale(s / LOGO_SPAN, s / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#111'
  g.stroke(new Path2D(LOGO_PATH))
  const t = new THREE.CanvasTexture(c)
  t.encoding = THREE.sRGBEncoding
  t.anisotropy = 8
  return t
}

// --- scene: a grey panel, a lamp up-left casting soft shadows -------------------------------------------------
const canvas = document.getElementById('ribbon') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setClearColor(new THREE.Color(0x5e5e5e).convertSRGBToLinear(), 1)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.VSMShadowMap
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100)

const lamp = new THREE.DirectionalLight(0xffffff, 1.05)
lamp.position.set(-0.55, 0.75, 1.6)
lamp.castShadow = true
lamp.shadow.mapSize.set(1024, 1024)
Object.assign(lamp.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, near: 0.1, far: 5 })
lamp.shadow.radius = 14
lamp.shadow.blurSamples = 24
lamp.shadow.bias = -0.0004
scene.add(lamp)
scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 0.55))

const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshLambertMaterial({ color: new THREE.Color(0x5a5a5a).convertSRGBToLinear() }))
panel.position.z = -0.05
panel.receiveShadow = true
scene.add(panel)

// --- the ribbons: the panel is 1 wide, -0.5..0.5 ---------------------------------------------------------------
const R = LOOK.rows
const S = LOOK.segs
const pitch = 1 / R
const half = (pitch * LOOK.fill) / 2
const printed = new THREE.MeshStandardMaterial({ map: printTexture(), roughness: 0.9, side: THREE.FrontSide })
const back = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.BackSide })
const ribbons: { geo: THREE.BufferGeometry; y: number; v: number }[] = []
for (let r = 0; r < R; r++) {
  const geo = new THREE.PlaneGeometry(1, 1, S, 1) // x along, two rows of vertices across
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((S + 1) * 2 * 3), 3))
  const y = 0.5 - pitch * (r + 0.5)
  // the print's slice for this ribbon
  const uv = geo.attributes.uv.array as Float32Array
  for (let i = 0; i <= S; i++) {
    uv[i * 2 + 1] = y + half + 0.5
    uv[(S + 1 + i) * 2 + 1] = y - half + 0.5
  }
  for (const m of [printed, back]) {
    const mesh = new THREE.Mesh(geo, m)
    mesh.castShadow = m === printed
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  ribbons.push({ geo, y, v: 0.5 - y })
}

// the twist of each ribbon along its length, now (radians: 0 flat, π/2 edge-on)
const twist = new Float32Array(R * (S + 1))
const extra = new Float32Array(R * (S + 1)) // the finger's and the waves' share, on a spring
const extraV = new Float32Array(R * (S + 1))

function resize() {
  const w = innerWidth
  const h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  // fit the panel's square (1 / art of the shorter side)
  const view = 1 / LOOK.art
  const vh = w < h ? view / camera.aspect : view
  camera.position.set(0, 0, vh / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()

// --- input ---------------------------------------------------------------------------------------------------
const ray = new THREE.Raycaster()
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const hit = new THREE.Vector3()
function toPanel(e: PointerEvent) {
  const r = canvas.getBoundingClientRect()
  ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera)
  return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, y: hit.y } : null
}
let finger: { x: number; y: number } | null = null
let press: { id: number; x: number; y: number; t: number } | null = null
// 0 = flat (the print whole), 1 = twisted; a tap sends a front out from the finger that changes it
let modeFrom = 0
let modeTo = 0
let front: { x: number; y: number; t: number } = { x: 0, y: 0, t: -1e9 }
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
  finger = toPanel(e)
})
canvas.addEventListener('pointermove', (e) => {
  if ((press && e.pointerId === press.id) || e.pointerType === 'mouse') finger = toPanel(e)
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 300
  press = null
  if (e.pointerType !== 'mouse') finger = null
  if (tap) {
    const p = toPanel(e) ?? { x: 0, y: 0 }
    // a tap mid-change starts the next one from where the front had got to
    modeFrom = modeTo
    modeTo = 1 - modeTo
    front = { ...p, t: performance.now() }
    haptic([10, 40, 10, 40, 10])
  }
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
canvas.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse') finger = null
})
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// --- frame ---------------------------------------------------------------------------------------------------
let last = performance.now()
const t0 = last
function frame(now: number) {
  const dt = Math.min(0.04, (now - last) / 1000)
  last = now
  const t = (now - t0) / 1000
  const phase = t * 0.35 // the twist turning
  const reach = ((now - front.t) / 1000) * 0.55 // the front's radius, panel widths
  const mid = (R - 1) / 2

  for (let r = 0; r < R; r++) {
    const rb = ribbons[r]
    const pos = rb.geo.attributes.position.array as Float32Array
    for (let i = 0; i <= S; i++) {
      const u = i / S
      const x = u - 0.5
      const k = r * (S + 1) + i
      // the twist: half a turn more per row out from the middle, all of it turning
      const wound = Math.abs(r - mid) * Math.PI * u + phase
      // which of the two this point is, by whether the front has reached it
      const d = Math.hypot(x - front.x, rb.y - front.y)
      const reached = Math.min(1, Math.max(0, (reach - d) / 0.18))
      const mode = modeFrom + (modeTo - modeFrom) * reached
      const e = mode * mode * (3 - 2 * mode)
      const target = wound * e // 0 = flat, the print whole
      // the finger: ribbons near it twist round, half a turn at its centre
      let push = 0
      if (finger) {
        const d2 = (x - finger.x) ** 2 + (rb.y - finger.y) ** 2
        push += Math.PI * 0.5 * Math.exp(-d2 / 0.006)
      }
      extraV[k] += (push - extra[k]) * 60 * dt
      extraV[k] *= Math.exp(-dt * 9)
      extra[k] += extraV[k] * dt
      const a = target + extra[k]
      twist[k] = a
      const cy = Math.cos(a) * half
      const cz = Math.sin(a) * half
      // two vertices across: top edge then bottom edge (PlaneGeometry order: row 0 is the top)
      pos[i * 3] = x
      pos[i * 3 + 1] = rb.y + cy
      pos[i * 3 + 2] = cz
      const j = (S + 1 + i) * 3
      pos[j] = x
      pos[j + 1] = rb.y - cy
      pos[j + 2] = -cz
    }
    rb.geo.attributes.position.needsUpdate = true
    rb.geo.computeVertexNormals()
  }
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
