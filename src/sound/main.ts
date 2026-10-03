// SOUND: the logo drawn in white horizontal lines on black — a scan of the mark, each line seen only
// where it crosses a stroke. With the microphone on, the lines tremble with the room: each one is
// bent by the sound's own waveform (a different stretch of it per line) and swings as hard as its
// band of the spectrum is loud — the low end at the foot of the mark, the highs at the top. Left
// silent the lines barely breathe. A tap plucks the line under the finger: it rings and dies away.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { haptic } from '../core/haptic'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import '../fonts/fonts.css'
import './sound.css'

const LOOK = {
  lines: 76, // across the mark's height
  markXs: 0.8, // mark width / screen width on a phone
  markLg: 0.4,
  swing: 0.05, // the most a line moves, in mark heights
  step: 3, // css px between the points of a line
}

// --- the scan: where each line crosses the strokes ------------------------------------------------------
const MASK = 1032 // px across the mark
const mask = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = MASK
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.scale(MASK / LOGO_SPAN, MASK / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.stroke(new Path2D(LOGO_PATH))
  return g.getImageData(0, 0, MASK, MASK).data
})()
/** Runs of each line inside the mark, as fractions of the mark's width. */
const runs: [number, number][][] = []
for (let l = 0; l < LOOK.lines; l++) {
  const y = Math.floor(((l + 0.5) / LOOK.lines) * MASK)
  const row: [number, number][] = []
  let start = -1
  for (let x = 0; x <= MASK; x++) {
    const inside = x < MASK && mask[(y * MASK + x) * 4 + 3] > 127
    if (inside && start < 0) start = x
    if (!inside && start >= 0) {
      row.push([start / MASK, x / MASK])
      start = -1
    }
  }
  runs.push(row)
}

// --- sound ---------------------------------------------------------------------------------------------------
let analyser: AnalyserNode | null = null
let wave = new Float32Array(2048)
let spectrum = new Uint8Array(1024)
const level = new Float32Array(LOOK.lines) // smoothed loudness of each line's band, 0..1

const button = document.getElementById('mic') as HTMLButtonElement
// a framed page has no microphone unless the host allows it; plucking still works there
if (EMBEDDED || !navigator.mediaDevices?.getUserMedia) button.hidden = true
button.addEventListener('click', async () => {
  // iPhone Safari: the audio context must be made and resumed inside the tap itself (after an await
  // the tap no longer counts and it stays suspended, the analyser reading silence), and a node that
  // does not lead to the speakers is never run — so the analyser feeds a muted gain to the output.
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new Ctx()
  const resumed = ctx.resume()
  button.textContent = 'listening…'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    await resumed
    if (ctx.state !== 'running') await ctx.resume()
    const node = ctx.createAnalyser()
    node.fftSize = 2048
    node.smoothingTimeConstant = 0.6
    const mute = ctx.createGain()
    mute.gain.value = 0
    ctx.createMediaStreamSource(stream).connect(node)
    node.connect(mute)
    mute.connect(ctx.destination)
    wave = new Float32Array(node.fftSize)
    spectrum = new Uint8Array(node.frequencyBinCount)
    analyser = node
    button.hidden = true
  } catch (err) {
    const name = (err as { name?: string })?.name
    button.textContent = name === 'NotAllowedError' ? 'microphone not allowed' : 'no microphone'
    ctx.close().catch(() => {})
  }
})

/** The spectrum bins of line l: log-spaced from ~60 Hz (the foot of the mark) to ~9 kHz (the top). */
function bandOf(l: number, sampleRate: number): [number, number] {
  const k = 1 - l / (LOOK.lines - 1) // 0 at the top, 1 at the foot
  const lo = 60 * Math.pow(9000 / 60, 1 - k)
  const hi = lo * Math.pow(9000 / 60, 1 / LOOK.lines) * 1.6
  const bin = (f: number) => Math.min(spectrum.length - 1, Math.max(1, Math.round((f / sampleRate) * 2 * spectrum.length)))
  return [bin(lo), bin(hi)]
}

// --- plucks -------------------------------------------------------------------------------------------------
const pluck = new Float32Array(LOOK.lines) // amplitude, 0..1, dying away
const pluckAt = new Float32Array(LOOK.lines) // where along the line (0..1) it was struck

