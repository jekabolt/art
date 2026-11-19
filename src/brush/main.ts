// BRUSH: a flat bristle brush loaded with opaque gouache, in one of the house colours — black, white,
// red or blue, one per page load (white paints on black, the rest on white). On load the brush paints
// the logo bar by bar, roughly and a little differently each time: its own order, wobble, dips of
// paint, bars that run dry or miss their ends. The visitor's first stroke lifts the logo and the hints
// off the sheet, and the sheet is theirs: hold to paint, right button to smudge, wheel for size, D to
// clean.
//
// The sheet is one byte of paint per device pixel. A stroke is a row of bristles dragged along the
// path; paint takes wherever a bristle is wetter than the paper's tooth at that pixel, so a loaded
// brush lays solid colour and a drying one catches only the peaks: streaks, then speckle, then
// nothing. Bristles lift one by one at the end of a stroke, which feathers it off.
// The way of painting follows Luis Bizarro's Brushes (brushes.bizar.ro); the code is our own.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { logoBars } from '../core/logo-bars'
import { LOGO_MIN, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import '../fonts/fonts.css'
import './brush.css'

const INKS: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  blue: [49, 30, 238],
}

const LOOK = {
  logo: EMBEDDED ? 0.78 : 0.56, // the mark's width, of the shorter side of the screen
  wet: 0.9, // how far a full brush tops the roughest paper
  tooth: 1, // how much paint the roughest paper peak asks for
  gain: 7, // how sharply paint takes or does not
  // How far a visitor's stroke runs before it is dry, as in Brushes: paint is spent on distance, and a
  // wider brush carries more. A brush `reachAt` of the screen's shorter side wide runs `reach` of that
  // side; other widths scale by the power `reachGrow` (2.8 times the width goes 1.85 times as far).
  reach: 0.45,
  reachAt: 0.036,
  reachGrow: 0.6,
  speed: 2800, // css px a second the logo is painted at (scaled with its size)
  rough: 0.7, // how carelessly the logo is painted: 0 is every bar whole and in place
  size: [6, 260], // the brush's width, css px
}

// --- which ink, which hand -------------------------------------------------------------------------
const query = new URLSearchParams(location.search)
function pickInk(): string {
  const asked = query.get('ink')
  if (asked && INKS[asked]) return asked
  let last = ''
  try {
    last = localStorage.getItem('brush-ink') || ''
  } catch {
    // private mode: any colour will do
  }
  const rest = Object.keys(INKS).filter((k) => k !== last)
  const ink = rest[Math.floor(Math.random() * rest.length)]
  try {
    localStorage.setItem('brush-ink', ink)
  } catch {
    // as above
  }
  return ink
}
const inkName = pickInk()
const ink = INKS[inkName]
const paper = inkName === 'white' ? '#000' : '#fff'
document.documentElement.style.background = paper
document.body.style.background = paper
document.body.classList.add(inkName === 'white' ? 'dark' : 'light')
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paper)

