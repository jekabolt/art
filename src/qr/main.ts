// QR: a QR code in qrbtf's C2 style — the logo as a 1/3-pixel dot matrix. Every module is split into
// 3×3 sub-pixels: the middle one carries the code's bit, the eight round it are the logo, dithered;
// the three finder patterns are drawn whole. No alignment or timing treatment, no background upload:
// the picture is always the mark. Error correction is a slider (7 / 15 / 25 / 30 %); contrast and
// brightness move the logo's grey before it is dithered.
import '../fonts/fonts.css'
import '../site.css'
import './qr.css'
import qrcode from 'qrcode-generator'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'

qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']

const LEVELS = [
  { level: 'L', label: '7%' },
  { level: 'M', label: '15%' },
  { level: 'Q', label: '25%' },
  { level: 'H', label: '30%' },
] as const
const QUIET = 2 // modules of white round the code

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const urlEl = $<HTMLInputElement>('url')
const levelEl = $<HTMLInputElement>('level')
const contrastEl = $<HTMLInputElement>('contrast')
const brightnessEl = $<HTMLInputElement>('brightness')
const noteEl = $<HTMLElement>('note')
const dlEl = $<HTMLButtonElement>('download')
const dlBoxEl = $<HTMLElement>('download-box')
const formatEls = [$<HTMLButtonElement>('download-png'), $<HTMLButtonElement>('download-svg')]
const svgEl = document.getElementById('code') as unknown as SVGSVGElement

// the logo as grey (0 = ink, 1 = paper) on a square of side s
function logoGrey(s: number): Float32Array {
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, s, s)
  g.scale(s / LOGO_SPAN, s / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#000'
  g.stroke(new Path2D(LOGO_PATH))
  const d = g.getImageData(0, 0, s, s).data
  const out = new Float32Array(s * s)
  for (let i = 0; i < s * s; i++) out[i] = d[i * 4] / 255
  return out
}

// contrast and brightness (both -100..100), then Floyd–Steinberg down to ink / paper
function dither(grey: Float32Array, s: number, contrast: number, brightness: number): Uint8Array {
  const k = contrast >= 0 ? 1 + (contrast / 100) * 3 : 1 + contrast / 100
  const b = (brightness / 100) * 0.5
  const v = new Float32Array(s * s)
  for (let i = 0; i < s * s; i++) v[i] = (grey[i] - 0.5) * k + 0.5 + b
  const ink = new Uint8Array(s * s)
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = y * s + x
      const old = v[i]
      const on = old < 0.5 ? 1 : 0
      ink[i] = on
      const err = old - (on ? 0 : 1)
      if (x + 1 < s) v[i + 1] += (err * 7) / 16
      if (y + 1 < s) {
        if (x > 0) v[i + s - 1] += (err * 3) / 16
        v[i + s] += (err * 5) / 16
        if (x + 1 < s) v[i + s + 1] += err / 16
      }
    }
  }
  return ink
}

const inFinder = (r: number, c: number, n: number) => (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8)

let current = ''
function render(): boolean {
  const text = urlEl.value.trim()
  const lv = LEVELS[Number(levelEl.value)]
  $('level-out').textContent = lv.label
  $('contrast-out').textContent = contrastEl.value
  $('brightness-out').textContent = brightnessEl.value
  if (!text) {
    noteEl.textContent = 'type a url'
    dlEl.disabled = true
    return false
  }
  let qr: ReturnType<typeof qrcode>
  try {
    qr = qrcode(0, lv.level)
    qr.addData(text, 'Byte')
    qr.make()
  } catch {
    noteEl.textContent = 'too long for a QR code at this correct level'
    dlEl.disabled = true
    return false
  }
  noteEl.textContent = ''
  dlEl.disabled = false

  const n = qr.getModuleCount()
  const s = n * 3
  const ink = dither(logoGrey(s), s, Number(contrastEl.value), Number(brightnessEl.value))
  // sub-pixel grid: the logo, the code's bit in every module's middle, the finders whole
  const dark = (sy: number, sx: number) => {
    const r = Math.floor(sy / 3)
    const c = Math.floor(sx / 3)
    if (inFinder(r, c, n)) return qr.isDark(r, c)
    if (sy % 3 === 1 && sx % 3 === 1) return qr.isDark(r, c)
    return ink[sy * s + sx] === 1
  }
  // one path, a rectangle per horizontal run
  const q = QUIET * 3
  let d = ''
  for (let y = 0; y < s; y++) {
    let x = 0
    while (x < s) {
      if (!dark(y, x)) {
        x++
        continue
      }
      let e = x + 1
      while (e < s && dark(y, e)) e++
      d += `M${x + q} ${y + q}h${e - x}v1h${x - e}z`
      x = e
    }
  }
  const size = s + 2 * q
  svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svgEl.setAttribute('shape-rendering', 'crispEdges')
  svgEl.innerHTML = `<rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/>`
  current = text
  return true
}

for (const el of [urlEl, levelEl, contrastEl, brightnessEl]) el.addEventListener('input', render)

// Sliders by hand: a touch anywhere on the line sets the value and drags from there (iOS only moves
// the thumb when the thumb itself is grabbed, and a miss scrolls the page instead).
for (const el of [levelEl, contrastEl, brightnessEl]) {
  const set = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    const thumb = 12
    const k = Math.max(0, Math.min(1, (e.clientX - r.left - thumb / 2) / (r.width - thumb)))
    const min = Number(el.min)
    const max = Number(el.max)
    const step = Number(el.step) || 1
    const v = String(Math.round((min + k * (max - min)) / step) * step)
    if (v !== el.value) {
      el.value = v
      render()
    }
  }
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    el.setPointerCapture(e.pointerId)
    set(e)
  })
  el.addEventListener('pointermove', (e) => {
    if (el.hasPointerCapture(e.pointerId)) set(e)
  })
}

// --- download: png or svg ------------------------------------------------------------------------------
let picking = false
function pick(open: boolean) {
  picking = open && !dlEl.disabled
  dlEl.hidden = picking
  dlEl.setAttribute('aria-expanded', String(picking))
  for (const el of formatEls) el.hidden = !picking
  if (picking) formatEls[0].focus()
}
dlEl.addEventListener('click', () => pick(true))
document.addEventListener('pointerdown', (e) => {
  if (picking && !dlBoxEl.contains(e.target as Node)) pick(false)
})
dlBoxEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') pick(false)
})

const slug = () =>
  current
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'qr'

function save(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function svgText() {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.removeAttribute('class')
  clone.removeAttribute('id')
  return new XMLSerializer().serializeToString(clone)
}

formatEls[1].addEventListener('click', () => {
  save(new Blob([svgText()], { type: 'image/svg+xml' }), `qr-${slug()}.svg`)
  pick(false)
})
formatEls[0].addEventListener('click', () => {
  const img = new Image()
  const url = URL.createObjectURL(new Blob([svgText()], { type: 'image/svg+xml' }))
  img.onload = () => {
    const px = 2048
    const c = document.createElement('canvas')
    c.width = c.height = px
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    g.drawImage(img, 0, 0, px, px)
    URL.revokeObjectURL(url)
    c.toBlob((b) => b && save(b, `qr-${slug()}.png`), 'image/png')
  }
  img.src = url
  pick(false)
})

render()
