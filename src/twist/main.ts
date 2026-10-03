// TWIST: the logo set large on paper and cut into concentric rings that are each turned round the
// same centre — the inner ones furthest — so its strokes break at every ring's edge and wind into a
// vortex, the way a 1970s cover cut a repeated word into rings.
// Drag sideways to wind the twist up or back; the rings follow one after another, the inner ones
// first. A tap moves the centre of the vortex to where you touched.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './twist.css'

const LOOK = {
  mark: 0.82, // the logo's width, a share of the shorter side
  rings: 11,
  reach: 0.6, // the outer ring's radius, a share of the shorter side
  ink: '#0d0d0d',
  paper: '#ecebe7',
  rest: 0.3, // the twist at rest, radians at the centre
}

const canvas = document.getElementById('twist') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let dpr = 1
let W = 0
let H = 0
const field = document.createElement('canvas') // the page of logos, big enough to turn under the screen
let F = 0

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  F = Math.ceil(Math.hypot(W, H) * 1.05)
  field.width = field.height = Math.round(F * dpr)
  const x = field.getContext('2d')!
  x.setTransform(dpr, 0, 0, dpr, 0, 0)
  x.fillStyle = LOOK.paper
  x.fillRect(0, 0, F, F)
  // one logo, square in the middle of the screen at rest
  const s = Math.min(W, H) * LOOK.mark
  x.strokeStyle = LOOK.ink
  x.translate(F / 2 - s / 2, F / 2 - s / 2)
  x.scale(s / LOGO_SPAN, s / LOGO_SPAN)
  x.translate(-LOGO_MIN, -LOGO_MIN)
  x.lineWidth = LOGO_STROKE
  x.stroke(new Path2D(LOGO_PATH))
  if (!centre) centre = { x: W * 0.5, y: H * 0.5 }
}

let centre: { x: number; y: number } | null = null
let goalCentre = { x: 0, y: 0 }
const angle = new Float32Array(LOOK.rings) // each ring's turn now
const speed = new Float32Array(LOOK.rings)
let wind = LOOK.rest // the twist asked for at the centre

addEventListener('resize', resize)
resize()
goalCentre = { ...centre! }

// --- input ----------------------------------------------------------------------------------------------
let press: { id: number; x: number; y: number; sx: number; sy: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }
})
canvas.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id) return
  wind += ((e.clientX - press.x) / Math.min(W, H)) * 4
  press.x = e.clientX
  press.y = e.clientY
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < 10 && performance.now() - press.t < 300
  press = null
  if (tap) {
    goalCentre = { x: e.clientX, y: e.clientY }
    haptic([10, 40, 10])
  }
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// --- frame ----------------------------------------------------------------------------------------------
let last = performance.now()
const t0 = last
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const t = (now - t0) / 1000
  const c = centre!
  c.x += (goalCentre.x - c.x) * Math.min(1, dt * 5)
  c.y += (goalCentre.y - c.y) * Math.min(1, dt * 5)

  const K = LOOK.rings
  for (let k = 0; k < K; k++) {
    // the inner rings turn furthest; each follows on a spring of its own, the outer ones slower
    const share = Math.pow(1 - k / K, 1.4)
    const breath = Math.sin(t * 0.4 - k * 0.35) * 0.04
    const target = wind * share + breath
    speed[k] += (target - angle[k]) * (60 - k * 4.5) * dt
    speed[k] *= Math.exp(-dt * 5)
    angle[k] += speed[k] * dt
  }

  g.setTransform(1, 0, 0, 1, 0, 0)
  // the page at rest, then each ring from the outside in, cut out and turned
  const off = (F - W) / 2
  const offY = (F - H) / 2
  g.drawImage(field, -off * dpr, -offY * dpr)
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  const R = Math.min(W, H) * LOOK.reach
  for (let k = K - 1; k >= 0; k--) {
    const r1 = (R * (k + 1)) / K
    g.save()
    g.beginPath()
    g.arc(c.x, c.y, r1, 0, Math.PI * 2)
    g.clip()
    g.translate(c.x, c.y)
    g.rotate(angle[k])
    g.translate(-c.x, -c.y)
    g.drawImage(field, -off, -offY, F, F)
    g.restore()
  }
  // the cuts: a hairline of bare paper along each ring's edge
  g.strokeStyle = LOOK.paper
  g.lineWidth = 1.2
  for (let k = 1; k <= K; k++) {
    g.beginPath()
    g.arc(c.x, c.y, (R * k) / K, 0, Math.PI * 2)
    g.stroke()
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
