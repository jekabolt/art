// A buzz on a tap. Android browsers have the Vibration API (any pattern); iPhone Safari has none,
// but since iOS 18 toggling a system switch (<input type="checkbox" switch>) gives the system's own
// light tick, so a hidden one is clicked instead — one tick, no length or strength. Both only work
// inside the user's own tap (call this from the pointer/click handler), and stay silent when the
// phone is set to no haptics. Elsewhere nothing happens.
export function haptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
      return
    }
    const label = document.createElement('label')
    label.ariaHidden = 'true'
    label.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.head.appendChild(label)
    label.click()
    label.remove()
  } catch {
    // a buzz is a nicety: never let it break the tap
  }
}

/** Android only: a buzz outside a tap (a fold passing under a dragging finger). iPhone has no way. */
export function hapticWhileDragging(ms: number): void {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ms)
  } catch {
    // never let it break the frame
  }
}
