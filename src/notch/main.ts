// NOTCH: a square of ultramarine discs on paper, each with a narrow wedge cut out of it. In every
// two-by-two block the four notches face the block's shared corner, so a small white star opens
// there; inside the logo's strokes the discs are whole, so the mark stands as solid blue in the
// field of stars (?mode=flip: the notches turn the other way instead and the stars shift lattice).
// The notches turn after a finger like a field of little compasses; a tap sends a wave out from it
// and every disc it passes spins round once before it settles back.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './notch.css'

const MODE = new URLSearchParams(location.search).get('mode') === 'flip' ? 'flip' : 'whole'

const LOOK = {
  n: 40, // discs across
  art: 0.95, // the square's width, a share of the screen's shorter side
  margin: 0.025, // the paper border inside the square
  radius: 0.47, // a disc, cells
  notch: 1.0, // the wedge's opening, radians
  blue: '#1638d0',
  paper: '#efece4',
  reach: 6, // cells round the finger the notches turn to it
  wave: 26, // cells per second
}

const canvas = document.getElementById('notch') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let dpr = 1
let W = 0
let H = 0
let cell = 1
let ox = 0
let oy = 0

const N = LOOK.n
const rest = new Float32Array(N * N) // the notch's angle at rest
const open = new Float32Array(N * N) // how wide the notch is (whole mode closes it in the mark)
const ang = new Float32Array(N * N)
const vel = new Float32Array(N * N)
const spun = new Float32Array(N * N) // when the last wave passed this disc
const flash = new Float32Array(N * N) // the wave opens every notch for a moment, the mark's too

// the logo sampled at the disc centres
{
  const s = N * 8
  const c = document.createElement('canvas')
  c.width = c.height = s
  const x = c.getContext('2d', { willReadFrequently: true })!
  const inner = s * (1 - 2 / N) // a disc of border round the mark
  x.translate((s - inner) / 2, (s - inner) / 2)
  x.scale(inner / LOGO_SPAN, inner / LOGO_SPAN)
  x.translate(-LOGO_MIN, -LOGO_MIN)
  x.lineWidth = LOGO_STROKE
  x.stroke(new Path2D(LOGO_PATH))
  const d = x.getImageData(0, 0, s, s).data
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const inside = d[((j * 8 + 4) * s + i * 8 + 4) * 4 + 3] > 127
      // towards the block's shared corner: the diagonal of where it sits in its 2x2 block
      const dx = i % 2 === 0 ? 1 : -1
      const dy = j % 2 === 0 ? 1 : -1
      let a = Math.atan2(dy, dx)
      if (inside && MODE === 'flip') a += Math.PI
      const k = j * N + i
      rest[k] = a
      ang[k] = a
      open[k] = inside && MODE === 'whole' ? 0 : 1
      spun[k] = -1
    }
  }
}

// gouache: a mottled grain laid over the blue only
const grain = document.createElement('canvas')
{
  grain.width = grain.height = 256
  const x = grain.getContext('2d')!
  const img = x.createImageData(256, 256)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  x.putImageData(img, 0, 0)
}
let grainPattern: CanvasPattern | null = null

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const art = Math.min(W, H) * LOOK.art
  const inner = art * (1 - 2 * LOOK.margin)
  cell = inner / N
  ox = (W - inner) / 2
  oy = (H - inner) / 2
  grainPattern = g.createPattern(grain, 'repeat')
}
addEventListener('resize', resize)
resize()

// --- input: the finger as a magnet for the notches, a tap as a wave -------------------------------------
let finger: { x: number; y: number } | null = null
let press: { id: number; x: number; y: number; t: number } | null = null
let wave: { x: number; y: number; t: number } | null = null
const toCell = (e: PointerEvent) => ({ x: (e.clientX - ox) / cell - 0.5, y: (e.clientY - oy) / cell - 0.5 })
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
  finger = toCell(e)
})
canvas.addEventListener('pointermove', (e) => {
  if ((press && e.pointerId === press.id) || e.pointerType === 'mouse') finger = toCell(e)
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 300
  press = null
  if (e.pointerType !== 'mouse') finger = null
  if (tap) {
    wave = { ...toCell(e), t: performance.now() }
    haptic([14, 40, 10])
  }
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
canvas.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse') finger = null
})
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// --- frame ------------------------------------------------------------------------------------------
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const waveR = wave ? ((now - wave.t) / 1000) * LOOK.wave : -1
  if (wave && waveR > N * 1.6) wave = null

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i
      let target = rest[k]
      if (finger) {
        const dx = finger.x - i
        const dy = finger.y - j
        const d = Math.hypot(dx, dy)
        const f = Math.max(0, 1 - d / LOOK.reach)
        if (f > 0) target = rest[k] + wrap(Math.atan2(dy, dx) - rest[k]) * Math.min(1, f * 1.6)
      }
      // the wave: a full turn, given once as it passes
      if (wave && spun[k] !== wave.t && Math.hypot(i - wave.x, j - wave.y) < waveR) {
        spun[k] = wave.t
        vel[k] += 2 * Math.PI * 4.2
        flash[k] = 1
      }
      flash[k] *= Math.exp(-dt * 2.5)
      vel[k] += wrap(target - ang[k]) * 90 * dt
      vel[k] *= Math.exp(-dt * 7)
      ang[k] += vel[k] * dt
    }
  }

  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.fillStyle = LOOK.paper
  g.fillRect(0, 0, W, H)
  const r = cell * LOOK.radius
  const discs = new Path2D()
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i
      const cx = ox + (i + 0.5) * cell
      const cy = oy + (j + 0.5) * cell
      const w = (LOOK.notch * Math.max(open[k], flash[k])) / 2
      if (w < 0.01) {
        discs.moveTo(cx + r, cy)
        discs.arc(cx, cy, r, 0, Math.PI * 2)
      } else {
        const a = ang[k]
        discs.moveTo(cx, cy)
        discs.arc(cx, cy, r, a + w, a - w + Math.PI * 2)
        discs.closePath()
      }
    }
  }
  g.fillStyle = LOOK.blue
  g.fill(discs)
  // the paint's grain, on the blue only
  if (grainPattern) {
    g.save()
    g.globalCompositeOperation = 'source-atop'
    g.globalAlpha = 0.07
    g.fillStyle = grainPattern
    g.fillRect(0, 0, W, H)
    g.restore()
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
