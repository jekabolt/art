// WINDOW: the logo as a window in time. The camera, mirrored, black and white at hard contrast;
// inside the logo's strokes it shows now, everywhere else the same camera three seconds ago. Hold
// still and the two agree — there is no logo, just you; move and the mark cuts itself out of the
// difference between you now and you a moment ago. A tap swaps them: the past inside, now outside.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { cameraButton, coverRect } from '../core/camera'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import '../fonts/fonts.css'
import '../core/camera.css'
import './window.css'

const LOOK = {
  delay: 3, // seconds between inside and outside
  markXs: 0.86,
  markLg: 0.5,
  frameW: 480, // the stored frames' width (they are small: three seconds of them sit in memory)
}

const canvas = document.getElementById('window') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let dpr = 1
let logo = new Path2D()
let lineW = 1

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(innerWidth * dpr)
  canvas.height = Math.round(innerHeight * dpr)
  const side = Math.min(canvas.width * (innerWidth <= 768 ? LOOK.markXs : LOOK.markLg), canvas.height * 0.8)
  const k = side / LOGO_SPAN
  const m = new DOMMatrix().translate((canvas.width - side) / 2, (canvas.height - side) / 2).scale(k).translate(-LOGO_MIN, -LOGO_MIN)
  logo = new Path2D()
  logo.addPath(new Path2D(LOGO_PATH), m)
  lineW = LOGO_STROKE * k
}
addEventListener('resize', resize)
resize()

// the past: a ring of small grey frames
let video: HTMLVideoElement | null = null
const ring: { c: HTMLCanvasElement; t: number }[] = []
const grab = document.createElement('canvas')
cameraButton((v) => (video = v), EMBEDDED)

let swapped = false
let press: { x: number; y: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => (press = { x: e.clientX, y: e.clientY, t: performance.now() }))
canvas.addEventListener('pointerup', (e) => {
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 12 && performance.now() - press.t < 350) {
    swapped = !swapped
    haptic(10)
  }
  press = null
})
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

/** A frame of the camera, mirrored, grey and hard, filling w × h. */
function draw(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, w: number, h: number) {
  ctx.save()
  ctx.filter = 'grayscale(1) contrast(2)'
  ctx.translate(w, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, w, h)
  ctx.restore()
}

function frame(now: number) {
  const W = canvas.width
  const H = canvas.height
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  if (video && video.readyState >= 2) {
    // keep the last few seconds, small
    const fw = LOOK.frameW
    const fh = Math.round(fw * (H / W))
    let slot = ring.length && now - ring[0].t > LOOK.delay * 1000 + 200 ? ring.shift()! : null
    if (!slot) slot = { c: document.createElement('canvas'), t: 0 }
    slot.c.width = fw
    slot.c.height = fh
    const [sx, sy, sw, sh] = coverRect(video, fw, fh)
    draw(slot.c.getContext('2d')!, video, sx, sy, sw, sh, fw, fh)
    slot.t = now
    ring.push(slot)
    // the frame closest to `delay` ago
    const want = now - LOOK.delay * 1000
    const past = ring.reduce((a, b) => (Math.abs(b.t - want) < Math.abs(a.t - want) ? b : a)).c
    const [lx, ly, lw, lh] = coverRect(video, W, H)
    const live = () => draw(g, video!, lx, ly, lw, lh, W, H)
    const old = () => g.drawImage(past, 0, 0, W, H)
    ;(swapped ? live : old)()
    g.save()
    g.lineWidth = lineW
    g.lineJoin = 'miter'
    // clip to the strokes: a stroked path has no clip, so draw the inside layer through a mask
    grab.width = W
    grab.height = H
    const m = grab.getContext('2d')!
    m.lineWidth = lineW
    m.stroke(logo)
    m.globalCompositeOperation = 'source-in'
    if (swapped) m.drawImage(past, 0, 0, W, H)
    else draw(m, video, lx, ly, lw, lh, W, H)
    g.drawImage(grab, 0, 0)
    g.restore()
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