// a small seeded generator, so ?seed= repeats a drawing
let seed = (parseInt(query.get('seed') || '', 10) || Math.floor(Math.random() * 2 ** 31)) >>> 0
function rnd(): number {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const between = (a: number, b: number) => a + (b - a) * rnd()

// --- the sheet -------------------------------------------------------------------------------------
const canvas = document.getElementById('brush') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const dpr = Math.min(window.devicePixelRatio || 1, 2)
let gw = 0
let gh = 0
let paint = new Uint8Array(0)
const inkWord = (ink[2] << 16) | (ink[1] << 8) | ink[0] // little-endian RGBA without the alpha

// what changed since the last frame
let dx0 = Infinity
let dy0 = Infinity
let dx1 = -1
let dy1 = -1

function show(x0: number, y0: number, x1: number, y1: number) {
  x0 = Math.max(0, x0)
  y0 = Math.max(0, y0)
  x1 = Math.min(gw - 1, x1)
  y1 = Math.min(gh - 1, y1)
  if (x1 < x0 || y1 < y0) return
  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  const img = ctx.createImageData(w, h)
  const px = new Uint32Array(img.data.buffer)
  for (let y = 0; y < h; y++) {
    let s = (y0 + y) * gw + x0
    let d = y * w
    for (let x = 0; x < w; x++) px[d++] = (paint[s++] << 24) | inkWord
  }
  ctx.putImageData(img, x0, y0)
}

function showAll() {
  for (let y = 0; y < gh; y += 256) show(0, y, gw - 1, Math.min(gh, y + 256) - 1)
}

// the paper's tooth, one tile repeated: fine grain on top of slightly larger bumps
const TILE = 256
const tooth = new Float32Array(TILE * TILE)
{
  const coarse = new Float32Array(TILE * TILE)
  for (let i = 0; i < coarse.length; i++) coarse[i] = Math.random()
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let sum = 0
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) sum += coarse[((y + j) & 255) * TILE + ((x + i) & 255)]
      // the blur squeezes the bumps towards the middle: stretch them back over 0..1
      const bump = Math.min(1, Math.max(0, (sum / 9 - 0.5) * 2.4 + 0.5))
      tooth[y * TILE + x] = 0.5 * bump + 0.5 * Math.random()
    }
  }
}

// smooth noise, for the way neighbouring bristles run dry together
const LAT = new Float32Array(256 * 256)
for (let i = 0; i < LAT.length; i++) LAT[i] = Math.random()
function noise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  let fx = x - xi
  let fy = y - yi
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const x0 = xi & 255
  const x1 = (xi + 1) & 255
  const y0 = (yi & 255) << 8
  const y1 = ((yi + 1) & 255) << 8
  const a = LAT[y0 + x0]
  const b = LAT[y0 + x1]
  const c = LAT[y1 + x0]
  const d = LAT[y1 + x1]
  return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy
}

// --- the brush -------------------------------------------------------------------------------------
// A flat row of bristles. Each has its place across the brush, a thickness, how hard the brush must
// be pressed before it touches the paper, and its own share of paint that it spends as it goes.
const MARGIN = 1.1
type Pose = { x: number; y: number; nx: number; ny: number; hw: number; press: number; dist: number }
type Brush = {
  w: number // width, device px
  n: number
  at: Float32Array // place across, -1..1
  rad: Float32Array // thickness, in gaps between bristles
  reach: Float32Array // the pressure it takes to touch
  thirst: Float32Array // how fast it spends paint
  phase: Float32Array // where in the noise it lives
  land: Float32Array // how far the brush has gone before it comes down
  comb: Float32Array // smudge: how firmly it drags (some not at all)
  load: Float32Array // paint left
  was: Float32Array // paint left a step ago
  carry: Float32Array // smudge: the paint it drags
  smudge: boolean
  dry: number // device px a full load lasts
  grain: number
  x: number
  y: number
  dx: number
  dy: number
  aimed: boolean // has a direction yet
  dist: number
  speed: number // css px a second
  press: number
  pose: Pose | null
}

function makeBrush(w: number, smudge: boolean, load: number, dry: number): Brush {
  const n = Math.min(420, Math.max(14, Math.round((w / dpr) * 1.15)))
  const f = () => new Float32Array(n)
  const b: Brush = {
    w, n, smudge, dry,
    at: f(), rad: f(), reach: f(), thirst: f(), phase: f(), land: f(), comb: f(), load: f(), was: f(), carry: f(),
    grain: Math.random() * 200, x: 0, y: 0, dx: 1, dy: 0, aimed: false, dist: 0, speed: 0, press: 0.12, pose: null,
  }
  for (let i = 0; i < n; i++) {
    const r = Math.random()
    b.at[i] = -1 + ((i + 0.15 + 0.7 * Math.random()) * 2) / n
    b.rad[i] = 0.7 + 0.9 * r * r
    // the outer bristles splay and touch last
    b.reach[i] = 0.04 + 0.66 * Math.pow(Math.random(), 1.7) + (Math.abs(b.at[i]) > 0.8 ? 0.08 : 0)
    b.thirst[i] = 0.55 + 0.9 * Math.random()
    b.phase[i] = Math.random() * 4000
    const l = Math.random()
    b.land[i] = 0.03 + 0.55 * l * l
    b.comb[i] = Math.random() > 0.45 ? 0.45 + 0.55 * Math.random() : 0
    b.load[i] = b.was[i] = load * (0.86 + 0.28 * Math.random())
    b.carry[i] = -1
  }
  return b
}

