// EXTRUDE: the logo pulled out into a long grey solid, the way a 2023 story showed it — flat grey
// faces, the body running far back and sinking into the black, its tail flickering: the far end is
// cut by a moving field, |sin| of a diagonal wave against a threshold that drifts with time (the
// same function the old emboss shader cut its layers with), and the cut edge shivers a little every
// frame. A finger (or the mouse) turns it a little; let go and it eases back to its pose.
// A tap presses material through the die: a swell of the cross-section, lit, runs from the face to
// the end, and the tail shoots out to its full length behind it before the cut eats it back.
//
// The solid is the logo's bars (core/logo-bars: rectangles that add up to the mark) each extruded
// into a box. Shading is flat and hand-made: a grey by face direction, darkened along the depth.
import '../core/embed'
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './extrude.css'

// --- the tail's function: picked from the row under the picture, kept in the address (?f=) --------
const FNS = ['sin', 'plasma', 'fbm', 'warp', 'cells', 'ridge', 'tan'] as const
const fromUrl = new URLSearchParams(location.search).get('f')
let fnIndex = Math.max(0, FNS.indexOf((fromUrl ?? 'sin') as (typeof FNS)[number]))
const picker = document.getElementById('fn') as HTMLElement
function renderPicker() {
  picker.replaceChildren(
    ...FNS.map((name, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = name
      b.setAttribute('aria-pressed', String(i === fnIndex))
      b.addEventListener('click', () => {
        fnIndex = i
        const q = new URLSearchParams(location.search)
        q.set('f', name)
        history.replaceState(null, '', `${location.pathname}?${q}`)
        renderPicker()
      })
      return b
    }),
  )
}
renderPicker()

const LOOK = {
  /** Mark width as a share of the screen width: phone / desktop. */
  markXs: 0.5,
  markLg: 0.22,
  /** Extrusion depth in mark widths. */
  depth: 2.6,
  /** Rest pose, degrees: the face turned up-left, the body running down-right into the dark. */
  rest: { x: -20, y: -32 },
  /** How far a drag may turn it from the rest pose, degrees. */
  reach: 24,
  /** Degrees per px of drag. */
  dragGain: 0.12,
  face: 0.56, // grey of the logo's face
  side: [0.36, 0.62], // grey of the walls, darkest → lightest by how they face the light
  far: 0.06, // what the far end fades to
}

const canvas = document.getElementById('extrude') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 1)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(38, 1, 1, 100000)

// --- the solid, in logo units (600 frame, y down → flipped to y up), centred on the mark ---------------
// The walls start a hair behind the face, and the face is its own flat plates: overlapping boxes
// would otherwise show their inner walls' front edges as dotted seams on the face.
const D = 516 * LOOK.depth
const parts = logoBars().flatMap((s) => {
  const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
  const place = (g: THREE.BufferGeometry) => {
    g.rotateZ(-Math.atan2(s.by - s.ay, s.bx - s.ax))
    g.translate((s.ax + s.bx) / 2 - 300, 300 - (s.ay + s.by) / 2, 0)
    return g
  }
  const body = new THREE.BoxGeometry(len, LOGO_STROKE, D - 1, 1, 1, 64) // depth segments: the swell bends the walls
  body.translate(0, 0, -(D - 1) / 2 - 1)
  const plate = new THREE.PlaneGeometry(len, LOGO_STROKE)
  return [place(body.toNonIndexed()), place(plate.toNonIndexed())]
})
const geo = mergeBufferGeometries(parts)!

