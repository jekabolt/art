// FROST (after Kelly Milligan's frosted pane studies): the logo behind frosted glass. Every stroke
// of the mark is a bar pressed against the pane, sharp and dark. Now and then one is knocked back
// into the depth, where the frost blurs and pales it; it tumbles and flies back to its place in the
// logo, knocking against the glass. A touch or the pointer knocks the bars under it back too.
//
// Blur is a true gaussian of each bar: a rectangle blurred by a gaussian is the product of two erf
// profiles in the bar's own frame, so every bar is one quad with an analytic shader.
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { Vector2 } from 'three/src/math/Vector2'
import { LOGO_PATH, LOGO_STROKE } from '../core/logo-path'
import './frost.css'

// --- the logo as bars -------------------------------------------------------------------------------
type Seg = { ax: number; ay: number; bx: number; by: number }

/** The logo path (absolute M/H/V/L only) as straight segments; collinear runs merged into one bar. */
function logoBars(): Seg[] {
  const tokens = LOGO_PATH.match(/[MHVL]|-?\d*\.?\d+/g)!
  const segs: Seg[] = []
  let x = 0
  let y = 0
  let i = 0
  let cmd = 'M'
  const num = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    if (/[MHVL]/.test(tokens[i])) cmd = tokens[i++]
    const px = x
    const py = y
    if (cmd === 'M') {
      x = num()
      y = num()
      continue
    }
    if (cmd === 'H') x = num()
    else if (cmd === 'V') y = num()
    else {
      x = num()
      y = num()
    }
    const last = segs[segs.length - 1]
    const dir = (s: Seg) => Math.atan2(s.by - s.ay, s.bx - s.ax)
    const seg = { ax: px, ay: py, bx: x, by: y }
    if (last && last.bx === px && last.by === py && Math.abs(dir(last) - dir(seg)) < 0.02) {
      last.bx = x
      last.by = y
    } else segs.push(seg)
  }
  return segs
}

// --- rendering --------------------------------------------------------------------------------------
const canvas = document.getElementById('frost') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
const quad = new PlaneGeometry(2, 2)
const resolution = new Vector2(1, 1)

// the pane: frosted grey, a soft light from the upper left, fine grain against banding
const pane = new Mesh(
  quad,
  new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: { resolution: { value: resolution } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 resolution;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 p = vUv * vec2(resolution.x / resolution.y, 1.0);
        float light = exp(-2.2 * distance(p, vec2(0.25 * resolution.x / resolution.y, 0.85)));
        vec3 c = mix(vec3(0.855, 0.867, 0.851), vec3(0.95, 0.955, 0.945), light);
        c += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 2.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  }),
)
pane.renderOrder = -1
scene.add(pane)

const BAR_VERT = /* glsl */ `
  uniform vec2 resolution;
  uniform vec2 center;   // px, y up
  uniform float angle;
  uniform vec2 halfSize; // half length, half width, px
  uniform float sigma;   // gaussian blur, px
  varying vec2 vLocal;
  void main() {
    vec2 ext = halfSize + 3.0 * sigma + 1.0;
    vLocal = position.xy * ext;
    vec2 cs = vec2(cos(angle), sin(angle));
    vec2 p = center + vec2(vLocal.x * cs.x - vLocal.y * cs.y, vLocal.x * cs.y + vLocal.y * cs.x);
    gl_Position = vec4(p / resolution * 2.0 - 1.0, 0.0, 1.0);
  }
`
const BAR_FRAG = /* glsl */ `
  uniform vec2 halfSize;
  uniform float sigma;
  uniform float opacity;
  uniform vec3 ink;
  varying vec2 vLocal;

  // erf, Abramowitz–Stegun 7.1.26 (|error| < 1.5e-7)
  float erf1(float x) {
    float s = sign(x);
    x = abs(x);
    float t = 1.0 / (1.0 + 0.3275911 * x);
    float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x);
    return s * y;
  }
  // share of a gaussian (sigma s) that falls inside [-h, h] around x
  float cover(float x, float h, float s) {
    float k = 0.70710678 / s;
    return 0.5 * (erf1((x + h) * k) - erf1((x - h) * k));
  }

  void main() {
    float s = max(sigma, 0.35);
    float a = cover(vLocal.x, halfSize.x, s) * cover(vLocal.y, halfSize.y, s) * opacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(ink, a);
  }
`

