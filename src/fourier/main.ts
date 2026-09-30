// FOURIER: the logo drawn by one pen on a chain of turning circles. The strokes of the mark are
// joined into a graph and walked in one closed tour that runs every stroke (there and back); the
// tour, sampled evenly, is a periodic complex signal, and its discrete Fourier transform is a set of
// circles, each turning at its own whole-number speed. Chained biggest first, their tip retraces the
// tour. With a few circles the pen draws a blob; add circles and the mark comes through.
//
// Left alone, every turn adds circles, then it starts again from one. Swipe (or scroll) to add or
// take away circles yourself.
import { pathSegments, type Seg } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './fourier.css'

// --- the tour --------------------------------------------------------------------------------------
type P = { x: number; y: number }

/** Split every segment where another one ends on its side, so the strokes form one connected graph. */
function splitAtJunctions(segs: Seg[]): Seg[] {
  let out = segs.slice()
  let changed = true
  while (changed) {
    changed = false
    const ends: P[] = out.flatMap((s) => [
      { x: s.ax, y: s.ay },
      { x: s.bx, y: s.by },
    ])
    for (let i = 0; i < out.length && !changed; i++) {
      const s = out[i]
      const dx = s.bx - s.ax
      const dy = s.by - s.ay
      const len2 = dx * dx + dy * dy
      for (const p of ends) {
        const t = ((p.x - s.ax) * dx + (p.y - s.ay) * dy) / len2
        if (t <= 0.001 || t >= 0.999) continue
        const qx = s.ax + dx * t
        const qy = s.ay + dy * t
        if (Math.hypot(qx - p.x, qy - p.y) > 0.5) continue
        out = [...out.slice(0, i), { ax: s.ax, ay: s.ay, bx: p.x, by: p.y }, { ax: p.x, ay: p.y, bx: s.bx, by: s.by }, ...out.slice(i + 1)]
        changed = true
        break
      }
    }
  }
  return out
}

/** One closed walk over every stroke, each run once in each direction (Euler tour of the doubled graph). */
function tour(): P[] {
  const segs = splitAtJunctions(pathSegments())
  const nodes: P[] = []
  const nodeOf = (x: number, y: number) => {
    const i = nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) < 0.5)
    if (i >= 0) return i
    nodes.push({ x, y })
    return nodes.length - 1
  }
  const edges: { a: number; b: number }[] = []
  for (const s of segs) {
    const a = nodeOf(s.ax, s.ay)
    const b = nodeOf(s.bx, s.by)
    if (a !== b) edges.push({ a, b }, { a, b })
  }
  // join separate pieces, if any, by their nearest nodes
  const comp = (): number[] => {
    const c = new Array(nodes.length).fill(-1)
    let k = 0
    for (let s = 0; s < nodes.length; s++) {
      if (c[s] >= 0) continue
      const stack = [s]
      c[s] = k
      while (stack.length) {
        const u = stack.pop()!
        for (const e of edges) {
          const v = e.a === u ? e.b : e.b === u ? e.a : -1
          if (v >= 0 && c[v] < 0) {
            c[v] = k
            stack.push(v)
          }
        }
      }
      k++
    }
    return c
  }
  for (let c = comp(); Math.max(...c) > 0; c = comp()) {
    let best = { d: Infinity, a: 0, b: 0 }
    nodes.forEach((p, i) =>
      nodes.forEach((q, j) => {
        if (c[i] === 0 && c[j] !== 0) {
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < best.d) best = { d, a: i, b: j }
        }
      }),
    )
    edges.push({ a: best.a, b: best.b }, { a: best.a, b: best.b })
  }
  // Hierholzer
  const adj: number[][] = nodes.map(() => [])
  edges.forEach((e, i) => {
    adj[e.a].push(i)
    adj[e.b].push(i)
  })
  const used = new Array(edges.length).fill(false)
  const ptr = new Array(nodes.length).fill(0)
  const stack = [edges[0].a]
  const walk: number[] = []
  while (stack.length) {
    const u = stack[stack.length - 1]
    while (ptr[u] < adj[u].length && used[adj[u][ptr[u]]]) ptr[u]++
    if (ptr[u] === adj[u].length) {
      walk.push(stack.pop()!)
    } else {
      const e = adj[u][ptr[u]]
      used[e] = true
      stack.push(edges[e].a === u ? edges[e].b : edges[e].a)
    }
  }
  // logo units, centred, y up
  return walk.map((i) => ({ x: nodes[i].x - 300, y: 300 - nodes[i].y }))
}

/** The closed walk sampled at M evenly spaced points along its length. */
function resample(path: P[], m: number): P[] {
  const pts = [...path]
  if (pts[0].x !== pts[pts.length - 1].x || pts[0].y !== pts[pts.length - 1].y) pts.push(pts[0])
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  const total = cum[cum.length - 1]
  const out: P[] = []
  let j = 1
  for (let n = 0; n < m; n++) {
    const s = (n / m) * total
    while (cum[j] < s) j++
    const t = (s - cum[j - 1]) / (cum[j] - cum[j - 1] || 1)
    out.push({ x: pts[j - 1].x + (pts[j].x - pts[j - 1].x) * t, y: pts[j - 1].y + (pts[j].y - pts[j - 1].y) * t })
  }
  return out
}

// --- the circles -----------------------------------------------------------------------------------
const M = 2048
const COS = new Float64Array(M)
const SIN = new Float64Array(M)
for (let i = 0; i < M; i++) {
  COS[i] = Math.cos((2 * Math.PI * i) / M)
  SIN[i] = Math.sin((2 * Math.PI * i) / M)
}

type Term = { f: number; re: number; im: number; r: number }

