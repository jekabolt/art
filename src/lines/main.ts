// LINES: the logo as a relief under a sheet of fine parallel lines, drawn the way an engraver would
// (or Unknown Pleasures): blue lines on a white plate, each line lifted where the mark rises, and the
// ridges in front hiding the lines behind them. It is a real surface: the heights come from the mark
// blurred at two widths, the lines are painted on the surface in the shader at a constant pixel
// width, so turning the plate in 3D (drag) keeps the hidden-line look from every side.
// A tap drops a stone: a red ring of ripples runs out over the plate from where it landed, the
// lines crowd in for the moment, and as the plate settles they go back to their usual number.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './lines.css'

const LOOK = {
  ink: new THREE.Color('#311eee'),
  wave: new THREE.Color('#ff0000'), // the ripple's ring
  plate: new THREE.Color('#ffffff'),
  lines: 120, // across the plate
  tapLines: 90, // a tap adds this many for a moment; they go as the plate settles
  angle: 0.2, // radians the lines rise from horizontal
  lift: 0.1, // relief height, plate widths
  plateXs: 0.72, // plate width / screen width on a phone
  plateLg: 0.42,
  rest: { x: -0.5, y: 0.0 }, // radians: the plate tipped back so the relief lifts the lines
  turn: { x: [-1.2, -0.1], y: [-0.7, 0.7] },
  margin: 0.025, // flat border round the mark, plate widths
}

// --- the relief: the mark's strokes blurred at a tight and a wide radius -------------------------------
const H = 512
function heightCanvas(): HTMLCanvasElement {
  const pad = LOOK.margin * H
  const mark = document.createElement('canvas')
  mark.width = mark.height = H
  const g = mark.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, H, H)
  g.translate(pad, pad)
  g.scale((H - 2 * pad) / LOGO_SPAN, (H - 2 * pad) / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
  const out = document.createElement('canvas')
  out.width = out.height = H
  const o = out.getContext('2d')!
  o.fillStyle = '#000'
  o.fillRect(0, 0, H, H)
  o.globalCompositeOperation = 'lighter'
  o.globalAlpha = 0.82
  o.filter = `blur(${H * 0.009}px)`
  o.drawImage(mark, 0, 0)
  o.globalAlpha = 0.18
  o.filter = `blur(${H * 0.03}px)`
  o.drawImage(mark, 0, 0)
  return out
}
const heightTex = new THREE.CanvasTexture(heightCanvas())
heightTex.minFilter = THREE.LinearFilter
heightTex.generateMipmaps = false

// --- the plate ---------------------------------------------------------------------------------------------
const canvas = document.getElementById('lines') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setClearColor(0xf2f2f2, 1)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)

const uniforms = {
  height: { value: heightTex },
  lift: { value: LOOK.lift },
  ink: { value: LOOK.ink },
  wave: { value: LOOK.wave },
  plate: { value: LOOK.plate },
  count: { value: LOOK.lines },
  dir: { value: new THREE.Vector2(-Math.sin(LOOK.angle), Math.cos(LOOK.angle)) },
  dpr: { value: 1 },
  rippleAt: { value: new THREE.Vector2(0, 0) },
  rippleT: { value: 99 },
}

