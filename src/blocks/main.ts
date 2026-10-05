// BLOCKS: the logo built from black and white blocks — cubes, bars and squat slabs — on a pale
// platform, in a few layers, and every block a real body: it has weight, falls, tips, slides and
// knocks into the others. The mark is laid out on a grid (no two blocks overlap), each layer cut
// into pieces at random, so every load is built a little differently.
// Drag a block and it is carried on a spring under your finger, swinging, bumping whatever it meets;
// let go and it drops. Pull one out from under a stack and the stack comes down. A tap flips a
// block into the air. Drag the empty space to look round; the wheel moves closer. Whatever falls off
// the platform drops back onto it from above.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './blocks.css'

const rand = Math.random
const MARK = 10 // the logo's width, world units
const C = ((LOGO_STROKE / LOGO_SPAN) * MARK) / 2 // a grid cell: half a stroke
const PLATFORM = 13.4
const SLAB = 0.7

// --- three -----------------------------------------------------------------------------------------------------
const canvas = document.getElementById('blocks') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
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

const platformMesh = new THREE.Mesh(
  new THREE.BoxGeometry(PLATFORM, SLAB, PLATFORM),
  new THREE.MeshStandardMaterial({ color: 0xd8d4cb, roughness: 0.95, envMapIntensity: 0.25 }),
)
platformMesh.position.y = -SLAB / 2
platformMesh.receiveShadow = true
platformMesh.castShadow = true
scene.add(platformMesh)

const black = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8, envMapIntensity: 0.2 })
const white = new THREE.MeshStandardMaterial({ color: 0xf3f1eb, roughness: 0.75, envMapIntensity: 0.25 })

// --- physics -----------------------------------------------------------------------------------------------------
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) })
world.allowSleep = true
world.broadphase = new CANNON.SAPBroadphase(world)
;(world.solver as CANNON.GSSolver).iterations = 12
world.defaultContactMaterial.friction = 0.55
world.defaultContactMaterial.restitution = 0.08
const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(PLATFORM / 2, SLAB / 2, PLATFORM / 2)) })
ground.position.set(0, -SLAB / 2, 0)
world.addBody(ground)

type Block = { body: CANNON.Body; mesh: THREE.Mesh }
const blocks: Block[] = []
const byMesh = new Map<THREE.Object3D, Block>()
function addBlock(x: number, y: number, z: number, w: number, h: number, d: number, ink: boolean) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ink ? black : white)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
  const body = new CANNON.Body({
    mass: w * h * d * 8,
    shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
    position: new CANNON.Vec3(x, y + h / 2, z),
    linearDamping: 0.05,
    angularDamping: 0.12,
    sleepSpeedLimit: 0.15,
    sleepTimeLimit: 0.6,
  })
  world.addBody(body)
  body.sleep() // the logo stands still until something touches it
  const b = { body, mesh }
  blocks.push(b)
  byMesh.set(mesh, b)
}

// --- the logo on a grid, cut into pieces layer by layer ----------------------------------------------------------
const N = Math.round(MARK / C)
const filled: boolean[] = new Array(N * N).fill(false)
{
  const px = 8
  const c = document.createElement('canvas')
  c.width = c.height = N * px
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.scale((N * px) / LOGO_SPAN, (N * px) / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.stroke(new Path2D(LOGO_PATH))
  const d = g.getImageData(0, 0, N * px, N * px).data
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) filled[j * N + i] = d[((j * px + px / 2) * N * px + i * px + px / 2) * 4 + 3] > 110
}
const cellX = (i: number) => (i + 0.5) * C - MARK / 2
const cellZ = (j: number) => (j + 0.5) * C - MARK / 2

// cut a set of cells into pieces: 2x2 blocks, bars along x or z, single cubes
function cut(cells: boolean[]) {
  const taken = new Array(N * N).fill(false)
  const order = [...Array(N * N).keys()].filter((k) => cells[k]).sort(() => rand() - 0.5)
  const free = (i: number, j: number) => i >= 0 && j >= 0 && i < N && j < N && cells[j * N + i] && !taken[j * N + i]
  const pieces: { i: number; j: number; w: number; d: number }[] = []
  for (const k of order) {
    const i = k % N
    const j = (k - i) / N
    if (!free(i, j)) continue
    let w = 1
    let d = 1
    const r = rand()
    if (r < 0.18 && free(i + 1, j) && free(i, j + 1) && free(i + 1, j + 1)) {
      w = d = 2
    } else if (r < 0.8) {
      const len = 2 + Math.floor(rand() * 5)
      if (rand() < 0.5) while (w < len && free(i + w, j)) w++
      else while (d < len && free(i, j + d)) d++
    }
    for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) taken[(j + b) * N + i + a] = true
    pieces.push({ i, j, w, d })
  }
  return pieces
}

