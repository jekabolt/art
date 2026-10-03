// STEREOGRAM: a field of random dots that hides the logo in depth — a single-image random-dot
// stereogram (the symmetric algorithm of Thimbleby, Inglis and Witten, with hidden-surface removal,
// so there are no streaks or echoes). Every row repeats itself with a period a little shorter
// wherever the mark stands higher; look through the screen (eyes parallel, as at something far behind it) until the two
// marks at the top become three, and the logo rises out of the dots, its strokes floating above
// the ground. Drag up or down to lift it higher or let it sink; a tap throws new dots.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './stereo.css'

const LOOK = {
  dot: 2, // css px per dot
  period: 0.07, // the repeat at the ground, a share of the screen's longer side (≈ eye separation on a phone held near)
  depth: 0.33, // depth of field: how far the strokes stand out of the ground (0..~0.45)
  mark: 0.62, // logo width, share of the shorter side
  ink: [17, 17, 17],
  paper: [246, 243, 234],
}

const canvas = document.getElementById('stereo') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let depth = LOOK.depth
let seed = 1

function rand(s: number) {
  // small fast PRNG (mulberry32)
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The depth map: the mark's strokes, softened at the edges so the rise has a slope. */
function heights(w: number, h: number): Float32Array {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d', { willReadFrequently: true })!
  const side = Math.min(w, h) * LOOK.mark
  x.filter = `blur(${side * 0.006}px)`
  x.translate((w - side) / 2, (h - side) / 2)
  x.scale(side / LOGO_SPAN, side / LOGO_SPAN)
  x.translate(-LOGO_MIN, -LOGO_MIN)
  x.lineWidth = LOGO_STROKE
  x.stroke(new Path2D(LOGO_PATH))
  const d = x.getImageData(0, 0, w, h).data
  const out = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) out[i] = d[i * 4 + 3] / 255
  return out
}

function render() {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(innerWidth * dpr)
  canvas.height = Math.round(innerHeight * dpr)
  const cell = Math.max(1, Math.round(LOOK.dot * dpr))
  const w = Math.ceil(canvas.width / cell)
  const h = Math.ceil(canvas.height / cell)
  const z = heights(w, h)
  const P = Math.round(Math.max(w, h) * LOOK.period) // dots: the repeat at the ground
  const E = P * 2 // eye separation, in dots (the ground sits at separation E / 2)
  const mu = depth // depth of field, a share of the distance to the ground
  const sep = (zz: number) => Math.round(((1 - mu * zz) * E) / (2 - mu * zz))
  const img = new ImageData(w, h)
  const r = rand(seed)
  const row = new Uint8Array(w)
  const same = new Int32Array(w)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) same[x] = x
    for (let x = 0; x < w; x++) {
      const zz = z[y * w + x]
      const s = sep(zz)
      let left = x - (s >> 1)
      let right = left + s
      if (left < 0 || right >= w) continue
      // hidden-surface removal: skip the link if something nearer blocks either eye's view
      let visible = true
      for (let t = 1; visible; t++) {
        const zt = zz + (2 * (2 - mu * zz) * t) / (mu * E)
        if (zt > 1) break
        const a = z[y * w + x - t]
        const b = z[y * w + x + t]
        if ((x - t >= 0 && a >= zt) || (x + t < w && b >= zt)) visible = false
      }
      if (!visible) continue
      // join the two points, following chains already made
      let k = same[left]
      while (k !== left && k !== right) {
        if (k < right) {
          left = k
          k = same[left]
        } else {
          same[left] = right
          left = right
          k = same[left]
          right = k
        }
      }
      same[left] = right
    }
    for (let x = w - 1; x >= 0; x--) row[x] = same[x] === x ? (r() < 0.5 ? 1 : 0) : row[same[x]]
    for (let x = 0; x < w; x++) {
      const c = row[x] ? LOOK.ink : LOOK.paper
      const k = (y * w + x) * 4
      img.data[k] = c[0]
      img.data[k + 1] = c[1]
      img.data[k + 2] = c[2]
      img.data[k + 3] = 255
    }
  }
  // draw small, scale up hard-edged
  const small = document.createElement('canvas')
  small.width = w
  small.height = h
  small.getContext('2d')!.putImageData(img, 0, 0)
  g.imageSmoothingEnabled = false
  g.drawImage(small, 0, 0, w * cell, h * cell)
  // the two convergence marks: one period apart, above the field
  const cx = canvas.width / 2
  const y0 = Math.min(canvas.height * 0.08, 48 * dpr)
  const half = (sep(0) * cell) / 2
  g.fillStyle = `rgb(${LOOK.paper.join(',')})`
  g.fillRect(cx - half - 14 * dpr, y0 - 12 * dpr, half * 2 + 28 * dpr, 24 * dpr)
  g.fillStyle = `rgb(${LOOK.ink.join(',')})`
  for (const x of [cx - half, cx + half]) {
    g.beginPath()
    g.arc(x, y0, 5 * dpr, 0, Math.PI * 2)
    g.fill()
  }
}

let queued = false
const later = () => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    render()
  })
}
addEventListener('resize', later)

let press: { x: number; y: number; t: number; d: number } | null = null
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId)
  press = { x: e.clientX, y: e.clientY, t: performance.now(), d: depth }
})
canvas.addEventListener('pointermove', (e) => {
  if (!press) return
  const nd = Math.max(0.1, Math.min(0.45, press.d + (press.y - e.clientY) * 0.0012))
  if (Math.abs(nd - depth) > 0.004) {
    depth = nd
    later()
  }
})
canvas.addEventListener('pointerup', (e) => {
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10 && performance.now() - press.t < 350) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    haptic(8)
    later()
  }
  press = null
})
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

render()
