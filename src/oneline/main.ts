// ONE LINE: the logo drawn in a single unbroken line, differently every time. The line runs round
// the mark's outline and round every empty cell inside it, crossing the strokes to get from one to
// the next. Each drawing picks its own order, entry points and directions, and its own hand: a slow
// drift and a fine tremor, corners slightly rounded, the pen quick on the straights and slow into
// the corners. A finished drawing keeps boiling (redrawn twelve times a second, as hand-drawn
// animation does) until the next one starts on a clean sheet.
// Every tap makes the pen faster (×1.6, up to ×12); left alone it slows back to its own pace.
import '../core/embed'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './oneline.css'

type P = { x: number; y: number }

// --- the outline of the mark ------------------------------------------------------------------------
/** Contours of the drawn mark (logo units, y down): marching squares over a rendered mask. */
function contours(): P[][] {
  const k = 1.2
  const m = 8
  const size = Math.ceil(LOGO_SPAN * k + 2 * m)
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.translate(m, m)
  g.scale(k, k)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#000'
  g.stroke(new Path2D(LOGO_PATH))
  const data = g.getImageData(0, 0, size, size).data
  const v = (x: number, y: number) => data[(y * size + x) * 4 + 3] / 255

  const pts = new Map<string, P>()
  const segs: [string, string][] = []
  const point = (key: string, p: P) => {
    if (!pts.has(key)) pts.set(key, p)
    return key
  }
  const lerp = (a: number, b: number) => (0.5 - a) / (b - a)
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const tl = v(x, y)
      const tr = v(x + 1, y)
      const br = v(x + 1, y + 1)
      const bl = v(x, y + 1)
      const idx = (tl >= 0.5 ? 8 : 0) | (tr >= 0.5 ? 4 : 0) | (br >= 0.5 ? 2 : 0) | (bl >= 0.5 ? 1 : 0)
      if (idx === 0 || idx === 15) continue
      const T = () => point(`h${x},${y}`, { x: x + lerp(tl, tr), y })
      const B = () => point(`h${x},${y + 1}`, { x: x + lerp(bl, br), y: y + 1 })
      const L = () => point(`v${x},${y}`, { x, y: y + lerp(tl, bl) })
      const R = () => point(`v${x + 1},${y}`, { x: x + 1, y: y + lerp(tr, br) })
      const add = (a: string, b: string) => segs.push([a, b])
      switch (idx) {
        case 1: case 14: add(L(), B()); break
        case 2: case 13: add(B(), R()); break
        case 3: case 12: add(L(), R()); break
        case 4: case 11: add(T(), R()); break
        case 6: case 9: add(T(), B()); break
        case 7: case 8: add(L(), T()); break
        case 5: add(L(), T()); add(B(), R()); break
        case 10: add(T(), R()); add(L(), B()); break
      }
    }
  }
  // link the pieces into closed loops
  const byKey = new Map<string, number[]>()
  segs.forEach(([a, b], i) => {
    for (const key of [a, b]) {
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key)!.push(i)
    }
  })
  const used = new Array(segs.length).fill(false)
  const loops: P[][] = []
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue
    used[s] = true
    const start = segs[s][0]
    let key = segs[s][1]
    const loop = [pts.get(start)!]
    while (key !== start) {
      loop.push(pts.get(key)!)
      const next = byKey.get(key)!.find((i) => !used[i])
      if (next === undefined) break
      used[next] = true
      key = segs[next][0] === key ? segs[next][1] : segs[next][0]
    }
    const ring = simplify(loop, 0.6).map((p) => ({ x: (p.x - m) / k + LOGO_MIN, y: (p.y - m) / k + LOGO_MIN }))
    if (Math.abs(area(ring)) > 40) loops.push(ring)
  }
  return loops
}

function area(r: P[]) {
  let a = 0
  for (let i = 0; i < r.length; i++) {
    const p = r[i]
    const q = r[(i + 1) % r.length]
    a += p.x * q.y - q.x * p.y
  }
  return a / 2
}

/** Ramer–Douglas–Peucker on a closed ring. */
function simplify(ring: P[], eps: number): P[] {
  const rdp = (pts: P[]): P[] => {
    if (pts.length < 3) return pts
    const a = pts[0]
    const b = pts[pts.length - 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    let far = 0
    let at = 0
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs((pts[i].x - a.x) * dy - (pts[i].y - a.y) * dx) / len
      if (d > far) {
        far = d
        at = i
      }
    }
    if (far <= eps) return [a, b]
    return [...rdp(pts.slice(0, at + 1)).slice(0, -1), ...rdp(pts.slice(at))]
  }
  // split the ring at its two farthest-apart points
  let j = 0
  let best = 0
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i].x - ring[0].x, ring[i].y - ring[0].y)
    if (d > best) {
      best = d
      j = i
    }
  }
  const a = rdp(ring.slice(0, j + 1))
  const b = rdp([...ring.slice(j), ring[0]])
  return [...a.slice(0, -1), ...b.slice(0, -1)]
}

