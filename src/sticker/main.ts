// STICKER: a white square sticker with the logo printed on it as a separate layer. Scrolling the
// page rolls the printed layer up into a scroll from the right edge (and back); dragging turns the
// paper in 3D. No lights, no shadows: flat white paper, flat black ink.
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
import { DoubleSide } from 'three/src/constants'
import './sticker.css'

// New logo (Frame 3353643.svg): stroke 36 in a 600 frame, cropped to 42..558.
const LOGO =
  'M216 60H184.927M216 60V91.0733M216 60H350.122M216 300H184.927M216 300V268.927M216 300V331.073M216 300H300M216 300L258 540M184.927 60H138.073H91.2188L60 91.2188L60.0778 180L60 268.201V300M60 300H91.7993M60 300V420M384 60V93.8779M384 60H350.122M384 60H508.946H540V91.0538V148.655V180M384 300H540M384 300V180M384 300V420M384 300L216 180M384 300H300M384 300L342 540M540 420V435.527V540H384M384 540V420M384 540H363M540 540L384 420M184.927 60L216 91.0733M216 91.0733V180M60 268.201L91.7993 300M91.7993 300H184.927M184.927 300L216 268.927M184.927 300L216 331.073M216 268.927V180M216 331.073L216 388.8L184.8 420H60M384 93.8779L350.122 60M384 93.8779V148.866M540 300V268.946V211.346V180M540 300V331.054V388.623V420M216 180H138.073M216 180H352.866M384 180V148.866M384 180H540M384 180H352.866M60 420V540H216H258M384 420H540M384 420L363 540M352.866 180L384 148.866M300 300L258 540M300 300L342 540M258 540H300H342M342 540H363'

/** The printed layer: the logo in black on a transparent square, 10 % margin like a sticker print. */
function logoTexture(): CanvasTexture {
  const px = 1024
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const pad = px * 0.1
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
paper.add(new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide })))

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
  const side = Math.min(w <= 768 ? 0.78 * w : 0.42 * w, 0.75 * h) // paper side, px
  // distance at which a 1-unit plane is `side` px tall on screen
  camera.position.z = h / side / (2 * Math.tan((camera.fov * Math.PI) / 360))
  camera.updateProjectionMatrix()
}

// --- roll: page scroll (wheel on desktop, swipe on a phone) -------------------------------------
let roll = 0
const scrollRoll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

// --- turn: drag rotates the paper; left alone it sways -------------------------------------------
let rotX = 0.12
let rotY = -0.45
let velX = 0
let velY = 0
let drag: { x: number; y: number } | null = null
let lastInput = -1e9

canvas.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY }
  lastInput = performance.now()
})
window.addEventListener('pointermove', (e) => {
  if (!drag) return
  const dx = e.clientX - drag.x
  const dy = e.clientY - drag.y
  drag = { x: e.clientX, y: e.clientY }
  velY = dx * 0.008
  velX = e.pointerType === 'mouse' ? dy * 0.008 : 0 // on touch, vertical swipes scroll (roll)
  rotY += velY
  rotX += velX
  lastInput = performance.now()
})
const release = () => {
  drag = null
}
window.addEventListener('pointerup', release)
window.addEventListener('pointercancel', release)

function frame(t: number) {
  roll += (scrollRoll() - roll) * 0.15
  layerMaterial.uniforms.roll.value = roll

  if (!drag) {
    rotY += velY
    rotX += velX
    velX *= 0.94
    velY *= 0.94
    if (t - lastInput > 3000) {
      // ease back towards a slow sway
      rotY += (-0.45 + 0.25 * Math.sin(t * 0.0004) - rotY) * 0.01
      rotX += (0.12 + 0.08 * Math.sin(t * 0.0003) - rotX) * 0.01
    }
  }
  rotX = Math.max(-1.2, Math.min(1.2, rotX))
  paper.rotation.set(rotX, rotY, 0)

  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