const step01 = (a: number, b: number, v: number) => {
  const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a)
  return t * t * (3 - 2 * t)
}
function noise1(v: number): number {
  const i = Math.floor(v)
  let f = v - i
  f = f * f * (3 - 2 * f)
  const a = LAT[i & 65535]
  return a + (LAT[(i + 1) & 65535] - a) * f
}

/** The bristles between two poses: each spends paint over the step, or (smudge) takes up some of
 *  what lies under it. */
function advance(b: Brush, to: Pose, len: number) {
  const travel = len / Math.max(2 * to.hw, 1)
  for (let i = 0; i < b.n; i++) {
    b.was[i] = b.load[i]
    const touch = step01(b.reach[i] - 0.06, b.reach[i] + 0.06, to.press)
    if (touch <= 0) continue
    const ix = Math.round(to.x + to.nx * b.at[i] * to.hw)
    const iy = Math.round(to.y + to.ny * b.at[i] * to.hw)
    const under = ix < 0 || iy < 0 || ix >= gw || iy >= gh ? 0 : paint[iy * gw + ix] / 255
    if (b.smudge) {
      if (b.carry[i] < 0) b.carry[i] = under
      b.carry[i] += (under - b.carry[i]) * Math.min(0.85, 1.9 * travel * touch)
    } else {
      // crossing paint tops the bristle up a little: the stroke drags the colour on
      const next = b.load[i] - ((b.thirst[i] * len) / b.dry) * touch * (0.4 + 0.6 * to.press) + 0.1 * travel * under * touch
      b.load[i] = next < 0 ? 0 : next
    }
  }
}

/** Paints the strip the brush swept from one pose to the next, pixel by pixel: what the nearest
 *  bristles hold there against what the paper asks for. */
