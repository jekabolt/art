import { Con } from './con/con'
import { isWhiteLogo } from './core/route'
import './fonts/fonts.css'
import './style.css'

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

function init() {
  if (isWhiteLogo()) {
    // Add invert class to body for black background
    document.body.classList.add('invert')

    // Also set canvas background directly as fallback
    const canvas = document.querySelector<HTMLCanvasElement>('#js-con')
    if (canvas) {
      canvas.style.backgroundColor = '#000'
    }
  }

  new Con({
    el: document.querySelector<HTMLCanvasElement>('#js-con')
  })
}