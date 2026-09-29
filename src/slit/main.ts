// SLIT-SCAN (2025): the webcam, mirrored, black and white at double contrast. The left 20 % is live;
// every frame the rest of the picture moves one pixel right and the live edge column is copied in,
// so whatever passes the edge is smeared across time. The logo button saves the frame as a PNG.
import '../fonts/fonts.css'
import '../site.css'
import './slit.css'

const W = 640
const H = 480
const LIVE = 0.2
const CONTRAST = 2
/** Paper white: the scan runs from black to this slightly yellow white instead of pure white. */
const PAPER = [250, 244, 220]

const canvas = document.getElementById('scan') as HTMLCanvasElement
const ctx = canvas.getContext('2d', { willReadFrequently: true })!
const video = document.createElement('video')
const saveBtn = document.getElementById('save') as HTMLButtonElement
const statusEl = document.getElementById('status') as HTMLElement
const overlay = document.getElementById('overlay') as HTMLElement
const overlayImg = overlay.querySelector('img') as HTMLImageElement

const frame = document.createElement('canvas')
const frameCtx = frame.getContext('2d', { willReadFrequently: true })!
canvas.width = frame.width = W
canvas.height = frame.height = H
ctx.fillStyle = '#000'
ctx.fillRect(0, 0, W, H)

const logo = new Image()
logo.src = '/assets/img/logo/white.png'

video.muted = true
video.playsInline = true
let stream: MediaStream | null = null

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.srcObject = stream
    await video.play()
    statusEl.textContent = ''
  } catch {
    statusEl.textContent = 'camera is off — allow it in the browser to scan'
  }
}

function stop() {
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
}

function draw() {
  if (video.readyState >= 2 && video.videoWidth) {
    // 4:3 crop of the camera, mirrored
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
    frameCtx.setTransform(-1, 0, 0, 1, W, 0)
    frameCtx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H)
    frameCtx.setTransform(1, 0, 0, 1, 0, 0)

    const live = Math.floor(W * LIVE)
    const img = frameCtx.getImageData(0, 0, live, H)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      const v = Math.max(0, Math.min(255, (lum - 128) * CONTRAST + 128)) / 255
      d[i] = v * PAPER[0]
      d[i + 1] = v * PAPER[1]
      d[i + 2] = v * PAPER[2]
    }

    // smear: shift the scanned part right by one pixel, then copy the live edge in
    ctx.drawImage(canvas, live, 0, W - live - 1, H, live + 1, 0, W - live - 1, H)
    ctx.putImageData(img, 0, 0)
    ctx.putImageData(ctx.getImageData(live - 1, 0, 1, H), live, 0)
  }
  requestAnimationFrame(draw)
}

const isPhone = () => /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || window.innerWidth <= 600

saveBtn.addEventListener('click', () => {
  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const o = out.getContext('2d')!
  o.drawImage(canvas, 0, 0)
  if (logo.complete && logo.naturalWidth) {
    // the logo in the same paper white as the scan
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
  const url = out.toDataURL('image/png')
  if (isPhone()) {
    // phones: show the picture to long-press and save; tap to scan again
    overlayImg.src = url
    overlay.hidden = false
    stop()
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = `slit-scan-${Date.now()}.png`
    a.click()
  }
})

overlay.addEventListener('click', () => {
  overlay.hidden = true
  start()
})

start()
requestAnimationFrame(draw)
