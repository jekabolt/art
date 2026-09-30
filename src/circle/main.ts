// CIRCLE LIMIT (after Escher's Circle Limit woodcuts): the logo tiling the hyperbolic plane, drawn
// in the Poincaré disk. The tiling is {4,6} — squares, six around every corner, which only
// hyperbolic space allows — and every square holds the mark, its frame running along the square's
// edges. Seen in the disk, the edges are arcs meeting the rim at right angles, so the frames bend
// and the marks shrink without end toward the rim, which they never reach. The plane drifts slowly
// on its own; a swipe drags it (a hyperbolic translation — whatever is under the finger stays under
// it), and it coasts after the release. A tap turns every other square to negative, like the
// woodcut's alternating fish.
//
// One fragment shader. Each pixel is carried back by the current motion, then folded into the
// central square by reflecting it across whichever edge it lies beyond, until it is inside; an odd
// number of reflections is undone by one more across the square's axis, so no mark reads mirrored.
// In the central square the point goes to the Klein model, where the square's edges are straight,
// and from there onto the mark. Antialiasing uses the exact local scale of the fold (hyperbolic
// isometries keep λ|dz|, λ = 2/(1−|z|²)), and where marks shrink below a few pixels they fade to
// their average grey.
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
import './circle.css'

// --- the {4,6} tiling's central square -------------------------------------------------------------------
const P = 4
const Q = 6
const inradius = Math.acosh(Math.cos(Math.PI / Q) / Math.sin(Math.PI / P)) // hyperbolic, centre to edge
const s = Math.tanh(inradius / 2) // the same, in the disk
const EDGE_C = (1 + s * s) / (2 * s) // each edge: a circle meeting the rim at right angles
const EDGE_R = (1 - s * s) / (2 * s)
const KLEIN_H = Math.tanh(inradius) // the square's half side in the Klein model
const INSET = 0.9 // the mark fills this much of its square, leaving a seam of paper between frames

const bars = logoBars().map((b) => {
  const ax = b.ax - 300
  const ay = 300 - b.ay
  const bx = b.bx - 300
  const by = 300 - b.by
  const len = Math.hypot(bx - ax, by - ay)
  return { c: new Vector4((ax + bx) / 2, (ay + by) / 2, (bx - ax) / len, (by - ay) / len), h: new Vector2(len / 2, LOGO_STROKE / 2) }
})

const canvas = document.getElementById('circle') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  resolution: { value: new Vector2() },
  radius: { value: 400 }, // device px
  motion: { value: new Vector4(1, 0, 0, 0) }, // the inverse motion: z → (a z + b) / (b̄ z + ā), as a.re, a.im, b.re, b.im
  checker: { value: 0 },
  bars: { value: bars.map((b) => b.c) },
  halves: { value: bars.map((b) => b.h) },
}

