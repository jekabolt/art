// The front camera as a playing <video> (muted, inline — iPhone Safari plays nothing else), asked
// for from a button so the permission prompt comes when the visitor asks for it.
export async function startCamera(): Promise<HTMLVideoElement> {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  })
  video.srcObject = stream
  await video.play()
  return video
}

/** Source rect of the video that covers a w × h box (centre crop). */
export function coverRect(video: HTMLVideoElement, w: number, h: number): [number, number, number, number] {
  const vw = video.videoWidth
  const vh = video.videoHeight
  const s = Math.max(w / vw, h / vh)
  const sw = w / s
  const sh = h / s
  return [(vw - sw) / 2, (vh - sh) / 2, sw, sh]
}

/** A button that starts the camera; hidden inside a frame (no camera there) or without the API. */
export function cameraButton(onVideo: (v: HTMLVideoElement) => void, embedded: boolean): HTMLButtonElement {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'cam'
  b.textContent = 'turn on camera'
  if (embedded || !navigator.mediaDevices?.getUserMedia) b.hidden = true
  b.addEventListener('click', async () => {
    b.textContent = 'starting…'
    try {
      onVideo(await startCamera())
      b.hidden = true
    } catch (err) {
      b.textContent = (err as { name?: string })?.name === 'NotAllowedError' ? 'camera not allowed' : 'no camera'
    }
  })
  document.body.appendChild(b)
  return b
}
