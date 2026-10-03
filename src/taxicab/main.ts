// TAXICAB: Manhattan against Euclid, on the logo. The mark's corner points are labelled P_0, P_1 …;
// every stroke between two of them is drawn twice — in cyan as the crow flies (the Euclidean
// distance, the logo as it is) and in red the taxicab way, in steps along the grid (the Manhattan
// distance). Where a stroke runs level or upright the two agree; on the diagonals of R, W and N they
// part. The points drift a little round their places and each staircase keeps re-cutting its steps.
// Drag a point and both lines follow it; tap the empty paper and the points scatter, then come home.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { pathSegments } from '../core/logo-bars'
import { LOGO_MIN, LOGO_SPAN } from '../core/logo-path'
import '../fonts/fonts.css'
import './taxicab.css'

const LOOK = {
  red: '#c43a3a',
  cyan: '#5bbfdc',
  ink: '#111',
  markXs: 0.74,
  markLg: 0.38,
  drift: 0.012, // how far a point wanders, mark widths
  maxSteps: 7,
}

// --- the graph: the logo's corner points and the strokes between them --------------------------------
type Pt = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; seed: number; tx?: number; ty?: number }
const pts: Pt[] = []
const key = (x: number, y: number) => `${Math.round(x * 2)},${Math.round(y * 2)}`
const index = new Map<string, number>()
const vertex = (x: number, y: number) => {
  const k = key(x, y)
  let i = index.get(k)
  if (i === undefined) {
    i = pts.length
    // logo units → mark fractions (0..1, y down)
    const hx = (x - LOGO_MIN) / LOGO_SPAN
    const hy = (y - LOGO_MIN) / LOGO_SPAN
    pts.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, seed: Math.random() * 100 })
    index.set(k, i)
  }
  return i
}
type Edge = { a: number; b: number; steps: number; cuts: number[]; hFirst: boolean; next: number }
const edges: Edge[] = pathSegments().map((s) => ({
  a: vertex(s.ax, s.ay),
  b: vertex(s.bx, s.by),
  steps: 1,
  cuts: [1],
  hFirst: Math.random() < 0.5,
  next: 0,
}))
// number the points top to bottom, left to right, as one would label them
const order = pts.map((_, i) => i).sort((i, j) => pts[i].hy - pts[j].hy || pts[i].hx - pts[j].hx)
const label = new Map(order.map((p, n) => [p, `P_${n}`]))

/** Re-cut a staircase: a new number of steps, of uneven sizes. */
function recut(e: Edge, now: number) {
  e.steps = 1 + Math.floor(Math.random() * LOOK.maxSteps)
  const w = Array.from({ length: e.steps }, () => 0.35 + Math.random())
  const sum = w.reduce((a, b) => a + b, 0)
  let acc = 0
  e.cuts = w.map((v) => (acc += v / sum))
  e.hFirst = Math.random() < 0.5
  e.next = now + 1.2 + Math.random() * 2.8
}

// --- drawing ------------------------------------------------------------------------------------------------
const canvas = document.getElementById('taxicab') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let dpr = 1
let side = 1
let ox = 0
let oy = 0
const sx = (p: Pt) => ox + p.x * side
const sy = (p: Pt) => oy + p.y * side

function resize() {
  const w = innerWidth
  const h = innerHeight
  dpr = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  side = Math.min(w * (w <= 768 ? LOOK.markXs : LOOK.markLg), h * 0.66) * dpr
  ox = (canvas.width - side) / 2
  oy = (canvas.height - side) / 2
}
addEventListener('resize', resize)
resize()

