// MOTION: the screen is black and the camera is never shown. What it sees is only compared with
// itself a moment before; wherever something moves, the logo shows through, white and sharp, and
// fades again within a second or so. A faint grey trace of the movement itself shows where your hands
// are. Wave in front of it and you wipe the mark out of the dark.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { cameraButton, coverRect } from '../core/camera'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import '../fonts/fonts.css'
import '../core/camera.css'
import './motion.css'

const LOOK = {
  gridW: 96, // the motion map's width (its height follows the screen)
  threshold: 18, // grey levels of change that count as movement
  fade: 1.1, // seconds for a revealed patch to go dark again
  markXs: 0.86,
  markLg: 0.5,
}

const canvas = document.getElementById('motion') as HTMLCanvasElement
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

let video: HTMLVideoElement | null = null
cameraButton((v) => (video = v), EMBEDDED)
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

// the small map: this frame's grey, the last one, and how revealed each cell is (0..1)
const small = document.createElement('canvas')
const sctx = small.getContext('2d', { willReadFrequently: true })!
let prevGrey: Uint8ClampedArray | null = null
let reveal = new Float32Array(0)
let moving = new Float32Array(0)
const map = document.createElement('canvas')
const mctx = map.getContext('2d')!
const layer = document.createElement('canvas')

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  const W = canvas.width
  const H = canvas.height
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  if (video && video.readyState >= 2) {
    const gw = LOOK.gridW
    const gh = Math.max(1, Math.round(gw * (H / W)))
    if (small.width !== gw || small.height !== gh) {
      small.width = map.width = gw
      small.height = map.height = gh
      reveal = new Float32Array(gw * gh)
      moving = new Float32Array(gw * gh)
      prevGrey = null
    }
    // the camera, mirrored, shrunk to the map
    const [sx, sy, sw, sh] = coverRect(video, gw, gh)
    sctx.save()
    sctx.translate(gw, 0)
    sctx.scale(-1, 1)
    sctx.drawImage(video, sx, sy, sw, sh, 0, 0, gw, gh)
    sctx.restore()
    const px = sctx.getImageData(0, 0, gw, gh).data
    const grey = new Uint8ClampedArray(gw * gh)
    for (let i = 0; i < gw * gh; i++) grey[i] = (px[i * 4] * 3 + px[i * 4 + 1] * 6 + px[i * 4 + 2]) / 10
    const decay = Math.exp(-dt / LOOK.fade)
    const img = mctx.createImageData(gw, gh)
    for (let i = 0; i < gw * gh; i++) {
      const d = prevGrey ? Math.abs(grey[i] - prevGrey[i]) : 0
      const hit = Math.min(1, Math.max(0, (d - LOOK.threshold) / 40))
      reveal[i] = Math.max(reveal[i] * decay, hit)
      moving[i] = Math.max(moving[i] * Math.exp(-dt / 0.25), hit)
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255
      img.data[i * 4 + 3] = Math.round(reveal[i] * 255)
    }
    prevGrey = grey
    mctx.putImageData(img, 0, 0)

    // the trace of movement itself, faint grey
    g.save()
    g.globalAlpha = 0.12
    g.imageSmoothingEnabled = true
    for (let i = 0; i < gw * gh; i++) img.data[i * 4 + 3] = Math.round(moving[i] * 255)
    mctx.putImageData(img, 0, 0)
    g.drawImage(map, 0, 0, W, H)
    g.restore()
    // the mark, sharp, wherever the map is revealed: the soft map stretched up, the logo cut into it
    for (let i = 0; i < gw * gh; i++) img.data[i * 4 + 3] = Math.round(reveal[i] * 255)
    mctx.putImageData(img, 0, 0)
    layer.width = W
    layer.height = H
    const l = layer.getContext('2d')!
    l.imageSmoothingEnabled = true
    l.drawImage(map, 0, 0, W, H)
    l.globalCompositeOperation = 'destination-in'
    l.lineWidth = lineW
    l.strokeStyle = '#fff'
    l.stroke(logo)
    g.drawImage(layer, 0, 0)
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