type Bar = {
  mesh: Mesh
  u: Record<string, { value: any }>
  // rest pose in logo units (600 frame, centred), y up
  rx: number
  ry: number
  ra: number
  len: number
  // state: position in logo units, z = depth behind the pane (0 = on the glass), angle, tilt
  x: number
  y: number
  z: number
  a: number
  t: number
  vx: number
  vy: number
  vz: number
  va: number
  vt: number
}

const INK = [0.09, 0.09, 0.09]
/** Each bar runs past its ends just enough to close the joins the way the logo's miters do:
 *  half a stroke at a right angle, less at an obtuse one (w/2 / tan(α/2)), nothing at a free end
 *  or where it stops on another bar's side (that bar covers it). Rectangles then add up to the mark
 *  without corners sticking out. */
function withJoins(segs: Seg[]): Seg[] {
  const w = LOGO_STROKE
  const same = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x1 - x2, y1 - y2) < 0.5
  const extAt = (me: Seg, px: number, py: number, ox: number, oy: number) => {
    // (ox, oy): my other end; my direction away from the joint is from P to it
    const mx = ox - px
    const my = oy - py
    let ext = 0
    for (const s of segs) {
      if (s === me) continue
      let qx: number
      let qy: number
      if (same(s.ax, s.ay, px, py)) {
        qx = s.bx
        qy = s.by
      } else if (same(s.bx, s.by, px, py)) {
        qx = s.ax
        qy = s.ay
      } else continue
      const nx = qx - px
      const ny = qy - py
      const cos = (mx * nx + my * ny) / (Math.hypot(mx, my) * Math.hypot(nx, ny))
      const alpha = Math.acos(Math.max(-1, Math.min(1, cos))) // angle between the two arms
      if (alpha < Math.PI / 2 - 0.01) continue // a sharp join: the partner covers it
      ext = Math.max(ext, Math.min(w / 2, w / 2 / Math.tan(alpha / 2)))
    }
    return ext
  }
  return segs.map((s) => {
    const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
    const dx = (s.bx - s.ax) / len
    const dy = (s.by - s.ay) / len
    const ea = extAt(s, s.ax, s.ay, s.bx, s.by)
    const eb = extAt(s, s.bx, s.by, s.ax, s.ay)
    return { ax: s.ax - dx * ea, ay: s.ay - dy * ea, bx: s.bx + dx * eb, by: s.by + dy * eb }
  })
}

const bars: Bar[] = withJoins(logoBars()).map((s) => {
  const ax = s.ax - 300
  const ay = 300 - s.ay
  const bx = s.bx - 300
  const by = 300 - s.by
  const u = {
    resolution: { value: resolution },
    center: { value: new Vector2() },
    angle: { value: 0 },
    halfSize: { value: new Vector2() },
    sigma: { value: 0 },
    opacity: { value: 1 },
    ink: { value: INK },
  }
  const mesh = new Mesh(
    quad,
    new ShaderMaterial({ uniforms: u, vertexShader: BAR_VERT, fragmentShader: BAR_FRAG, transparent: true, depthTest: false, depthWrite: false }),
  )
  mesh.frustumCulled = false
  scene.add(mesh)
  const rx = (ax + bx) / 2
  const ry = (ay + by) / 2
  return {
    mesh,
    u,
    rx,
    ry,
    ra: Math.atan2(by - ay, bx - ax),
    len: Math.hypot(bx - ax, by - ay),
    // start deep and scattered: the logo gathers on the glass when the page opens
    x: rx + (Math.random() - 0.5) * 500,
    y: ry + (Math.random() - 0.5) * 500,
    z: 500 + Math.random() * 700,
    a: Math.random() * Math.PI * 2,
    t: (Math.random() - 0.5) * 2,
    vx: 0,
    vy: 0,
    vz: 0,
    va: 0,
    vt: 0,
  }
})

// --- physics (logo units, seconds) ------------------------------------------------------------------
const K = 16 // spring to the rest pose, 1/s²
const DAMP = 2.6 // 1/s
const ZMAX = 1400
const FOCAL = 900 // perspective: scale = FOCAL / (FOCAL + z)
const BLUR = 0.075 // gaussian sigma per unit of depth, in logo units
const FADE = 1 / 900 // opacity = exp(-z * FADE)

function kick(b: Bar, strength: number) {
  b.vz += (700 + Math.random() * 900) * strength
  b.vx += (Math.random() - 0.5) * 500 * strength
  b.vy += (Math.random() - 0.5) * 500 * strength
  b.va += (Math.random() - 0.5) * 14 * strength
  b.vt += (Math.random() - 0.5) * 10 * strength
}

