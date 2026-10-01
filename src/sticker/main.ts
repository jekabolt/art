// STICKER: a white square sticker with the logo printed on it as a separate layer. Dragging on the
// paper rolls the print up into a scroll from the right edge (drag left) and back (drag right);
// dragging beside the paper turns it in 3D; the wheel / trackpad rolls too. Nothing moves by itself.
// No lights, no shadows: flat white paper, flat black ink.
import { EMBEDDED } from '../core/embed'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { Group } from 'three/src/objects/Group'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { Color } from 'three/src/math/Color'
import { Raycaster } from 'three/src/core/Raycaster'
import { Vector2 } from 'three/src/math/Vector2'
import { DoubleSide } from 'three/src/constants'
import { LOGO_PATH as LOGO } from '../core/logo-path'
import './sticker.css'

/** The printed layer: the logo in black on a transparent square, a thin 3.5 % margin to the paper edge. */
function logoTexture(): CanvasTexture {
  const px = 1024
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const pad = px * 0.035
  const k = (px - 2 * pad) / 516
  g.translate(pad, pad)
  g.scale(k, k)
  g.translate(-42, -42)
  g.lineWidth = 36
  g.strokeStyle = '#000'
  g.stroke(new Path2D(LOGO))
  const t = new CanvasTexture(c)
  t.anisotropy = 4
  return t
}

const canvas = document.getElementById('sticker') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: true })
renderer.setClearColor(new Color(0x0a0a0a), 1)
const scene = new Scene()
const camera = new PerspectiveCamera(35, 1, 0.01, 100)
camera.position.z = 3

const paper = new Group()
scene.add(paper)

// white paper
const sheet = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide }))
paper.add(sheet)

// printed layer, rolled in the vertex shader around an axis parallel to y that moves right → left
const layerMaterial = new ShaderMaterial({
  side: DoubleSide,
  transparent: true,
  uniforms: { map: { value: logoTexture() }, roll: { value: 0 }, radius: { value: 0.07 } },
  vertexShader: /* glsl */ `
    uniform float roll;
    uniform float radius;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      // the unrolled part lies flat; from 'edge' to the right the layer winds up into a spiral
      float edge = 0.5 - roll * 1.02;
      if (p.x > edge) {
        float s = p.x - edge;                                     // length already rolled
        float r = radius * (1.0 + 0.12 * s / radius / 6.2831853); // grows a little per turn
        float th = s / r;
        p.x = edge + r * sin(th);
        p.z = r * (1.0 - cos(th));
      }
      p.z += 0.0015; // printed on top of the paper
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    varying vec2 vUv;
    void main() {
      float a = texture2D(map, vUv).a;
      if (a < 0.5) discard;
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  `,
})
paper.add(new Mesh(new PlaneGeometry(1, 1, 256, 1), layerMaterial))

// --- size: the paper as wide on screen as the logo pages' mark --------------------------------
function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  const side = Math.min(w <= 768 ? 0.55 * w : 0.28 * w, 0.5 * h) // paper side, px
  paperPx = side
  // distance at which a 1-unit plane is `side` px tall on screen
  camera.position.z = h / side / (2 * Math.tan((camera.fov * Math.PI) / 360))
  camera.updateProjectionMatrix()
}

// --- input ----------------------------------------------------------------------------------------
let roll = 0 // 0 flat … 1 rolled up to the left edge
let rollTarget = 0
let rotX = 0.12
let rotY = -0.45
let velX = 0
let velY = 0
let paperPx = 300 // paper side on screen, for drag → roll

const REST_X = 0.12
const REST_Y = -0.45
const IDLE_MS = 2000 // left alone this long, the print rolls back flat and the paper turns back
let lastInput = -1e9

type Drag = { mode: 'roll' | 'turn'; x: number; y: number; startX: number; startRoll: number }
let drag: Drag | null = null

const ray = new Raycaster()
const onPaper = (x: number, y: number) => {
  const ndc = new Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  return ray.intersectObject(sheet).length > 0
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  drag = {
    mode: onPaper(e.clientX, e.clientY) ? 'roll' : 'turn',
    x: e.clientX,
    y: e.clientY,
    startX: e.clientX,
    startRoll: rollTarget,
  }
  velX = velY = 0
  lastInput = performance.now()
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return
  if (drag.mode === 'roll') {
    // pull the print: dragging left rolls it up, right lays it back
    rollTarget = clamp01(drag.startRoll + (drag.startX - e.clientX) / paperPx)
  } else {
    velY = (e.clientX - drag.x) * 0.004
    velX = (e.clientY - drag.y) * 0.004
    rotY += velY
    rotX += velX
  }
  drag.x = e.clientX
  drag.y = e.clientY
  lastInput = performance.now()
})
const release = () => {
  drag = null
  lastInput = performance.now()
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)

// embedded: the wheel scrolls the host page (see core/embed)
if (!EMBEDDED) window.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
    rollTarget = clamp01(rollTarget + d / (paperPx * 2))
    lastInput = performance.now()
  },
  { passive: false },
)

function frame(t: number) {
  if (!drag && t - lastInput > IDLE_MS) {
    // nobody is touching it: roll the print back down and turn the paper back, slowly
    rollTarget += (0 - rollTarget) * 0.04
    rotY += (REST_Y - rotY) * 0.04
    rotX += (REST_X - rotX) * 0.04
    velX = velY = 0
  }
  roll += (rollTarget - roll) * (drag?.mode === 'roll' ? 0.5 : 0.15)
  layerMaterial.uniforms.roll.value = roll

  if (drag?.mode !== 'turn') {
    // a turned paper keeps a little momentum, then stays where it was left
    rotY += velY
    rotX += velX
    velX *= 0.92
    velY *= 0.92
  }
  // never edge-on: the paper stays readable
  rotX = Math.max(-0.9, Math.min(0.9, rotX))
  rotY = Math.max(-1.0, Math.min(1.0, rotY))
  paper.rotation.set(rotX, rotY, 0)

  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
