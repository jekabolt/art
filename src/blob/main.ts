// BLOB: the logo as one closed elastic loop inside a frame. The mark's outline is cut open at each
// counter (a hairline slit to the outside) so that all of it is a single loop; that loop keeps its
// length and the area it holds, its points push each other apart so it never crosses itself, and it
// may not leave the frame. Squeeze the frame and the loop has nowhere to go but to fold — guts,
// channels and nested loops — stretch it and the loop relaxes into a soft blob.
// Drag anywhere to size the frame about the middle; a tap brings the logo back (the frame returns to
// its square and every point is drawn home).
// Colours after a plot of polynomial roots: yellow body, burning to orange, magenta and blue at the
// edge, and faint trails of where the outline has just been.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './blob.css'

const LOOK = {
  mark: 0.56, // the logo's width, a share of the screen's shorter side
  raster: 360, // the grid the outline is traced on
  segments: 150, // loop points per logo width (sets the rest spacing)
  memory: 0.12, // how hard the points are drawn home while the logo is remembered
  slack: 0.6, // let go, the loop shortens to this share of the logo's outline: fewer, rounder folds
}

// --- the outline: the logo's strokes on a grid, every counter slit open, traced as one loop -----------------
function traceLogo(): number[] {
  const R = LOOK.raster
  const pad = 8
  const c = document.createElement('canvas')
  c.width = c.height = R
  const g = c.getContext('2d', { willReadFrequently: true })!
  const s = R - pad * 2
  g.translate(pad, pad)
  g.scale(s / LOGO_SPAN, s / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.stroke(new Path2D(LOGO_PATH))
  const d = g.getImageData(0, 0, R, R).data
  const ink = new Uint8Array(R * R)
  for (let i = 0; i < R * R; i++) ink[i] = d[i * 4 + 3] > 127 ? 1 : 0

  // background regions: 0 = not yet labelled; outside is the one touching the border
  const label = new Int32Array(R * R)
  const fill = (start: number, id: number) => {
    const stack = [start]
    label[start] = id
    while (stack.length) {
      const k = stack.pop()!
      const x = k % R
      const y = (k - x) / R
      for (const n of [x > 0 ? k - 1 : -1, x < R - 1 ? k + 1 : -1, y > 0 ? k - R : -1, y < R - 1 ? k + R : -1]) {
        if (n >= 0 && !ink[n] && !label[n]) {
          label[n] = id
          stack.push(n)
        }
      }
    }
  }
  fill(0, 1)
  // each hole: cut a slit (2 px) straight up through the ink until it opens into an already-open region
  for (let k = 0; k < R * R; k++) {
    if (ink[k] || label[k]) continue
    fill(k, 2)
    const x = k % R
    let y = (k - x) / R
    // walk up out of the hole, then through the stroke above it
    while (y > 0 && !ink[y * R + x]) y--
    while (y > 0 && ink[y * R + x]) {
      ink[y * R + x] = 0
      ink[y * R + x + 1] = 0
      y--
    }
    // the slit joins this hole to whatever is above; relabel everything reachable as open
    label.fill(0)
    fill(0, 1)
  }

  // Moore-neighbour trace of the ink's boundary from its top-left pixel
  let start = -1
  for (let k = 0; k < R * R && start < 0; k++) if (ink[k]) start = k
  const dirs = [
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
  ]
  const isInk = (x: number, y: number) => x >= 0 && y >= 0 && x < R && y < R && ink[y * R + x] === 1
  const pts: number[] = []
  let cx = start % R
  let cy = (start - cx) / R
  let back = 0 // the direction we came from (start: from the left)
  const sx = cx
  const sy = cy
  for (let guard = 0; guard < R * R * 2; guard++) {
    pts.push(cx, cy)
    let found = false
    for (let t = 1; t <= 8; t++) {
      const di = (back + t) % 8
      const nx = cx + dirs[di][0]
      const ny = cy + dirs[di][1]
      if (isInk(nx, ny)) {
        back = (di + 4) % 8
        cx = nx
        cy = ny
        found = true
        break
      }
    }
    if (!found || (cx === sx && cy === sy && pts.length > 8)) break
  }
  // to the logo's frame: -0.5..0.5 across the mark
  return pts.map((v) => (v - pad) / s - 0.5)
}

// resample a closed polyline to n points evenly spaced along it
function resample(p: number[], n: number): Float32Array {
  const m = p.length / 2
  const cum = [0]
  for (let i = 1; i <= m; i++) {
    const a = (i - 1) * 2
    const b = (i % m) * 2
    cum.push(cum[i - 1] + Math.hypot(p[b] - p[a], p[b + 1] - p[a + 1]))
  }
  const total = cum[m]
  const out = new Float32Array(n * 2)
  let j = 0
  for (let i = 0; i < n; i++) {
    const s = (i / n) * total
    while (cum[j + 1] < s) j++
    const k = (s - cum[j]) / (cum[j + 1] - cum[j] || 1)
    const a = j * 2
    const b = ((j + 1) % m) * 2
    out[i * 2] = p[a] + (p[b] - p[a]) * k
    out[i * 2 + 1] = p[a + 1] + (p[b + 1] - p[a + 1]) * k
  }
  return out
}

const outline = traceLogo()
let perim0 = 0
for (let i = 0; i < outline.length; i += 2) {
  const j = (i + 2) % outline.length
  perim0 += Math.hypot(outline[j] - outline[i], outline[j + 1] - outline[i + 1])
}
const N = Math.min(1600, Math.round(perim0 * LOOK.segments))
const home = resample(outline, N) // in mark widths, about the middle

// --- the loop ---------------------------------------------------------------------------------------------
const canvas = document.getElementById('blob') as HTMLCanvasElement
const g = canvas.getContext('2d')!
const trails = document.createElement('canvas')
const tg = trails.getContext('2d')!
let dpr = 1
let W = 0
let H = 0
let M = 1 // the mark's width, px
const pos = new Float32Array(N * 2)
const prev = new Float32Array(N * 2)
let l0 = 1 // rest spacing, px
let area0 = 0
let frame = { w: 0, h: 0 } // half-sizes, px, about the middle
let goal = { w: 0, h: 0 }
let memory = LOOK.memory
let reach = 1 // the loop's length now, a share of the logo's outline

const signedArea = () => {
  let a = 0
  for (let i = 0; i < N; i++) {
    const j = ((i + 1) % N) * 2
    a += pos[i * 2] * pos[j + 1] - pos[j] * pos[i * 2 + 1]
  }
  return a / 2
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2)
  const oldM = M
  W = innerWidth
  H = innerHeight
  canvas.width = trails.width = Math.round(W * dpr)
  canvas.height = trails.height = Math.round(H * dpr)
  M = Math.min(W, H) * LOOK.mark
  l0 = (perim0 * M) / N
  const first = area0 === 0
  for (let i = 0; i < N * 2; i++) {
    pos[i] = first ? home[i] * M : (pos[i] / oldM) * M
    prev[i] = pos[i]
  }
  area0 = Math.abs(first ? signedArea() : (area0 / (oldM * oldM)) * M * M)
  const rest = M * 0.5 + 6
  goal = { w: rest, h: rest }
  if (first) frame = { ...goal }
  else frame = { w: Math.min(frame.w, W / 2 - 8), h: Math.min(frame.h, H / 2 - 8) }
}
addEventListener('resize', resize)
resize()

