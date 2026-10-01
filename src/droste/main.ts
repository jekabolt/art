// DROSTE (after Escher's Print Gallery, as Lenstra and de Smit worked it out): the logo holds a
// smaller copy of itself in one of its empty cells, that copy holds another, forever, both ways.
// Then Escher's twist: in log-polar coordinates the picture is multiplied by β = 1 − i·ln S / 2π,
// so one turn around the centre is one step of scale and the nesting becomes a single spiral.
//
// Everything is one fragment shader. The logo is not a texture: it is the exact signed distance to
// its bars, antialiased with the transform's own derivative (|β|·|p − c| / |z|), so it is crisp at
// every depth and has no seams. It keeps sinking in by itself; drag across to turn it, drag up and
// down or scroll to go deeper or come back out.
import { EMBEDDED } from '../core/embed'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector4 } from 'three/src/math/Vector4'
import { LOGO_STROKE } from '../core/logo-path'
import { logoBars } from '../core/logo-bars'
import './droste.css'

// --- the picture --------------------------------------------------------------------------------------
// Logo units, y up. The mark spans 42..558. The copy sits in the right column, second cell from the
// top (path y 180..300): an empty 120 × 84 opening between strokes.
const MARGIN = 40 // a little paper around the mark belongs to it, so the copy has air in its cell
const Q_LO = 42 - MARGIN
const Q_HI = 558 + MARGIN
const CELL = { x: 462, y: 600 - 240 } // opening centre
const COPY = 84 - 2 * 3 // the copy's square side (with its margin), inside the 84 high opening
const S = COPY / (Q_HI - Q_LO) // scale of each nesting step
const QC = (Q_LO + Q_HI) / 2
// the fixed point of z → c + S(z − c) that sends the square's centre to the opening's centre
const C = { x: (CELL.x - S * QC) / (1 - S), y: (CELL.y - S * QC) / (1 - S) }

const bars = logoBars().map((s) => {
  const ax = s.ax
  const ay = 600 - s.ay
  const bx = s.bx
  const by = 600 - s.by
  const len = Math.hypot(bx - ax, by - ay)
  return { c: new Vector4((ax + bx) / 2, (ay + by) / 2, (bx - ax) / len, (by - ay) / len), h: new Vector2(len / 2, LOGO_STROKE / 2) }
})

const canvas = document.getElementById('droste') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  resolution: { value: new Vector2() },
  ppu: { value: 1 }, // device px per logo unit at the spiral's unit radius
  offset: { value: new Vector2() }, // log-zoom, rotation
  bars: { value: bars.map((b) => b.c) },
  halves: { value: bars.map((b) => b.h) },
}

const material = new ShaderMaterial({
  uniforms,
  defines: {
    NB: bars.length,
    S: S.toFixed(8),
    CX: C.x.toFixed(6),
    CY: C.y.toFixed(6),
    QLO: Q_LO.toFixed(1),
    QHI: Q_HI.toFixed(1),
  },
  vertexShader: /* glsl */ `
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution;
    uniform float ppu;
    uniform vec2 offset;
    uniform vec4 bars[NB];   // centre, direction
    uniform vec2 halves[NB]; // half length, half width

    const vec3 PAPER = vec3(0.965);
    const vec3 INK = vec3(0.0);

    vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }

    // signed distance to the mark (logo units)
    float logoSD(vec2 p) {
      vec2 o = max(max(vec2(42.0) - p, p - vec2(558.0)), 0.0);
      float away = length(o);
      if (away > 30.0) return away;
      float d = 1e9;
      for (int i = 0; i < NB; i++) {
        vec4 b = bars[i];
        vec2 r = p - b.xy;
        vec2 l = vec2(dot(r, b.zw), dot(r, vec2(-b.w, b.z)));
        vec2 q = abs(l) - halves[i];
        d = min(d, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
      }
      return d;
    }

    bool inSquare(vec2 p, float lo, float hi) { return all(greaterThanEqual(p, vec2(lo))) && all(lessThanEqual(p, vec2(hi))); }

    void main() {
      vec2 c = vec2(CX, CY);
      float L = log(S); // one nesting step in log-radius (negative)
      vec2 z = (gl_FragCoord.xy - 0.5 * resolution) / ppu;
      float r = max(length(z), 1e-6);

      // Escher: w = β · (log z + offset), β = 1 − i ln S / 2π
      vec2 beta = vec2(1.0, -L / 6.2831853);
      vec2 w = cmul(vec2(log(r), atan(z.y, z.x)) + offset, beta);
      // one step of scale changes nothing, so keep the log-radius near the picture's own size
      float r0 = log(250.0);
      w.x = r0 + mod(w.x - r0, -L);
      vec2 p = c + exp(w.x) * vec2(cos(w.y), sin(w.y));

      // Droste: outside the picture is its parent, inside the opening its child
      vec2 qlo = c + S * (vec2(QLO) - c); // the opening's square: the picture sent through z → c + S(z − c)
      vec2 qhi = c + S * (vec2(QHI) - c);
      for (int i = 0; i < 6; i++) {
        if (!inSquare(p, QLO, QHI)) p = c + (p - c) * S;
        else if (all(greaterThanEqual(p, qlo)) && all(lessThanEqual(p, qhi))) p = c + (p - c) / S;
        else break;
      }

      // pixel footprint in logo units at p: |dp/dz| = |β| · |p − c| / |z|
      float fp = length(beta) * length(p - c) / r / ppu;
      float d = logoSD(p);
      float ink = clamp(0.5 - d / max(fp, 1e-4), 0.0, 1.0);
      vec3 col = mix(PAPER, INK, ink);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

// --- size and input -------------------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  uniforms.ppu.value = (Math.min(w, h) * dpr) / 900
}

const view = { zoom: 0, turn: 0, vz: 0, vt: 0 }
let drag: { x: number; y: number } | null = null
let lastInput = -1e9

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  drag = { x: e.clientX, y: e.clientY }
  view.vz = view.vt = 0
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return
  const k = 3 / Math.min(window.innerWidth, window.innerHeight)
  view.vt = (e.clientX - drag.x) * k
  view.vz = (e.clientY - drag.y) * k
  view.turn += view.vt
  view.zoom += view.vz
  drag = { x: e.clientX, y: e.clientY }
  lastInput = performance.now()
})
const up = () => {
  drag = null
  lastInput = performance.now()
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
// embedded: the wheel scrolls the host page (see core/embed)
if (!EMBEDDED) window.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    view.zoom += (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.002
    lastInput = performance.now()
  },
  { passive: false },
)

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (!drag) {
    // a flick keeps going a little; left alone, it sinks in slowly
    view.turn += view.vt
    view.zoom += view.vz
    view.vt *= 0.9
    view.vz *= 0.9
    const drift = now - lastInput > 1500 ? 1 : 0
    view.zoom -= dt * 0.16 * drift
  }
  uniforms.offset.value.set(view.zoom, view.turn)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