const gap = 0.006
let layer = filled
let y = 0
for (let l = 0; l < 3; l++) {
  const tall = l === 0 ? 2 : rand() < 0.5 ? 1 : 2 // in cells
  const h = C * tall
  for (const p of cut(layer)) {
    addBlock(cellX(p.i) + ((p.w - 1) * C) / 2, y + gap, cellZ(p.j) + ((p.d - 1) * C) / 2, p.w * C - gap * 2, h - gap, p.d * C - gap * 2, l === 0 ? rand() < 0.9 : rand() < 0.7)
  }
  y += h
  // the next layer stands on part of this one, in patches
  const ph = rand() * 10
  const keep = l === 0 ? 0.32 : 0.22
  layer = layer.map((on, k) => {
    const i = k % N
    const j = (k - i) / N
    const n = Math.sin(i * 0.55 + ph) * Math.cos(j * 0.47 - ph * 1.3) * 0.5 + 0.5
    return on && n < keep + (rand() - 0.5) * 0.1
  })
}
// a few loose ones round it
for (let i = 0; i < 7; i++) {
  const a = rand() * Math.PI * 2
  const r = 5.6 + rand() * 0.6
  addBlock(Math.cos(a) * r, 0.02, Math.sin(a) * r, C * 2 * (rand() < 0.5 ? 1 : 2), C * 2, C * 2, rand() < 0.5)
}

// --- camera ------------------------------------------------------------------------------------------------------
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
aim()

// --- input: carry on a spring, flip with a tap, orbit on empty space -----------------------------------------------
const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hit = new THREE.Vector3()
const hand = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
hand.collisionResponse = false
world.addBody(hand)
let grip: { id: number; block: Block; joint: CANNON.PointToPointConstraint; height: number } | null = null
let turning: { id: number; x: number; y: number } | null = null
let press: { id: number; x: number; y: number; t: number } | null = null
const setRay = (e: PointerEvent) => {
  const r = canvas.getBoundingClientRect()
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera)
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  setRay(e)
  const found = ray.intersectObjects(blocks.map((b) => b.mesh))[0]
  const block = found ? byMesh.get(found.object)! : null
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
  if (block && found) {
    const p = found.point
    // the pivot, in the block's own frame
    const local = block.body.pointToLocalFrame(new CANNON.Vec3(p.x, p.y, p.z))
    hand.position.set(p.x, p.y, p.z)
    const joint = new CANNON.PointToPointConstraint(block.body, local, hand, new CANNON.Vec3(0, 0, 0), 60)
    world.addConstraint(joint)
    block.body.wakeUp()
    block.body.angularDamping = 0.6
    // carried a little above where it was taken
    grip = { id: e.pointerId, block, joint, height: p.y + C * 3 }
    plane.constant = -p.y
    haptic(8)
  } else turning = { id: e.pointerId, x: e.clientX, y: e.clientY }
})
canvas.addEventListener('pointermove', (e) => {
  if (grip && e.pointerId === grip.id) {
    setRay(e)
    if (ray.ray.intersectPlane(plane, hit)) {
      const lim = PLATFORM / 2 - C * 2
      hand.position.set(Math.max(-lim, Math.min(lim, hit.x)), hand.position.y, Math.max(-lim, Math.min(lim, hit.z)))
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
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8 && performance.now() - press.t < 280
  if (grip) {
    world.removeConstraint(grip.joint)
    const b = grip.block.body
    b.angularDamping = 0.12
    if (tap) {
      // a flip: up and over
      b.velocity.set((rand() - 0.5) * 2, 9, (rand() - 0.5) * 2)
      b.angularVelocity.set((rand() - 0.5) * 16, (rand() - 0.5) * 6, (rand() - 0.5) * 16)
      haptic([8, 30, 8])
    } else haptic(10)
    grip = null
  }
  turning = null
  press = null
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
addEventListener('wheel', (e) => (zoom = Math.max(0.55, Math.min(1.6, zoom * Math.exp(e.deltaY * 0.001)))), { passive: true })
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// --- frame ---------------------------------------------------------------------------------------------------------
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  // the hand rises to its carrying height
  if (grip) hand.position.y += (grip.height - hand.position.y) * Math.min(1, dt * 10)
  world.step(1 / 60, dt, 4)
  for (const b of blocks) {
    // fallen off: dropped back on from above
    if (b.body.position.y < -12) {
      b.body.position.set((rand() - 0.5) * 8, 8 + rand() * 3, (rand() - 0.5) * 8)
      b.body.velocity.set(0, 0, 0)
      b.body.angularVelocity.set((rand() - 0.5) * 4, 0, (rand() - 0.5) * 4)
    }
    b.mesh.position.set(b.body.position.x, b.body.position.y, b.body.position.z)
    b.mesh.quaternion.set(b.body.quaternion.x, b.body.quaternion.y, b.body.quaternion.z, b.body.quaternion.w)
  }
  aim()
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
