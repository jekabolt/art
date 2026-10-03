// HATCH: a cube drawn the way a pen plotter draws it — every face a stack of parallel ink lines on
// textured paper. On the front face the hatching stops at the logo's strokes, so the mark is cut
// clean out of the lines.
// A finger tears the hatching wherever it passes — solid lines too — and blows the dashes away from
// it; they drift back and join up into lines again, slowly. A tap is a gust: the whole drawing
// scatters and reassembles round the cut-out mark.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './hatch.css'

const LOOK = {
  size: 0.3, // the cube's half-edge, a share of the screen's shorter side
  lines: Math.min(innerWidth, innerHeight) < 600 ? 44 : 64, // hatch lines across a face
  dash: 0.032, // a dash, in half-edges
  logo: 0.84, // the logo's width on the front face, a share of the face
  yaw: -0.62, // rest pose, radians
  pitch: 0.48,
  ink: '#151515',
  paper: '#f1eee6',
  reach: 70, // css px: how far round the finger the hatching tears
}

// --- the logo on the front face: inside, and how deep inside (for how far the dashes stray) ------------------
const MS = 512
const inside = new Uint8Array(MS * MS)
const depth = new Float32Array(MS * MS)
{
  const c = document.createElement('canvas')
  c.width = c.height = MS
  const x = c.getContext('2d', { willReadFrequently: true })!
  const draw = (blur: number) => {
    x.clearRect(0, 0, MS, MS)
    x.save()
    x.filter = blur ? `blur(${blur}px)` : 'none'
    const s = MS * LOOK.logo
    x.translate((MS - s) / 2, (MS - s) / 2)
    x.scale(s / LOGO_SPAN, s / LOGO_SPAN)
    x.translate(-LOGO_MIN, -LOGO_MIN)
    x.lineWidth = LOGO_STROKE
    x.stroke(new Path2D(LOGO_PATH))
    x.restore()
    return x.getImageData(0, 0, MS, MS).data
  }
  const sharp = draw(0)
  const soft = draw(MS * LOOK.logo * (LOGO_STROKE / LOGO_SPAN) * 0.3)
  for (let i = 0; i < MS * MS; i++) {
    inside[i] = sharp[i * 4 + 3] > 127 ? 1 : 0
    depth[i] = Math.max(0, Math.min(1, (soft[i * 4 + 3] / 255 - 0.5) * 2.2))
  }
}
// face coords u, v in -1..1 (v up) → the mask
const maskAt = (u: number, v: number) => {
  const i = Math.floor(((u + 1) / 2) * MS)
  const j = Math.floor(((1 - v) / 2) * MS)
  return i < 0 || j < 0 || i >= MS || j >= MS ? -1 : j * MS + i
}

// --- the dashes: every hatch line cut into short pieces that sit end to end ---------------------------------
type Face = { n: [number, number, number]; first: number; count: number }
const faces: Face[] = []
const cx: number[] = []
const cy: number[] = []
const cz: number[] = []
const dx: number[] = []
const dy: number[] = []
const dz: number[] = []
const base: number[] = [] // how loose it is at rest (1 in the logo)
const amp: number[] = [] // how far it strays when loose, half-edges
const rnd: number[] = []
const step = 2 / LOOK.lines
// a face: origin o, the line direction a, the stacking direction b (both spanning -1..1), normal n
function face(o: number[], a: number[], b: number[], n: [number, number, number], logo: boolean) {
  const first = cx.length
  for (let li = 0; li < LOOK.lines; li++) {
    const t = -1 + (li + 0.5) * step
    const pieces = Math.round(2 / LOOK.dash)
    for (let k = 0; k < pieces; k++) {
      const s = -1 + ((k + 0.5) / pieces) * 2
      let loose = 0
      let a0 = 0
      if (logo) {
        const m = maskAt(s, t)
        if (m >= 0 && inside[m]) continue // the logo is cut clean out of the hatching
      }
      cx.push(o[0] + a[0] * s + b[0] * t)
      cy.push(o[1] + a[1] * s + b[1] * t)
      cz.push(o[2] + a[2] * s + b[2] * t)
      dx.push(a[0])
      dy.push(a[1])
      dz.push(a[2])
      base.push(loose)
      amp.push(a0)
      rnd.push(Math.random())
    }
  }
  faces.push({ n, first, count: cx.length - first })
}
// front (+z) carries the logo; the sides are stacked horizontals, the top runs front to back
face([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1], true)
face([1, 0, 0], [0, 0, -1], [0, 1, 0], [1, 0, 0], false)
face([-1, 0, 0], [0, 0, 1], [0, 1, 0], [-1, 0, 0], false)
face([0, 0, -1], [-1, 0, 0], [0, 1, 0], [0, 0, -1], false)
face([0, 1, 0], [1, 0, 0], [0, 0, -1], [0, 1, 0], false)