const material = new ShaderMaterial({
  uniforms,
  defines: {
    NB: bars.length,
    EDGE_C: EDGE_C.toFixed(6),
    EDGE_R: EDGE_R.toFixed(6),
    TO_LOGO: (258 / INSET / KLEIN_H).toFixed(6),
  },
  vertexShader: /* glsl */ `
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution;
    uniform float radius;
    uniform vec4 motion;
    uniform float checker;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.953, 0.945, 0.937);
    const vec3 INK = vec3(0.04);
    const float GREY = 0.36; // the mark's share of ink over its square, for where it is too small to draw

    vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
    vec2 cdiv(vec2 a, vec2 b) { return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b); }
    vec2 conj(vec2 a) { return vec2(a.x, -a.y); }

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

    // one sample: the ink at disk point q (pix: one device pixel in disk units)
    float shade(vec2 q, float pix, out float scale) {
      float r2 = dot(q, q);
      // carry the pixel back by the plane's motion
      vec2 a = motion.xy;
      vec2 b = motion.zw;
      vec2 z = cdiv(cmul(a, q) + b, cmul(conj(b), q) + conj(a));

      // fold into the central square: reflect across any edge it lies beyond (inversion in that
      // edge's circle), until it lies beyond none
      float flips = 0.0;
      bool done = false;
      for (int i = 0; i < 80; i++) {
        bool moved = false;
        for (int k = 0; k < 4; k++) {
          float ang = float(k) * 1.5707963;
          vec2 c = vec2(cos(ang), sin(ang)) * EDGE_C;
          vec2 d = z - c;
          float dd = dot(d, d);
          if (dd < EDGE_R * EDGE_R) {
            z = c + d * (EDGE_R * EDGE_R / dd);
            flips += 1.0;
            moved = true;
          }
        }
        if (!moved) { done = true; break; }
      }
      float odd = mod(flips, 2.0);
      if (odd > 0.5) z.y = -z.y; // undo the mirror: the square is symmetric about this axis

      // to the Klein model (straight edges), then onto the mark
      float w2 = dot(z, z);
      vec2 k = 2.0 * z / (1.0 + w2);
      vec2 p = k * TO_LOGO;

      // the local scale: logo units per device pixel
      scale = (1.0 - w2) / max(1.0 - r2, 1e-6) * (2.0 / (1.0 + w2)) * TO_LOGO * pix;
      float ink = clamp(0.5 - logoSD(p) / scale, 0.0, 1.0);
      ink = mix(ink, GREY, smoothstep(16.0, 48.0, scale));
      if (!done) ink = GREY;
      if (checker > 0.5 && odd > 0.5) ink = 1.0 - ink;
      return ink;
    }

    void main() {
      vec2 q = (gl_FragCoord.xy - 0.5 * resolution) / radius; // the disk is the unit circle
      float r2 = dot(q, q);
      float pix = 1.0 / radius;
      float rim = clamp((1.0 - sqrt(r2)) / pix + 0.5, 0.0, 1.0); // coverage of the disk, antialiased
      if (rim <= 0.0) { gl_FragColor = vec4(PAPER, 1.0); return; }

      float scale;
      float ink = shade(q, pix, scale);
      if (scale > 6.0) {
        // out toward the rim, where marks shrink to a few pixels: four more samples inside the pixel
        float s2;
        float acc = ink;
        acc += shade(q + vec2(-0.3, -0.3) * pix, pix, s2);
        acc += shade(q + vec2(0.3, -0.3) * pix, pix, s2);
        acc += shade(q + vec2(-0.3, 0.3) * pix, pix, s2);
        acc += shade(q + vec2(0.3, 0.3) * pix, pix, s2);
        ink = acc / 5.0;
      }

      vec3 col = mix(PAPER, INK, ink);
      gl_FragColor = vec4(mix(PAPER, col, rim), 1.0);
    }
  `,
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

// --- size -----------------------------------------------------------------------------------------------
let w = 1
let h = 1
let dpr = 1
let R = 1 // css px: the disk's radius
function resize() {
  w = window.innerWidth
  h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  R = Math.min(w, h) * (w <= 768 ? 0.47 : 0.45)
  uniforms.radius.value = R * dpr
}

// --- motion: a hyperbolic isometry z → (a z + b)/(b̄ z + ā), |a|² − |b|² = 1 ---------------------------------
type C = [number, number]
type M = { a: C; b: C }
const mul = (x: C, y: C): C => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]]
const add = (x: C, y: C): C => [x[0] + y[0], x[1] + y[1]]
const cj = (x: C): C => [x[0], -x[1]]
function compose(m1: M, m2: M): M {
  // m1 after m2
  const a = add(mul(m1.a, m2.a), mul(m1.b, cj(m2.b)))
  const b = add(mul(m1.a, m2.b), mul(m1.b, cj(m2.a)))
  const n = Math.sqrt(Math.max(1e-12, a[0] ** 2 + a[1] ** 2 - b[0] ** 2 - b[1] ** 2))
  return { a: [a[0] / n, a[1] / n], b: [b[0] / n, b[1] / n] }
}
// the translation taking 0 to c
function toward(c: C): M {
  const n = Math.sqrt(Math.max(1e-12, 1 - c[0] ** 2 - c[1] ** 2))
  return { a: [1 / n, 0], b: [c[0] / n, c[1] / n] }
}
let motion: M = { a: [1, 0], b: [0, 0] }

// --- input -------------------------------------------------------------------------------------------------
const toDisk = (e: PointerEvent): C => {
  const x = (e.clientX - w / 2) / R
  const y = -(e.clientY - h / 2) / R
  const r = Math.hypot(x, y)
  const k = r > 0.97 ? 0.97 / r : 1
  return [x * k, y * k]
}
let down: { x: number; y: number } | null = null
let drag: { z: C; t: number } | null = null
let vel: C = [0, 0] // translation at the origin, per second
let lastInput = -1e9

canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY }
  drag = { z: toDisk(e), t: performance.now() }
  vel = [0, 0]
  lastInput = performance.now()
  canvas.setPointerCapture(e.pointerId)
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return
  const now = performance.now()
  const z1 = toDisk(e)
  const z0 = drag.z
  // whatever was under the finger stays under it: take z0 to the middle, then the middle to z1
  motion = compose(toward(z1), compose(toward([-z0[0], -z0[1]]), motion))
  const dt = Math.max(0.008, (now - drag.t) / 1000)
  const f = 1 / Math.max(0.05, 1 - (z0[0] ** 2 + z0[1] ** 2)) // a step out there is a longer one at the middle
  vel = [vel[0] * 0.5 + ((z1[0] - z0[0]) * f * 0.5) / dt, vel[1] * 0.5 + ((z1[1] - z0[1]) * f * 0.5) / dt]
  drag = { z: z1, t: now }
  lastInput = now
})
function release(e: PointerEvent) {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
    uniforms.checker.value = 1 - uniforms.checker.value
    vel = [0, 0]
  }
  if (drag && performance.now() - drag.t > 80) vel = [0, 0]
  down = null
  drag = null
  lastInput = performance.now()
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)

// --- loop --------------------------------------------------------------------------------------------------
let last = performance.now()
function frame(t: number) {
  const dt = Math.min(0.05, (t - last) / 1000)
  last = t
  if (!drag) {
    // coasting after a swipe, and, once it has died down, the slow drift, its heading turning
    const idle = t - lastInput > 2500
    const s = t / 1000
    const drift: C = idle ? [Math.cos(s * 0.05) * 0.07, Math.sin(s * 0.05) * 0.07] : [0, 0]
    const f = Math.exp(-dt / 1.2)
    vel = [vel[0] * f, vel[1] * f]
    const step: C = [(vel[0] + drift[0]) * dt, (vel[1] + drift[1]) * dt]
    if (step[0] || step[1]) motion = compose(toward(step), motion)
  }
  // the shader takes the inverse: ā, −b
  uniforms.motion.value.set(motion.a[0], -motion.a[1], -motion.b[0], -motion.b[1])
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