function step(dt: number) {
  for (const b of bars) {
    let da = b.a - b.ra
    da = Math.atan2(Math.sin(da), Math.cos(da)) // nearest turn
    b.vx += (-K * (b.x - b.rx) - DAMP * b.vx) * dt
    b.vy += (-K * (b.y - b.ry) - DAMP * b.vy) * dt
    b.vz += (-K * b.z - DAMP * b.vz) * dt
    b.va += (-K * da - DAMP * b.va) * dt
    b.vt += (-K * b.t - DAMP * b.vt) * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.z += b.vz * dt
    b.a += b.va * dt
    b.t += b.vt * dt
    if (b.z < 0) {
      // the pane: bars knock against the glass
      b.z = 0
      if (b.vz < 0) b.vz = -b.vz * 0.35
    }
    if (b.z > ZMAX) {
      b.z = ZMAX
      if (b.vz > 0) b.vz = 0
    }
  }
}

// --- layout -----------------------------------------------------------------------------------------
let scale = 1 // px per logo unit
let cx = 0
let cy = 0

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  resolution.set(w * dpr, h * dpr)
  const side = Math.min(w <= 768 ? 0.6 * w : 0.3 * w, 0.6 * h) // the mark, as on the logo pages
  scale = (side / 516) * dpr
  cx = (w * dpr) / 2
  cy = (h * dpr) / 2
}

function draw() {
  // far bars first
  const order = bars.slice().sort((p, q) => q.z - p.z)
  order.forEach((b, i) => {
    const s = FOCAL / (FOCAL + b.z)
    const u = b.u
    u.center.value.set(cx + b.x * s * scale, cy + b.y * s * scale)
    u.angle.value = b.a
    // tilted out of the pane, a bar is foreshortened, never thinner than it is wide
    const hl = (b.len / 2) * Math.abs(Math.cos(b.t))
    u.halfSize.value.set(Math.max(hl, LOGO_STROKE / 2) * s * scale, (LOGO_STROKE / 2) * s * scale)
    u.sigma.value = b.z * BLUR * s * scale
    u.opacity.value = Math.exp(-b.z * FADE)
    b.mesh.renderOrder = i
  })
  renderer.render(scene, camera)
}

// --- input ------------------------------------------------------------------------------------------
const toLogo = (e: PointerEvent) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  return [(e.clientX * dpr - cx) / scale, (cy - e.clientY * dpr) / scale]
}
const near = (x: number, y: number, r: number) =>
  bars.filter((b) => b.z < 200 && distToBar(b, x, y) < r)

function distToBar(b: Bar, x: number, y: number) {
  const c = Math.cos(b.a)
  const s = Math.sin(b.a)
  const lx = (x - b.x) * c + (y - b.y) * s
  const ly = -(x - b.x) * s + (y - b.y) * c
  const dx = Math.max(Math.abs(lx) - b.len / 2, 0)
  return Math.hypot(dx, ly)
}

let lastMove = { x: 0, y: 0, t: 0 }
canvas.addEventListener('pointerdown', (e) => {
  const [x, y] = toLogo(e)
  for (const b of near(x, y, 70)) kick(b, 1)
  lastMove = { x, y, t: performance.now() }
})
canvas.addEventListener('pointermove', (e) => {
  const [x, y] = toLogo(e)
  const now = performance.now()
  const speed = Math.hypot(x - lastMove.x, y - lastMove.y) / Math.max(1, now - lastMove.t) // units/ms
  lastMove = { x, y, t: now }
  if (e.pointerType === 'mouse' || e.buttons) {
    for (const b of near(x, y, 40)) kick(b, Math.min(1, speed * 0.6))
  }
})

// --- loop -------------------------------------------------------------------------------------------
let last = performance.now()
let nextPop = last + 1800
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (now > nextPop) {
    // one bar at a time is knocked into the depth, now and then two
    const n = Math.random() < 0.25 ? 2 : 1
    for (let k = 0; k < n; k++) kick(bars[Math.floor(Math.random() * bars.length)], 0.6 + Math.random() * 0.6)
    nextPop = now + 350 + Math.random() * 900
  }
  // two half steps keep the springs stable on a slow frame
  step(dt / 2)
  step(dt / 2)
  draw()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