function sweep(b: Brush, A: Pose, B: Pose) {
  const Dx = B.x - A.x
  const Dy = B.y - A.y
  const len = Math.hypot(Dx, Dy)
  if (len < 1e-3) return
  let nx = A.nx + B.nx
  let ny = A.ny + B.ny
  const nl = Math.hypot(nx, ny) || 1
  nx /= nl
  ny /= nl
  let det = Dx * ny - Dy * nx
  if (Math.abs(det) < 0.3 * len) {
    // the brush sliding along its own edge: treat it as square to the move
    nx = -Dy / len
    ny = Dx / len
    det = len
  }
  const hwMax = Math.max(A.hw, B.hw) * MARGIN
  // a turning brush fans out: let neighbouring strips overlap instead of leaving slits
  const pad = (Math.max(A.hw, B.hw) * Math.abs(A.nx * B.ny - A.ny * B.nx) + 0.75) / len
  const ex = Math.abs(nx) * hwMax + Math.abs(Dx) * pad + 1
  const ey = Math.abs(ny) * hwMax + Math.abs(Dy) * pad + 1
  const x0 = Math.max(0, Math.floor(Math.min(A.x, B.x) - ex))
  const x1 = Math.min(gw - 1, Math.ceil(Math.max(A.x, B.x) + ex))
  const y0 = Math.max(0, Math.floor(Math.min(A.y, B.y) - ey))
  const y1 = Math.min(gh - 1, Math.ceil(Math.max(A.y, B.y) + ey))
  if (x1 < x0 || y1 < y0) return
  // along the move (t, 0..1) and along the brush's edge (s, px) are both straight in x
  const kt = ny / det
  const ks = -Dy / det
  const gap = 2 / b.n
  const minRad = 0.6 * dpr
  const smudge = b.smudge
  for (let y = y0; y <= y1; y++) {
    const ry = y + 0.5 - A.y
    const t0 = (-A.x * ny - ry * nx) / det
    const s0 = (Dx * ry + Dy * A.x) / det
    // the stretch of this row that lies inside the strip
    let xa = x0
    let xb = x1
    if (Math.abs(kt) > 1e-9) {
      const p = (-pad - t0) / kt - 0.5
      const q = (1 + pad - t0) / kt - 0.5
      xa = Math.max(xa, Math.ceil(Math.min(p, q)))
      xb = Math.min(xb, Math.floor(Math.max(p, q)))
    } else if (t0 < -pad || t0 > 1 + pad) continue
    if (Math.abs(ks) > 1e-9) {
      const p = (-hwMax - s0) / ks - 0.5
      const q = (hwMax - s0) / ks - 0.5
      xa = Math.max(xa, Math.ceil(Math.min(p, q)))
      xb = Math.min(xb, Math.floor(Math.max(p, q)))
    } else if (s0 < -hwMax || s0 > hwMax) continue
    for (let x = xa; x <= xb; x++) {
      const t = t0 + (x + 0.5) * kt
      const s = s0 + (x + 0.5) * ks
      const tc = t < 0 ? 0 : t > 1 ? 1 : t
      const hw = A.hw + (B.hw - A.hw) * tc
      const a = s / hw
      if (a < -MARGIN || a > MARGIN) continue
      const press = A.press + (B.press - A.press) * tc
      const dist = A.dist + (B.dist - A.dist) * tc
      const dcss = dist / dpr
      const near = Math.floor((a + 1) / gap)
      let inkSum = 0
      let profSum = 0
      let carried = 0
      for (let i = near - 2; i <= near + 2; i++) {
        if (i < 0 || i >= b.n) continue
        const o = ((a - b.at[i]) * hw) / Math.max(b.rad[i] * gap * hw, minRad)
        if (o <= -1 || o >= 1) continue
        const prof = (1 - o * o) * (1 - o * o)
        profSum += prof
        // a bristle near the rim skips on and off the paper
        const rim = 0.2 + 0.8 * step01(0.5, 1, Math.abs(b.at[i]))
        const skip = (noise1(dcss / 13 + b.phase[i] + 0.5) - 0.5) * rim * 0.4
        const touch = step01(b.reach[i] + skip - 0.06, b.reach[i] + skip + 0.06, press)
        if (touch <= 0) continue
        const landed = step01(b.land[i], b.land[i] + 0.14, dist / hw)
        if (landed <= 0) continue
        if (smudge) {
          const k = prof * touch * landed * b.comb[i]
          inkSum += k
          carried += k * b.carry[i]
        } else {
          const load = b.was[i] + (b.load[i] - b.was[i]) * tc
          // as it dries a bristle starts to drag in broken hairs
          const dryness = Math.min(1, Math.max(0, (1 - load) * 1.5))
          const hair = 1 - dryness * 0.9 * (1 - step01(0.3, 0.7, noise1(dcss / 19 + b.phase[i] * 3)))
          inkSum += prof * Math.min(1, load * 1.12) * touch * landed * hair
        }
      }
      if (inkSum < 1e-4) continue
      const idx = y * gw + x
      // the paper: its own tooth, and the furrows the bristles comb along the stroke
      const need =
        tooth[((y & 255) << 8) | (x & 255)] * 0.46 +
        noise(b.grain + dcss / 20, b.grain + (s / dpr) * 0.9) * 0.36 +
        noise(x / (11 * dpr), y / (11 * dpr)) * 0.18
      const edge = 1 - 0.45 * step01(0.6, 1.08, a < 0 ? -a : a)
      const body = inkSum / (profSum > 0.5 ? profSum : 0.5)
      const p = paint[idx]
      if (smudge) {
        const k = Math.min(1, body * 1.6) * 0.62 * (0.35 + 0.65 * press) * edge * (1.15 - 0.6 * need)
        paint[idx] = p + ((carried / inkSum) * 255 - p) * (k > 1 ? 1 : k)
      } else {
        let d = (body * (0.42 + 0.58 * press) * edge * LOOK.wet - need * LOOK.tooth) * LOOK.gain
        if (d <= 0) continue
        if (d > 1) d = 1
        paint[idx] = p + (255 - p) * d
      }
    }
  }
  if (x0 < dx0) dx0 = x0
  if (y0 < dy0) dy0 = y0
  if (x1 > dx1) dx1 = x1
  if (y1 > dy1) dy1 = y1
}