// --- input: drag sizes the frame about the middle; tap remembers the logo ------------------------------------
let press: { id: number; x: number; y: number; t: number; moved: boolean } | null = null
const minSide = () => Math.sqrt(area0) * 0.75
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: false }
})
canvas.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id) return
  if (!press.moved && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8) return
  press.moved = true
  memory = 0 // the logo lets go
  goal = {
    w: Math.max(minSide() / 2, Math.min(W / 2 - 8, Math.abs(e.clientX - W / 2))),
    h: Math.max(minSide() / 2, Math.min(H / 2 - 8, Math.abs(e.clientY - H / 2))),
  }
  // keep enough room for the area
  const need = area0 * 1.15
  if (4 * goal.w * goal.h < need) goal.h = need / (4 * goal.w)
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && !press.moved && performance.now() - press.t < 300
  press = null
  if (tap) {
    memory = LOOK.memory
    const rest = M * 0.5 + 6
    goal = { w: rest, h: rest }
    haptic([10, 40, 10])
  }
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// --- physics ----------------------------------------------------------------------------------------------
const cellOf = new Int32Array(N)
const grid = new Map<number, number[]>()
function step() {
  frame.w += (goal.w - frame.w) * 0.12
  frame.h += (goal.h - frame.h) * 0.12
  // inertia
  for (let i = 0; i < N * 2; i++) {
    const v = (pos[i] - prev[i]) * 0.9
    prev[i] = pos[i]
    pos[i] += v
  }
  reach += ((memory > 0 ? 1 : LOOK.slack) - reach) * 0.01
  const l = l0 * reach
  // how close two stretches of outline may come: tight while it is the logo, wider as it melts, so
  // the folds leave open channels
  const melt = (1 - reach) / (1 - LOOK.slack)
  const r = l * (2 + 1.4 * melt)
  for (let pass = 0; pass < 3; pass++) {
    // length: neighbours held at the rest spacing
    for (let i = 0; i < N; i++) {
      const a = i * 2
      const b = ((i + 1) % N) * 2
      const dx = pos[b] - pos[a]
      const dy = pos[b + 1] - pos[a + 1]
      const d = Math.hypot(dx, dy) || 1e-6
      const k = ((d - l) / d) * 0.5
      pos[a] += dx * k
      pos[a + 1] += dy * k
      pos[b] -= dx * k
      pos[b + 1] -= dy * k
    }
    // no crossing: points not next to each other push apart
    grid.clear()
    for (let i = 0; i < N; i++) {
      const key = Math.floor(pos[i * 2] / r) * 73856093 ^ Math.floor(pos[i * 2 + 1] / r) * 19349663
      cellOf[i] = key
      const list = grid.get(key)
      if (list) list.push(i)
      else grid.set(key, [i])
    }
    for (let i = 0; i < N; i++) {
      const cx = Math.floor(pos[i * 2] / r)
      const cy = Math.floor(pos[i * 2 + 1] / r)
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const list = grid.get(((cx + ox) * 73856093) ^ ((cy + oy) * 19349663))
          if (!list) continue
          for (const j of list) {
            if (j <= i) continue
            const gap = Math.min(Math.abs(i - j), N - Math.abs(i - j))
            if (gap < 5) continue
            const dx = pos[j * 2] - pos[i * 2]
            const dy = pos[j * 2 + 1] - pos[i * 2 + 1]
            const d2 = dx * dx + dy * dy
            if (d2 >= r * r || d2 < 1e-9) continue
            const d = Math.sqrt(d2)
            const k = ((r - d) / d) * 0.15
            pos[i * 2] -= dx * k
            pos[i * 2 + 1] -= dy * k
            pos[j * 2] += dx * k
            pos[j * 2 + 1] += dy * k
          }
        }
      }
    }
    // pressure: keep the area it started with
    const A = signedArea()
    const sign = A >= 0 ? 1 : -1
    let P = 0
    for (let i = 0; i < N; i++) {
      const b = ((i + 1) % N) * 2
      P += Math.hypot(pos[b] - pos[i * 2], pos[b + 1] - pos[i * 2 + 1])
    }
    const push = ((area0 - Math.abs(A)) / P) * 0.4
    for (let i = 0; i < N; i++) {
      const a = ((i + N - 1) % N) * 2
      const b = ((i + 1) % N) * 2
      const dx = pos[b] - pos[a]
      const dy = pos[b + 1] - pos[a + 1]
      const d = Math.hypot(dx, dy) || 1e-6
      pos[i * 2] += (dy / d) * sign * push
      pos[i * 2 + 1] += (-dx / d) * sign * push
    }
    // memory: drawn home while the logo is remembered
    if (memory > 0) {
      for (let i = 0; i < N * 2; i++) pos[i] += (home[i] * M - pos[i]) * memory
    }
    // a little stiffness, so the folds are round
    for (let i = 0; i < N; i++) {
      const a = ((i + N - 1) % N) * 2
      const m = i * 2
      const b = ((i + 1) % N) * 2
      pos[m] += ((pos[a] + pos[b]) / 2 - pos[m]) * 0.25
      pos[m + 1] += ((pos[a + 1] + pos[b + 1]) / 2 - pos[m + 1]) * 0.25
    }
    // the frame
    for (let i = 0; i < N; i++) {
      pos[i * 2] = Math.max(-frame.w, Math.min(frame.w, pos[i * 2]))
      pos[i * 2 + 1] = Math.max(-frame.h, Math.min(frame.h, pos[i * 2 + 1]))
    }
  }
}

