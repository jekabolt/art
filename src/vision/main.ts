// VISION: the logo as a computer-vision feature map, shown the way a notebook shows one — a coarse
// grid of flat pixels in a matplotlib imshow frame, ticks every ten. Every channel is thresholded,
// so there are only the eight loud colours of a one-bit RGB: the strokes come out red with magenta
// and white specks, their edge a yellow rim, the ground green blotches over black and dark blue,
// with stray pixels. The map is recomputed eight times a second, like frames going through a
// model. The mark itself is a flat plate in space in front of the camera, seen in perspective, its
// back mirrored: a swipe turns it — sideways about its upright, up and down about the horizontal —
// and it keeps turning a while after the finger lets go, so the strokes squeeze, go edge-on and
// vanish into the ground. The pointer is heat, burning the ground yellow and white around it. A tap
// changes the resolution: 40, 80, 160 pixels across.
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './vision.css'

// --- the mark as a distance field (logo units, y down) ---------------------------------------------
const bars = logoBars().map((s) => {
  const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
  return { cx: (s.ax + s.bx) / 2, cy: (s.ay + s.by) / 2, ux: (s.bx - s.ax) / len, uy: (s.by - s.ay) / len, hl: len / 2 }
})
const HW = LOGO_STROKE / 2

function sd(x: number, y: number): number {
  let d = Infinity
  for (const b of bars) {
    const rx = x - b.cx
    const ry = y - b.cy
    const lx = Math.abs(rx * b.ux + ry * b.uy) - b.hl
    const ly = Math.abs(-rx * b.uy + ry * b.ux) - HW
    const out = Math.hypot(Math.max(lx, 0), Math.max(ly, 0))
    d = Math.min(d, out + Math.min(Math.max(lx, ly), 0))
  }
  return d
}

// --- noise ---------------------------------------------------------------------------------------------
function hash(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, z)
  const b = hash(xi + 1, yi, z)
  const c = hash(xi, yi + 1, z)
  const d = hash(xi + 1, yi + 1, z)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, t: number) {
  // two octaves, drifting through time by blending neighbouring slices
  const z = Math.floor(t)
  const f = t - z
  const at = (zz: number) => vnoise(x, y, zz) * 0.65 + vnoise(x * 2.1, y * 2.1, zz + 97) * 0.35
  return at(z) * (1 - f) + at(z + 1) * f
}

// --- the map ---------------------------------------------------------------------------------------------
const RESOLUTIONS = [40, 80, 160]
let resIndex = 1
const SPAN = 900 // logo units across the map: the mark small in the middle of a wide field

const q = (v: number, levels: number) => Math.round(v * (levels - 1)) / (levels - 1)

// --- the plate in space: rotation about the upright (spin), then a nod about the horizontal ---------------
const EYE = 1500 // logo units from the eye to the plate's centre
type Pose = { a: number[]; b: number[]; n: number[] }
function pose(spin: number, nod: number): Pose {
  const c = Math.cos(spin)
  const s = Math.sin(spin)
  const cn = Math.cos(nod)
  const sn = Math.sin(nod)
  const rx = (v: number[]) => [v[0], v[1] * cn - v[2] * sn, v[1] * sn + v[2] * cn]
  return { a: rx([c, 0, -s]), b: rx([0, 1, 0]), n: rx([s, 0, c]) }
}

// where the ray from the eye through a map point (logo units from the middle) meets the plate, as a
// point of the logo, and the signed distance to the strokes measured on screen
function onPlate(X: number, Y: number, p: Pose) {
  const dn = X * p.n[0] + Y * p.n[1] + EYE * p.n[2]
  if (Math.abs(dn) < 1e-6) return { d: Infinity, u: 0, v: 0 }
  const t = (EYE * p.n[2]) / dn // the eye at (0, 0, -EYE), looking through the map at z = 0
  if (t <= 0) return { d: Infinity, u: 0, v: 0 }
  const hx = t * X
  const hy = t * Y
  const hz = -EYE + t * EYE
  const u = hx * p.a[0] + hy * p.a[1] + hz * p.a[2] + 300
  const v = hx * p.b[0] + hy * p.b[1] + hz * p.b[2] + 300
  // logo units to map units here: perspective shrink, and the slant (roughly, the root of the cosine)
  const k = (EYE / (EYE + hz)) * Math.sqrt(Math.abs(dn) / Math.hypot(X, Y, EYE))
  return { d: sd(u, v) * k, u, v }
}