function poseOf(b: Brush): Pose {
  // the flat of the brush lies square to the way it is pulled, and spreads as it is pressed
  return { x: b.x, y: b.y, nx: -b.dy, ny: b.dx, hw: (b.w / 2) * (0.8 + 0.2 * b.press), press: b.press, dist: b.dist }
}

function down(b: Brush, x: number, y: number) {
  b.x = x
  b.y = y
}

/** Pulls the brush to (x, y); `press` is how hard the hand means to press, which the brush reaches
 *  over a little distance. */
function move(b: Brush, x: number, y: number, press: number) {
  const mx = x - b.x
  const my = y - b.y
  const len = Math.hypot(mx, my)
  if (len < (b.aimed ? 0.2 * dpr : 1.5 * dpr)) return
  const tx = mx / len
  const ty = my / len
  if (!b.aimed) {
    b.dx = tx
    b.dy = ty
    b.aimed = true
  }
  if (!b.pose) b.pose = poseOf(b)
  const n = Math.ceil(len / Math.min(3 * dpr, Math.max(dpr, 0.08 * b.w)))
  const hop = len / n
  const turn = 1 - Math.exp(-hop / (0.3 * b.w))
  const settle = 1 - Math.exp(-hop / (0.22 * b.w))
  const fx = b.x
  const fy = b.y
  for (let i = 1; i <= n; i++) {
    // the brush swings round to follow the hand, with a little lag
    const ax = b.dx + (tx - b.dx) * turn
    const ay = b.dy + (ty - b.dy) * turn
    const al = Math.hypot(ax, ay) || 1
    b.dx = ax / al
    b.dy = ay / al
    b.press += (press - b.press) * settle
    b.dist += hop
    b.x = fx + (mx * i) / n
    b.y = fy + (my * i) / n
    const next = poseOf(b)
    advance(b, next, hop)
    sweep(b, b.pose, next)
    b.pose = next
  }
}

/** The brush leaves the paper: it runs on a little while the pressure goes and the bristles lift. */
function up(b: Brush, tail = -1) {
  if (!b.aimed) {
    // a tap: a short dab at whatever angle the brush happened to be held
    const a = Math.random() * Math.PI * 2
    const d = Math.max(3 * dpr, b.w * 0.35)
    move(b, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 1)
  }
  if (!b.pose) return
  if (tail < 0) tail = Math.min(1.6 * b.w, Math.max(0.35 * b.w, b.speed * 0.05 * dpr))
  const n = Math.max(2, Math.ceil(tail / Math.min(3 * dpr, Math.max(dpr, 0.08 * b.w))))
  const hop = tail / n
  const from = b.press
  for (let i = 1; i <= n; i++) {
    const q = i / n
    b.press = from * (1 - q) * (1 - 0.35 * q)
    b.dist += hop
    b.x += b.dx * hop
    b.y += b.dy * hop
    const next = poseOf(b)
    advance(b, next, hop)
    sweep(b, b.pose, next)
    b.pose = next
  }
}

// --- the logo, painted ------------------------------------------------------------------------------
// A bar is one stroke: where it starts and ends (device px from the middle of the screen), how far it
// bows, the brush that paints it and how fast.
type Job = { ax: number; ay: number; bx: number; by: number; bow: number; brush: Brush; len: number; done: number; speed: number; wait: number; press: number; tail: number }
let jobs: Job[] = []
let cx = 0
let cy = 0

