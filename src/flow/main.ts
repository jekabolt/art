// FLOW: the logo in a wind tunnel. A steady wind blows left to right, and the mark stands in it as a
// solid body, drawn the way flow simulations are drawn: the air coloured by its pressure — red where
// it piles up against the body, blue where it races past the edges, cyan in the free stream — with
// long fine black streamlines carried through it, and the body itself a plain white model. Inside the letters' counters, cut off from the wind, the air turns in slow eddies. Swipe
// to turn the body in the wind (it keeps turning a little after you let go); a tap changes what is
// shown: pressure, speed, or the streamlines alone.
//
// The flow is divergence-free by construction: the velocity is the curl of a stream function ψ,
// the uniform wind (ψ = y) plus a faint drifting turbulence, pressed to a constant on the body's
// walls with a smooth ramp in the distance to them (Bridson's curl-noise boundaries), plus a thin
// circulation hugging every wall. ψ is constant along the walls, so no air crosses into the body.
// The pressure is Bernoulli's, Cp = 1 − (|v|/U)².
import { logoBars } from '../core/logo-bars'
import { LOGO_STROKE } from '../core/logo-path'
import './flow.css'

// --- the body: bars in logo units (centred, y down) and its distance field on a grid ----------------------
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

// the distance field in the body's own frame, once: logo units, 2.5 per cell, far enough out that the
// ramp around the body is covered at any turn; beyond the grid the distance grows with the radius
const LCELL = 2.5
const LREACH = 620
const LN = Math.ceil((2 * LREACH) / LCELL) + 1
const logoField = new Float32Array(LN * LN)
for (let j = 0; j < LN; j++)
  for (let i = 0; i < LN; i++) logoField[j * LN + i] = logoSD(i * LCELL - LREACH, j * LCELL - LREACH)

function bodyDist(u: number, v: number) {
  // u, v: logo units from the body's centre, in its own frame
  const fx = (u + LREACH) / LCELL
  const fy = (v + LREACH) / LCELL
  if (fx < 0 || fy < 0 || fx >= LN - 1 || fy >= LN - 1) {
    // far out the mark is just its square: the box's distance, which the grid's edge agrees with
    const qx = Math.abs(u) - 258
    const qy = Math.abs(v) - 258
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)
  }
  const i = Math.floor(fx)
  const j = Math.floor(fy)
  const a = fx - i
  const b = fy - j
  const o = j * LN + i
  const p = logoField[o]
  const q = logoField[o + 1]
  const r = logoField[o + LN]
  const s = logoField[o + LN + 1]
  return p + (q - p) * a + (r - p) * b + (p - q - r + s) * a * b
}

// smooth ramp: 0 at the wall, 1 from x = 1 on, with zero slope there (Bridson)
function ramp(x: number) {
  if (x >= 1) return 1
  if (x <= -1) return -1
  return (15 / 8) * x - (10 / 8) * x ** 3 + (3 / 8) * x ** 5
}

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
let cx = 0
let cy = 0
let scale = 1 // css px per logo unit
let L = 100 // the ramp's reach around the body, css px
let LS = 12 // the wall circulation's reach, css px
let CIRC = 6 // its strength
let noiseScale = 120