const mat = new THREE.ShaderMaterial({
  uniforms: {
    face: { value: LOOK.face },
    sideLo: { value: LOOK.side[0] },
    sideHi: { value: LOOK.side[1] },
    far: { value: LOOK.far },
    depth: { value: D },
    time: { value: 0 },
    fn: { value: 0 },
    pulse: { value: 99 }, // seconds since the last tap
  },
  side: THREE.DoubleSide,
  vertexShader: /* glsl */ `
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    varying vec2 vXY;
    varying float vSwell;
    uniform float depth, pulse;
    // where the swell is along the body (0 = face, 1 = the end) and how strong, after a tap
    float swellAt(float d) {
      float at = pulse * 0.9 - 0.08;
      float k = exp(-pow((d - at) / 0.07, 2.0));
      return k * exp(-pulse * 0.9) * step(pulse, 3.0);
    }
    void main() {
      vXY = position.xy / 516.0; // the mark's width = 1
      vN = normalize(mat3(modelMatrix) * normal);
      vFace = step(0.99, normal.z);
      vDepth = clamp(-position.z / depth, 0.0, 1.0);
      vSwell = swellAt(vDepth);
      vec3 p = position;
      p.xy *= 1.0 + 0.16 * vSwell; // the section swells about the mark's centre
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    varying vec2 vXY;
    varying float vSwell;
    uniform float face, sideLo, sideHi, far, time, fn, pulse;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec2 hash2(vec2 p) {
      return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float a = 0.5, s = 0.0;
      for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; }
      return s / 0.97;
    }

    // How far back the body reaches at this point of the mark (0 = the face, 1 = the full length).
    float reachAt(vec2 p, float t) {
      if (fn < 0.5) {
        // sin: a diagonal wave, |sin|, swung by a slower cross wave
        float w = sin((p.x + p.y) * 3.1 + t * 1.4);
        float c = sin((p.x - p.y) * 4.7 - t * 0.9) * 0.5 + 0.5;
        return abs(w) * (0.5 + 0.5 * c);
      }
      if (fn < 1.5) {
        // plasma: four waves at different angles and speeds, summed and folded
        float v = sin(p.x * 5.0 + t) + sin(p.y * 6.3 - t * 1.3) + sin((p.x + p.y) * 4.1 + t * 0.7)
          + sin(length(p - vec2(0.3 * sin(t * 0.5), 0.3 * cos(t * 0.4))) * 9.0 - t * 2.0);
        return abs(sin(v * 1.3));
      }
      if (fn < 2.5) {
        // fbm: five octaves of value noise drifting along
        return smoothstep(0.25, 0.75, fbm(p * 3.0 + vec2(t * 0.35, -t * 0.2)));
      }
      if (fn < 3.5) {
        // warp: noise sampled through noise (domain warping), slow smoke
        vec2 q = vec2(fbm(p * 2.5 + t * 0.15), fbm(p * 2.5 + vec2(5.2, 1.3) - t * 0.12));
        vec2 r = vec2(fbm(p * 2.5 + 4.0 * q + vec2(1.7, 9.2) + t * 0.2), fbm(p * 2.5 + 4.0 * q + vec2(8.3, 2.8)));
        return smoothstep(0.2, 0.8, fbm(p * 2.5 + 4.0 * r));
      }
      if (fn < 4.5) {
        // cells: moving Voronoi seeds; the body is long at the seeds and short at the borders
        vec2 g = p * 5.0;
        vec2 i = floor(g), f = fract(g);
        float d1 = 8.0, d2 = 8.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 o = vec2(float(x), float(y));
          vec2 h = hash2(i + o);
          vec2 c = o + 0.5 + 0.45 * sin(t * 0.8 + 6.2831 * h) - f;
          float d = dot(c, c);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
        }
        return smoothstep(0.0, 0.6, sqrt(d2) - sqrt(d1));
      }
      if (fn < 5.5) {
        // ridge: the creases of noise, 1 - |n|, stacked: thin bright veins like lightning
        float s = 0.0, a = 0.6;
        vec2 q = p * 2.2 + vec2(t * 0.25, t * 0.1);
        for (int i = 0; i < 4; i++) { s += a * (1.0 - abs(vnoise(q) * 2.0 - 1.0)); q = mat2(1.6, 1.2, -1.2, 1.6) * q; a *= 0.5; }
        return pow(clamp(s / 1.1, 0.0, 1.0), 3.0);
      }
      // tan: tangent of a travelling wave, clamped: long calm stretches broken by sudden jumps
      float v = tan((p.x * 1.7 + p.y * 2.3) * 2.0 + t * 0.9) * 0.25 + sin(p.y * 7.0 - t * 1.7) * 0.15;
      return clamp(abs(v), 0.0, 1.0);
    }

    void main() {
      // The tail: where the body ends is a field, not a plane (one of the functions above, picked
      // below the picture); the cut edge gets a per-pixel jitter re-rolled twelve times a second, so
      // it flickers like the story did. Near zero the cut reaches into the face.
      float reach = 0.02 + 0.8 * reachAt(vXY, time);
      // behind the running swell the material is pushed out whole, then the cut eats back into it
      float pushed = clamp(pulse * 0.9, 0.0, 1.0) * (1.0 - smoothstep(1.2, 2.6, pulse));
      reach = max(reach, pushed);
      float shiver = (hash(floor(gl_FragCoord.xy / 2.0) + floor(time * 12.0)) - 0.5) * 0.05;
      if (vDepth > reach + shiver) discard;

      // inside of the cut: the hollow of the walls, dark
      if (!gl_FrontFacing) { gl_FragColor = vec4(vec3(far * 0.6), 1.0); return; }

      vec3 n = normalize(vN);
      // a soft light from the upper left, in front: the faces turned to it read lighter
      float l = dot(n, normalize(vec3(-0.5, 0.7, 0.6))) * 0.5 + 0.5;
      float g = mix(sideLo, sideHi, l);
      g = mix(g, face, vFace);
      // the body sinks into the dark towards its far end
      g = mix(g, far, pow(vDepth / 0.8, 0.9) * 0.85);
      g = min(1.0, g + vSwell * 0.45); // the swell catches the light
      gl_FragColor = vec4(vec3(g) * vec3(0.98, 0.97, 1.0), 1.0);
    }`,
})

