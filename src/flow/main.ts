// FLOW: thousands of hairline particles carried left to right by a stream, and the logo standing in
// it as a solid body. The mark is never drawn — it is the one place nothing flows through: the
// stream parts at its front, runs faster over its top and bottom, closes behind it, and inside the
// letters' counters, cut off from the stream, the water turns in slow eddies. A finger (or the
// cursor) is a second body: the streamlines part around it wherever it goes. A tap changes the ink:
// black, red, blue, purple.
//
// The flow is divergence-free by construction: the velocity is the curl of a stream function ψ,
// the uniform stream (ψ = y) plus a little drifting noise, pressed to a constant on each body's
// boundary with a smooth ramp in the distance to it (Bridson's curl-noise boundaries). ψ is constant
// along the walls, so no particle can ever cross into the mark.
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './flow.css'

// --- the mark's distance field, sampled once per size on a grid ------------------------------------------
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

// smooth ramp: 0 at the wall, 1 from x = 1 on, with zero slope there (Bridson)
function ramp(x: number) {
  if (x >= 1) return 1
  if (x <= -1) return -1
  return (15 / 8) * x - (10 / 8) * x ** 3 + (3 / 8) * x ** 5
}

const CELL = 3 // css px per grid cell
let gw = 0
let gh = 0
let field = new Float32Array(0) // distance to the mark, css px (negative inside the strokes)

// --- noise ----------------------------------------------------------------------------------------------
function hash(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const w = zf * zf * (3 - 2 * zf)
  const at = (zz: number) => {
    const a = hash(xi, yi, zz)
    const b = hash(xi + 1, yi, zz)
    const c = hash(xi, yi + 1, zz)
    const d = hash(xi + 1, yi + 1, zz)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  const n0 = at(zi)
  return (n0 + (at(zi + 1) - n0) * w) * 2 - 1
}

// --- canvas and size -------------------------------------------------------------------------------------
const canvas = document.getElementById('flow') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let w = 1
let h = 1
let dpr = 1
let scale = 1 // css px per logo unit
let L = 100 // the ramp's reach around the mark, css px
let noiseScale = 120
let LS = 12 // the wall circulation's reach, css px
let CIRC = 6 // its strength: ψ units, so that it runs about as fast as the stream along the walls

function resize() {
  w = window.innerWidth
  h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const side = Math.min(w <= 768 ? 0.74 * w : 0.42 * w, 0.66 * h)
  scale = side / 516
  L = side * 0.28
  noiseScale = side * 0.3
  LS = 13 * scale
  CIRC = (LS / 1.875) * 0.9
  nw = Math.ceil(w / NCELL) + 2
  nh = Math.ceil(h / NCELL) + 2
  refreshNoise()
  gw = Math.ceil(w / CELL) + 2
  gh = Math.ceil(h / CELL) + 2
  field = new Float32Array(gw * gh)
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const x = (i * CELL - w / 2) / scale
      const y = (j * CELL - h / 2) / scale
      field[j * gw + i] = logoSD(x, y) * scale
    }
  }
  seedAll()
}

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

