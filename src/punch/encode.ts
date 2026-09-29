// IBM 029 keypunch code: one character per column, rows 12, 11, 0, 1 … 9 top to bottom.
// Row indices here are positions on the card (0 = row 12, 1 = row 11, 2 = row 0, 3 = row 1 … 11 = row 9).

export const COLUMNS = 80
export const ROWS = 12

const ROW_12 = 0
const ROW_11 = 1
const ROW_0 = 2
const digitRow = (d: number) => (d === 0 ? ROW_0 : d + 2)

const CODES: Record<string, number[]> = { ' ': [] }

for (let d = 0; d <= 9; d++) CODES[String(d)] = [digitRow(d)]
'ABCDEFGHI'.split('').forEach((ch, i) => (CODES[ch] = [ROW_12, digitRow(i + 1)]))
'JKLMNOPQR'.split('').forEach((ch, i) => (CODES[ch] = [ROW_11, digitRow(i + 1)]))
'STUVWXYZ'.split('').forEach((ch, i) => (CODES[ch] = [ROW_0, digitRow(i + 2)]))

const special = (chars: string, zone: number[], from: number) =>
  chars.split('').forEach((ch, i) => (CODES[ch] = [...zone, digitRow(8), digitRow(from + i)]))

CODES['&'] = [ROW_12]
CODES['-'] = [ROW_11]
CODES['/'] = [ROW_0, digitRow(1)]
special('¢.<(+|', [ROW_12], 2)
special('!$*);¬', [ROW_11], 2)
special(',%_>?', [ROW_0], 3)
special(':#@\'="', [], 2)

/** Every character the card can carry, for hints. */
export const CHARSET = Object.keys(CODES).join('')

export const isPunchable = (ch: string) => ch in CODES

/** Upper-cases, drops what IBM 029 cannot punch, cuts to 80 columns. */
export function normalize(text: string): { text: string; dropped: string } {
  let out = ''
  let dropped = ''
  for (const ch of text) {
    const up = ch.toUpperCase()
    if (isPunchable(up)) out += up
    else if (!dropped.includes(ch)) dropped += ch
  }
  return { text: out.slice(0, COLUMNS), dropped }
}

/** Punched rows of one column. */
export const punches = (ch: string): number[] => CODES[ch] ?? []
