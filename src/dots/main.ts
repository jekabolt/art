// DOTS (after the op-art screenprints of red dot grids cut and turned in rectangles): one even grid
// of red dots on paper, and the logo cut out of it. Inside the strokes the grid is turned and
// shifted a little; inside the mark's square, around the strokes, it is turned the other way. The
// mark shows only where the grids disagree: dots sliced along the edges, rows that no longer meet.
// A finger or the cursor slides and turns the inner grids; left alone they drift. A click or a tap
// changes the colour: red, blue, black, purple — the brand's palette.
//
// One fragment shader. The mark is the exact signed distance to its bars, and dots are sliced by it
// with a one-pixel antialiased edge.
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'
import { Vector4 } from 'three/src/math/Vector4'
import { LOGO_STROKE } from '../core/logo-path'
import { logoBars } from '../core/logo-bars'
import './dots.css'

const PITCH = 18 // logo units between dots: two dots across a stroke
const bars = logoBars().map((s) => {
  const ax = s.ax - 300
  const ay = 300 - s.ay
  const bx = s.bx - 300
  const by = 300 - s.by
  const len = Math.hypot(bx - ax, by - ay)
  return { c: new Vector4((ax + bx) / 2, (ay + by) / 2, (bx - ax) / len, (by - ay) / len), h: new Vector2(len / 2, LOGO_STROKE / 2) }
})

const canvas = document.getElementById('dots') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  resolution: { value: new Vector2() },
  ppu: { value: 1 }, // device px per logo unit
  inner: { value: new Vector4() }, // strokes' grid: offset x, y, angle, —
  frame: { value: new Vector4() }, // square's grid: offset x, y, angle, —
  ink: { value: new Vector3() },
  bars: { value: bars.map((b) => b.c) },
  halves: { value: bars.map((b) => b.h) },
}

const material = new ShaderMaterial({
  uniforms,
  defines: { NB: bars.length, PITCH: PITCH.toFixed(1) },
  vertexShader: /* glsl */ `
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution;
    uniform float ppu;
    uniform vec4 inner;
    uniform vec4 frame;
    uniform vec3 ink;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.945, 0.937, 0.918);

    float logoSD(vec2 p) {
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
    float boxSD(vec2 p, float h) {
      vec2 q = abs(p) - vec2(h);
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    }

    // coverage of a dot grid at p: pitch PITCH, dots 0.78 of the pitch across, turned and shifted
    float grid(vec2 p, vec3 g, float px) {
      float c = cos(g.z);
      float s = sin(g.z);
      vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) + g.xy;
      vec2 cell = mod(q, PITCH) - 0.5 * PITCH;
      float d = length(cell) - 0.39 * PITCH;
      return clamp(0.5 - d / px, 0.0, 1.0);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / ppu;
      float px = 1.0 / ppu; // one device pixel in logo units

      float outer = grid(p, vec3(0.0), px);
      float sq = clamp(0.5 - boxSD(p, 258.0 + 30.0) / px, 0.0, 1.0);   // the mark's square, with a margin
      float mark = clamp(0.5 - logoSD(p) / px, 0.0, 1.0);             // the strokes

      float cover = outer;
      if (sq > 0.0) cover = mix(cover, grid(p, frame.xyz, px), sq);
      if (mark > 0.0) cover = mix(cover, grid(p, inner.xyz, px), mark);

      gl_FragColor = vec4(mix(PAPER, ink, cover), 1.0);
    }
  `,
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

// --- size -----------------------------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  // the square with its margin fills most of the short side, like the print's rectangles
  const side = Math.min(w <= 768 ? 0.86 * w : 0.5 * w, 0.72 * h)
  uniforms.ppu.value = (side * dpr) / (516 + 60)
}

// --- colour: a click takes the next one from the brand's palette (grbpwr.com's own colours) ------------------
const PALETTE = [0xff0000, 0x311eee, 0x000000, 0x501089] // red, blue, black, purple
const rgb = (hex: number) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]
let colour = 0
let from = rgb(PALETTE[0])
let changed = -1e9
uniforms.ink.value.set(from[0], from[1], from[2])

let down: { x: number; y: number } | null = null
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }))
canvas.addEventListener('pointerup', (e) => {
  // a click or a tap, not the end of a swipe
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
    const c = uniforms.ink.value
    from = [c.x, c.y, c.z]
    colour = (colour + 1) % PALETTE.length
    changed = performance.now()
  }
  down = null
})

function tint(t: number) {
  const k = Math.min(1, (t - changed) / 350)
  const e = k * k * (3 - 2 * k)
  const to = rgb(PALETTE[colour])
  uniforms.ink.value.set(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e, from[2] + (to[2] - from[2]) * e)
}

// --- input -------------------------------------------------------------------------------------------------
// the pointer, as -1..1 across the screen; the grids follow it, softly
const target = { x: 0, y: 0 }
const now = { x: 0, y: 0 }
let lastInput = -1e9

function point(e: PointerEvent) {
  target.x = (e.clientX / window.innerWidth) * 2 - 1
  target.y = (e.clientY / window.innerHeight) * 2 - 1
  lastInput = performance.now()
}
canvas.addEventListener('pointerdown', point)
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' || e.buttons) point(e)
})

let last = performance.now()
function frame(t: number) {
  const dt = Math.min(0.05, (t - last) / 1000)
  last = t
  if (t - lastInput > 2500) {
    // nobody is steering: a slow figure-eight
    const s = t / 1000
    target.x = Math.sin(s * 0.23) * 0.6
    target.y = Math.sin(s * 0.17 + 1.3) * 0.5
  }
  const k = 1 - Math.exp(-dt * 5)
  now.x += (target.x - now.x) * k
  now.y += (target.y - now.y) * k
  // strokes: slide up to a pitch and a half, turn up to ±9°; the square: less, and the other way
  uniforms.inner.value.set(now.x * PITCH * 1.5, -now.y * PITCH * 1.5, 0.06 + now.x * 0.1, 0)
  uniforms.frame.value.set(-now.x * PITCH * 0.6, now.y * PITCH * 0.6, -0.05 - now.y * 0.06, 0)
  tint(t)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
