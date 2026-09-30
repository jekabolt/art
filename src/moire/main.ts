// MOIRÉ: two layers of fine black lines on white paper. In the lower layer the lines are shifted by
// exactly half a period inside the logo; the upper layer is the same lines, moved by the pointer (or
// drifting by itself; on a phone, tilted) — and the mark itself, a plate, leans a few degrees with
// the same hand, for a little depth. Where the layers coincide the paper stays half grey; where they interleave it
// goes solid — so the mark appears only through the overlap, and as the upper layer turns a degree
// or slides a line, moiré fringes sweep the field and break at the mark's edge, showing it, hiding
// it, turning it inside out. A tap changes the family of lines: straight, rings, a fan of rays.
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
import './moire.css'

const bars = logoBars().map((s) => {
  const ax = s.ax - 300
  const ay = 300 - s.ay
  const bx = s.bx - 300
  const by = 300 - s.by
  const len = Math.hypot(bx - ax, by - ay)
  return { c: new Vector4((ax + bx) / 2, (ay + by) / 2, (bx - ax) / len, (by - ay) / len), h: new Vector2(len / 2, LOGO_STROKE / 2) }
})

const canvas = document.getElementById('moire') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  resolution: { value: new Vector2() },
  ppu: { value: 1 }, // device px per logo unit
  period: { value: 8 }, // device px between lines
  mode: { value: 0 }, // 0 lines, 1 rings, 2 rays
  hub: { value: 1000 }, // rays: the hub sits this far below the middle (device px), fanning the lines out
  move: { value: new Vector4() },
  // the mark's plate, tipped a few degrees in space: its axes and normal (x right, y up, z away)
  plateA: { value: new Vector3(1, 0, 0) },
  plateB: { value: new Vector3(0, 1, 0) },
  plateN: { value: new Vector3(0, 0, 1) },
  eye: { value: 3000 }, // device px from the eye to the screen // upper layer: turn, shift (in periods), centre x, centre y (device px from the middle)
  bars: { value: bars.map((b) => b.c) },
  halves: { value: bars.map((b) => b.h) },
}

const material = new ShaderMaterial({
  uniforms,
  defines: { NB: bars.length },
  vertexShader: /* glsl */ `
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution;
    uniform float ppu;
    uniform float period;
    uniform int mode;
    uniform float hub;
    uniform vec4 move;
    uniform vec3 plateA;
    uniform vec3 plateB;
    uniform vec3 plateN;
    uniform float eye;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.965);
    const vec3 INK = vec3(0.0);

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

    // the line pattern's phase at pixel position q (device px from the middle), in periods
    float phase(vec2 q, vec2 centre, float turn) {
      if (mode == 0) {
        float c = cos(turn);
        float s = sin(turn);
        return (c * q.x + s * q.y) / period;
      }
      if (mode == 1) return length(q - centre) / period;
      // rays from a hub far below, as many as it takes for them to be a period apart across the mark
      vec2 r = q - centre + vec2(0.0, hub);
      return (atan(r.x, r.y) + turn) * hub / period;
    }

    // lines DUTY of a period wide, antialiased by the phase's own slope; the slope comes from the smooth
    // phase, so the half-period jump at the mark stays crisp. Where lines crowd under three pixels
    // apart (the hub of the rays) they would alias into noise, so they fade to their average grey
    const float DUTY = 0.27;
    float line(float u, float slope) {
      float px = 1.0 / max(slope, 1e-4); // device px per period here
      float c = abs(fract(u - 0.5 * DUTY + 0.5) - 0.5); // periods from the nearest line's centre
      float cov = clamp(0.5 - (c - 0.5 * DUTY) * px, 0.0, 1.0);
      return mix(DUTY, cov, smoothstep(2.5, 4.5, px));
    }

    // where the ray from the eye through this pixel meets the tipped plate, in the plate's own px
    vec2 onPlate(vec2 q) {
      vec3 d = vec3(q, eye);
      float t = eye * plateN.z / dot(d, plateN);
      vec3 hit = vec3(0.0, 0.0, -eye) + t * d;
      return vec2(dot(hit, plateA), dot(hit, plateB));
    }

    void main() {
      vec2 q = gl_FragCoord.xy - 0.5 * resolution;
      // the mark and its lines belong to the plate, so they lean with it; the sheet around stays flat
      vec2 pq = onPlate(q);
      float mark = clamp(0.5 - logoSD(pq / ppu) * ppu, 0.0, 1.0);

      float flat_ = phase(q, vec2(0.0), 0.0);
      float tipped = phase(pq, vec2(0.0), 0.0);
      float onMark = step(0.5, mark);
      float lower = line(mix(flat_, tipped, onMark) + 0.5 * mark, mix(fwidth(flat_), fwidth(tipped), onMark));

      float up = phase(q, move.zw, move.x) + move.y;
      float upper = line(up, fwidth(up));

      // two transparencies over each other: ink wherever either has a line
      float ink = 1.0 - (1.0 - lower) * (1.0 - upper);
      gl_FragColor = vec4(mix(PAPER, INK, ink), 1.0);
    }
  `,
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

// --- size ---------------------------------------------------------------------------------------------
let dpr = 1
let w = 1
let h = 1
function resize() {
  w = window.innerWidth
  h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  const side = Math.min(w <= 768 ? 0.72 * w : 0.42 * w, 0.66 * h)
  uniforms.ppu.value = (side * dpr) / 516
  // fine enough to shimmer, coarse enough to survive the screen: 4 css px on phones, 5 on desktop
  uniforms.period.value = (w <= 768 ? 4 : 5) * dpr
  uniforms.hub.value = 1.1 * h * dpr
  uniforms.eye.value = 2.2 * Math.max(w, h) * dpr
}

// --- input: the pointer steers the upper layer; a tap changes the lines -------------------------------------
const target = { x: 0, y: 0 }
const at = { x: 0, y: 0 }
let lastInput = -1e9
let down: { x: number; y: number } | null = null

function aim(e: PointerEvent) {
  target.x = (e.clientX / w) * 2 - 1
  target.y = (e.clientY / h) * 2 - 1
  lastInput = performance.now()
}
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY }
  aim(e)
})
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' || e.buttons) aim(e)
})
canvas.addEventListener('pointerup', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) uniforms.mode.value = (uniforms.mode.value + 1) % 3
  down = null
})

