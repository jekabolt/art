import './style.css'

// Opened on its own, the page must not scroll: on a phone a swipe turns the mark, and the page
// bouncing and the browser bars sliding along with it made the turn jerk. Inside an iframe
// (storefront) vertical swipes still belong to the host page, so nothing is locked there.
const embedded = (() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})()
if (!embedded) {
  document.documentElement.classList.add('-locked')
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
}
import { Contents } from './parts/contents';

new Contents({
  el:document.body,
})