const COUNT = cx.length
const tear = new Float32Array(COUNT) // looseness given by the finger or a gust, fading
const px = new Float32Array(COUNT) // how far it has been blown, css px
const py = new Float32Array(COUNT)
const spin = new Float32Array(COUNT) // … and turned
// a stable random angle and sway per dash
const ang0 = new Float32Array(COUNT)
for (let i = 0; i < COUNT; i++) ang0[i] = (rnd[i] - 0.5) * 2.4

// --- the paper: cold-pressed, a soft mottle and a fine tooth -------------------------------------------------
const paper = document.createElement('canvas')
function makePaper(w: number, h: number) {
  paper.width = w
  paper.height = h
  const g = paper.getContext('2d')!
  g.fillStyle = LOOK.paper
  g.fillRect(0, 0, w, h)
  const img = g.getImageData(0, 0, w, h)
  const d = img.data
  // tooth: noise lit from the upper left (a pixel minus its lower-right neighbour)
  const n = new Float32Array(w * h)
  for (let i = 0; i < n.length; i++) n[i] = Math.random()
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x
      const k = (n[i] - n[i + w + 1]) * 9 + (Math.random() - 0.5) * 4
      d[i * 4] += k
      d[i * 4 + 1] += k
      d[i * 4 + 2] += k
    }
  }
  g.putImageData(img, 0, 0)
  // mottle
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = (0.05 + Math.random() * 0.15) * Math.max(w, h)
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    const c = Math.random() < 0.5 ? '255,255,255' : '120,110,90'
    grd.addColorStop(0, `rgba(${c},0.05)`)
    grd.addColorStop(1, `rgba(${c},0)`)
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
  }
}

const canvas = document.getElementById('hatch') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let dpr = 1
let W = 0
let H = 0
let scale = 1
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2)
  W = innerWidth
  H = innerHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  scale = Math.min(W, H) * LOOK.size
  makePaper(canvas.width, canvas.height)
}
addEventListener('resize', resize)
resize()

