// Tap effects, two variants to compare: `?tap=wave` (the relief swells layer by layer from the
// front to the back, pushed away from the finger) and `?tap=glint` (a ring of light runs out from
// the finger over the relief). Without the parameter a tap does nothing, as before.
// A tap = press and release within 350 ms and 12 px; a drag that turns the mark is not a tap.

export type TapMode = 'wave' | 'glint' | 'none'

const param = new URLSearchParams(window.location.search).get('tap')
export const TAP_MODE: TapMode = param === 'wave' || param === 'glint' ? param : 'none'

/** Seconds since the last tap (Infinity before the first) and where it landed, in screen px. */
export const tap = { t0: -Infinity, x: 0, y: 0 }
export const tapAge = (): number => (performance.now() - tap.t0) / 1000

export function listenTaps(onTap: (x: number, y: number) => void): void {
  if (TAP_MODE === 'none') return
  let down: { x: number; y: number; t: number } | null = null
  window.addEventListener('pointerdown', (e) => {
    down = e.isPrimary ? { x: e.clientX, y: e.clientY, t: performance.now() } : null
  })
  window.addEventListener('pointerup', (e) => {
    if (!down || !e.isPrimary) return
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
    if (moved < 12 && performance.now() - down.t < 350) {
      tap.t0 = performance.now()
      tap.x = e.clientX
      tap.y = e.clientY
      onTap(e.clientX, e.clientY)
    }
    down = null
  })
  window.addEventListener('pointercancel', () => (down = null))
}