// --- tilt: on a phone the upper layer follows the phone's tilt, measured from how it is held ------------
const tilt = { on: false, b0: 0, g0: 0 }
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v))
function onTilt(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return
  if (!tilt.on) {
    tilt.on = true
    tilt.b0 = e.beta
    tilt.g0 = e.gamma
  }
  // the neutral slowly follows the hand, so a phone held at any angle comes back to rest
  tilt.b0 += (e.beta - tilt.b0) * 0.002
  tilt.g0 += (e.gamma - tilt.g0) * 0.002
  target.x = clamp1((e.gamma - tilt.g0) / 15) // ±15° sideways sweeps the whole range
  target.y = clamp1((e.beta - tilt.b0) / 15)
  lastInput = performance.now()
}
const motion = document.querySelector<HTMLButtonElement>('.l-motion')
const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
const touch = window.matchMedia('(pointer: coarse)').matches
if (touch && DOE && typeof DOE.requestPermission === 'function') {
  // iOS: motion only after a tap on the button
  motion?.classList.remove('-none')
  motion?.addEventListener('click', () => {
    DOE.requestPermission!()
      .then((r) => r === 'granted' && window.addEventListener('deviceorientation', onTilt))
      .finally(() => motion.classList.add('-none'))
  })
} else if (touch && DOE) window.addEventListener('deviceorientation', onTilt)

// the plate tips with the same hand, a few degrees at most: just enough for depth
const TIP = 0.075
function tip(yaw: number, pitch: number) {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const rx = (v: number[]) => [v[0], v[1] * cp - v[2] * sp, v[1] * sp + v[2] * cp]
  const a = rx([c, 0, -s])
  const b = rx([0, 1, 0])
  const n = rx([s, 0, c])
  uniforms.plateA.value.set(a[0], a[1], a[2])
  uniforms.plateB.value.set(b[0], b[1], b[2])
  uniforms.plateN.value.set(n[0], n[1], n[2])
}

let last = performance.now()
function frame(t: number) {
  const dt = Math.min(0.05, (t - last) / 1000)
  last = t
  if (t - lastInput > 3000) {
    // nobody is steering: drift slowly through the fringes
    const s = t / 1000
    target.x = Math.sin(s * 0.11) * 0.5
    target.y = Math.sin(s * 0.07 + 1.1) * 0.5
  }
  const k = 1 - Math.exp(-dt * 4)
  at.x += (target.x - at.x) * k
  at.y += (target.y - at.y) * k
  const m = uniforms.mode.value
  const small = Math.min(w, h) * dpr
  const p = uniforms.period.value
  if (m === 0) uniforms.move.value.set(at.x * 0.09, at.y * 2, 0, 0) // turn up to ±5°, slide two lines
  else if (m === 1) uniforms.move.value.set(0, 0, at.x * p * 9, -at.y * p * 9) // rings: the centre wanders up to nine rings off
  else uniforms.move.value.set(at.x * 0.012, 0, 0, at.y * small * 0.12) // rays: the fan turns a little, its hub slides
  tip(at.x * TIP, -at.y * TIP)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
