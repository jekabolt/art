// WINDOW: the logo as a window in time, in the slit-scan's dress — the webcam, mirrored, black and
// paper white at double contrast, in a square frame. Inside the logo's strokes the picture is now;
// everywhere else it is the same camera three seconds ago. Hold still and the two agree, there is no
// logo, just you; move and the mark cuts itself out of the difference between you now and you a
// moment ago. A tap on the picture swaps them (the past inside, now outside). The camera starts from
// a button over the frame, and the picture runs as soon as it is allowed — no second tap; the logo
// button saves the frame as a PNG.
import '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import '../fonts/fonts.css'
import '../site.css'
import '../slit/slit.css'
import './window.css'

const W = 600
const H = 600
const CONTRAST = 2
const DELAY = 3 // seconds between inside and outside
/** Paper white, as in the slit-scan: black to a barely warm white instead of pure white. */
const PAPER = [255, 252, 242]
const MARK = 0.82 // the logo's size, a share of the frame's height

const canvas = document.getElementById('scan') as HTMLCanvasElement
const ctx = canvas.getContext('2d', { willReadFrequently: true })!
const statusEl = document.getElementById('status') as HTMLElement
const saveBtn = document.getElementById('save') as HTMLButtonElement
const overlay = document.getElementById('overlay') as HTMLElement
const overlayImg = overlay.querySelector('img') as HTMLImageElement
canvas.width = W
canvas.height = H
ctx.fillStyle = '#000'
ctx.fillRect(0, 0, W, H)

// the logo's strokes as a mask over the frame
const inside = (() => {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d', { willReadFrequently: true })!
  const side = H * MARK
  const k = side / LOGO_SPAN
  g.translate((W - side) / 2, (H - side) / 2)
  g.scale(k, k)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.stroke(new Path2D(LOGO_PATH))
  const d = g.getImageData(0, 0, W, H).data
  const m = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) m[i] = d[i * 4 + 3] // 0..255, antialiased edge
  return m
})()

const startBtn = document.getElementById('start') as HTMLButtonElement
const video = document.createElement('video')
video.muted = true
video.playsInline = true
video.setAttribute('playsinline', '')
// iPhone Safari gives no frames from a video that is not in the page until something is tapped
// again: keep it in the page, invisible
video.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
document.body.appendChild(video)
let stream: MediaStream | null = null
const grab = document.createElement('canvas')
grab.width = W
grab.height = H
const grabCtx = grab.getContext('2d', { willReadFrequently: true })!

// the last few seconds, as grey frames (one byte a pixel keeps three seconds small)
const ring: { grey: Uint8Array; t: number }[] = []
const out = ctx.createImageData(W, H)
let swapped = false

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    video.srcObject = stream
    await video.play()
    startBtn.hidden = true
    statusEl.textContent = 'move — the logo is the difference'
  } catch (err) {
    startBtn.hidden = false
    startBtn.textContent = 'turn on camera'
    statusEl.textContent =
      (err as { name?: string })?.name === 'NotAllowedError'
        ? 'camera not allowed — allow it in the browser to look through'
        : 'no camera'
  }
}
function stop() {
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
}

function draw(now: number) {
  if (video.readyState >= 2 && video.videoWidth) {
    // square crop of the camera, mirrored
    const va = video.videoWidth / video.videoHeight
    let sx = 0
    let sy = 0
    let sw = video.videoWidth
    let sh = video.videoHeight
    if (va > W / H) {
      sw = video.videoHeight * (W / H)
      sx = (video.videoWidth - sw) / 2
    } else {
      sh = video.videoWidth / (W / H)
      sy = (video.videoHeight - sh) / 2
    }
    grabCtx.setTransform(-1, 0, 0, 1, W, 0)
    grabCtx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H)
    grabCtx.setTransform(1, 0, 0, 1, 0, 0)
    const d = grabCtx.getImageData(0, 0, W, H).data

    // this frame, grey at double contrast; reuse the oldest frame's buffer once three seconds are kept
    const slot = ring.length && now - ring[0].t > DELAY * 1000 + 250 ? ring.shift()! : { grey: new Uint8Array(W * H), t: 0 }
    const g = slot.grey
    for (let i = 0; i < W * H; i++) {
      const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]
      g[i] = Math.max(0, Math.min(255, (lum - 128) * CONTRAST + 128))
    }
    slot.t = now
    ring.push(slot)

    // the frame nearest to three seconds ago
    const want = now - DELAY * 1000
    let past = ring[0]
    for (const f of ring) if (Math.abs(f.t - want) < Math.abs(past.t - want)) past = f
    const a = swapped ? past.grey : g // inside
    const b = swapped ? g : past.grey // outside
    const o = out.data
    for (let i = 0; i < W * H; i++) {
      const m = inside[i]
      const v = (a[i] * m + b[i] * (255 - m)) / 65025 // 0..1
      o[i * 4] = v * PAPER[0]
      o[i * 4 + 1] = v * PAPER[1]
      o[i * 4 + 2] = v * PAPER[2]
      o[i * 4 + 3] = 255
    }
    ctx.putImageData(out, 0, 0)
  }
  requestAnimationFrame(draw)
}

// a tap on the picture swaps now and then
let press: { x: number; y: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => (press = { x: e.clientX, y: e.clientY, t: performance.now() }))
canvas.addEventListener('pointerup', (e) => {
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 12 && performance.now() - press.t < 350) {
    swapped = !swapped
    haptic(10)
  }
  press = null
})

// save, as the slit-scan does: the frame with the logo small in the corner, in paper white
const logo = new Image()
logo.src = '/assets/img/logo/white.png'
const isPhone = () => /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || window.innerWidth <= 600
saveBtn.addEventListener('click', () => {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const o = c.getContext('2d')!
  o.drawImage(canvas, 0, 0)
  if (logo.complete && logo.naturalWidth) {
    const s = 36
    const tint = document.createElement('canvas')
    tint.width = tint.height = s
    const t = tint.getContext('2d')!
    t.drawImage(logo, 0, 0, s, s)
    t.globalCompositeOperation = 'source-in'
    t.fillStyle = `rgb(${PAPER.join(',')})`
    t.fillRect(0, 0, s, s)
    o.drawImage(tint, W - s - 12, H - s - 12)
  }
  const url = c.toDataURL('image/png')
  if (isPhone()) {
    overlayImg.src = url
    overlay.hidden = false
    stop()
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = `window-${Date.now()}.png`
    a.click()
  }
})
overlay.addEventListener('click', () => {
  overlay.hidden = true
  start()
})

startBtn.addEventListener('click', () => {
  startBtn.textContent = 'starting…'
  start()
})
requestAnimationFrame(draw)
