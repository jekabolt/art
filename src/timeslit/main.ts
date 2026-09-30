// TIME SLIT: slit-scan, with the logo in front of the slit. Every line of the screen is taken at a
// different moment: the line through the mark's middle shows it now, and the further a line lies
// from it, the older the moment it shows — up to three seconds back. Held still, the mark is itself;
// dragged, it stretches and bends into the path it has taken, like the long fingers of a hand typing
// in front of a slit camera, and it swings a little as it goes, which twists the smear. Left alone it
// wanders on its own; on a phone it also follows the tilt. A tap turns the slit: across (lines),
// upright (columns), or round (rings from the mark's middle, so a turn becomes a spiral).
//
// One fragment shader. The mark's recent positions and angles live in a small float texture, one
// texel per frame; each pixel picks its moment, blends the two nearest frames, and tests the exact
// distance to the mark at that pose.
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { DataTexture } from 'three/src/textures/DataTexture'
import { FloatType, NearestFilter, RGBAFormat } from 'three/src/constants'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector4 } from 'three/src/math/Vector4'
import { LOGO_STROKE } from '../core/logo-path'
import { logoBars } from '../core/logo-bars'
import './timeslit.css'

const HIST = 180 // frames of history: three seconds at sixty a second

const bars = logoBars().map((s) => {
  const ax = s.ax - 300
  const ay = 300 - s.ay
  const bx = s.bx - 300
  const by = 300 - s.by
  const len = Math.hypot(bx - ax, by - ay)
  return { c: new Vector4((ax + bx) / 2, (ay + by) / 2, (bx - ax) / len, (by - ay) / len), h: new Vector2(len / 2, LOGO_STROKE / 2) }
})

const canvas = document.getElementById('timeslit') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

// history: x, y (device px from the middle, y up), angle, unused — newest at `head`
const histData = new Float32Array(HIST * 4)
const hist = new DataTexture(histData, HIST, 1, RGBAFormat, FloatType)
hist.minFilter = hist.magFilter = NearestFilter
hist.needsUpdate = true

const uniforms = {
  resolution: { value: new Vector2() },
  ppu: { value: 1 },
  hist: { value: hist },
  head: { value: 0 },
  now: { value: new Vector4() },
  reach: { value: 2000 }, // device px from the slit's live line to the oldest moment
  mode: { value: 0 },
  bars: { value: bars.map((b) => b.c) },
  halves: { value: bars.map((b) => b.h) },
}