function computeMap(n: number, frameNo: number, heat: { x: number; y: number; on: number }, p: Pose, img: ImageData) {
  const cell = SPAN / n
  const t = frameNo * 0.06
  const buf = img.data
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * cell
      const y = (j + 0.5) * cell
      const hit = onPlate(x - SPAN / 2, y - SPAN / 2, p)
      const d = hit.d
      const h = hash(i, j, frameNo) // flicker, per frame
      const hot = heat.on * Math.exp(-((x - heat.x) ** 2 + (y - heat.y) ** 2) / (130 * 130))
      let r = 0
      let g = 0
      let b = 0
      const edge = cell * 0.6 // the rim: about a pixel of the map
      if (d < -edge * 0.6) {
        // the strokes: red, with magenta clusters and white where it runs hot
        const m = fbm(hit.u / 40, hit.v / 40, t * 1.5)
        r = 1
        if (m + hot * 0.6 > 0.72 || h > 0.93) g = b = 1
        else if (m > 0.55 || h > 0.8) b = 1
      } else if (d < edge) {
        // the rim: yellow, broken by white and the odd cyan
        r = g = 1
        if (h > 0.9 || hot > 0.5) b = 1
        if (h < 0.025) (r = 0), (b = 1)
      } else if (d < edge * 2.2 && h > 0.86) {
        // a fringe of misread pixels just outside
        r = 1
        b = h > 0.93 ? 1 : 0
        g = h > 0.97 ? 1 : 0
      } else {
        // the ground: green blotches in a few shades, black, dark blue in the hollows
        const bg = fbm(x / 110 + 3, y / 110 + 7, t * 0.5) + hot * 0.9
        if (hot > 0.55) {
          r = g = 1
          b = hot > 0.8 ? 1 : 0
        } else if (bg > 0.5) {
          g = 0.25 + 0.75 * q(Math.min(1, (bg - 0.5) / 0.18), 4)
          if (h > 0.97) g *= 0.5
        } else if (bg < 0.3) {
          b = 0.25 + 0.4 * q(Math.min(1, (0.3 - bg) / 0.15), 3)
        }
        if (h < 0.006) (r = h < 0.003 ? 1 : 0.55), (g = 0), (b = 0) // stray red
      }
      const o = (j * n + i) * 4
      buf[o] = r * 255
      buf[o + 1] = g * 255
      buf[o + 2] = b * 255
      buf[o + 3] = 255
    }
  }
}

// --- drawing: a matplotlib imshow figure --------------------------------------------------------------
const canvas = document.getElementById('vision') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const small = document.createElement('canvas')
const sctx = small.getContext('2d')!
let img = sctx.createImageData(1, 1)
let dpr = 1
let plot = { x: 0, y: 0, s: 1 } // device px

function setResolution() {
  const n = RESOLUTIONS[resIndex]
  small.width = small.height = n
  img = sctx.createImageData(n, n)
}

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const s = Math.min(w <= 768 ? 0.84 * w : 0.52 * w, 0.78 * h)
  plot = { x: Math.round(((w - s) / 2 + 12) * dpr), y: Math.round(((h - s) / 2 - 8) * dpr), s: Math.round(s * dpr) }
}

function drawFigure() {
  const n = RESOLUTIONS[resIndex]
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(small, plot.x, plot.y, plot.s, plot.s)

  // frame and ticks, matplotlib's defaults: 0.8 pt spines, 3.5 pt ticks outside, 10 pt labels
  const lw = Math.max(1, 0.9 * dpr)
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#000'
  ctx.lineWidth = lw
  ctx.strokeRect(plot.x - lw / 2, plot.y - lw / 2, plot.s + lw, plot.s + lw)
  const step = n <= 40 ? 5 : n <= 80 ? 10 : 20
  const tick = 4.5 * dpr
  ctx.font = `${Math.round(11 * dpr)}px "DejaVu Sans", "Helvetica Neue", Arial, sans-serif`
  const px = plot.s / n
  for (let v = 0; v < n; v += step) {
    const c = (v + 0.5) * px
    // bottom
    ctx.beginPath()
    ctx.moveTo(plot.x + c, plot.y + plot.s)
    ctx.lineTo(plot.x + c, plot.y + plot.s + tick)
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(String(v), plot.x + c, plot.y + plot.s + tick + 2 * dpr)
    // left
    ctx.beginPath()
    ctx.moveTo(plot.x, plot.y + c)
    ctx.lineTo(plot.x - tick, plot.y + c)
    ctx.stroke()
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(v), plot.x - tick - 3 * dpr, plot.y + c)
  }
}

