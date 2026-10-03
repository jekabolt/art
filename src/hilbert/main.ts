// HILBERT: the logo stitched with one thread. A Hilbert curve fills the mark's square in a single
// unbroken line; where it runs through the logo's strokes it is drawn heavy, everywhere else it is a
// hair, so the whole mark is one stitch from the first corner to the last. A pen lays the thread down.
// Every tap makes the stitch finer: the curve goes one order up (2 → 7), each stitch folding into
// the four of the next order; past 7 it starts again from a coarse 2 on a clean sheet.
import '../core/embed'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './hilbert.css'

const LOOK = {
  firstOrder: 4,
  minOrder: 2,
  maxOrder: 7,
  /** Seconds the pen takes over the whole thread, whatever the order. */
  drawTime: 3.2,
  /** Seconds a fold from one order to the next takes. */
  foldTime: 0.7,
  ink: '#f6f6f6',
  hair: '#3a3a3a',
  /** Heavy thread width as a share of a cell, and the hair in css px. */
  heavy: 0.5,
  hairPx: 1,
}

// --- the curve --------------------------------------------------------------------------------------
/** Cell (x, y) of the d-th step of an order-n Hilbert curve (side 2^n). */
function d2xy(n: number, d: number): [number, number] {
  let x = 0
  let y = 0
  let t = d
  for (let s = 1; s < 1 << n; s <<= 1) {
    const rx = 1 & (t >> 1)
    const ry = 1 & (t ^ rx)
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x
        y = s - 1 - y
      }
      const k = x
      x = y
      y = k
    }
    x += s * rx
    y += s * ry
    t >>= 2
  }
  return [x, y]
}

/** Centres of an order-n curve's cells in logo units (the mark's square, y down). */
function curve(n: number): Float32Array {
  const side = 1 << n
  const cell = LOGO_SPAN / side
  const out = new Float32Array(side * side * 2)
  for (let d = 0; d < side * side; d++) {
    const [x, y] = d2xy(n, d)
    out[d * 2] = LOGO_MIN + (x + 0.5) * cell
    out[d * 2 + 1] = LOGO_MIN + (y + 0.5) * cell
  }
  return out
}

// --- where the strokes are --------------------------------------------------------------------------
const MASK = 1024
const mask = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = MASK
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.scale(MASK / LOGO_SPAN, MASK / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.lineJoin = 'miter'
  g.stroke(new Path2D(LOGO_PATH))
  return g.getImageData(0, 0, MASK, MASK).data
})()
const inMark = (x: number, y: number) => {
  const px = Math.floor(((x - LOGO_MIN) / LOGO_SPAN) * MASK)
  const py = Math.floor(((y - LOGO_MIN) / LOGO_SPAN) * MASK)
  if (px < 0 || py < 0 || px >= MASK || py >= MASK) return false
  return mask[(py * MASK + px) * 4 + 3] > 127
}

type Order = { n: number; pts: Float32Array; heavy: Uint8Array }
const orders = new Map<number, Order>()
function order(n: number): Order {
  let o = orders.get(n)
  if (!o) {
    const pts = curve(n)
    const steps = pts.length / 2 - 1
    const heavy = new Uint8Array(steps)
    // a step is heavy where its middle lies in a stroke
    for (let i = 0; i < steps; i++) {
      heavy[i] = inMark((pts[i * 2] + pts[i * 2 + 2]) / 2, (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2) ? 1 : 0
    }
    o = { n, pts, heavy }
    orders.set(n, o)
  }
  return o
}

// --- state: the current order, a fold in progress, how far the pen has gone (0..1) -----------------
let cur = order(LOOK.firstOrder)
let from: Order | null = null // folding from this order into `cur`
let foldT = 1
let pen = 0

function tap() {
  if (cur.n >= LOOK.maxOrder) {
    cur = order(LOOK.minOrder)
    from = null
    foldT = 1
    pen = 0 // a clean sheet
    return
  }
  from = cur
  cur = order(cur.n + 1)
  foldT = 0
}

// --- rendering ---------------------------------------------------------------------------------------
const canvas = document.getElementById('hilbert') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let dpr = 1
let scale = 1
let ox = 0
let oy = 0

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const side = Math.min(w <= 768 ? 0.74 * w : 0.38 * w, 0.66 * h)
  scale = (side / LOGO_SPAN) * dpr
  ox = canvas.width / 2 - (LOGO_MIN + LOGO_SPAN / 2) * scale
  oy = canvas.height / 2 - (LOGO_MIN + LOGO_SPAN / 2) * scale
}
window.addEventListener('resize', resize)
resize()

let down: { x: number; y: number } | null = null
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }))
canvas.addEventListener('pointerup', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12) tap()
  down = null
})

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  pen = Math.min(1, pen + dt / LOOK.drawTime)
  if (foldT < 1) foldT = Math.min(1, foldT + dt / LOOK.foldTime)
  const f = from && foldT < 1 ? ease(foldT) : 1

  const P = cur.pts
  const count = P.length / 2
  const upto = Math.floor(pen * (count - 1))
  // A point of the finer order starts at its parent's place (index >> 2) and moves to its own.
  const at = (i: number): [number, number] => {
    let x = P[i * 2]
    let y = P[i * 2 + 1]
    if (f < 1 && from) {
      const j = i >> 2
      x = from.pts[j * 2] + (x - from.pts[j * 2]) * f
      y = from.pts[j * 2 + 1] + (y - from.pts[j * 2 + 1]) * f
    }
    return [ox + x * scale, oy + y * scale]
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.lineJoin = 'miter'
  ctx.lineCap = 'square'

  const cellPx = (LOGO_SPAN / (1 << cur.n)) * scale
  const pass = (heavy: 0 | 1) => {
    ctx.beginPath()
    let open = false
    let [px, py] = at(0)
    for (let i = 0; i < upto; i++) {
      const [x, y] = at(i + 1)
      if (cur.heavy[i] === heavy) {
        if (!open) ctx.moveTo(px, py)
        ctx.lineTo(x, y)
        open = true
      } else open = false
      px = x
      py = y
    }
    ctx.stroke()
  }
  // the hair fades as the stitch gets fine, so the empty cells read as dark cloth, not grey fill
  ctx.strokeStyle = LOOK.hair
  ctx.lineWidth = LOOK.hairPx * dpr
  ctx.globalAlpha = Math.min(1, Math.max(0.35, cellPx / (14 * dpr)))
  pass(0)
  ctx.globalAlpha = 1
  ctx.strokeStyle = LOOK.ink
  ctx.lineWidth = Math.max(1 * dpr, cellPx * LOOK.heavy * (from && foldT < 1 ? 0.6 + 0.4 * f : 1))
  pass(1)

  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