// --- drawing -----------------------------------------------------------------------------------------------
// the outline as drawn: averaged over a few neighbours, so the small shiver of the points between
// two stretches pressed together doesn't read as beads
const smooth = new Float32Array(N * 2)
function loopPath() {
  const K = 3
  for (let i = 0; i < N; i++) {
    let x = 0
    let y = 0
    for (let o = -K; o <= K; o++) {
      const j = ((i + o + N) % N) * 2
      x += pos[j]
      y += pos[j + 1]
    }
    smooth[i * 2] = x / (2 * K + 1)
    smooth[i * 2 + 1] = y / (2 * K + 1)
  }
  const p = new Path2D()
  p.moveTo(smooth[0], smooth[1])
  for (let i = 1; i < N; i++) p.lineTo(smooth[i * 2], smooth[i * 2 + 1])
  p.closePath()
  return p
}
function draw() {
  const path = loopPath()
  // trails: where the outline has just been, fading
  tg.setTransform(1, 0, 0, 1, 0, 0)
  tg.globalCompositeOperation = 'destination-out'
  tg.fillStyle = 'rgba(0,0,0,0.035)'
  tg.fillRect(0, 0, trails.width, trails.height)
  tg.globalCompositeOperation = 'source-over'
  tg.setTransform(dpr, 0, 0, dpr, (W / 2) * dpr, (H / 2) * dpr)
  tg.strokeStyle = 'rgba(150, 40, 255, 0.07)'
  tg.lineWidth = 1
  tg.stroke(path)

  g.setTransform(1, 0, 0, 1, 0, 0)
  g.fillStyle = '#fff'
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.drawImage(trails, 0, 0)
  g.setTransform(dpr, 0, 0, dpr, (W / 2) * dpr, (H / 2) * dpr)

  // the body: yellow, burning through orange and magenta to blue at the edge
  g.globalAlpha = 0.9
  g.fillStyle = '#ffd21a'
  g.fill(path, 'evenodd')
  g.save()
  g.clip(path, 'evenodd')
  g.lineJoin = 'round'
  for (const [w, c, a] of [
    [Math.max(10, M * 0.07), '#ff9a2e', 0.35],
    [Math.max(6, M * 0.035), '#f2399e', 0.45],
    [Math.max(3, M * 0.015), '#8a2bff', 0.7],
  ] as const) {
    g.globalAlpha = a
    g.strokeStyle = c
    g.lineWidth = w
    g.stroke(path)
  }
  g.restore()
  g.globalAlpha = 1
  g.strokeStyle = '#3a1cff'
  g.lineWidth = 1.1
  g.stroke(path)

  // the frame, and a handle at each corner
  g.strokeStyle = '#b9b7c6'
  g.lineWidth = 1
  g.strokeRect(-frame.w, -frame.h, frame.w * 2, frame.h * 2)
  g.fillStyle = '#b9b7c6'
  for (const [x, y] of [
    [-frame.w, -frame.h],
    [frame.w, -frame.h],
    [-frame.w, frame.h],
    [frame.w, frame.h],
  ]) g.fillRect(x - 3, y - 3, 6, 6)
}

function tick() {
  step()
  draw()
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