const solid = new THREE.Mesh(geo, mat)
solid.position.z = D * 0.3 // turn about a point inside the body, not about the face
const pivot = new THREE.Group()
pivot.add(solid)
scene.add(pivot)

// --- turning: drag offsets the pose within reach; released, it eases back --------------------------
const rad = THREE.MathUtils.degToRad
let target = { x: 0, y: 0 }
let pose = { x: 0, y: 0 }
let drag: { id: number; x: number; y: number; ox: number; oy: number } | null = null
const clampReach = (v: number) => Math.max(-LOOK.reach, Math.min(LOOK.reach, v))

canvas.addEventListener('pointerdown', (e) => {
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: target.x, oy: target.y }
  canvas.setPointerCapture(e.pointerId)
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return
  target.y = clampReach(drag.oy + (e.clientX - drag.x) * LOOK.dragGain)
  target.x = clampReach(drag.ox + (e.clientY - drag.y) * LOOK.dragGain)
})
// A tap (pressed and let go within 12 px and 350 ms) sends a pulse down the body.
let tapAt = -99
let press: { x: number; y: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => (press = { x: e.clientX, y: e.clientY, t: performance.now() }))
const release = (e: PointerEvent) => {
  if (drag && e.pointerId === drag.id) drag = null
  if (press && e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 12 && performance.now() - press.t < 350) {
    tapAt = performance.now()
  }
  press = null
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  // place the camera so the face's width is the wanted share of the screen width
  const markPx = w * (w <= 768 ? LOOK.markXs : LOOK.markLg)
  const visibleW = (516 / markPx) * w
  const visibleH = visibleW / camera.aspect
  camera.position.set(0, 0, visibleH / 2 / Math.tan(rad(camera.fov / 2)))
  camera.near = 1
  camera.far = camera.position.z + D * 3
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

// Frame the lit part (the face and the first stretch of body) in the middle of the screen, as it
// sits in the rest pose; turning then moves it about that place.
const centre = new THREE.Vector3(0, 0, -D * 0.22).add(solid.position)
centre.applyEuler(new THREE.Euler(rad(LOOK.rest.x), rad(LOOK.rest.y), 0))

const t0 = performance.now()
function frame() {
  const t = (performance.now() - t0) / 1000
  if (!drag) {
    target.x *= 0.96
    target.y *= 0.96
  }
  pose.x += (target.x - pose.x) * 0.12
  pose.y += (target.y - pose.y) * 0.12
  // a slow breath so it is never quite still
  const sway = { x: Math.sin(t * 0.35) * 2, y: Math.sin(t * 0.27 + 1) * 3 }
  pivot.rotation.set(rad(LOOK.rest.x + pose.x + sway.x), rad(LOOK.rest.y + pose.y + sway.y), 0)
  pivot.position.set(-centre.x, -centre.y, 0)
  mat.uniforms.time.value = t
  mat.uniforms.fn.value = fnIndex
  mat.uniforms.pulse.value = (performance.now() - tapAt) / 1000
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
frame()
