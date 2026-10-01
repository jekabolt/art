// Embedded in another site (storefront hero, timeline block, footer): the sketch
// must not trap the host page's scroll. A full-screen `touch-action: none` canvas
// inside a full-viewport iframe swallows every swipe on a phone, and a
// non-passive wheel listener does the same to the mouse wheel on desktop.
// So inside an iframe vertical pans belong to the host page (they chain out of
// the non-scrollable iframe document), taps and sideways drags stay with the
// sketch, and wheel zoom/roll handlers are not installed.
export const EMBEDDED = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true // cross-origin parent access throws: that is embedding too
  }
})()

if (EMBEDDED) {
  document.documentElement.classList.add('embedded')
  const style = document.createElement('style')
  style.textContent = 'html.embedded, html.embedded * { touch-action: pan-y !important; }'
  document.head.appendChild(style)
}