const LOOPS = contours()

// --- a drawing -----------------------------------------------------------------------------------
function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

/** Smooth 1D value noise for a given seed. */
function noise(seed: number) {
  const h = (i: number) => {
    let x = (i * 374761393 + seed * 668265263) | 0
    x = (x ^ (x >>> 13)) * 1274126177
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296 - 0.5
  }
  return (t: number) => {
    const i = Math.floor(t)
    const f = t - i
    const u = f * f * (3 - 2 * f)
    return h(i) * (1 - u) + h(i + 1) * u
  }
}

/** Corner-cutting (Chaikin) on an open polyline: a pen rounds corners a little — by a few units,
 *  not by a share of the side, so long straight sides keep sharp corners. */
function chaikin(pts: P[], rounds: number, reach = 3.5): P[] {
  let p = pts
  for (let r = 0; r < rounds; r++) {
    const out: P[] = [p[0]]
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i]
      const b = p[i + 1]
      const cut = Math.min(0.25, reach / (Math.hypot(b.x - a.x, b.y - a.y) || 1))
      out.push({ x: a.x + (b.x - a.x) * cut, y: a.y + (b.y - a.y) * cut }, { x: a.x + (b.x - a.x) * (1 - cut), y: a.y + (b.y - a.y) * (1 - cut) })
    }
    out.push(p[p.length - 1])
    p = out
  }
  return p
}

type Drawing = {
  pts: Float32Array // x, y per sample (logo units, before the tremor)
  nx: Float32Array // unit normal per sample, for the tremor
  s: Float32Array // arc length per sample
  at: Float32Array // time (s) the pen reaches each sample
  duration: number
  tremor: (t: number) => number
}

/** One way through all the outlines as a single line, and how far it jumps between them in total.
 *  Each outline is drawn round in full from its entry point, then the pen carries on along it (over
 *  what it just drew, as a hand would) to the point nearest the next outline, and crosses over. */
function route(r: () => number): { pts: P[]; jumps: number } {
  const wrap = (ring: P[], i: number) => ring[((i % ring.length) + ring.length) % ring.length]
  const left = LOOPS.map((_, i) => i)
  let cur = left.splice(Math.floor(r() * left.length), 1)[0]
  let entry = Math.floor(r() * LOOPS[cur].length)
  const pts: P[] = []
  let jumps = 0
  for (;;) {
    const ring = LOOPS[cur]
    const dir = r() < 0.5 ? 1 : -1
    for (let i = 0; i <= ring.length; i++) pts.push(wrap(ring, entry + dir * i))
    if (!left.length) break
    // the nearest pair of points between this outline and each one still to draw
    const near = left
      .map((li) => {
        let best = { d: Infinity, from: 0, to: 0 }
        ring.forEach((p, pi) =>
          LOOPS[li].forEach((q, qi) => {
            const d = Math.hypot(p.x - q.x, p.y - q.y)
            if (d < best.d) best = { d, from: pi, to: qi }
          }),
        )
        return { li, ...best }
      })
      .sort((a, b) => a.d - b.d)
    // the nearest outline, or one about as near: the line crosses a single stroke to get there
    const close = near.filter((c) => c.d <= near[0].d * 1.25 + 6)
    const pick = close[Math.floor(r() * close.length)]
    // carry on along this outline to the exit, whichever way round is shorter
    const n = ring.length
    const fwd = (((pick.from - entry) * dir) % n + n) % n
    const steps = fwd <= n - fwd ? fwd : -(n - fwd)
    for (let k = 1; k <= Math.abs(steps); k++) pts.push(wrap(ring, entry + dir * Math.sign(steps) * k))
    jumps += pick.d
    left.splice(left.indexOf(pick.li), 1)
    cur = pick.li
    entry = pick.to
  }
  return { pts, jumps }
}