// the turbulence changes slowly, so it is sampled on a coarse grid once a frame
const NCELL = 24
let nw = 0
let nh = 0
let noiseGrid = new Float32Array(0)
function refreshNoise() {
  if (noiseGrid.length !== nw * nh) noiseGrid = new Float32Array(nw * nh)
  for (let j = 0; j < nh; j++)
    for (let i = 0; i < nw; i++) noiseGrid[j * nw + i] = vnoise((i * NCELL) / noiseScale, (j * NCELL) / noiseScale, time * 0.12)
}
function noiseAt(x: number, y: number) {
  const fx = Math.min(nw - 1.001, Math.max(0, x / NCELL))
  const fy = Math.min(nh - 1.001, Math.max(0, y / NCELL))
  const i = Math.floor(fx)
  const j = Math.floor(fy)
  const u = fx - i
  const v = fy - j
  const o = j * nw + i
  const a = noiseGrid[o]
  const b = noiseGrid[o + 1]
  const c = noiseGrid[o + nw]
  const d = noiseGrid[o + nw + 1]
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

// --- the stream -------------------------------------------------------------------------------------------
const finger = { x: -1e4, y: -1e4, r: 0, target: 0 }
let time = 0

function psiFree(x: number, y: number) {
  // the uniform stream with a little drifting turbulence, measured from the mark's middle
  const yy = y - h / 2
  return yy + noiseScale * 0.35 * noiseAt(x, y)
}
function psi(x: number, y: number) {
  // the mark: ψ pressed to 0 on its walls (its middle stands at ψ = 0 in the free stream), plus a
  // thin circulation hugging every wall — it is what keeps the water moving in the channels between
  // the letters, where the stream cannot reach: it runs along each wall, up one side, down the other
  const dm = markDist(x, y)
  let p = psiFree(x, y) * ramp(dm / L) + CIRC * ramp(dm / LS)
  if (finger.r > 1) {
    // the finger: ψ pressed to its value at the finger's centre
    const dc = markDist(finger.x, finger.y)
    const pc = psiFree(finger.x, finger.y) * ramp(dc / L) + CIRC * ramp(dc / LS)
    const df = Math.hypot(x - finger.x, y - finger.y) - finger.r
    p = pc + (p - pc) * ramp(Math.max(0, df) / (finger.r * 1.6))
  }
  return p
}

// --- particles -----------------------------------------------------------------------------------------------
const TRAIL = 30 // points kept per particle
const EVERY = 2 // frames between trail points
const SPEED = 42 // css px per second in the free stream
let N = 0
let px = new Float32Array(0)
let py = new Float32Array(0)
let age = new Float32Array(0)
let life = new Float32Array(0)
let count = new Uint16Array(0) // trail points so far
let trail = new Float32Array(0) // N × TRAIL × 2, a ring shared by all (same write slot for everyone)
let slot = 0

function seed(k: number) {
  for (let tries = 0; tries < 20; tries++) {
    const x = Math.random() * w
    const y = Math.random() * h
    if (markDist(x, y) > 1.5 && Math.hypot(x - finger.x, y - finger.y) > finger.r + 2) {
      px[k] = x
      py[k] = y
      break
    }
  }
  age[k] = 0
  life[k] = 3 + Math.random() * 6
  count[k] = 0
}
function seedAll() {
  N = Math.min(6000, Math.round((w * h) / 190))
  px = new Float32Array(N)
  py = new Float32Array(N)
  age = new Float32Array(N)
  life = new Float32Array(N)
  count = new Uint16Array(N)
  trail = new Float32Array(N * TRAIL * 2)
  for (let k = 0; k < N; k++) {
    seed(k)
    age[k] = Math.random() * life[k] // staggered, so they don't all renew together
  }
}

function velocity(x: number, y: number, out: number[]) {
  const e = 1.5
  const dy = (psi(x, y + e) - psi(x, y - e)) / (2 * e)
  const dx = (psi(x + e, y) - psi(x - e, y)) / (2 * e)
  out[0] = dy * SPEED
  out[1] = -dx * SPEED
}

// --- ink: a tap takes the next colour from the brand's palette -----------------------------------------------------
const PALETTE = ['#0b0b0b', '#ff0000', '#311eee', '#501089']
let ink = 0
const PAPER = '#f4f3ef'

// --- input -----------------------------------------------------------------------------------------------------
let down: { x: number; y: number } | null = null
let lastMove = -1e9
function place(e: PointerEvent) {
  finger.x = e.clientX
  finger.y = e.clientY
  finger.target = w <= 768 ? 46 : 58
  lastMove = performance.now()
}
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY }
  place(e)
})
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' || e.buttons) place(e)
})
canvas.addEventListener('pointerup', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) ink = (ink + 1) % PALETTE.length
  down = null
  if (e.pointerType !== 'mouse') finger.target = 0
})
canvas.addEventListener('pointerleave', () => (finger.target = 0))

// --- loop ------------------------------------------------------------------------------------------------------
const v = [0, 0]
const v2 = [0, 0]
let frameNo = 0
let last = performance.now()

function step(dt: number) {
  for (let k = 0; k < N; k++) {
    age[k] += dt
    const x = px[k]
    const y = py[k]
    // midpoint step: follows the curving streamlines without spiralling out of the eddies
    velocity(x, y, v)
    velocity(x + v[0] * dt * 0.5, y + v[1] * dt * 0.5, v2)
    const nx = x + v2[0] * dt
    const ny = y + v2[1] * dt
    if (age[k] > life[k] || nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20 || markDist(nx, ny) < 0 || Math.hypot(nx - finger.x, ny - finger.y) < finger.r) seed(k)
    else {
      px[k] = nx
      py[k] = ny
    }
  }
}

function record() {
  slot = (slot + 1) % TRAIL
  for (let k = 0; k < N; k++) {
    const o = (k * TRAIL + slot) * 2
    trail[o] = px[k]
    trail[o + 1] = py[k]
    if (count[k] < TRAIL) count[k]++
  }
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.strokeStyle = PALETTE[ink]
  ctx.lineWidth = 0.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // three strengths: particles fade in when they are born and out before they are renewed
  const LEVELS = [0.18, 0.42, 0.72]
  for (let lv = 0; lv < LEVELS.length; lv++) {
    ctx.globalAlpha = LEVELS[lv]
    ctx.beginPath()
    for (let k = 0; k < N; k++) {
      const n = count[k]
      if (n < 2) continue
      const f = Math.min(age[k] / 0.8, (life[k] - age[k]) / 0.8, 1)
      const level = f < 0.34 ? 0 : f < 0.67 ? 1 : 2
      if (level !== lv) continue
      let s = slot
      let o = (k * TRAIL + s) * 2
      ctx.moveTo(px[k], py[k])
      ctx.lineTo(trail[o], trail[o + 1])
      for (let i = 1; i < n; i++) {
        s = (s - 1 + TRAIL) % TRAIL
        o = (k * TRAIL + s) * 2
        ctx.lineTo(trail[o], trail[o + 1])
      }
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  time += dt
  refreshNoise()
  if (now - lastMove > 2500) finger.target = 0
  finger.r += (finger.target - finger.r) * (1 - Math.exp(-dt * 6))
  step(dt)
  if (++frameNo % EVERY === 0) record()
  draw()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
