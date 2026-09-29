// File size of the card, in centimetres, as in the tech-card print pages: either the original
// artwork size, or one side typed by hand with the other side following the card's proportion.
import { CARD_H, CARD_W } from './card'

/** `cm` is NaN while the typed side is not a number yet: nothing can be downloaded then. */
export type SizeChoice = { kind: 'original' } | { kind: 'side'; side: 'w' | 'h'; cm: number }

const PT_PER_CM = 72 / 2.54

/** A PDF page cannot exceed 14 400 pt per side (jsPDF silently crops a larger one). */
export const MAX_CM = Math.floor((14400 / PT_PER_CM) * 10) / 10
export const MIN_CM = 1

export const round1 = (v: number) => Math.round(v * 10) / 10

/** A typed side: digits with an optional decimal point or comma, nothing else. */
export const parseCm = (v: string): number =>
  /^\s*\d+(?:[.,]\d+)?\s*$/.test(v) ? round1(parseFloat(v.replace(',', '.'))) : NaN

export type Size = { wCm: number; hCm: number; scale: number; ok: boolean }

export function resolveSize(choice: SizeChoice): Size {
  const origW = CARD_W / PT_PER_CM
  const origH = CARD_H / PT_PER_CM
  const scale =
    choice.kind === 'original' ? 1 : choice.side === 'w' ? choice.cm / origW : choice.cm / origH
  const wCm = origW * scale
  const hCm = origH * scale
  const ok = Number.isFinite(scale) && Math.min(wCm, hCm) >= MIN_CM && Math.max(wCm, hCm) <= MAX_CM
  return { wCm, hCm, scale, ok }
}

export const ptOf = (cm: number) => cm * PT_PER_CM

/** `?size=` value: `w66.2` / `h29.2`; anything else is the original. */
export function parseSize(v: string | null): SizeChoice {
  const m = v?.match(/^([wh])(\d+(?:\.\d+)?)$/)
  if (!m) return { kind: 'original' }
  const cm = round1(parseFloat(m[2]))
  return cm > 0 ? { kind: 'side', side: m[1] as 'w' | 'h', cm } : { kind: 'original' }
}

export const formatSize = (c: SizeChoice) => (c.kind === 'original' ? '' : `${c.side}${c.cm}`)