// --- drawing ----------------------------------------------------------------------------------------------
const canvas = document.getElementById('sound') as HTMLCanvasElement
const g = canvas.getContext('2d')!
let dpr = 1
let side = 1 // mark size, device px
let ox = 0
let oy = 0

function resize() {
  const w = innerWidth
  const h = innerHeight
  dpr = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  side = Math.min(w * (w <= 768 ? LOOK.markXs : LOOK.markLg), h * 0.7) * dpr
  ox = (canvas.width - side) / 2
  oy = (canvas.height - side) / 2
}
addEventListener('resize', resize)
resize()

let press: { x: number; y: number; t: number } | null = null
canvas.addEventListener('pointerdown', (e) => (press = { x: e.clientX, y: e.clientY, t: performance.now() }))
canvas.addEventListener('pointerup', (e) => {
  const tap = press && Math.hypot(e.clientX - press.x, e.clientY - press.y) <= 12 && performance.now() - press.t <= 400
  press = null
  if (!tap) return
  const l = Math.round(((e.clientY * dpr - oy) / side) * LOOK.lines - 0.5)
  if (l < 0 || l >= LOOK.lines) return
  // the struck line rings hardest, its neighbours a little
  for (let d = -3; d <= 3; d++) {
    const i = l + d
    if (i < 0 || i >= LOOK.lines) continue
    pluck[i] = Math.max(pluck[i], Math.exp(-d * d * 0.5))
    pluckAt[i] = Math.min(0.95, Math.max(0.05, (e.clientX * dpr - ox) / side))
  }
  haptic(10)
})
if (!EMBEDDED) addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const t = now / 1000

  if (analyser) {
    analyser.getFloatTimeDomainData(wave)
    analyser.getByteFrequencyData(spectrum)
    const rate = analyser.context.sampleRate
    for (let l = 0; l < LOOK.lines; l++) {
      const [a, b] = bandOf(l, rate)
      let sum = 0
      for (let i = a; i <= b; i++) sum += spectrum[i]
      const v = Math.min(1, Math.max(0, (sum / (b - a + 1) / 255 - 0.25) / 0.6))
      level[l] += (v - level[l]) * (v > level[l] ? 0.5 : 0.08) // quick to swell, slow to settle
    }
  }
  for (let l = 0; l < LOOK.lines; l++) pluck[l] *= Math.exp(-dt * 1.6)

  g.setTransform(1, 0, 0, 1, 0, 0)
  g.fillStyle = '#000'
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.strokeStyle = '#fff'
  g.lineWidth = 1.3 * dpr
  g.lineCap = 'round'
  g.lineJoin = 'round'

  const swing = LOOK.swing * side
  const step = LOOK.step * dpr
  const N = wave.length
  for (let l = 0; l < LOOK.lines; l++) {
    const y0 = oy + ((l + 0.5) / LOOK.lines) * side
    const amp = level[l]
    const pk = pluck[l]
    const offset = Math.floor((l * 97) % (N / 2))
    g.beginPath()
    for (const [a, b] of runs[l]) {
      const x0 = ox + a * side
      const x1 = ox + b * side
      for (let x = x0; ; x += step) {
        const xx = Math.min(x, x1)
        const u = (xx - ox) / side // 0..1 across the mark
        // the room: this line's stretch of the waveform, as loud as its band
        let d = 0
        if (amp) {
          // ~250 samples across the mark, each averaged with its neighbours: a smooth trace
          const i = offset + Math.floor(u * N * 0.12)
          d = ((wave[(i - 2 + N) % N] + wave[(i - 1 + N) % N] + wave[i % N] + wave[(i + 1) % N] + wave[(i + 2) % N]) / 5) * amp * swing * 3.2
        }
        // a pluck: a string struck at pluckAt, ringing (the shape of a plucked string, triangular, decaying)
        if (pk > 0.002) {
          const p = pluckAt[l]
          const shape = u < p ? u / p : (1 - u) / (1 - p)
          d += shape * pk * swing * Math.sin(t * 38 + l) * 0.9
        }
        // and a breath, so it never lies dead still
        d += Math.sin(u * 9 + t * 1.3 + l * 0.7) * 0.004 * swing
        if (xx === x0) g.moveTo(xx, y0 + d)
        else g.lineTo(xx, y0 + d)
        if (xx >= x1) break
      }
    }
    g.stroke()
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