// --- input ----------------------------------------------------------------------------------------------
let finger: { x: number; y: number; vx: number; vy: number } | null = null
let press: { id: number; x: number; y: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }
  finger = { x: e.clientX, y: e.clientY, vx: 0, vy: 0 }
})
canvas.addEventListener('pointermove', (e) => {
  if (!press || e.pointerId !== press.id || !finger) return
  finger.vx = e.clientX - finger.x
  finger.vy = e.clientY - finger.y
  finger.x = e.clientX
  finger.y = e.clientY
})
const up = (e: PointerEvent) => {
  if (!press || e.pointerId !== press.id) return
  const tap = e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 300
  press = null
  finger = null
  if (tap) gust(e.clientX, e.clientY)
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

let gustAt = -1
let gustFrom = { x: 0, y: 0 }
function gust(x: number, y: number) {
  gustAt = performance.now()
  gustFrom = { x, y }
  haptic([20, 50, 12, 50, 8])
}

// --- frame ------------------------------------------------------------------------------------------------
const sx = new Float32Array(COUNT) // projected rest centre, css px
const sy = new Float32Array(COUNT)
let last = performance.now()
const t0 = last
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const t = (now - t0) / 1000

  // pose: the rest pose with a slow breath
  const yaw = LOOK.yaw + Math.sin(t * 0.21) * 0.05
  const pitch = LOOK.pitch + Math.sin(t * 0.17 + 1) * 0.03
  const cyw = Math.cos(yaw)
  const syw = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  // rotate about y (yaw), then x (pitch); screen y is down
  const rot = (x: number, y: number, z: number, out: number[]) => {
    const x1 = x * cyw + z * syw
    const z1 = -x * syw + z * cyw
    out[0] = x1
    out[1] = y * cp - z1 * sp
    out[2] = y * sp + z1 * cp
  }
  const v = [0, 0, 0]
  const ox = W / 2
  const oy = H / 2 + scale * 0.12

  // the gust: a ring running out from the tap, tearing everything it crosses
  const gustR = gustAt >= 0 ? ((now - gustAt) / 1000) * 1400 : -1
  if (gustR > Math.hypot(W, H)) gustAt = -1

  g.setTransform(1, 0, 0, 1, 0, 0)
  g.drawImage(paper, 0, 0)
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  const solid = new Path2D()
  const loose = new Path2D()
  const fade = Math.exp(-dt * 0.55) // torn hatching knits back up slowly
  const reach2 = LOOK.reach * LOOK.reach

  for (const f of faces) {
    rot(f.n[0], f.n[1], f.n[2], v)
    if (v[2] < 0.02) continue // facing away
    const end = f.first + f.count
    for (let i = f.first; i < end; i++) {
      rot(cx[i], cy[i], cz[i], v)
      const X = ox + v[0] * scale
      const Y = oy - v[1] * scale
      sx[i] = X
      sy[i] = Y
      rot(dx[i], dy[i], dz[i], v)
      let ux = v[0]
      let uy = -v[1]

      // the finger tears what is under it and blows it along its stroke and out from it
      if (finger) {
        const ex = X - finger.x
        const ey = Y - finger.y
        const d2 = ex * ex + ey * ey
        if (d2 < reach2) {
          const d = Math.sqrt(d2) + 1e-3
          const k = 1 - d / LOOK.reach
          tear[i] = Math.max(tear[i], k)
          px[i] += ((ex / d) * 40 * dt + finger.vx * 0.5) * k
          py[i] += ((ey / d) * 40 * dt + finger.vy * 0.5) * k
          spin[i] += (rnd[i] - 0.5) * 6 * k * dt
        }
      }
      if (gustR > 0 && tear[i] < 0.99) {
        const ex = X - gustFrom.x
        const ey = Y - gustFrom.y
        const d = Math.hypot(ex, ey) + 1e-3
        if (d < gustR && d > gustR - 120) {
          tear[i] = 1
          const k = 18 + rnd[i] * 30
          px[i] += (ex / d) * k
          py[i] += (ey / d) * k - 6
          spin[i] += (rnd[i] - 0.5) * 3
        }
      }
      tear[i] *= fade
      px[i] *= fade
      py[i] *= fade
      spin[i] *= fade

      const L = Math.max(base[i], tear[i])
      const half = (LOOK.dash / 2) * scale * 1.04
      if (L < 0.015) {
        solid.moveTo(X - ux * half, Y - uy * half)
        solid.lineTo(X + ux * half, Y + uy * half)
        continue
      }
      // loose: slipped, turned and stirring; torn hatching strays further than the logo's
      const r = rnd[i]
      const a = base[i] * (Math.PI / 2) * (1 - tear[i]) + (ang0[i] + Math.sin(t * (0.4 + r) + r * 40) * 0.25) * tear[i] + spin[i] // the logo's ticks stand upright
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const nx = ux * ca - uy * sa
      const ny = ux * sa + uy * ca
      ux = nx
      uy = ny
      const stray = 0.05 * tear[i] * scale
      const sway = t * (0.15 + r * 0.3) + r * 90
      const X2 = X + Math.cos(sway) * stray + px[i]
      const Y2 = Y + Math.sin(sway * 1.3) * stray + py[i]
      const h = half * (base[i] ? 0.5 : 0.62 + 0.12 * r) * (1 + 0.6 * tear[i])
      loose.moveTo(X2 - ux * h, Y2 - uy * h)
      loose.lineTo(X2 + ux * h, Y2 + uy * h)
    }
  }
  g.strokeStyle = LOOK.ink
  g.lineCap = 'butt'
  g.lineWidth = 1
  g.globalAlpha = 0.9
  g.stroke(solid)
  g.lineWidth = 1.15
  g.lineCap = 'round'
  g.stroke(loose)
  g.globalAlpha = 1
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