function planLogo() {
  const size = Math.min(innerWidth, innerHeight) * LOOK.logo * dpr
  const s = size / LOGO_SPAN
  const stroke = LOGO_STROKE * s
  const tilt = between(-0.022, 0.022)
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  const mid = LOGO_MIN + LOGO_SPAN / 2
  const bars = logoBars()
  const first = Math.floor(rnd() * bars.length)
  const backwards = rnd() < 0.5
  let dip = 0 // bars left before the brush goes back to the pot
  let load = 1
  jobs = bars.map((_, i) => {
    const bar = bars[(first + (backwards ? bars.length - i : i)) % bars.length]
    let ax = (bar.ax - mid) * s
    let ay = (bar.ay - mid) * s
    let bx = (bar.bx - mid) * s
    let by = (bar.by - mid) * s
    // a hand mostly pulls a stroke left to right, top to bottom
    const natural = Math.abs(bx - ax) > Math.abs(by - ay) ? bx > ax : by > ay
    if (natural !== rnd() < 0.82) [ax, ay, bx, by] = [bx, by, ax, ay]
    const j = stroke * LOOK.rough * 0.13
    ax += between(-j, j)
    ay += between(-j, j)
    bx += between(-j, j)
    by += between(-j, j)
    // and no bar sits quite on its angle
    const lean = between(-0.035, 0.035) * LOOK.rough
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    const lc = Math.cos(lean)
    const ls = Math.sin(lean)
    ;[ax, ay] = [mx + (ax - mx) * lc - (ay - my) * ls, my + (ax - mx) * ls + (ay - my) * lc]
    ;[bx, by] = [mx + (bx - mx) * lc - (by - my) * ls, my + (bx - mx) * ls + (by - my) * lc]
    ;[ax, ay] = [ax * cos - ay * sin, ax * sin + ay * cos]
    ;[bx, by] = [bx * cos - by * sin, bx * sin + by * cos]
    const len = Math.hypot(bx - ax, by - ay)
    // the brush comes down early or late, and either runs past the bar's end or lifts short of it
    const ux = (bx - ax) / len
    const uy = (by - ay) / len
    const lead = stroke * between(-0.3, 0.3) * LOOK.rough
    const tail = stroke * between(0.28, 0.6)
    const past = stroke * (rnd() < 0.22 ? between(0.2, 0.9) : -between(0, 0.5)) * LOOK.rough
    ax -= ux * lead
    ay -= uy * lead
    bx += ux * (past - tail * 0.6)
    by += uy * (past - tail * 0.6)
    // one dip of paint lasts a few bars, each drier than the one before
    if (dip <= 0) {
      dip = 2 + Math.floor(rnd() * 4)
      load = between(1, 1.28)
    } else load = Math.max(0.3, load - between(0.1, 0.2) * LOOK.rough)
    dip--
    // now and then the hand barely touches the paper
    const faint = rnd() < 0.06 * LOOK.rough ? 0.45 : 1
    const brush = makeBrush(stroke * between(0.8, 1), false, load * faint, size * between(0.75, 1.7))
    const speed = LOOK.speed * dpr * (size / (420 * dpr)) * between(0.8, 1.25)
    return { ax, ay, bx, by, bow: between(-0.1, 0.1) * stroke, brush, len: Math.hypot(bx - ax, by - ay), done: -1, speed, wait: between(0.005, 0.02) + (dip === 0 ? 0.04 : 0), press: between(0.7, 1), tail }
  })
}

function at(job: Job, t: number): [number, number] {
  const nx = -(job.by - job.ay) / job.len
  const ny = (job.bx - job.ax) / job.len
  const bow = job.bow * 4 * t * (1 - t)
  return [cx + job.ax + (job.bx - job.ax) * t + nx * bow, cy + job.ay + (job.by - job.ay) * t + ny * bow]
}

