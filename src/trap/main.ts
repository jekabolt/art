// TRAP: a fractal in two flat colours, blue and white. Every point of the plane is iterated through
// z → z² + c (a Julia set); the logo sits at the origin as an orbit trap, and a point turns white the
// moment its orbit falls on one of the mark's strokes. So the logo is caught again and again, bent and
// shrunk along the set's coastline, and everything else, inside the set or out, is blue.
// Drag moves c and the whole figure melts and re-forms under the finger; a tap glides c to another
// of a handful of shapes. Left alone, c drifts slowly round a small circle so it never stands still.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './trap.css'

const LOOK = {
  view: 3.0, // the plane's width across the shorter side of the screen
  trap: 0.9, // the logo's width in the plane
  iters: 80,
  // c values with good coastlines
  shapes: [
    [-0.8, 0.156],
    [0.285, 0.01],
    [-0.4, 0.6],
    [-0.70176, -0.3842],
    [0.355, 0.355],
    [-0.54, 0.54],
    [-0.12, 0.75],
  ] as [number, number][],
}

function logoTexture() {
  const n = 512
  const c = document.createElement('canvas')
  c.width = c.height = n
  const g = c.getContext('2d')!
  g.scale(n / LOGO_SPAN, n / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
  const t = new THREE.CanvasTexture(c)
  t.minFilter = THREE.LinearFilter
  t.generateMipmaps = false
  return t
}

const canvas = document.getElementById('trap') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const uniforms = {
  logo: { value: logoTexture() },
  res: { value: new THREE.Vector2() },
  c: { value: new THREE.Vector2(...LOOK.shapes[0]) },
  view: { value: LOOK.view },
  trap: { value: LOOK.trap },
}
const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D logo;
    uniform vec2 res, c;
    uniform float view, trap;
    // 1 when the point's orbit lands on the mark, else 0
    float caught(vec2 p) {
      vec2 z = (p - res * 0.5) / min(res.x, res.y) * view;
      for (int i = 0; i < ${LOOK.iters}; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 16.0) return 0.0;
        if (i >= 7) continue; // only the first few landings: the mark and its first preimages
        vec2 uv = z / trap + 0.5;
        uv.y = 1.0 - uv.y;
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && texture2D(logo, uv).a > 0.5) return 1.0;
      }
      return 0.0;
    }
    void main() {
      // four samples a pixel, so the coastline is smooth
      float w = 0.25 * (caught(gl_FragCoord.xy + vec2(-0.25, -0.25)) + caught(gl_FragCoord.xy + vec2(0.25, -0.25))
        + caught(gl_FragCoord.xy + vec2(-0.25, 0.25)) + caught(gl_FragCoord.xy + vec2(0.25, 0.25)));
      vec3 blue = vec3(0.04, 0.11, 1.0);
      gl_FragColor = vec4(mix(blue, vec3(1.0), w), 1.0);
    }`,
})
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))

function resize() {
  renderer.setSize(innerWidth, innerHeight, false)
  uniforms.res.value.set(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio())
}
addEventListener('resize', resize)
resize()

// --- c: where it rests, the drift round it, the finger's pull and the glide to a new shape ---------------
let home = [...LOOK.shapes[0]]
let from = [...home]
let glideAt = -1
let shape = 0
let press: { id: number; x: number; y: number; sx: number; sy: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }
})
canvas.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id) return
  const k = 0.35 / Math.min(innerWidth, innerHeight)
  home[0] += (e.clientX - press.x) * k
  home[1] -= (e.clientY - press.y) * k
  glideAt = -1
  press.x = e.clientX
  press.y = e.clientY
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < 10 && performance.now() - press.t < 300
  press = null
  if (!tap) return
  shape = (shape + 1) % LOOK.shapes.length
  from = [...home]
  home = [...LOOK.shapes[shape]]
  glideAt = performance.now()
  haptic([10, 30, 10])
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

const t0 = performance.now()
function frame(now: number) {
  const t = (now - t0) / 1000
  let cx = home[0]
  let cy = home[1]
  if (glideAt >= 0) {
    const k = Math.min(1, (now - glideAt) / 1400)
    const e = k * k * (3 - 2 * k)
    cx = from[0] + (home[0] - from[0]) * e
    cy = from[1] + (home[1] - from[1]) * e
    if (k >= 1) glideAt = -1
  }
  uniforms.c.value.set(cx + Math.cos(t * 0.23) * 0.012, cy + Math.sin(t * 0.31) * 0.012)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