// --- input and loop -------------------------------------------------------------------------------------
const heat = { x: SPAN / 2, y: SPAN / 2, on: 0 }
const heatTarget = { x: SPAN / 2, y: SPAN / 2, on: 0 }
let lastMove = -1e9
function toMap(e: PointerEvent) {
  heatTarget.x = ((e.clientX * dpr - plot.x) / plot.s) * SPAN
  heatTarget.y = ((e.clientY * dpr - plot.y) / plot.s) * SPAN
  heatTarget.on = 1
  lastMove = performance.now()
}
// --- turning the plate: a swipe turns it, and it coasts on after the release --------------------------------
const turn = { spin: 0, nod: 0, vs: 0, vn: 0 } // radians, radians per second
let down: { x: number; y: number } | null = null
let drag: { x: number; y: number; t: number } | null = null
const radPerPx = () => Math.PI / (plot.s / dpr) // a swipe across the plot turns it half round

canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY }
  drag = { x: e.clientX, y: e.clientY, t: performance.now() }
  turn.vs = turn.vn = 0
  canvas.setPointerCapture(e.pointerId)
  toMap(e)
})
canvas.addEventListener('pointermove', (e) => {
  if (drag) {
    const now = performance.now()
    const ds = (e.clientX - drag.x) * radPerPx()
    const dn = (e.clientY - drag.y) * radPerPx()
    turn.spin += ds
    turn.nod += dn
    // the release speed, smoothed over the last few moves
    const dt = Math.max(0.008, (now - drag.t) / 1000)
    turn.vs = turn.vs * 0.5 + (ds / dt) * 0.5
    turn.vn = turn.vn * 0.5 + (dn / dt) * 0.5
    drag = { x: e.clientX, y: e.clientY, t: now }
  }
  if (e.pointerType === 'mouse' || e.buttons) toMap(e)
})
function release(e: PointerEvent) {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
    resIndex = (resIndex + 1) % RESOLUTIONS.length
    setResolution()
    turn.vs = turn.vn = 0
  }
  // a finger that stopped before lifting leaves the plate still
  if (drag && performance.now() - drag.t > 80) turn.vs = turn.vn = 0
  down = null
  drag = null
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)
canvas.addEventListener('pointerleave', () => (heatTarget.on = 0))

let frameNo = 0
let nextAt = 0
let nextNoiseAt = 0
let drawn = { spin: NaN, nod: NaN, res: -1 }
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (!drag) {
    turn.spin += turn.vs * dt
    turn.nod += turn.vn * dt
    const f = Math.exp(-dt / 1.2)
    turn.vs *= f
    turn.vn *= f
  }
  if (now - lastMove > 1500) heatTarget.on = 0
  const k = 0.25
  heat.x += (heatTarget.x - heat.x) * k
  heat.y += (heatTarget.y - heat.y) * k
  heat.on += (heatTarget.on - heat.on) * 0.12
  // the noise flickers eight times a second, like a model working through a feed; while the plate
  // turns the map is redrawn more often, so the swipe does not lag behind the finger
  const moved = turn.spin !== drawn.spin || turn.nod !== drawn.nod || resIndex !== drawn.res
  if (now >= nextAt || (moved && now >= nextAt - 125 + 33)) {
    nextAt = now + 125
    if (now >= nextNoiseAt) {
      nextNoiseAt = now + 125
      frameNo++
    }
    drawn = { spin: turn.spin, nod: turn.nod, res: resIndex }
    computeMap(RESOLUTIONS[resIndex], frameNo, heat, pose(turn.spin, turn.nod), img)
    sctx.putImageData(img, 0, 0)
    drawFigure()
  }
  requestAnimationFrame(frame)
}

window.addEventListener('resize', () => {
  resize()
  drawFigure()
})
setResolution()
resize()
requestAnimationFrame(frame)
