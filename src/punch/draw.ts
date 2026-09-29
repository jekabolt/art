// The same primitive list, drawn twice: as SVG on screen and as a vector PDF for download.
// jsPDF is loaded only when the button is pressed; the page itself never pulls it.
import fontUrl from '../fonts/FeatureMono-Regular.ttf?url'
import { CARD_H, CARD_W } from './card'
import type { Prim } from './card'

const SVG_NS = 'http://www.w3.org/2000/svg'
const FAMILY = 'FeatureMono'

export function renderSvg(svg: SVGSVGElement, prims: Prim[]): void {
  svg.setAttribute('viewBox', `0 0 ${CARD_W} ${CARD_H}`)
  const nodes: SVGElement[] = prims.map((p) => {
    if (p.kind === 'rect') {
      const el = document.createElementNS(SVG_NS, 'rect')
      el.setAttribute('x', String(p.x))
      el.setAttribute('y', String(p.y))
      el.setAttribute('width', String(p.w))
      el.setAttribute('height', String(p.h))
      el.setAttribute('fill', p.fill)
      return el
    }
    if (p.kind === 'poly') {
      const el = document.createElementNS(SVG_NS, 'polygon')
      el.setAttribute('points', p.points.map(([x, y]) => `${x},${y}`).join(' '))
      el.setAttribute('fill', p.fill)
      return el
    }
    const el = document.createElementNS(SVG_NS, 'text')
    el.setAttribute('x', String(p.x))
    el.setAttribute('y', String(p.y))
    el.setAttribute('font-size', String(p.size))
    el.setAttribute('fill', p.fill)
    el.textContent = p.text
    return el
  })
  svg.replaceChildren(...nodes)
}

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

/** Builds the PDF (page = card at `wPt × hPt`) and saves it as `fileName`. */
export async function downloadPdf(prims: Prim[], wPt: number, hPt: number, fileName: string) {
  const [{ jsPDF }, font] = await Promise.all([
    import('jspdf'),
    fetch(fontUrl).then((r) => {
      if (!r.ok) throw new Error(`font ${r.status}`)
      return r.arrayBuffer()
    }),
  ])
  const k = wPt / CARD_W
  const pdf = new jsPDF({
    unit: 'pt',
    format: [wPt, hPt],
    orientation: wPt >= hPt ? 'landscape' : 'portrait',
    compress: true,
  })
  pdf.addFileToVFS('FeatureMono-Regular.ttf', toBase64(font))
  pdf.addFont('FeatureMono-Regular.ttf', FAMILY, 'normal')
  pdf.setFont(FAMILY, 'normal')
  pdf.setProperties({ title: fileName.replace(/\.pdf$/, ''), creator: 'art.grbpwr.com' })

  for (const p of prims) {
    if (p.kind === 'rect') {
      pdf.setFillColor(p.fill)
      pdf.rect(p.x * k, p.y * k, p.w * k, p.h * k, 'F')
    } else if (p.kind === 'poly') {
      const [[x0, y0], ...rest] = p.points
      const deltas = rest.map(([x, y], i) => {
        const [px, py] = i === 0 ? [x0, y0] : rest[i - 1]
        return [(x - px) * k, (y - py) * k]
      })
      pdf.setFillColor(p.fill)
      pdf.lines(deltas, x0 * k, y0 * k, [1, 1], 'F', true)
    } else {
      pdf.setTextColor(p.fill)
      pdf.setFontSize(p.size * k)
      pdf.text(p.text, p.x * k, p.y * k, { baseline: 'alphabetic' })
    }
  }
  pdf.save(fileName)
}
