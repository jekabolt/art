import { useEffect, useRef, useState } from 'react';
import './styles.css';

export default function App(): JSX.Element {
  // Slit-scan effect refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const sliceXRef = useRef(0);
  const sliceYRef = useRef(0);
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  const slitWidth = 2; // or your preferred default
  const direction = 'vertical'; // or 'horizontal'
  const speed = 1; // or your preferred default

  // No dynamic canvas size; always 640x480
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Save image handler
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw logo onto canvas
    const logo = logoImgRef.current;
    if (logo && logo.complete) {
      const margin = 12;
      let logoWidth = logo.naturalWidth;
      let logoHeight = logo.naturalHeight;
      const maxWidth = 120;
      const maxHeight = 48;

      // Scale logo to fit within max dimensions, preserving aspect ratio
      if (logoWidth > maxWidth) {
        const scale = maxWidth / logoWidth;
        logoWidth = maxWidth;
        logoHeight = logoHeight * scale;
      }
      if (logoHeight > maxHeight) {
        const scale = maxHeight / logoHeight;
        logoHeight = maxHeight;
        logoWidth = logoWidth * scale;
      }

      ctx.save();
      ctx.drawImage(
        logo,
        canvas.width - logoWidth - margin,
        canvas.height - logoHeight - margin,
        logoWidth,
        logoHeight
      );
      ctx.restore();
    }

    // Save image
    const url = canvas.toDataURL('image/png');
    if (isIOS() || window.innerWidth <= 600) {
      // On mobile: overlay and stop video
      setOverlayUrl(url);
      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'slit-scan.png';
      a.click();
    }
  };

  // Dismiss overlay and restart video
  const handleOverlayDismiss = () => {
    setOverlayUrl(null);
    // Restart video stream
    if (!videoRef.current) return;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        streamRef.current = s;
        videoRef.current!.srcObject = s;
        videoRef.current!.play();
      })
      .catch(err => {
        console.error('Webcam error:', err);
      });
  };

  useEffect(() => {
    // Get webcam
    const video = videoRef.current;
    if (!video) return;
    let stream: MediaStream;
    let running = true;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        streamRef.current = s;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error('Webcam error:', err);
      });

    return () => {
      running = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Offscreen buffer for current video frame
    let offscreen = offscreenRef.current;
    if (!offscreen) {
      offscreen = document.createElement('canvas');
      offscreenRef.current = offscreen;
    }
    const width = 640, height = 480;
    canvas.width = width;
    canvas.height = height;
    offscreen.width = width;
    offscreen.height = height;
    sliceXRef.current = 0;
    sliceYRef.current = 0;
    frameCountRef.current = 0;

    function draw() {
      if (!video || !offscreen || !ctx) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      if (video.readyState < 2) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      // Draw current frame to offscreen, mirrored horizontally
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      offCtx.save();
      offCtx.setTransform(-1, 0, 0, 1, width, 0);
      offCtx.drawImage(video, 0, 0, width, height);
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.restore();
      // Convert offscreen buffer to grayscale
      const imgData = offCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const contrast = 2.0; // 2.0 = strong contrast
      for (let i = 0; i < data.length; i += 4) {
        // Luminance formula: 0.299*R + 0.587*G + 0.114*B
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Apply contrast
        const contrasted = Math.max(0, Math.min(255, (lum - 128) * contrast + 128));
        data[i] = data[i + 1] = data[i + 2] = contrasted;
      }
      offCtx.putImageData(imgData, 0, 0);
      const percent = 0.2; // 20% for live
      if (direction === 'vertical') {
        const liveLimit = Math.floor(width * percent);
        // Draw live video on the leftmost 10% from offscreen buffer
        ctx.drawImage(offscreen, 0, 0, liveLimit, height, 0, 0, liveLimit, height);
        // Shift effect region right by 1px
        if (canvas) {
          ctx.drawImage(
            canvas,
            liveLimit, 0, width - liveLimit - 1, height, // src
            liveLimit + 1, 0, width - liveLimit - 1, height // dest
          );
        }
        // Copy last column of live region to first column of effect region
        const col = ctx.getImageData(liveLimit - 1, 0, 1, height);
        ctx.putImageData(col, liveLimit, 0);
      } else {
        const liveLimit = Math.floor(height * percent);
        // Draw live video on the top 10% from offscreen buffer
        ctx.drawImage(offscreen, 0, 0, width, liveLimit, 0, 0, width, liveLimit);
        // Shift effect region down by 1px
        if (canvas) {
          ctx.drawImage(
            canvas,
            0, liveLimit, width, height - liveLimit - 1, // src
            0, liveLimit + 1, width, height - liveLimit - 1 // dest
          );
        }
        // Copy last row of live region to first row of effect region
        const row = ctx.getImageData(0, liveLimit - 1, width, 1);
        ctx.putImageData(row, 0, liveLimit);
      }
      animationRef.current = requestAnimationFrame(draw);
    }
    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [slitWidth, direction, speed]);

  useEffect(() => {
    const img = new window.Image();
    img.src = '/logo-50k.jpg';
    logoImgRef.current = img;
  }, []);

  return (
    <div className="app-root" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      minWidth: '100vw',
      background: '#000',
      overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 640,
            aspectRatio: '4 / 3',
            background: '#000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              background: '#000',
              width: '100%',
              aspectRatio: '4 / 3',
              border: 'none',
              outline: 'none',
              display: 'block',
              maxWidth: 640,
            }}
            width={640}
            height={480}
          />
          <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
          {overlayUrl && (
            <div
              onClick={handleOverlayDismiss}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                aspectRatio: '4 / 3',
                maxWidth: 640,
                height: 'auto',
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                cursor: 'pointer',
              }}
            >
              <img
                src={overlayUrl}
                alt="Saved PNG"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 8,
                  boxShadow: '0 2px 16px #000a',
                  background: '#fff',
                  display: 'block',
                  aspectRatio: '4 / 3',
                  maxWidth: 640,
                }}
              />
            </div>
          )}
        </div>
        <div
          style={{
            width: 640,
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 12,
          }}
        >
          <img
            src="/logo-50k.jpg"
            alt="Save"
            onClick={handleSave}
            style={{
              cursor: 'pointer',
              maxWidth: 120,
              maxHeight: 48,
              objectFit: 'contain',
              borderRadius: 6,
              boxShadow: '0 2px 8px #000a',
              background: '#fff',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
} 