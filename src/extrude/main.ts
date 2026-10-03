// EXTRUDE: the logo pulled out into a long grey solid, the way a 2023 story showed it — flat grey
// faces, the body running far back and sinking into the black. A finger (or the mouse) turns it a
// little; let go and it eases back to its pose.
//
// The solid is the logo's bars (core/logo-bars: rectangles that add up to the mark) each extruded
// into a box. Shading is flat and hand-made: a grey by face direction, darkened along the depth.
import '../core/embed'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './extrude.css'

const LOOK = {
  /** Mark width as a share of the screen width: phone / desktop. */
  markXs: 0.5,
  markLg: 0.22,
  /** Extrusion depth in mark widths. */
  depth: 2.6,
  /** Rest pose, degrees: the face turned up-left, the body running down-right into the dark. */
  rest: { x: -20, y: -32 },
  /** How far a drag may turn it from the rest pose, degrees. */
  reach: 24,
  /** Degrees per px of drag. */
  dragGain: 0.12,
  face: 0.56, // grey of the logo's face
  side: [0.36, 0.62], // grey of the walls, darkest → lightest by how they face the light
  far: 0.06, // what the far end fades to
}

const canvas = document.getElementById('extrude') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 1)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(38, 1, 1, 100000)

// --- the solid, in logo units (600 frame, y down → flipped to y up), centred on the mark ---------------
// The walls start a hair behind the face, and the face is its own flat plates: overlapping boxes
// would otherwise show their inner walls' front edges as dotted seams on the face.
const D = 516 * LOOK.depth
const parts = logoBars().flatMap((s) => {
  const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
  const place = (g: THREE.BufferGeometry) => {
    g.rotateZ(-Math.atan2(s.by - s.ay, s.bx - s.ax))
    g.translate((s.ax + s.bx) / 2 - 300, 300 - (s.ay + s.by) / 2, 0)
    return g
  }
  const body = new THREE.BoxGeometry(len, LOGO_STROKE, D - 1)
  body.translate(0, 0, -(D - 1) / 2 - 1)
  const plate = new THREE.PlaneGeometry(len, LOGO_STROKE)
  return [place(body.toNonIndexed()), place(plate.toNonIndexed())]
})
const geo = mergeBufferGeometries(parts)!

const mat = new THREE.ShaderMaterial({
  uniforms: {
    face: { value: LOOK.face },
    sideLo: { value: LOOK.side[0] },
    sideHi: { value: LOOK.side[1] },
    far: { value: LOOK.far },
    depth: { value: D },
  },
  vertexShader: /* glsl */ `
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    uniform float depth;
    void main() {
      vN = normalize(mat3(modelMatrix) * normal);
      vFace = step(0.99, normal.z);
      vDepth = clamp(-position.z / depth, 0.0, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    uniform float face, sideLo, sideHi, far;
    void main() {
      vec3 n = normalize(vN);
      // a soft light from the upper left, in front: the faces turned to it read lighter
      float l = dot(n, normalize(vec3(-0.5, 0.7, 0.6))) * 0.5 + 0.5;
      float g = mix(sideLo, sideHi, l);
      g = mix(g, face, vFace);
      // the body sinks into the dark towards its far end
      g = mix(g, far, pow(vDepth, 0.75));
      gl_FragColor = vec4(vec3(g) * vec3(0.98, 0.97, 1.0), 1.0);
    }`,
})

const solid = new THREE.Mesh(geo, mat)
solid.position.z = D * 0.3 // turn about a point inside the body, not about the face
const pivot = new THREE.Group()
pivot.add(solid)
scene.add(pivot)

// --- turning: drag offsets the pose within reach; released, it eases back --------------------------
const rad = THREE.MathUtils.degToRad
let target = { x: 0, y: 0 }
let pose = { x: 0, y: 0 }
let drag: { id: number; x: number; y: number; ox: number; oy: number } | null = null
const clampReach = (v: number) => Math.max(-LOOK.reach, Math.min(LOOK.reach, v))

canvas.addEventListener('pointerdown', (e) => {
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: target.x, oy: target.y }
  canvas.setPointerCapture(e.pointerId)
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return
  target.y = clampReach(drag.oy + (e.clientX - drag.x) * LOOK.dragGain)
  target.x = clampReach(drag.ox + (e.clientY - drag.y) * LOOK.dragGain)
})
const release = (e: PointerEvent) => {
  if (drag && e.pointerId === drag.id) drag = null
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  // place the camera so the face's width is the wanted share of the screen width
  const markPx = w * (w <= 768 ? LOOK.markXs : LOOK.markLg)
  const visibleW = (516 / markPx) * w
  const visibleH = visibleW / camera.aspect
  camera.position.set(0, 0, visibleH / 2 / Math.tan(rad(camera.fov / 2)))
  camera.near = 1
  camera.far = camera.position.z + D * 3
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

// Frame the lit part (the face and the first stretch of body) in the middle of the screen, as it
// sits in the rest pose; turning then moves it about that place.
const centre = new THREE.Vector3(0, 0, -D * 0.22).add(solid.position)
centre.applyEuler(new THREE.Euler(rad(LOOK.rest.x), rad(LOOK.rest.y), 0))

const t0 = performance.now()
function frame() {
  const t = (performance.now() - t0) / 1000
  if (!drag) {
    target.x *= 0.96
    target.y *= 0.96
  }
  pose.x += (target.x - pose.x) * 0.12
  pose.y += (target.y - pose.y) * 0.12
  // a slow breath so it is never quite still
  const sway = { x: Math.sin(t * 0.35) * 2, y: Math.sin(t * 0.27 + 1) * 3 }
  pivot.rotation.set(rad(LOOK.rest.x + pose.x + sway.x), rad(LOOK.rest.y + pose.y + sway.y), 0)
  pivot.position.set(-centre.x, -centre.y, 0)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
frame()
