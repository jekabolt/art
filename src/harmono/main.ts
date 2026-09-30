// HARMONOGRAPH: a pen on two pairs of swinging, slowly dying pendulums — one pair moves it sideways,
// the other up and down — draws its loops over the whole square, fast, for a minute, the swing
// swelling and ebbing as the pendulums are pushed again. It presses only where it crosses the mark
// and barely grazes the paper elsewhere, so the mark fills in with the harmonograph's own hatching
// while the full figure stays a faint ghost around it. The pendulums' ratios and phases are new
// each time (1:1, 2:1, 3:2 … a hair out of tune, which is what makes the figure turn), and the
// table under the paper turns slowly too, so the loops sweep every direction and the whole square
// is reached; no two sheets are alike. When the swing has died the sheet rests, then fades, and a
// new one starts; a tap starts it now.
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './harmono.css'

// --- the mark's distance field on a grid (css px, negative inside the strokes) -----------------------------
const bars = logoBars().map((s) => {
  const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
  return { cx: (s.ax + s.bx) / 2 - 300, cy: (s.ay + s.by) / 2 - 300, ux: (s.bx - s.ax) / len, uy: (s.by - s.ay) / len, hl: len / 2 }
})
const HW = LOGO_STROKE / 2
function logoSD(x: number, y: number): number {
  let d = Infinity
  for (const b of bars) {
    const rx = x - b.cx
    const ry = y - b.cy
    const lx = Math.abs(rx * b.ux + ry * b.uy) - b.hl
    const ly = Math.abs(-rx * b.uy + ry * b.ux) - HW
    d = Math.min(d, Math.hypot(Math.max(lx, 0), Math.max(ly, 0)) + Math.min(Math.max(lx, ly), 0))
  }
  return d
}

const CELL = 2
let gw = 0
let gh = 0
let field = new Float32Array(0)
function markDist(x: number, y: number) {
  const fx = Math.min(gw - 1.001, Math.max(0, x / CELL))
  const fy = Math.min(gh - 1.001, Math.max(0, y / CELL))
  const i = Math.floor(fx)
  const j = Math.floor(fy)
  const u = fx - i
  const v = fy - j
  const o = j * gw + i
  const a = field[o]
  const b = field[o + 1]
  const c = field[o + gw]
  const d = field[o + gw + 1]
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// --- canvases: the sheet accumulates ink; the screen shows the sheet and the pen over it ---------------------
const canvas = document.getElementById('harmono') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const sheet = document.createElement('canvas')
const sctx = sheet.getContext('2d')!
const PAPER = '#f4f3ef'
const INK = '#0b0b0b'
let w = 1
let h = 1
let dpr = 1
let half = 200 // css px: half the mark's square
let cx = 0
let cy = 0

function resize() {
  w = window.innerWidth
  h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  for (const c of [canvas, sheet]) {
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
  }
  const side = Math.min(w <= 768 ? 0.8 * w : 0.44 * w, 0.7 * h)
  half = side / 2
  cx = w / 2
  cy = h / 2
  const scale = side / 516
  gw = Math.ceil(w / CELL) + 2
  gh = Math.ceil(h / CELL) + 2
  field = new Float32Array(gw * gh)
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) field[j * gw + i] = logoSD((i * CELL - cx) / scale, (j * CELL - cy) / scale) * scale
  newSheet()
}

// --- the pendulums -------------------------------------------------------------------------------------------
type Pendulum = { a: number; f: number; p: number; d: number }
let px: Pendulum[] = []
let py: Pendulum[] = []
let t = 0
let spin = 0 // the table's turning, radians per pendulum time
let pen: { x: number; y: number } | null = null
let phase: 'drawing' | 'resting' | 'fading' = 'drawing'
let phaseAt = 0

const RATIOS = [
  [1, 1],
  [2, 1],
  [3, 2],
  [3, 1],
  [4, 3],
  [5, 4],
  [5, 3],
  [2, 3],
]
const END = 1100 // pendulum time for one sheet
const PER_SECOND = 20 // pendulum time per second of screen time: about a minute a sheet

