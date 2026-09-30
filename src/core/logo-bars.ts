// The new logo as straight bars: the path's segments, collinear runs merged, each run past its ends
// just enough to close the joins the way the drawn logo's miters do. Rectangles of these add up to
// the mark exactly. Units: the logo's 600 frame, y down (as in the SVG path).
import { LOGO_PATH, LOGO_STROKE } from './logo-path'

export type Seg = { ax: number; ay: number; bx: number; by: number }

/** The logo path (absolute M/H/V/L only) as straight segments; collinear runs merged into one bar. */
function pathSegments(): Seg[] {
  const tokens = LOGO_PATH.match(/[MHVL]|-?\d*\.?\d+/g)!
  const segs: Seg[] = []
  let x = 0
  let y = 0
  let i = 0
  let cmd = 'M'
  const num = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    if (/[MHVL]/.test(tokens[i])) cmd = tokens[i++]
    const px = x
    const py = y
    if (cmd === 'M') {
      x = num()
      y = num()
      continue
    }
    if (cmd === 'H') x = num()
    else if (cmd === 'V') y = num()
    else {
      x = num()
      y = num()
    }
    const last = segs[segs.length - 1]
    const dir = (s: Seg) => Math.atan2(s.by - s.ay, s.bx - s.ax)
    const seg = { ax: px, ay: py, bx: x, by: y }
    if (last && last.bx === px && last.by === py && Math.abs(dir(last) - dir(seg)) < 0.02) {
      last.bx = x
      last.by = y
    } else segs.push(seg)
  }
  return segs
}

/** Each bar runs past its ends just enough to close the joins the way the logo's miters do:
 *  half a stroke at a right angle, less at an obtuse one (w/2 / tan(α/2)), nothing at a free end
 *  or where it stops on another bar's side (that bar covers it). Rectangles then add up to the mark
 *  without corners sticking out. */
function withJoins(segs: Seg[]): Seg[] {
  const w = LOGO_STROKE
  const same = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x1 - x2, y1 - y2) < 0.5
  const extAt = (me: Seg, px: number, py: number, ox: number, oy: number) => {
    // (ox, oy): my other end; my direction away from the joint is from P to it
    const mx = ox - px
    const my = oy - py
    let ext = 0
    for (const s of segs) {
      if (s === me) continue
      let qx: number
      let qy: number
      if (same(s.ax, s.ay, px, py)) {
        qx = s.bx
        qy = s.by
      } else if (same(s.bx, s.by, px, py)) {
        qx = s.ax
        qy = s.ay
      } else continue
      const nx = qx - px
      const ny = qy - py
      const cos = (mx * nx + my * ny) / (Math.hypot(mx, my) * Math.hypot(nx, ny))
      const alpha = Math.acos(Math.max(-1, Math.min(1, cos))) // angle between the two arms
      if (alpha < Math.PI / 2 - 0.01) continue // a sharp join: the partner covers it
      ext = Math.max(ext, Math.min(w / 2, w / 2 / Math.tan(alpha / 2)))
    }
    return ext
  }
  return segs.map((s) => {
    const len = Math.hypot(s.bx - s.ax, s.by - s.ay)
    const dx = (s.bx - s.ax) / len
    const dy = (s.by - s.ay) / len
    const ea = extAt(s, s.ax, s.ay, s.bx, s.by)
    const eb = extAt(s, s.bx, s.by, s.ax, s.ay)
    return { ax: s.ax - dx * ea, ay: s.ay - dy * ea, bx: s.bx + dx * eb, by: s.by + dy * eb }
  })
}


/** The logo's bars, joins closed. */
export function logoBars(): Seg[] {
  return withJoins(pathSegments())
}