const samples = resample(tour(), M)
const terms: Term[] = []
for (let k = 0; k < M; k++) {
  let re = 0
  let im = 0
  for (let n = 0; n < M; n++) {
    const idx = (k * n) % M
    // z · e^{-iθ}
    re += samples[n].x * COS[idx] + samples[n].y * SIN[idx]
    im += samples[n].y * COS[idx] - samples[n].x * SIN[idx]
  }
  re /= M
  im /= M
  terms.push({ f: k < M / 2 ? k : k - M, re, im, r: Math.hypot(re, im) })
}
const dc = terms[0]
const circles = terms.slice(1).sort((a, b) => b.r - a.r)
const MAX = 700

/** The pen's path with the first n circles, at M points around one turn. */
function curve(n: number): Float64Array {
  const out = new Float64Array(M * 2)
  for (let s = 0; s < M; s++) {
    let x = dc.re
    let y = dc.im
    for (let c = 0; c < n; c++) {
      const t = circles[c]
      const idx = (((t.f * s) % M) + M) % M
      x += t.re * COS[idx] - t.im * SIN[idx]
      y += t.re * SIN[idx] + t.im * COS[idx]
    }
    out[s * 2] = x
    out[s * 2 + 1] = y
  }
  return out
}

// --- drawing ---------------------------------------------------------------------------------------
const canvas = document.getElementById('fourier') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let dpr = 1
let scale = 1 // device px per logo unit
let cx = 0
let cy = 0

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const side = Math.min(w <= 768 ? 0.6 * w : 0.3 * w, 0.6 * h) // the mark, as on the logo pages
  scale = (side / 516) * dpr
  cx = canvas.width / 2
  cy = canvas.height / 2
}

const X = (x: number) => cx + x * scale
const Y = (y: number) => cy - y * scale

// --- state -------------------------------------------------------------------------------------------
const PERIOD = 7 // seconds per turn
let n = 1 // circles in use
let nShown = 1 // eased, for the circle count while swiping
let path = curve(1)
let t = 0 // 0..1 through the turn
let lastInput = -1e9
let holdTurns = 0

function setN(v: number) {
  const k = Math.max(1, Math.min(MAX, Math.round(v)))
  if (k !== n) {
    n = k
    path = curve(n)
  }
}

/** Left alone: every turn adds circles — 1, 2, 3, 5, 8 … — then holds the full mark and starts over. */
function nextTurn() {
  if (performance.now() - lastInput < 6000) return
  if (n >= MAX) {
    if (++holdTurns >= 2) {
      holdTurns = 0
      setN(1)
    }
    return
  }
  setN(Math.min(MAX, Math.ceil(n * 1.55) + 1))
}

// swipe / scroll: circles on a log scale, so the first few are as easy to reach as the last hundred
let drag: { x: number; y: number; ln: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  drag = { x: e.clientX, y: e.clientY, ln: Math.log(nShown) }
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return
  const d = (e.clientX - drag.x - (e.clientY - drag.y)) / Math.min(window.innerWidth, window.innerHeight)
  nShown = Math.exp(Math.max(0, Math.min(Math.log(MAX), drag.ln + d * 4)))
  setN(nShown)
  lastInput = performance.now()
})
const up = () => (drag = null)
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
window.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    nShown = Math.exp(Math.max(0, Math.min(Math.log(MAX), Math.log(nShown) - e.deltaY * 0.003)))
    setN(nShown)
    lastInput = performance.now()
  },
  { passive: false },
)

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#f6f6f6'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const lw = LOGO_STROKE * scale
  const upto = Math.floor(t * M)
  // square corners like the mark (a right angle needs √2), but the tour's U-turns are bevelled —
  // a plain miter would shoot spikes out of every stroke end
  ctx.lineJoin = 'miter'
  ctx.miterLimit = 1.5
  ctx.lineCap = 'butt'

  // the whole of this approximation, faint; the pen's ink so far, black
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = lw
  ctx.beginPath()
  for (let s = 0; s <= M; s++) {
    const i = (s % M) * 2
    if (s === 0) ctx.moveTo(X(path[i]), Y(path[i + 1]))
    else ctx.lineTo(X(path[i]), Y(path[i + 1]))
  }
  ctx.stroke()

  ctx.strokeStyle = '#000'
  ctx.beginPath()
  for (let s = 0; s <= upto; s++) {
    const i = s * 2
    if (s === 0) ctx.moveTo(X(path[i]), Y(path[i + 1]))
    else ctx.lineTo(X(path[i]), Y(path[i + 1]))
  }
  ctx.stroke()

  // the circles, biggest first, each riding on the last
  const theta = 2 * Math.PI * t
  let x = dc.re
  let y = dc.im
  ctx.lineWidth = Math.max(1, dpr * 0.75)
  for (let c = 0; c < n; c++) {
    const k = circles[c]
    const rpx = k.r * scale
    const a = k.f * theta
    const nx = x + k.re * Math.cos(a) - k.im * Math.sin(a)
    const ny = y + k.re * Math.sin(a) + k.im * Math.cos(a)
    if (rpx > 0.6 * dpr) {
      ctx.strokeStyle = 'rgba(0,0,0,0.16)'
      ctx.beginPath()
      ctx.arc(X(x), Y(y), rpx, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'
      ctx.beginPath()
      ctx.moveTo(X(x), Y(y))
      ctx.lineTo(X(nx), Y(ny))
      ctx.stroke()
    }
    x = nx
    y = ny
  }
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(X(x), Y(y), 3 * dpr, 0, Math.PI * 2)
  ctx.fill()
}

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  t += dt / PERIOD
  if (t >= 1) {
    t -= 1
    nextTurn()
    nShown = n
  }
  draw()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