// --- input: drag a point; tap the paper to scatter -------------------------------------------------------
let held: number | null = null
let press: { x: number; y: number; t: number } | null = null
let scatterUntil = 0
const nearest = (x: number, y: number) => {
  let best = -1
  let bd = (28 * dpr) ** 2
  pts.forEach((p, i) => {
    const d = (sx(p) - x) ** 2 + (sy(p) - y) ** 2
    if (d < bd) {
      bd = d
      best = i
    }
  })
  return best
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { x: e.clientX, y: e.clientY, t: performance.now() }
  const i = nearest(e.clientX * dpr, e.clientY * dpr)
  if (i >= 0) {
    held = i
    haptic(6)
  }
})
canvas.addEventListener('pointermove', (e) => {
  if (held === null) return
  const p = pts[held]
  p.x = (e.clientX * dpr - ox) / side
  p.y = (e.clientY * dpr - oy) / side
  p.vx = p.vy = 0
})
const up = (e: PointerEvent) => {
  const tap = press && e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 350
  if (tap && held === null) {
    // scatter: every point flies to a random place on the paper, then comes home
    const w = canvas.width / side
    const h = canvas.height / side
    for (const p of pts) {
      p.tx = (Math.random() * 0.9 + 0.05) * w - ox / side
      p.ty = (Math.random() * 0.9 + 0.05) * h - oy / side
    }
    scatterUntil = performance.now() / 1000 + 1.4
    haptic([10, 30, 10])
  }
  held = null
  press = null
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

let last = performance.now()
function frame(nowMs: number) {
  const now = nowMs / 1000
  const dt = Math.min(0.05, (nowMs - last) / 1000)
  last = nowMs
  const scattered = now < scatterUntil

  // points: a spring towards home (or the scatter target), plus a slow wander
  pts.forEach((p, i) => {
    if (i === held) return
    const wx = Math.sin(now * 0.37 + p.seed) * LOOK.drift + Math.sin(now * 0.91 + p.seed * 1.7) * LOOK.drift * 0.4
    const wy = Math.cos(now * 0.29 + p.seed * 1.3) * LOOK.drift + Math.sin(now * 0.77 + p.seed * 0.6) * LOOK.drift * 0.4
    const tx = scattered && p.tx !== undefined ? p.tx : p.hx + wx
    const ty = scattered && p.ty !== undefined ? p.ty : p.hy + wy
    const k = scattered ? 60 : 28
    p.vx += (tx - p.x) * k * dt
    p.vy += (ty - p.y) * k * dt
    p.vx *= Math.exp(-dt * 7)
    p.vy *= Math.exp(-dt * 7)
    p.x += p.vx * dt
    p.y += p.vy * dt
  })
  for (const e of edges) if (now > e.next) recut(e, now)

  g.setTransform(1, 0, 0, 1, 0, 0)
  g.fillStyle = '#fff'
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.lineJoin = 'miter'
  g.lineCap = 'square'

  // red: the taxicab way, a staircase per stroke
  g.strokeStyle = LOOK.red
  g.lineWidth = 1.4 * dpr
  g.beginPath()
  for (const e of edges) {
    const A = pts[e.a]
    const B = pts[e.b]
    let x = sx(A)
    let y = sy(A)
    const dx = sx(B) - x
    const dy = sy(B) - y
    g.moveTo(x, y)
    let prev = 0
    for (const c of e.cuts) {
      const f = c - prev
      prev = c
      if (e.hFirst) {
        x += dx * f
        g.lineTo(x, y)
        y += dy * f
        g.lineTo(x, y)
      } else {
        y += dy * f
        g.lineTo(x, y)
        x += dx * f
        g.lineTo(x, y)
      }
    }
  }
  g.stroke()

  // cyan: as the crow flies
  g.strokeStyle = LOOK.cyan
  g.lineWidth = 1.4 * dpr
  g.beginPath()
  for (const e of edges) {
    g.moveTo(sx(pts[e.a]), sy(pts[e.a]))
    g.lineTo(sx(pts[e.b]), sy(pts[e.b]))
  }
  g.stroke()

  // the points: a small diamond and a label
  const r = 4.5 * dpr
  g.lineWidth = 1.2 * dpr
  g.strokeStyle = LOOK.ink
  g.fillStyle = '#fff'
  g.font = `${9 * dpr}px FeatureMono, ui-monospace, monospace`
  g.textBaseline = 'middle'
  pts.forEach((p, i) => {
    const x = sx(p)
    const y = sy(p)
    g.beginPath()
    g.moveTo(x, y - r)
    g.lineTo(x + r, y)
    g.lineTo(x, y + r)
    g.lineTo(x - r, y)
    g.closePath()
    g.fill()
    g.stroke()
    g.fillStyle = LOOK.ink
    g.fillText(label.get(i)!, x + r * 1.8, y)
    g.fillStyle = '#fff'
  })

  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
