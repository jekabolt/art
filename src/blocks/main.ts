// BLOCKS: the logo built from black and white blocks — cubes and long bars — on a pale platform,
// in a few layers: every stroke cut into pieces, some pieces stacked two or three high. Each load
// cuts and stacks it a little differently.
// Drag a block to carry it: it lifts clear of whatever it passes over and, let go, settles on top of
// what is under it; whatever stood on it drops down. A tap on a block turns it a quarter round.
// Drag the empty space to look round the platform; the wheel moves closer or further.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { haptic } from '../core/haptic'
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './blocks.css'

const rand = Math.random
const K = 10 / 516 // logo units → world: the mark is 10 wide
const U = LOGO_STROKE * K // a stroke's width, and a block's height unit
const PLATFORM = 13.4
const SLAB = 0.7

const canvas = document.getElementById('blocks') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xe9e7e2)
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.add(new THREE.HemisphereLight(0xffffff, 0xbdb8ae, 0.25))
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400)

const sun = new THREE.DirectionalLight(0xfff8ef, 2.6)
sun.position.set(-9, 14, 4)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 })
sun.shadow.bias = -0.0005
sun.shadow.normalBias = 0.02
sun.shadow.radius = 4
scene.add(sun)

const platform = new THREE.Mesh(new THREE.BoxGeometry(PLATFORM, SLAB, PLATFORM), new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.95, envMapIntensity: 0.25 }))
platform.position.y = -SLAB / 2
platform.receiveShadow = true
platform.castShadow = true
scene.add(platform)

// --- the blocks ---------------------------------------------------------------------------------------------
const black = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8, envMapIntensity: 0.2 })
const white = new THREE.MeshStandardMaterial({ color: 0xf3f1eb, roughness: 0.75, envMapIntensity: 0.25 })
type Block = {
  mesh: THREE.Mesh
  w: number // along its own x
  d: number // along its own z
  h: number
  x: number
  z: number
  yaw: number
  yawGoal: number
  bottom: number // y of its underside
  vy: number
}
const blocks: Block[] = []
function addBlock(x: number, z: number, yaw: number, w: number, d: number, h: number, bottom: number, ink: boolean) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ink ? black : white)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
  const b: Block = { mesh, w, d, h, x, z, yaw, yawGoal: yaw, bottom, vy: 0 }
  blocks.push(b)
  place(b)
}
function place(b: Block) {
  b.mesh.position.set(b.x, b.bottom + b.h / 2, b.z)
  b.mesh.rotation.y = b.yaw
}

// every stroke cut into pieces along its length, some stacked
for (const s of logoBars()) {
  const ax = (s.ax - 300) * K
  const az = (s.ay - 300) * K
  const bx = (s.bx - 300) * K
  const bz = (s.by - 300) * K
  const len = Math.hypot(bx - ax, bz - az)
  const ux = (bx - ax) / len
  const uz = (bz - az) / len
  const yaw = Math.atan2(-uz, ux)
  let at = 0
  while (at < len - 1e-3) {
    // a cube, or a bar two to four strokes long
    let piece = rand() < 0.35 ? U : U * (2 + Math.floor(rand() * 3))
    if (len - at - piece < U * 0.7) piece = len - at
    const mid = at + piece / 2
    const cx = ax + ux * mid
    const cz = az + uz * mid
    // one to three layers, each a slab or a full block, black or white
    const layers = 1 + (rand() < 0.38 ? 1 : 0) + (rand() < 0.12 ? 1 : 0)
    let y = 0
    for (let l = 0; l < layers; l++) {
      const h = U * (rand() < 0.3 ? 0.5 : 1) + rand() * 0.01
      const ink = l === 0 ? rand() < 0.9 : rand() < 0.75
      // the upper layers are sometimes shorter than the piece under them
      const w = l === 0 || piece <= U * 1.01 ? piece : piece * (rand() < 0.5 ? 1 : 0.5)
      const shift = (piece - w) / 2 * (rand() < 0.5 ? -1 : 1)
      addBlock(cx + ux * shift, cz + uz * shift, yaw + (l ? (rand() - 0.5) * 0.06 : 0), w - 0.012, U - 0.012, h, y, ink)
      y += h
    }
    at += piece
  }
}
// and a few loose ones round it, to play with
for (let i = 0; i < 6; i++) {
  const side = Math.floor(rand() * 4)
  const t = (rand() - 0.5) * 10
  const edge = 5.9
  const x = side === 0 ? t : side === 1 ? t : side === 2 ? -edge : edge
  const z = side === 0 ? -edge : side === 1 ? edge : t
  const cube = rand() < 0.6
  addBlock(x, z, rand() * Math.PI, cube ? U : U * 3, U, U, 0, rand() < 0.5)
}

