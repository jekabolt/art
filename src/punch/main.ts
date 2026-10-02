import '../fonts/fonts.css'
import '../site.css'
import './punch.css'
import { cardPrims } from './card'
import { downloadPdf, downloadSvg, renderSvg } from './draw'
import { COLUMNS, normalize } from './encode'
import { MAX_CM, MIN_CM, formatSize, parseCm, parseSize, ptOf, resolveSize, round1 } from './size'
import type { SizeChoice } from './size'

const DEFAULT_TEXT = 'GRBPWR / CRITICAL PATH BLAZER / 2026.1'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const textEl = $<HTMLInputElement>('text')
const countEl = $<HTMLElement>('count')
const hintEl = $<HTMLElement>('hint')
const origEl = $<HTMLButtonElement>('size-original')
const wEl = $<HTMLInputElement>('size-w')
const hEl = $<HTMLInputElement>('size-h')
const noteEl = $<HTMLElement>('size-note')
const dlEl = $<HTMLButtonElement>('download')
const dlBoxEl = $<HTMLElement>('download-box')
const formatEls = [$<HTMLButtonElement>('download-pdf'), $<HTMLButtonElement>('download-svg')]
const svgEl = document.getElementById('card') as unknown as SVGSVGElement

const params = new URLSearchParams(location.search)
let text = normalize(params.has('text') ? params.get('text') ?? '' : DEFAULT_TEXT).text
let size: SizeChoice = parseSize(params.get('size'))
let busy = false
let picking = false

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

function fileName(): string {
  const base = slug(text) || 'blank'
  const suffix = size.kind === 'original' ? '' : `-${formatSize(size)}cm`
  return `punch-card-${base}${suffix}`
}

function syncUrl() {
  const q = new URLSearchParams()
  if (text !== DEFAULT_TEXT) q.set('text', text)
  if (size.kind !== 'original') q.set('size', formatSize(size))
  const s = q.toString()
  history.replaceState(null, '', location.pathname + (s ? `?${s}` : ''))
}

function renderCard() {
  renderSvg(svgEl, cardPrims(text, false))
  countEl.textContent = `${[...text].length} / ${COLUMNS}`
}

function renderSize() {
  const r = resolveSize(size)
  origEl.setAttribute('aria-pressed', String(size.kind === 'original'))
  // Leave the field being typed into alone; rewrite only the derived one.
  const show = (v: number) => (Number.isFinite(v) ? String(round1(v)) : '')
  if (document.activeElement !== wEl) wEl.value = show(r.wCm)
  if (document.activeElement !== hEl) hEl.value = show(r.hCm)
  wEl.classList.toggle('is-set', size.kind === 'side' && size.side === 'w')
  hEl.classList.toggle('is-set', size.kind === 'side' && size.side === 'h')
  noteEl.textContent = r.ok
    ? `${round1(r.wCm)} × ${round1(r.hCm)} cm · vector`
    : Number.isFinite(r.scale)
      ? `sides must stay between ${MIN_CM} and ${MAX_CM} cm`
      : 'type the size in cm, e.g. 30 or 29.7'
  noteEl.classList.toggle('is-error', !r.ok)
  dlEl.disabled = !r.ok || busy
  if (!r.ok) picking = false
  dlEl.hidden = picking
  dlEl.setAttribute('aria-expanded', String(picking))
  for (const el of formatEls) {
    el.hidden = !picking
    el.disabled = busy
  }
  // The file is built from what was on screen at the click: nothing changes until it is saved.
  for (const el of [textEl, origEl, wEl, hEl]) el.disabled = busy
}

function onText() {
  const raw = textEl.value
  const caret = textEl.selectionStart ?? raw.length
  const { text: clean, dropped } = normalize(raw)
  if (clean !== raw) {
    const at = normalize(raw.slice(0, caret)).text.length
    textEl.value = clean
    textEl.setSelectionRange(at, at)
  }
  hintEl.textContent = dropped ? `not on a punch card: ${dropped}` : ''
  text = clean
  renderCard()
  renderSize()
  syncUrl()
}

function onSide(side: 'w' | 'h', el: HTMLInputElement) {
  size = { kind: 'side', side, cm: parseCm(el.value) }
  renderSize()
  if (Number.isFinite(size.cm)) syncUrl()
}

// No maxlength: the browser counts UTF-16 units before normalize() drops what cannot be punched.
textEl.value = text
textEl.addEventListener('input', onText)

origEl.addEventListener('click', () => {
  size = { kind: 'original' }
  renderSize()
  syncUrl()
})
wEl.addEventListener('input', () => onSide('w', wEl))
hEl.addEventListener('input', () => onSide('h', hEl))
for (const el of [wEl, hEl]) {
  el.addEventListener('blur', renderSize)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.blur()
  })
}

function pick(open: boolean) {
  if (picking === open) return
  picking = open
  renderSize()
  if (open) formatEls[0].focus()
  else dlEl.focus()
}

dlEl.addEventListener('click', () => pick(true))
document.addEventListener('pointerdown', (e) => {
  if (picking && !busy && !dlBoxEl.contains(e.target as Node)) pick(false)
})
dlBoxEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !busy) pick(false)
})

for (const el of formatEls) {
  el.addEventListener('click', async () => {
    const r = resolveSize(size)
    if (!r.ok || busy) return
    const format = el.dataset.format as 'pdf' | 'svg'
    const label = el.textContent
    busy = true
    el.textContent = '…'
    renderSize()
    try {
      const prims = cardPrims(text)
      if (format === 'pdf') await downloadPdf(prims, ptOf(r.wCm), ptOf(r.hCm), `${fileName()}.pdf`)
      else await downloadSvg(prims, round1(r.wCm), round1(r.hCm), `${fileName()}.svg`)
      picking = false
    } catch (err) {
      console.error(err)
      noteEl.textContent = `could not build the ${format} — try again`
      noteEl.classList.add('is-error')
    } finally {
      busy = false
      el.textContent = label
      renderSize()
      if (!picking) dlEl.focus()
    }
  })
}

renderCard()
renderSize()