function pick<T>(a: T[]) {
  return a[Math.floor(Math.random() * a.length)]
}
function newSheet() {
  const [m, n] = pick(RATIOS)
  const tune = () => 1 + (Math.random() - 0.5) * 0.02 // a hair out of tune: the figure turns
  // each axis: a main pendulum and a weaker one, each losing a little of its own swing over the sheet
  const damp = () => (Math.log(1.6) / END) * (0.5 + Math.random())
  const main = 0.78 + Math.random() * 0.12
  const axis = (f: number): Pendulum[] => [
    { a: main, f: f * tune(), p: Math.random() * Math.PI * 2, d: damp() },
    { a: 1.18 - main, f: pick([1, 2, 3]) * tune(), p: Math.random() * Math.PI * 2, d: damp() },
  ]
  spin = ((Math.random() < 0.5 ? 1 : -1) * Math.PI * 3) / END
  px = axis(m)
  py = axis(n)
  t = 0
  pen = null
  phase = 'drawing'
  phaseAt = performance.now()
  sctx.setTransform(1, 0, 0, 1, 0, 0)
  sctx.globalAlpha = 1
  sctx.fillStyle = PAPER
  sctx.fillRect(0, 0, sheet.width, sheet.height)
}

// the swing breathes: the pendulums are pushed and let go five times over a sheet, so the loops
// sweep in and out over the whole square again and again; the last push is let to die out
function envelope(tt: number) {
  const breath = 0.3 + 0.9 * (0.5 - 0.5 * Math.cos((tt / END) * Math.PI * 2 * 5 + Math.PI))
  const last = Math.min(1, Math.max(0, (END - tt) / (END * 0.18)))
  return breath * (0.25 + 0.75 * last)
}
function swing(ps: Pendulum[], tt: number) {
  let s = 0
  for (const q of ps) s += q.a * Math.sin(q.f * tt + q.p) * Math.exp(-q.d * tt)
  return s * envelope(tt)
}

// --- drawing -------------------------------------------------------------------------------------------------
function drawTo(tEnd: number) {
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  sctx.lineCap = 'round'
  sctx.lineJoin = 'round'
  const inside = new Path2D()
  const outside = new Path2D()
  const STEP = 0.004
  while (t < tEnd) {
    t += STEP
    // the table turns a turn and a half over the sheet, the pen's figure turning with it
    const sx = swing(px, t)
    const sy = swing(py, t)
    const c = Math.cos(t * spin)
    const s = Math.sin(t * spin)
    const x = cx + (c * sx - s * sy) * half
    const y = cy + (s * sx + c * sy) * half
    if (pen) {
      const d = markDist((x + pen.x) / 2, (y + pen.y) / 2)
      const path = d < 0 ? inside : outside
      path.moveTo(pen.x, pen.y)
      path.lineTo(x, y)
    }
    pen = { x, y }
  }
  sctx.strokeStyle = INK
  sctx.lineWidth = 0.55
  sctx.globalAlpha = 0.04
  sctx.stroke(outside)
  sctx.lineWidth = 0.7
  sctx.globalAlpha = 0.5
  sctx.stroke(inside)
  sctx.globalAlpha = 1
}

function show() {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(sheet, 0, 0)
  if (pen && phase === 'drawing') {
    // the pen: a small dark bead
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(pen.x, pen.y, 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

let down: { x: number; y: number } | null = null
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }))
canvas.addEventListener('pointerup', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) newSheet()
  down = null
})

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (phase === 'drawing') {
    drawTo(Math.min(END, t + dt * PER_SECOND))
    if (t >= END) {
      phase = 'resting'
      phaseAt = now
    }
  } else if (phase === 'resting' && now - phaseAt > 5000) {
    phase = 'fading'
    phaseAt = now
  } else if (phase === 'fading') {
    // wash the sheet back to paper over a second and a half
    sctx.setTransform(1, 0, 0, 1, 0, 0)
    sctx.globalAlpha = Math.min(1, dt * 3)
    sctx.fillStyle = PAPER
    sctx.fillRect(0, 0, sheet.width, sheet.height)
    sctx.globalAlpha = 1
    if (now - phaseAt > 1500) newSheet()
  }
  show()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