/** Paints `dt` seconds' worth of the logo. */
function paintLogo(dt: number) {
  while (jobs.length && dt > 0) {
    const job = jobs[0]
    if (job.wait > 0) {
      const w = Math.min(job.wait, dt)
      job.wait -= w
      dt -= w
      continue
    }
    if (job.done < 0) {
      down(job.brush, ...at(job, 0))
      job.done = 0
    }
    const go = Math.min(job.len - job.done, job.speed * dt)
    const from = job.done
    job.done += go
    dt -= go / job.speed
    // short hops, so the bow is followed
    const hops = Math.max(1, Math.ceil(go / (4 * dpr)))
    for (let i = 1; i <= hops; i++) move(job.brush, ...at(job, (from + (go * i) / hops) / job.len), job.press)
    if (job.done >= job.len - 0.01) {
      up(job.brush, job.tail)
      jobs.shift()
    }
  }
}

// --- the visitor's hand ------------------------------------------------------------------------------
let size = Math.max(10, Math.min(innerWidth, innerHeight) * LOOK.logo * (LOGO_STROKE / LOGO_SPAN)) // css px
const hands = new Map<number, { brush: Brush; t: number; x: number; y: number }>()
// the nib under the mouse: a line as wide as the brush, lying across the way the last stroke went
const nib = document.getElementById('nib') as HTMLElement
let nibTurn = 0
let mouseX = -1000
let mouseY = -1000

function placeNib() {
  const h = Math.max(2, Math.round(size * 0.11))
  nib.style.width = `${size}px`
  nib.style.height = `${h}px`
  nib.style.borderRadius = `${h / 2}px`
  nib.style.transform = `translate(${mouseX}px, ${mouseY}px) rotate(${nibTurn}rad) translate(${-size / 2}px, ${-h / 2}px)`
}

// The logo is there until the visitor paints: their first stroke lifts it off the sheet (a copy of the
// sheet fades out over the fresh one), and the hints go with the first touch of either button.
let logoUp = true
function takeSheet(smudge: boolean) {
  document.body.classList.add('taken')
  if (smudge || !logoUp) return
  logoUp = false
  jobs = []
  wipe = -1
  flush()
  const ghost = document.createElement('canvas')
  ghost.className = 'ghost'
  ghost.width = gw
  ghost.height = gh
  ghost.getContext('2d')!.drawImage(canvas, 0, 0)
  canvas.after(ghost)
  paint.fill(0)
  ctx.clearRect(0, 0, gw, gh)
  ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' })
  setTimeout(() => ghost.remove(), 300)
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault())
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.button !== 2) return
  canvas.setPointerCapture(e.pointerId)
  const smudge = e.button === 2
  takeSheet(smudge)
  nib.hidden = true
  const short = Math.min(innerWidth, innerHeight)
  const dry = short * dpr * LOOK.reach * Math.pow(size / short / LOOK.reachAt, LOOK.reachGrow) * between(0.9, 1.15)
  const brush = makeBrush(size * dpr * (smudge ? 1.2 : 1), smudge, between(1.15, 1.35), dry)
  down(brush, e.clientX * dpr, e.clientY * dpr)
  hands.set(e.pointerId, { brush, t: e.timeStamp, x: e.clientX, y: e.clientY })
})
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') {
    mouseX = e.clientX
    mouseY = e.clientY
    nib.hidden = hands.size > 0
    placeNib()
  }
  const hand = hands.get(e.pointerId)
  if (!hand) return
  const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
  for (const ev of events.length ? events : [e]) {
    const dt = Math.max(1, ev.timeStamp - hand.t) / 1000
    const v = Math.hypot(ev.clientX - hand.x, ev.clientY - hand.y) / dt
    hand.brush.speed += (v - hand.brush.speed) * 0.3
    hand.t = ev.timeStamp
    hand.x = ev.clientX
    hand.y = ev.clientY
    // a slow hand presses, a fast one skims
    const press = 1 - 0.52 * Math.min(1, hand.brush.speed / 2600)
    move(hand.brush, ev.clientX * dpr, ev.clientY * dpr, ev.pointerType === 'pen' && ev.pressure > 0 ? press * (0.5 + ev.pressure * 0.6) : press)
  }
})
const release = (e: PointerEvent) => {
  const hand = hands.get(e.pointerId)
  if (!hand) return
  hands.delete(e.pointerId)
  if (e.type === 'pointerup') up(hand.brush)
  if (e.pointerType === 'mouse') {
    if (hand.brush.aimed) nibTurn = Math.atan2(hand.brush.dx, -hand.brush.dy)
    nib.hidden = false
    placeNib()
  }
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)
canvas.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse' && !hands.size) nib.hidden = true
})