const material = new THREE.ShaderMaterial({
  uniforms,
  side: THREE.DoubleSide,
  extensions: { derivatives: true } as never,
  vertexShader: /* glsl */ `
    uniform sampler2D height;
    uniform float lift, rippleT;
    uniform vec2 rippleAt;
    varying vec2 vP;
    varying float vRed;
    float env(vec2 p) {
      if (rippleT > 4.0) return 0.0;
      float r = distance(p, rippleAt);
      return exp(-pow((r - rippleT * 0.55) / 0.2, 2.0)) * exp(-rippleT * 0.7);
    }
    void main() {
      vP = position.xy; // plate units, -0.5..0.5
      float e = env(vP);
      float r = distance(vP, rippleAt) - rippleT * 0.55;
      vRed = e;
      float h = texture2D(height, uv).r * lift + sin(r * 30.0) * e * 0.06;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, h, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 ink, plate, wave;
    uniform float count, dpr;
    uniform vec2 dir;
    varying vec2 vP;
    varying float vRed;
    void main() {
      // Lines a constant ~0.8 px wide whatever the slope or the turn (measured through fwidth), but
      // never more than a quarter of the gap: where they crowd — steep flanks, more lines after a
      // tap — they thin out instead of closing up, so the plate keeps its white.
      float s = dot(vP, dir) * count;
      float fw = max(fwidth(s), 1e-4);
      float d = abs(fract(s + 0.5) - 0.5);
      float hw = min(0.4 * dpr * fw, 0.25);
      float a = 1.0 - smoothstep(hw - 0.6 * fw, hw + 0.6 * fw, d);
      a *= clamp(hw / fw * 1.5, 0.35, 1.0); // sub-pixel lines fade rather than flicker
      // the ripple's ring turns the lines red as it passes
      vec3 col = mix(ink, wave, smoothstep(0.25, 0.7, vRed));
      gl_FragColor = vec4(mix(plate, col, a), 1.0);
    }`,
})
const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 400, 400), material)
const pivot = new THREE.Group()
pivot.add(plateMesh)
scene.add(pivot)

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.dpr.value = dpr
  camera.aspect = w / h
  // the plate's width is the wanted share of the screen at rest
  const share = Math.min(w <= 768 ? LOOK.plateXs : LOOK.plateLg, (0.8 * h) / w)
  const visibleW = 1 / share
  const visibleH = visibleW / camera.aspect
  camera.position.set(0, 0, visibleH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

// --- input: drag turns the plate (it stays where it is left); a tap drops a ripple ------------------------
const want = { x: LOOK.rest.x, y: LOOK.rest.y }
const pose = { x: LOOK.rest.x, y: LOOK.rest.y }
let drag: { id: number; x: number; y: number; ox: number; oy: number; t: number } | null = null
let rippleStart = -99
const clamp = (v: number, [a, b]: number[]) => Math.max(a, Math.min(b, v))
const ray = new THREE.Raycaster()

canvas.addEventListener('pointerdown', (e) => {
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: want.x, oy: want.y, t: performance.now() }
  canvas.setPointerCapture(e.pointerId)
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return
  want.y = clamp(drag.oy + (e.clientX - drag.x) * 0.006, LOOK.turn.y)
  want.x = clamp(drag.ox + (e.clientY - drag.y) * 0.006, LOOK.turn.x)
})
const up = (e: PointerEvent) => {
  if (!drag || e.pointerId !== drag.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 12 && performance.now() - drag.t < 350
  drag = null
  if (!tap) return
  const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  const hit = ray.intersectObject(plateMesh)[0]
  const at = hit ? plateMesh.worldToLocal(hit.point.clone()) : new THREE.Vector3()
  uniforms.rippleAt.value.set(at.x, at.y)
  rippleStart = performance.now()
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

const t0 = performance.now()
function frame(now: number) {
  const t = (now - t0) / 1000
  pose.x += (want.x - pose.x) * 0.1
  pose.y += (want.y - pose.y) * 0.1
  // a slow sway so the relief keeps catching the eye
  pivot.rotation.set(pose.x + Math.sin(t * 0.3) * 0.03, pose.y + Math.sin(t * 0.21 + 1) * 0.05, 0)
  uniforms.rippleT.value = (now - rippleStart) / 1000
  // a tap crowds the lines in quickly, and they ease back to the usual number as the ripple dies
  const rt = uniforms.rippleT.value
  const ss = (a: number, b: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return k * k * (3 - 2 * k)
  }
  uniforms.count.value = LOOK.lines + LOOK.tapLines * ss(0, 0.25, rt) * (1 - ss(0.8, 3.0, rt))
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