function newDrawing(seed: number): Drawing {
  const r = rng(seed)
  // many ways through, keep one of the few with the shortest jumps: varied, never lost
  const ways = Array.from({ length: 30 }, () => route(r)).sort((a, b) => a.jumps - b.jumps)
  const routePts = ways[Math.floor(r() * 4)].pts

  // hand: rounded corners, a slow drift along the line
  const rounded = chaikin(routePts, 2)
  const step = 1.6
  const drift = noise(Math.floor(r() * 1e9))
  const drift2 = noise(Math.floor(r() * 1e9))
  const samples: P[] = []
  const arc: number[] = []
  let acc = 0
  for (let i = 0; i < rounded.length - 1; i++) {
    const a = rounded[i]
    const b = rounded[i + 1]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    const n = Math.max(1, Math.ceil(len / step))
    for (let k = 0; k < n; k++) {
      const t = k / n
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      arc.push(acc + len * t)
    }
    acc += len
  }
  const N = samples.length
  const pts = new Float32Array(N * 2)
  const nx = new Float32Array(N * 2)
  const s = new Float32Array(N)
  const at = new Float32Array(N)
  const amp = 2.2 + r() * 1.6
  for (let i = 0; i < N; i++) {
    const p = samples[i]
    const q = samples[Math.min(N - 1, i + 1)]
    const o = samples[Math.max(0, i - 1)]
    let tx = q.x - o.x
    let ty = q.y - o.y
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    const off = drift(arc[i] / 70) * amp * 2 + drift2(arc[i] / 19) * amp * 0.6
    pts[i * 2] = p.x - ty * off
    pts[i * 2 + 1] = p.y + tx * off
    nx[i * 2] = -ty
    nx[i * 2 + 1] = tx
    s[i] = arc[i]
  }
  // the pen: quick on the straights, slow into turns
  let time = 0
  const base = 950 + r() * 300 // units per second on a straight
  for (let i = 0; i < N; i++) {
    at[i] = time
    const a = Math.max(0, i - 3)
    const b = Math.min(N - 1, i + 3)
    const ax = pts[i * 2] - pts[a * 2]
    const ay = pts[i * 2 + 1] - pts[a * 2 + 1]
    const bx = pts[b * 2] - pts[i * 2]
    const by = pts[b * 2 + 1] - pts[i * 2 + 1]
    const cos = (ax * bx + ay * by) / ((Math.hypot(ax, ay) * Math.hypot(bx, by)) || 1)
    const speed = base * (0.28 + 0.72 * Math.max(0, cos) ** 3)
    time += step / speed
  }
  return { pts, nx, s, at, duration: time, tremor: noise(Math.floor(r() * 1e9)) }
}

// --- rendering ---------------------------------------------------------------------------------------
const canvas = document.getElementById('oneline') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let dpr = 1
let scale = 1
let ox = 0
let oy = 0

const INK = '#f6f6f6'

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const side = Math.min(w <= 768 ? 0.74 * w : 0.38 * w, 0.66 * h)
  scale = (side / LOGO_SPAN) * dpr
  ox = canvas.width / 2 - 300 * scale
  oy = canvas.height / 2 - 300 * scale
}

function trace(g: CanvasRenderingContext2D, d: Drawing, upto: number, boil: number) {
  const N = Math.min(upto, d.s.length)
  if (N < 2) return
  g.beginPath()
  for (let i = 0; i < N; i++) {
    const tr = boil >= 0 ? d.tremor(d.s[i] / 6 + boil * 13.7) * 0.9 : 0
    const x = ox + (d.pts[i * 2] + d.nx[i * 2] * tr) * scale
    const y = oy + (d.pts[i * 2 + 1] + d.nx[i * 2 + 1] * tr) * scale
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.stroke()
}

let seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0
let drawing = newDrawing(seed)
let clock = 0 // seconds of drawing, at the pen's current speed
let speed = 1
let lastFrame = performance.now()
let doneAt = 0

function next() {
  seed = (seed * 1664525 + 1013904223) >>> 0
  drawing = newDrawing(seed)
  clock = 0
  doneAt = 0
}
canvas.addEventListener('pointerdown', () => {
  speed = Math.min(12, speed * 1.6)
})

function frame(now: number) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000)
  lastFrame = now
  clock += dt * speed
  speed = 1 + (speed - 1) * Math.exp(-dt / 3) // eases back to its own pace over a few seconds
  const t = clock
  // the pen's position: the last sample it has reached
  let lo = 0
  let hi = drawing.at.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (drawing.at[mid] <= t) lo = mid
    else hi = mid - 1
  }
  const upto = lo + 1
  if (upto >= drawing.at.length && !doneAt) doneAt = clock
  if (doneAt && clock - doneAt > 3.5) next() // the pause before the next drawing speeds up too

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.lineJoin = ctx.lineCap = 'round'
  ctx.lineWidth = 1.5 * dpr
  ctx.strokeStyle = INK
  const boil = Math.floor(now / 83) // twelve drawings a second
  trace(ctx, drawing, upto, boil)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