if (!EMBEDDED) {
  addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
  addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      size = Math.min(LOOK.size[1], Math.max(LOOK.size[0], size * Math.exp(-e.deltaY * 0.002)))
      placeNib()
    },
    { passive: false },
  )
}
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyD' || e.metaKey || e.ctrlKey || e.altKey) return
  jobs = []
  logoUp = false
  if (wipe < 0) wipe = 0
})

// cleaning: a wet rag pulled across the sheet, its edge a little uneven
let wipe = -1 // 0..1 while it runs
function wipeOn(dt: number) {
  const from = wipe
  wipe = Math.min(1, wipe + dt / 0.7)
  const edge = (k: number, y: number) => Math.round((k * 1.12 - 0.12 + noise(7.3, y / (70 * dpr)) * 0.12) * gw)
  let lo = gw
  let hi = 0
  for (let y = 0; y < gh; y++) {
    const a = Math.max(0, from === 0 ? 0 : edge(from, y))
    const b = Math.min(gw, wipe === 1 ? gw : edge(wipe, y))
    if (b <= a) continue
    paint.fill(0, y * gw + a, y * gw + b)
    if (a < lo) lo = a
    if (b > hi) hi = b
  }
  if (hi > lo) show(lo, 0, hi - 1, gh - 1)
  if (wipe === 1) wipe = -1
}

// --- the frame ---------------------------------------------------------------------------------------
function resize() {
  const w = Math.round(innerWidth * dpr)
  const h = Math.round(innerHeight * dpr)
  if (w === gw && h === gh) return
  // the sheet keeps its middle where the middle of the screen is
  const ox = Math.round((w - gw) / 2)
  const oy = Math.round((h - gh) / 2)
  const next = new Uint8Array(w * h)
  for (let y = Math.max(0, -oy); y < gh && y + oy < h; y++) {
    const x0 = Math.max(0, -ox)
    const x1 = Math.min(gw, w - ox)
    if (x1 > x0) next.set(paint.subarray(y * gw + x0, y * gw + x1), (y + oy) * w + x0 + ox)
  }
  const fresh = gw === 0
  paint = next
  gw = canvas.width = w
  gh = canvas.height = h
  cx = w / 2
  cy = h / 2
  if (!fresh) {
    for (const b of [...jobs.map((j) => j.brush), ...[...hands.values()].map((h) => h.brush)]) {
      b.x += ox
      b.y += oy
      if (b.pose) {
        b.pose.x += ox
        b.pose.y += oy
      }
    }
    showAll()
  }
}
addEventListener('resize', resize)
resize()
planLogo()

function flush() {
  if (dx1 < 0) return
  show(dx0, dy0, dx1, dy1)
  dx0 = dy0 = Infinity
  dx1 = dy1 = -1
}
// ?still paints the whole logo at once (a poster, a screenshot)
if (query.has('still')) {
  paintLogo(Infinity)
  flush()
}

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (jobs.length) paintLogo(dt)
  if (wipe >= 0) wipeOn(dt)
  flush()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
// strokes land the moment the hand moves, not a frame later (and in a tab that gets no frames)
canvas.addEventListener('pointermove', flush)
canvas.addEventListener('pointerup', flush)
