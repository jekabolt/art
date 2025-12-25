import { Con } from './con/con'
import './style.css'

// Check if we're on the /invert path (handles both /invert and /invert/)
const pathname = window.location.pathname
const isInvertPath = pathname === '/invert' || pathname.startsWith('/invert/')

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

function init() {
  if (isInvertPath) {
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