// RISO: the mark as a two-colour risograph print. The blue drum prints the logo solid, with the
// edge a little ragged and the odd pinhole where the ink skipped; the fluorescent pink drum prints a
// halftone glow round it, coarse dots on a rotated screen. Each colour is a transparent ink, so
// where they overlap they multiply into violet, and the two never quite line up.
// Drag and you pull the pink layer out of (or back into) register; a tap runs a new copy through the
// machine — new grain, new misregistration, the ink a little starved in other places.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import * as THREE from 'three'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './riso.css'

const LOOK = {
  mark: 0.62, // the logo's width, a share of the screen's shorter side
  pad: 1.6, // the textures cover this many logo widths (room for the glow)
  cell: 5.5, // halftone screen, css px
}

// --- the two plates as textures: the logo sharp (blue) and blurred wide (pink tone) -----------------
function plate(blur: number) {
  const n = 1024
  const c = document.createElement('canvas')
  c.width = c.height = n
  const g = c.getContext('2d')!
  const s = n / LOOK.pad
  g.filter = blur ? `blur(${blur * s}px)` : 'none'
  g.translate((n - s) / 2, (n - s) / 2)
  g.scale(s / LOGO_SPAN, s / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
  const t = new THREE.CanvasTexture(c)
  t.minFilter = THREE.LinearFilter
  t.generateMipmaps = false
  return t
}

const canvas = document.getElementById('riso') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  sharp: { value: plate(0.004) },
  soft: { value: plate(0.09) },
  res: { value: new THREE.Vector2() },
  side: { value: 1 },
  cell: { value: LOOK.cell },
  off: { value: new THREE.Vector2(5, -3) }, // the pink plate's offset, device px
  rot: { value: 0.006 },
  seed: { value: Math.random() * 100 },
}
const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D sharp, soft;
    uniform vec2 res, off;
    uniform float side, cell, rot, seed;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 13.7) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) { return vnoise(p) * 0.6 + vnoise(p * 2.1) * 0.28 + vnoise(p * 4.3) * 0.12; }
    // a point on screen → the plate's texture, with the plate shifted and turned
    vec2 plateUv(vec2 p, vec2 shift, float a) {
      vec2 q = p - res * 0.5 - shift;
      q = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
      vec2 uv = q / (side * ${LOOK.pad.toFixed(2)}) + 0.5;
      return uv;
    }
    float inside(vec2 uv) { return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }

    void main() {
      vec2 p = gl_FragCoord.xy;
      vec3 paper = vec3(0.965, 0.953, 0.918) * (0.975 + 0.025 * hash(floor(p)));
      paper *= 0.985 + 0.015 * fbm(p / 3.0);

      // --- pink: a halftone of the glow, on a screen turned 15°, ink starved in bands along the drum
      vec2 uvP = plateUv(p, off, rot);
      float tone = texture2D(soft, uvP).a * inside(uvP);
      vec2 c = res * 0.5 + off;
      float halo = 1.0 - smoothstep(0.0, side * 0.95, length(p - c));
      tone = clamp(tone * 0.8 + halo * 0.1, 0.0, 1.0);
      float sa = 0.2618;
      vec2 sp = mat2(cos(sa), sin(sa), -sin(sa), cos(sa)) * (p - c) / cell;
      vec2 f = fract(sp) - 0.5;
      float r = pow(tone, 1.15) * 0.7 + (hash(floor(sp)) - 0.5) * 0.06;
      float d = length(f);
      float aa = 1.2 / cell;
      float pink = smoothstep(r + aa, r - aa, d);
      float starveP = 0.78 + 0.22 * smoothstep(0.25, 0.75, fbm(vec2(p.x / 200.0, p.y / 18.0)));
      pink *= starveP;

      // --- blue: the logo solid, the edge ragged by grain, pinholes where the ink skipped
      vec2 uvB = plateUv(p, vec2(0.0), 0.0);
      float m = texture2D(sharp, uvB).a * inside(uvB);
      float edge = 0.5 + (fbm(p / 2.2) - 0.5) * 0.55;
      float blue = smoothstep(edge - 0.08, edge + 0.08, m);
      blue *= 0.86 + 0.14 * smoothstep(0.3, 0.8, fbm(vec2(p.x / 14.0, p.y / 260.0) + 7.0));
      blue *= 1.0 - step(0.9965, hash(floor(p / 1.5) + 3.1)) * 0.85;

      // toner dust: the odd fleck of each ink anywhere on the sheet
      pink = max(pink, step(0.9993, hash(floor(p / 2.0) + 11.0)) * 0.7);
      blue = max(blue, step(0.9996, hash(floor(p / 2.0) + 23.0)) * 0.6);

      // transparent inks multiply over the paper and each other
      vec3 pinkInk = vec3(1.0, 0.28, 0.66);
      vec3 blueInk = vec3(0.16, 0.27, 0.66);
      vec3 col = paper * mix(vec3(1.0), pinkInk, pink * 0.95) * mix(vec3(1.0), blueInk, blue * 0.93);
      gl_FragColor = vec4(col, 1.0);
    }`,
})
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))

let dpr = 1
function resize() {
  dpr = renderer.getPixelRatio()
  renderer.setSize(innerWidth, innerHeight, false)
  uniforms.res.value.set(innerWidth * dpr, innerHeight * dpr)
  uniforms.side.value = Math.min(innerWidth, innerHeight) * LOOK.mark * dpr
  uniforms.cell.value = LOOK.cell * dpr
  render()
}
let queued = false
function render() {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    renderer.render(scene, camera)
  })
}
addEventListener('resize', resize)
resize()

// --- drag the pink plate; tap for a new copy ----------------------------------------------------------
let press: { id: number; x: number; y: number; sx: number; sy: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }
})
canvas.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id) return
  const o = uniforms.off.value
  o.x += (e.clientX - press.x) * dpr
  o.y -= (e.clientY - press.y) * dpr
  const lim = uniforms.side.value * 0.6
  o.x = Math.max(-lim, Math.min(lim, o.x))
  o.y = Math.max(-lim, Math.min(lim, o.y))
  press.x = e.clientX
  press.y = e.clientY
  render()
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < 10 && performance.now() - press.t < 300
  press = null
  if (!tap) return
  // a new copy: the plates land differently every time
  uniforms.seed.value = Math.random() * 100
  uniforms.off.value.set((Math.random() - 0.5) * 14 * dpr, (Math.random() - 0.5) * 14 * dpr)
  uniforms.rot.value = (Math.random() - 0.5) * 0.02
  haptic([10, 30, 10])
  render()
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