// --- footprints: two blocks overlap when their rectangles (seen from above) do -----------------------------------
function corners(b: Block, shrink = 0.02) {
  const c = Math.cos(b.yaw)
  const s = Math.sin(b.yaw)
  const hw = b.w / 2 - shrink
  const hd = b.d / 2 - shrink
  // local x → (c, -s), local z → (s, c)
  return [
    [b.x + c * hw + s * hd, b.z - s * hw + c * hd],
    [b.x - c * hw + s * hd, b.z + s * hw + c * hd],
    [b.x - c * hw - s * hd, b.z + s * hw - c * hd],
    [b.x + c * hw - s * hd, b.z - s * hw - c * hd],
  ]
}
function overlap(a: Block, b: Block) {
  if (Math.hypot(a.x - b.x, a.z - b.z) > (Math.hypot(a.w, a.d) + Math.hypot(b.w, b.d)) / 2) return false
  const pa = corners(a)
  const pb = corners(b)
  for (const poly of [pa, pb]) {
    for (let i = 0; i < 2; i++) {
      const nx = -(poly[i + 1][1] - poly[i][1])
      const nz = poly[i + 1][0] - poly[i][0]
      let amin = Infinity
      let amax = -Infinity
      let bmin = Infinity
      let bmax = -Infinity
      for (const p of pa) {
        const v = p[0] * nx + p[1] * nz
        amin = Math.min(amin, v)
        amax = Math.max(amax, v)
      }
      for (const p of pb) {
        const v = p[0] * nx + p[1] * nz
        bmin = Math.min(bmin, v)
        bmax = Math.max(bmax, v)
      }
      if (amax <= bmin || bmax <= amin) return false
    }
  }
  return true
}
// the highest top under a block's footprint, among blocks below it (or all others, when lifting)
function support(b: Block, any: boolean) {
  let top = 0
  for (const o of blocks) {
    if (o === b || o === held?.block) continue
    const t = o.bottom + o.h
    if (!any && t > b.bottom + 0.03) continue
    if (t > top && overlap(b, o)) top = t
  }
  return top
}

// --- camera: orbiting the platform ---------------------------------------------------------------------------
const orbit = { theta: -0.38, phi: 0.82, dist: 1 }
let zoom = 1
function fit() {
  const w = innerWidth
  const h = innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  const v = THREE.MathUtils.degToRad(camera.fov / 2)
  const need = PLATFORM * 0.6
  orbit.dist = Math.max(need / Math.tan(v), need / (Math.tan(v) * camera.aspect))
  camera.updateProjectionMatrix()
}
function aim() {
  const d = orbit.dist * zoom
  camera.position.set(Math.sin(orbit.theta) * Math.sin(orbit.phi) * d, Math.cos(orbit.phi) * d, Math.cos(orbit.theta) * Math.sin(orbit.phi) * d)
  camera.lookAt(0, 0.4, 0)
}
addEventListener('resize', fit)
fit()

// --- input -----------------------------------------------------------------------------------------------------
const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const lift = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hit = new THREE.Vector3()
let held: { block: Block; id: number; ox: number; oz: number } | null = null
let turning: { id: number; x: number; y: number } | null = null
let press: { id: number; x: number; y: number; t: number; block: Block | null } | null = null
const setRay = (e: PointerEvent) => {
  const r = canvas.getBoundingClientRect()
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera)
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  setRay(e)
  const found = ray.intersectObjects(blocks.map((b) => b.mesh))[0]
  const block = found ? blocks.find((b) => b.mesh === found.object)! : null
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), block }
  if (block) {
    // carry it on a level plane through where it was grabbed
    lift.constant = -found.point.y
    held = { block, id: e.pointerId, ox: block.x - found.point.x, oz: block.z - found.point.z }
    haptic(8)
  } else turning = { id: e.pointerId, x: e.clientX, y: e.clientY }
})
canvas.addEventListener('pointermove', (e) => {
  if (held && e.pointerId === held.id) {
    setRay(e)
    if (ray.ray.intersectPlane(lift, hit)) {
      const lim = PLATFORM / 2 - U * 0.6
      held.block.x = Math.max(-lim, Math.min(lim, hit.x + held.ox))
      held.block.z = Math.max(-lim, Math.min(lim, hit.z + held.oz))
    }
  } else if (turning && e.pointerId === turning.id) {
    orbit.theta -= (e.clientX - turning.x) * 0.008
    orbit.phi = Math.max(0.25, Math.min(1.35, orbit.phi - (e.clientY - turning.y) * 0.006))
    turning.x = e.clientX
    turning.y = e.clientY
  }
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8 && performance.now() - press.t < 300
  if (tap && press.block) {
    press.block.yawGoal += Math.PI / 2
    haptic([8, 30, 8])
  }
  if (held) {
    // let go: it drops onto whatever is under it
    if (!tap) haptic(12)
    held = null
  }
  turning = null
  press = null
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
addEventListener('wheel', (e) => (zoom = Math.max(0.55, Math.min(1.6, zoom * Math.exp(e.deltaY * 0.001)))), { passive: true })
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// --- frame -------------------------------------------------------------------------------------------------------
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.04, (now - last) / 1000)
  last = now
  // low first, so a tower settles from the bottom up
  const order = [...blocks].sort((a, b) => a.bottom - b.bottom)
  for (const b of order) {
    b.yaw += (b.yawGoal - b.yaw) * Math.min(1, dt * 14)
    if (held && b === held.block) {
      // carried: clear of everything under it
      const goal = support(b, true) + U * 0.35
      b.bottom += (goal - b.bottom) * Math.min(1, dt * 16)
      b.vy = 0
    } else {
      const floor = support(b, false)
      if (b.bottom > floor + 1e-4) {
        b.vy -= 40 * dt
        b.bottom = Math.max(floor, b.bottom + b.vy * dt)
        if (b.bottom === floor) b.vy = 0
      } else {
        b.bottom = floor
        b.vy = 0
      }
    }
    place(b)
  }
  aim()
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