const material = new ShaderMaterial({
  uniforms,
  defines: { NB: bars.length, HIST: HIST.toFixed(1) },
  vertexShader: /* glsl */ `
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution;
    uniform float ppu;
    uniform sampler2D hist;
    uniform float head;
    uniform vec4 now;
    uniform float reach;
    uniform int mode;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.957, 0.953, 0.937);
    const vec3 INK = vec3(0.043);

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

    vec4 poseAt(float k) {
      // k frames back from the newest
      float i = mod(head - k + HIST, HIST);
      return texture2D(hist, vec2((floor(i) + 0.5) / HIST, 0.5));
    }

    void main() {
      vec2 q = gl_FragCoord.xy - 0.5 * resolution;
      // how far this pixel lies from the slit's live line, in device px
      float off;
      if (mode == 0) off = abs(q.y - now.y);
      else if (mode == 1) off = abs(q.x - now.x);
      else off = length(q - now.xy);
      float k = clamp(off / reach, 0.0, 1.0) * (HIST - 2.0);
      vec4 a = poseAt(floor(k));
      vec4 b = poseAt(floor(k) + 1.0);
      vec4 pose = mix(a, b, fract(k));

      vec2 r = q - pose.xy;
      float c = cos(pose.z);
      float s = sin(pose.z);
      vec2 p = vec2(c * r.x + s * r.y, -s * r.x + c * r.y) / ppu;
      float ink = clamp(0.5 - logoSD(p) * ppu, 0.0, 1.0);
      gl_FragColor = vec4(mix(PAPER, INK, ink), 1.0);
    }
  `,
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

// --- size ---------------------------------------------------------------------------------------------
let w = 1
let h = 1
let dpr = 1
function resize() {
  w = window.innerWidth
  h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  const side = Math.min(w <= 768 ? 0.5 * w : 0.24 * w, 0.36 * h)
  uniforms.ppu.value = (side * dpr) / 516
  uniforms.reach.value = 1.2 * Math.max(w, h) * dpr
}

// --- the mark's motion: it follows the finger on a soft spring and swings as it goes ------------------------
const pos = { x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0 } // css px from the middle (y down), radians
const target = { x: 0, y: 0 }
let lastInput = -1e9
let down: { x: number; y: number } | null = null

function aim(e: PointerEvent) {
  target.x = e.clientX - w / 2
  target.y = e.clientY - h / 2
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

// tilt on a phone: the mark rolls toward the low side
const tilt = { on: false, x: 0, y: 0, b0: 0, g0: 0 }
function onTilt(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return
  if (!tilt.on) {
    tilt.on = true
    tilt.b0 = e.beta
    tilt.g0 = e.gamma
  }
  tilt.b0 += (e.beta - tilt.b0) * 0.002
  tilt.g0 += (e.gamma - tilt.g0) * 0.002
  tilt.x = Math.max(-1, Math.min(1, (e.gamma - tilt.g0) / 20))
  tilt.y = Math.max(-1, Math.min(1, (e.beta - tilt.b0) / 20))
}
const motion = document.querySelector<HTMLButtonElement>('.l-motion')
const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
const touch = window.matchMedia('(pointer: coarse)').matches
if (touch && DOE && typeof DOE.requestPermission === 'function') {
  motion?.classList.remove('-none')
  motion?.addEventListener('click', () => {
    DOE.requestPermission!()
      .then((r) => r === 'granted' && window.addEventListener('deviceorientation', onTilt))
      .finally(() => motion.classList.add('-none'))
  })
} else if (touch && DOE) window.addEventListener('deviceorientation', onTilt)

let head = 0
function record() {
  head = (head + 1) % HIST
  const o = head * 4
  histData[o] = pos.x * dpr
  histData[o + 1] = -pos.y * dpr
  histData[o + 2] = pos.a
  histData[o + 3] = 0
  hist.needsUpdate = true
  uniforms.head.value = head
  uniforms.now.value.set(pos.x * dpr, -pos.y * dpr, pos.a, 0)
}
function fill() {
  for (let i = 0; i < HIST; i++) {
    head = i
    record()
  }
}

let last = performance.now()
let acc = 0
function frame(t: number) {
  const dt = Math.min(0.05, (t - last) / 1000)
  last = t
  if (t - lastInput > 2500) {
    // nobody is steering: a slow wander, pulled by the tilt when there is one
    const s = t / 1000
    target.x = Math.sin(s * 0.53) * w * 0.22 + tilt.x * w * 0.3
    target.y = Math.sin(s * 0.37 + 1.2) * h * 0.18 + tilt.y * h * 0.3
  }
  // a soft spring, a little under-damped: the mark overshoots and settles
  const k = 38
  const c = 9
  pos.vx += ((target.x - pos.x) * k - pos.vx * c) * dt
  pos.vy += ((target.y - pos.y) * k - pos.vy * c) * dt
  pos.x += pos.vx * dt
  pos.y += pos.vy * dt
  // it swings with its sideways speed, like a card on a string
  const aTarget = Math.max(-0.6, Math.min(0.6, -pos.vx * 0.0012))
  pos.va += ((aTarget - pos.a) * 60 - pos.va * 10) * dt
  pos.a += pos.va * dt
  // history at a steady sixty a second, whatever the display's rate
  acc += dt
  while (acc >= 1 / 60) {
    acc -= 1 / 60
    record()
  }
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
fill()
requestAnimationFrame(frame)
