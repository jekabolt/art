// The card as a list of primitives in points of the reference artwork (PT-FULL 2.pdf,
// 1875 × 827.5 pt = 66.1 × 29.2 cm). The screen (SVG) and the PDF draw the same list, so what
// is on screen is what lands in the file.
import { COLUMNS, ROWS, punches } from './encode'

export const CARD_W = 1875
export const CARD_H = 827.5

/** FeatureMono is strictly monospaced: every glyph advances 0.6 em. */
const ADVANCE = 0.6

const COL_X = 58
const COL_W = 22
const ROW_Y = 147
const ROW_PITCH = 52
const HOLE_H = 32

const HEADER_PT = 24
const HEADER_BASELINE = 90
const DIGIT_PT = 16.34
const DIGIT_BASELINE = 168.5

const INK = '#000000'
const DIGIT = '#6e6e6e'
const MARK = '#cecece'

export type Prim =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string }
  | { kind: 'poly'; points: [number, number][]; fill: string }
  | { kind: 'text'; x: number; y: number; size: number; fill: string; text: string }

/** Printed label of each row: rows 12 and 11 carry "0" too, as on the artwork. */
const ROW_LABELS = ['0', '0', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** One glyph centred in column `col` (glyph box = advance). */
const glyph = (col: number, y: number, size: number, fill: string, text: string): Prim => ({
  kind: 'text',
  x: COL_X + col * COL_W + (COL_W - ADVANCE * size) / 2,
  y,
  size,
  fill,
  text,
})

export function cardPrims(text: string): Prim[] {
  const out: Prim[] = [
    { kind: 'rect', x: 0, y: 0, w: CARD_W, h: CARD_H, fill: '#ffffff' },
    // Cut corner and the tab on the right, both from the artwork.
    { kind: 'poly', points: [[1, 1], [66, 1], [1, 66]], fill: MARK },
    { kind: 'rect', x: 1806, y: 34, w: 35, h: 65, fill: MARK },
  ]

  const chars = [...text].slice(0, COLUMNS)
  chars.forEach((ch, col) => {
    if (ch !== ' ') out.push(glyph(col, HEADER_BASELINE, HEADER_PT, INK, ch))
  })

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      out.push(glyph(col, DIGIT_BASELINE + row * ROW_PITCH, DIGIT_PT, DIGIT, ROW_LABELS[row]))
    }
  }

  chars.forEach((ch, col) => {
    for (const row of punches(ch)) {
      out.push({
        kind: 'rect',
        x: COL_X + col * COL_W,
        y: ROW_Y + row * ROW_PITCH,
        w: COL_W,
        h: HOLE_H,
        fill: INK,
      })
    }
  })

  // 1 pt frame on the edge of the card.
  out.push(
    { kind: 'rect', x: 0, y: 0, w: CARD_W, h: 1, fill: INK },
    { kind: 'rect', x: 0, y: CARD_H - 1, w: CARD_W, h: 1, fill: INK },
    { kind: 'rect', x: 0, y: 0, w: 1, h: CARD_H, fill: INK },
    { kind: 'rect', x: CARD_W - 1, y: 0, w: 1, h: CARD_H, fill: INK },
  )
  return out
}