// the turbulence changes slowly, so it is sampled on a coarse grid once a frame
const NCELL = 24
let nw = 0
let nh = 0
let noiseGrid = new Float32Array(0)
let time = 0
function refreshNoise() {
  if (noiseGrid.length !== nw * nh) noiseGrid = new Float32Array(nw * nh)
  for (let j = 0; j < nh; j++)
    for (let i = 0; i < nw; i++) noiseGrid[j * nw + i] = vnoise((i * NCELL) / noiseScale - time * 0.25, (j * NCELL) / noiseScale, time * 0.08)
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

// the colour field: coarse cells, drawn smoothly scaled up
const FCELL = 5
let fw = 0
let fh = 0
const fieldCanvas = document.createElement('canvas')
const fctx = fieldCanvas.getContext('2d')!
let fieldImg = fctx.createImageData(1, 1)

function resize() {
  w = window.innerWidth
  h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  cx = w / 2
  cy = h / 2
  const side = Math.min(w <= 768 ? 0.62 * w : 0.34 * w, 0.52 * h)
  scale = side / 516
  L = side * 0.55
  LS = 13 * scale
  CIRC = (LS / 1.875) * 0.9
  noiseScale = side * 0.45
  nw = Math.ceil(w / NCELL) + 2
  nh = Math.ceil(h / NCELL) + 2
  refreshNoise()
  fw = Math.ceil(w / FCELL) + 1
  fh = Math.ceil(h / FCELL) + 1
  fieldCanvas.width = fw
  fieldCanvas.height = fh
  fieldImg = fctx.createImageData(fw, fh)
  seedAll()
}

// --- the body's turn --------------------------------------------------------------------------------------------
const turn = { a: 0.18, v: 0 } // radians, radians per second
let cosA = 1
let sinA = 0

function markDist(x: number, y: number) {
  const dx = x - cx
  const dy = y - cy
  // into the body's frame: turn back by its angle
  const u = (cosA * dx + sinA * dy) / scale
  const v = (-sinA * dx + cosA * dy) / scale
  return bodyDist(u, v) * scale
}

// --- the wind -------------------------------------------------------------------------------------------------
const SPEED = 60 // css px per second in the free stream
function psi(x: number, y: number) {
  const d = markDist(x, y)
  const free = y - cy + noiseScale * 0.05 * noiseAt(x, y)
  return free * ramp(d / L) + CIRC * ramp(d / LS)
}
function velocity(x: number, y: number, out: number[]) {
  const e = 1.5
  out[0] = ((psi(x, y + e) - psi(x, y - e)) / (2 * e)) * SPEED
  out[1] = (-(psi(x + e, y) - psi(x - e, y)) / (2 * e)) * SPEED
}

// --- colour ------------------------------------------------------------------------------------------------------
// the rainbow of flow plots (jet), a touch softened
function jet(x: number, out: number[]) {
  const c = (v: number) => Math.max(0, Math.min(1, v))
  out[0] = c(1.5 - Math.abs(4 * x - 3))
  out[1] = c(1.5 - Math.abs(4 * x - 2))
  out[2] = c(1.5 - Math.abs(4 * x - 1))
}
const MODES = ['pressure', 'speed', 'lines'] as const
let mode = 0

function colourOf(speed: number, out: number[]) {
  const s = speed / SPEED
  if (MODES[mode] === 'pressure') {
    const cp = 1 - s * s
    // free stream (Cp 0) sits at cyan-blue; stagnation (Cp 1) is red; fast air sinks to deep blue
    jet(cp >= 0 ? 0.32 + 0.68 * cp : 0.32 / (1 - cp * 0.5), out)
  } else jet(Math.min(1, 0.36 * s), out) // still air deep blue, the free stream cyan, fast air red
}

const vv = [0, 0]
const col = [0, 0, 0]
function computeField() {
  const fb = fieldImg.data
  for (let j = 0; j < fh; j++) {
    for (let i = 0; i < fw; i++) {
      const x = i * FCELL
      const y = j * FCELL
      const o = (j * fw + i) * 4
      velocity(x, y, vv)
      colourOf(Math.hypot(vv[0], vv[1]), col)
      fb[o] = col[0] * 255
      fb[o + 1] = col[1] * 255
      fb[o + 2] = col[2] * 255
      fb[o + 3] = 255
    }
  }
  fctx.putImageData(fieldImg, 0, 0)
}

// --- streamlines -----------------------------------------------------------------------------------------------
const TRAIL = 80
const EVERY = 2
let N = 0
let px = new Float32Array(0)
let py = new Float32Array(0)
let age = new Float32Array(0)
let life = new Float32Array(0)
let count = new Uint16Array(0)
let trail = new Float32Array(0)
let slot = 0

function seed(k: number, anywhere: boolean) {
  for (let tries = 0; tries < 20; tries++) {
    // new air mostly comes in from the left edge, some anywhere (for the eddies in the counters)
    const x = anywhere || Math.random() < 0.35 ? Math.random() * w : Math.random() * 40 - 20
    const y = Math.random() * h
    if (markDist(x, y) > 1.5) {
      px[k] = x
      py[k] = y
      break
    }
  }
  age[k] = 0
  life[k] = 6 + Math.random() * 10
  count[k] = 0
}
function seedAll() {
  N = Math.min(2200, Math.round((w * h) / 520))
  px = new Float32Array(N)
  py = new Float32Array(N)
  age = new Float32Array(N)
  life = new Float32Array(N)
  count = new Uint16Array(N)
  trail = new Float32Array(N * TRAIL * 2)
  for (let k = 0; k < N; k++) {
    seed(k, true)
    age[k] = Math.random() * life[k]
  }
}

const v2 = [0, 0]
function step(dt: number) {
  for (let k = 0; k < N; k++) {
    age[k] += dt
    const x = px[k]
    const y = py[k]
    velocity(x, y, vv)
    velocity(x + vv[0] * dt * 0.5, y + vv[1] * dt * 0.5, v2)
    const nx = x + v2[0] * dt
    const ny = y + v2[1] * dt
    if (age[k] > life[k] || nx < -30 || nx > w + 20 || ny < -20 || ny > h + 20 || markDist(nx, ny) < 0) seed(k, false)
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

// --- drawing -------------------------------------------------------------------------------------------------
function bodyPath() {
  const p = new Path2D()
  for (const b of bars) {
    const ax = b.ux * b.hl
    const ay = b.uy * b.hl
    const nx = -b.uy * HW
    const ny = b.ux * HW
    p.moveTo(b.cx - ax - nx, b.cy - ay - ny)
    p.lineTo(b.cx + ax - nx, b.cy + ay - ny)
    p.lineTo(b.cx + ax + nx, b.cy + ay + ny)
    p.lineTo(b.cx - ax + nx, b.cy - ay + ny)
    p.closePath()
  }
  return p
}
const BODY = bodyPath()

function draw() {
  const lines = MODES[mode] === 'lines'
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  if (lines) {
    ctx.fillStyle = '#f4f3ef'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(fieldCanvas, 0, 0, fw * FCELL * dpr, fh * FCELL * dpr)
  }
  // the body: a plain model with its exact outline — white in the coloured views, black on paper
  ctx.setTransform(dpr * scale * cosA, dpr * scale * sinA, -dpr * scale * sinA, dpr * scale * cosA, cx * dpr, cy * dpr)
  ctx.fillStyle = lines ? '#0b0b0b' : '#f4f3ef'
  ctx.fill(BODY, 'nonzero')

  // streamlines: fine black threads, fading in when born and out before they go
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = lines ? 0.7 : 0.6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const LEVELS = lines ? [0.2, 0.45, 0.75] : [0.15, 0.35, 0.6]
  for (let lv = 0; lv < LEVELS.length; lv++) {
    ctx.globalAlpha = LEVELS[lv]
    ctx.beginPath()
    for (let k = 0; k < N; k++) {
      const n = count[k]
      if (n < 2) continue
      const f = Math.min(age[k] / 0.8, (life[k] - age[k]) / 0.8, 1)
      if ((f < 0.34 ? 0 : f < 0.67 ? 1 : 2) !== lv) continue
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

// --- input: a swipe turns the body, a tap changes the view -----------------------------------------------------
let down: { x: number; y: number } | null = null
let drag: { x: number; y: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY }
  drag = { x: e.clientX, y: e.clientY, t: performance.now() }
  turn.v = 0
  canvas.setPointerCapture(e.pointerId)
})
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return
  const now = performance.now()
  // turning about the body's middle: the swipe's sweep around it, like turning a wheel
  const a0 = Math.atan2(drag.y - cy, drag.x - cx)
  const a1 = Math.atan2(e.clientY - cy, e.clientX - cx)
  let da = a1 - a0
  if (da > Math.PI) da -= Math.PI * 2
  if (da < -Math.PI) da += Math.PI * 2
  // close to the middle the angle jumps: there, a sideways swipe turns it instead
  const r = Math.hypot(e.clientX - cx, e.clientY - cy)
  if (r < 40) da = (e.clientX - drag.x) * 0.01
  turn.a += da
  const dt = Math.max(0.008, (now - drag.t) / 1000)
  turn.v = turn.v * 0.5 + (da / dt) * 0.5
  drag = { x: e.clientX, y: e.clientY, t: now }
})
function release(e: PointerEvent) {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
    mode = (mode + 1) % MODES.length
    turn.v = 0
  }
  if (drag && performance.now() - drag.t > 80) turn.v = 0
  down = null
  drag = null
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)

// --- loop ------------------------------------------------------------------------------------------------------
let last = performance.now()
let frameNo = 0
let fieldAt = { a: NaN, frame: -99, mode: -1 }
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  time += dt
  if (!drag) {
    turn.a += turn.v * dt
    turn.v *= Math.exp(-dt / 1.0)
  }
  cosA = Math.cos(turn.a)
  sinA = Math.sin(turn.a)
  refreshNoise()
  step(dt)
  if (++frameNo % EVERY === 0) record()
  // the colour field: whenever the body turns, else a few times a second for the drifting turbulence
  if (MODES[mode] !== 'lines' && (turn.a !== fieldAt.a || frameNo - fieldAt.frame >= 6 || mode !== fieldAt.mode)) {
    computeField()
    fieldAt = { a: turn.a, frame: frameNo, mode }
  }
  draw()
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
