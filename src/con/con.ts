import { Color } from 'three';
import { BufferAttribute } from 'three/src/core/BufferAttribute';
import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { Object3D } from 'three/src/core/Object3D';
import { RawShaderMaterial } from 'three/src/materials/RawShaderMaterial';
import { Vector3 } from "three/src/math/Vector3";
import { Points } from 'three/src/objects/Points';
import { Conf } from '../core/conf';
import { Func } from '../core/func';
import { Param } from '../core/param';
import meshFg from '../glsl/mesh.frag';
import meshVt from '../glsl/mesh.vert';
import { Util } from '../libs/util';
import { Canvas } from '../webgl/canvas';

export class Con extends Canvas {

  private _con: Object3D;
  private _mesh: Points | undefined;
  private _ang: number = 0;
  private _val: number = 0;
  private _totalRotation: number = 0; // Total rotation angle (can be negative or positive)
  private _color: Array<Color> = [];
  private _imgSize: number = 512;
  private _sample: Array<any> = [];
  private _currentImageIndex: number = 1; // 0-4 for sample-0.png through sample-4.png
  private _maxImageIndex: number = 4; // Maximum image index (sample-4.png)
  private _clickTimes: number[] = []; // Track click timestamps for triple-click detection
  private _tripleClickDelay: number = 400; // Milliseconds between clicks for triple-click
  private _oldAng: number = -1;
  private _touchStartX: number = 0;
  private _touchStartY: number = 0;
  private _isTouching: boolean = false;
  private _swipeSensitivity: number = 0.05; // How much rotation per pixel of swipe (reduced to prevent immediate wrapping)
  private _minSwipeDistance: number = 10; // Minimum pixels to move before registering swipe (increased)
  private _lastTouchX: number = 0; // Last touch position for incremental updates
  private _lastTouchY: number = 0; // Last touch position for incremental updates
  private _maxRotationPerFrame: number = 0.5; // Maximum degrees of rotation per frame (reduced to prevent immediate wrapping)
  private _lastInteractionTime: number = 0; // Timestamp of last user interaction
  private _autoReturnDelay: number = 3000; // Milliseconds before auto-return starts
  private _autoReturnSpeed: number = 0.05; // Speed of auto-return (lerp factor)

  constructor(opt: any) {
    super(opt);

    for (let i = 0; i < 10; i++) {
      this._color.push(new Color(Util.instance.random(0, 1), Util.instance.random(0, 1), Util.instance.random(0, 1)))
    }
    this._color[0] = new Color(1 - this._color[1].r, 1 - this._color[1].g, 1 - this._color[1].b)

    this._con = new Object3D()
    this.mainScene.add(this._con)

    // Initialize interaction timer
    this._lastInteractionTime = Date.now()

    // Swipe controls
    this._initSwipeControls()

    // 画像解析
    this._loadImg()

    this._resize()
  }

  private _initSwipeControls(): void {
    // Hide the permission button since we don't need device orientation
    document.querySelector('.l-btn')?.classList.add('-none')

    // Track touch start position for tap detection
    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0
    let hasMoved = false

    // Touch events
    this.el.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this._touchStartX = e.touches[0].clientX
        this._touchStartY = e.touches[0].clientY
        touchStartX = this._touchStartX
        touchStartY = this._touchStartY
        touchStartTime = Date.now()
        this._lastTouchX = this._touchStartX
        this._lastTouchY = this._touchStartY
        this._isTouching = true
        hasMoved = false
        this._lastInteractionTime = Date.now() // Reset interaction timer
      }
    }, { passive: true })

    this.el.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this._isTouching || e.touches.length === 0) return

      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY
      const deltaX = touchX - this._lastTouchX // Incremental movement since last frame
      const deltaY = touchY - this._lastTouchY // Incremental movement since last frame
      const totalDeltaX = touchX - this._touchStartX // Total movement from start
      const totalDeltaY = touchY - this._touchStartY // Total movement from start
      const totalDistance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

      // Only process if movement exceeds minimum threshold
      if (totalDistance > this._minSwipeDistance) {
        hasMoved = true // Mark that user has moved (not a tap)

        const absDeltaX = Math.abs(deltaX)
        const absDeltaY = Math.abs(deltaY)

        // Handle horizontal swipes (rotation)
        if (absDeltaX > absDeltaY && absDeltaX > 0) {
          // Convert incremental movement to rotation
          let rotationDelta = deltaX * this._swipeSensitivity

          // Clamp rotation delta to prevent sudden jumps
          rotationDelta = Math.max(-this._maxRotationPerFrame, Math.min(this._maxRotationPerFrame, rotationDelta))

          // Update total rotation (can be negative or positive)
          this._totalRotation += rotationDelta

          // Calculate wrapped angle from total rotation
          this._val = ((this._totalRotation % 360) + 360) % 360

          if (this._oldAng === -1) {
            this._oldAng = this._val
          }

          Param.instance.debug.innerHTML = 'swipe H: ' + Math.round(this._val) + '° (total: ' + Math.round(this._totalRotation) + '°)'
        }

        // Handle vertical swipes (rotation with wrap effect)
        // Top to bottom (positive deltaY) = right to left (negative rotation)
        // Bottom to top (negative deltaY) = left to right (positive rotation)
        if (absDeltaY > absDeltaX && absDeltaY > 0) {
          // Convert incremental movement to rotation (inverted for vertical)
          let rotationDelta = -deltaY * this._swipeSensitivity

          // Clamp rotation delta to prevent sudden jumps
          rotationDelta = Math.max(-this._maxRotationPerFrame, Math.min(this._maxRotationPerFrame, rotationDelta))

          // Update total rotation (can be negative or positive)
          this._totalRotation += rotationDelta

          // Calculate wrapped angle from total rotation
          this._val = ((this._totalRotation % 360) + 360) % 360

          if (this._oldAng === -1) {
            this._oldAng = this._val
          }

          Param.instance.debug.innerHTML = 'swipe V: ' + Math.round(this._val) + '° (total: ' + Math.round(this._totalRotation) + '°)'
        }

        this._lastInteractionTime = Date.now() // Reset interaction timer

        // Update last touch position for next incremental update
        this._lastTouchX = touchX
        this._lastTouchY = touchY
      }
    }, { passive: true })

    this.el.addEventListener('touchend', (e: TouchEvent) => {
      const touchEndTime = Date.now()
      const touchDuration = touchEndTime - touchStartTime
      const touchEndX = e.changedTouches[0]?.clientX || touchStartX
      const touchEndY = e.changedTouches[0]?.clientY || touchStartY
      const touchDistance = Math.sqrt(Math.pow(touchEndX - touchStartX, 2) + Math.pow(touchEndY - touchStartY, 2))

      this._isTouching = false

      // Only register as tap if no significant movement and short duration
      if (!hasMoved && touchDistance < 10 && touchDuration < 300) {
        this._handleTripleClick()
      }
    }, { passive: true })

    // Mouse events for desktop (drag)
    let isMouseDown = false
    let mouseStartX = 0
    let mouseStartY = 0
    let lastMouseX = 0
    let lastMouseY = 0
    let mouseHasMoved = false
    let mouseStartTime = 0
    let isFirstMouseMove = false

    this.el.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault() // Prevent text selection and other default behaviors
      isMouseDown = true
      mouseStartX = e.clientX
      mouseStartY = e.clientY
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      mouseHasMoved = false
      mouseStartTime = Date.now()
      isFirstMouseMove = true // Flag to handle first move specially
      this._lastInteractionTime = Date.now() // Reset interaction timer
    })

    this.el.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isMouseDown) return
      e.preventDefault() // Prevent text selection during drag

      const mouseX = e.clientX
      const mouseY = e.clientY
      const deltaX = mouseX - lastMouseX // Incremental movement since last frame
      const deltaY = mouseY - lastMouseY // Incremental movement since last frame
      const totalDeltaX = mouseX - mouseStartX // Total movement from start
      const totalDeltaY = mouseY - mouseStartY // Total movement from start
      const totalDistance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

      // Only process if movement exceeds minimum threshold
      if (totalDistance > this._minSwipeDistance) {
        mouseHasMoved = true // Mark that user has moved (not a click)

        const absDeltaX = Math.abs(deltaX)
        const absDeltaY = Math.abs(deltaY)

        // Handle horizontal swipes (rotation)
        if (absDeltaX > absDeltaY && absDeltaX > 0) {
          // On first move, if delta is too large, reset tracking to prevent jumps
          if (isFirstMouseMove) {
            if (Math.abs(deltaX) > 20) {
              // Large initial jump, reset tracking
              lastMouseX = mouseX
              lastMouseY = mouseY
              isFirstMouseMove = false
              return
            }
            isFirstMouseMove = false
          }

          // Convert incremental movement to rotation
          let rotationDelta = deltaX * this._swipeSensitivity

          // Additional check: if delta is suspiciously large, reset last position to prevent jumps
          if (Math.abs(deltaX) > 30) {
            // Large jump detected, reset tracking to current position
            lastMouseX = mouseX
            lastMouseY = mouseY
            return
          }

          // Clamp rotation delta to prevent sudden jumps (more restrictive for desktop)
          rotationDelta = Math.max(-this._maxRotationPerFrame, Math.min(this._maxRotationPerFrame, rotationDelta))

          // Only apply rotation if delta is meaningful (prevent micro-movements from accumulating)
          if (Math.abs(rotationDelta) < 0.05) {
            // Update position but don't apply rotation for very small movements
            lastMouseX = mouseX
            lastMouseY = mouseY
            return
          }

          // Update total rotation (can be negative or positive)
          this._totalRotation += rotationDelta

          // Calculate wrapped angle from total rotation
          this._val = ((this._totalRotation % 360) + 360) % 360

          if (this._oldAng === -1) {
            this._oldAng = this._val
          }

          Param.instance.debug.innerHTML = 'drag H: ' + Math.round(this._val) + '° (total: ' + Math.round(this._totalRotation) + '°)'
        }

        // Handle vertical swipes (rotation with wrap effect)
        // Top to bottom (positive deltaY) = right to left (negative rotation)
        // Bottom to top (negative deltaY) = left to right (positive rotation)
        if (absDeltaY > absDeltaX && absDeltaY > 0) {
          // On first move, if delta is too large, reset tracking to prevent jumps
          if (isFirstMouseMove) {
            if (Math.abs(deltaY) > 20) {
              // Large initial jump, reset tracking
              lastMouseX = mouseX
              lastMouseY = mouseY
              isFirstMouseMove = false
              return
            }
            isFirstMouseMove = false
          }

          // Convert incremental movement to rotation (inverted for vertical)
          let rotationDelta = -deltaY * this._swipeSensitivity

          // Additional check: if delta is suspiciously large, reset last position to prevent jumps
          if (Math.abs(deltaY) > 30) {
            // Large jump detected, reset tracking to current position
            lastMouseX = mouseX
            lastMouseY = mouseY
            return
          }

          // Clamp rotation delta to prevent sudden jumps (more restrictive for desktop)
          rotationDelta = Math.max(-this._maxRotationPerFrame, Math.min(this._maxRotationPerFrame, rotationDelta))

          // Only apply rotation if delta is meaningful (prevent micro-movements from accumulating)
          if (Math.abs(rotationDelta) < 0.05) {
            // Update position but don't apply rotation for very small movements
            lastMouseX = mouseX
            lastMouseY = mouseY
            return
          }

          // Update total rotation (can be negative or positive)
          this._totalRotation += rotationDelta

          // Calculate wrapped angle from total rotation
          this._val = ((this._totalRotation % 360) + 360) % 360

          if (this._oldAng === -1) {
            this._oldAng = this._val
          }

          Param.instance.debug.innerHTML = 'drag V: ' + Math.round(this._val) + '° (total: ' + Math.round(this._totalRotation) + '°)'
        }

        this._lastInteractionTime = Date.now() // Reset interaction timer

        // Update last mouse position for next incremental update (always update to prevent accumulation)
        lastMouseX = mouseX
        lastMouseY = mouseY
      } else {
        // Even if below threshold, update last position to prevent large jumps when threshold is exceeded
        lastMouseX = mouseX
        lastMouseY = mouseY
      }
    })

    this.el.addEventListener('mouseup', (e: MouseEvent) => {
      if (!isMouseDown) return

      const mouseEndTime = Date.now()
      const mouseDuration = mouseEndTime - mouseStartTime
      const mouseEndX = e.clientX
      const mouseEndY = e.clientY
      const mouseDistance = Math.sqrt(Math.pow(mouseEndX - mouseStartX, 2) + Math.pow(mouseEndY - mouseStartY, 2))

      isMouseDown = false

      // Only register as click if no significant movement and short duration
      if (!mouseHasMoved && mouseDistance < 10 && mouseDuration < 300) {
        this._handleTripleClick()
      }
    })

    this.el.addEventListener('mouseleave', (e: MouseEvent) => {
      if (isMouseDown) {
        // Treat mouse leave as mouse up
        const mouseEndTime = Date.now()
        const mouseDuration = mouseEndTime - mouseStartTime
        const mouseEndX = e.clientX
        const mouseEndY = e.clientY
        const mouseDistance = Math.sqrt(Math.pow(mouseEndX - mouseStartX, 2) + Math.pow(mouseEndY - mouseStartY, 2))

        isMouseDown = false

        // Only register as click if no significant movement and short duration
        if (!mouseHasMoved && mouseDistance < 10 && mouseDuration < 300) {
          this._handleTripleClick()
        }
      }
    })

    // Prevent context menu on right click
    this.el.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
    })
  }

  private _loadImg(imageIndex?: number): void {
    // Clear previous data
    this._sample = []

    // Remove old mesh if it exists
    if (this._mesh) {
      this._con.remove(this._mesh)
      this._mesh = undefined
    }

    // Use provided index or current index
    if (imageIndex !== undefined) {
      this._currentImageIndex = imageIndex
    }

    const img = new Image();
    img.src = Conf.instance.PATH_IMG + `sample-${this._currentImageIndex}.png`

    img.onload = () => {
      const cvs: any = document.createElement('canvas');
      cvs.width = cvs.height = this._imgSize;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0);
      img.style.display = 'none';

      const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const key = ~~(i / 4)
        const ix = ~~(key % cvs.width)
        const iy = ~~(key / cvs.width)
        const r = data[i + 0] // 0 ~ 255
        const g = data[i + 1] // 0 ~ 255
        const b = data[i + 2] // 0 ~ 255
        const a = data[i + 3] // 0 ~ 255

        const kake = 1
        if (a > 0) {
          this._sample.push({
            color: new Color(r / 255, g / 255, b / 255),
            pos: new Vector3(
              (ix - this._imgSize * 0.5) * kake,
              ((iy - this._imgSize * 0.5) * -1) * kake,
              0
            )
          })
        }
      }
      console.log(this._sample.length);
      this._makeMesh();
    }
  }

  private _handleTripleClick(): void {
    const now = Date.now()

    // Remove clicks older than the delay window
    this._clickTimes = this._clickTimes.filter(time => now - time < this._tripleClickDelay)

    // Add current click
    this._clickTimes.push(now)

    // Check if we have 3 clicks within the delay window
    if (this._clickTimes.length >= 3) {
      // Select random image (excluding current one)
      let newImageIndex: number
      do {
        newImageIndex = Math.floor(Util.instance.random(0, this._maxImageIndex + 1)) // 0-4 inclusive
      } while (newImageIndex === this._currentImageIndex && this._maxImageIndex > 0) // Only loop if there are other images available

      this._currentImageIndex = newImageIndex
      this._loadImg()
      this._clickTimes = [] // Reset click counter

      Param.instance.debug.innerHTML = `Switched to sample-${this._currentImageIndex}.png`
    }
  }

  private _makeMesh(): void {
    this._mesh = new Points(
      this.getGeo(),
      new RawShaderMaterial({
        vertexShader: meshVt,
        fragmentShader: meshFg,
        transparent: true,
        depthTest: false,
        uniforms: {
          alpha: { value: 0 },
          size: { value: 2 },
          time: { value: 0 },
          ang: { value: 0 },
        }
      })
    )
    this._con.add(this._mesh)
  }

  protected _update(): void {
    super._update()
    this._con.position.y = Func.instance.screenOffsetY() * -1

    // Disabled auto-rotation - rotation only happens via user input
    // if (Conf.instance.FLG_TEST) {
    //   // Test mode - auto rotate
    //   this._oldAng = this._val
    //   this._totalRotation += 2
    //   // Calculate wrapped angle and rotation count from total rotation
    //   this._val = ((this._totalRotation % 360) + 360) % 360
    //   this._rotCnt = Math.floor(this._totalRotation / 360)
    // } else {
    if (true) {
      // Auto-return to initial state after inactivity
      const currentTime = Date.now()
      const timeSinceLastInteraction = currentTime - this._lastInteractionTime

      if (timeSinceLastInteraction > this._autoReturnDelay) {
        // Smoothly return rotation to 0
        if (Math.abs(this._totalRotation) > 0.1) {
          this._totalRotation += (0 - this._totalRotation) * this._autoReturnSpeed
          // Calculate wrapped angle from total rotation
          this._val = ((this._totalRotation % 360) + 360) % 360
        }
      }
    }

    if (this._mesh != undefined) {
      const s = Func.instance.r(3)
      this._mesh.scale.set(s, s, 1)

      this._setUni(this._mesh, 'size', 5)

      // Use total rotation directly (already includes full rotations)
      const ang = this._totalRotation;
      this._ang += (ang - this._ang) * 0.1
      this._setUni(this._mesh, 'ang', Util.instance.radian(this._ang))
    }

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }

  private _render(): void {
    const bgColor = 0xffffff
    this.renderer.setClearColor(bgColor, 1)
    this.renderer.render(this.mainScene, this.camera)
  }

  public isNowRenderFrame(): boolean {
    return this.isRender
  }

  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    if (Conf.instance.IS_SP || Conf.instance.IS_TAB) {
      if (w == this.renderSize.width && this.renderSize.height * 2 > h) {
        return
      }
    }

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }

  // ---------------------------------
  //
  // ---------------------------------
  public getGeo(): BufferGeometry {
    const num = this._sample.length

    const geometry = new BufferGeometry()

    const translate = new Float32Array(num * 3)
    const info = new Float32Array(num * 3)
    const color = new Float32Array(num * 3)

    let pKey = 0
    let i = 0
    while (i < num) {
      const p = this._sample[i].pos
      const col = this._sample[i].color

      translate[pKey * 3 + 0] = p.x
      translate[pKey * 3 + 1] = p.y
      translate[pKey * 3 + 2] = 0

      info[pKey * 3 + 0] = Math.sqrt(p.x * p.x + p.y * p.y)
      info[pKey * 3 + 1] = 0
      info[pKey * 3 + 2] = 0

      color[pKey * 3 + 0] = col.r
      color[pKey * 3 + 1] = col.g
      color[pKey * 3 + 2] = col.b

      pKey++
      i++
    }

    geometry.setAttribute('position', new BufferAttribute(translate, 3))
    geometry.setAttribute('info', new BufferAttribute(info, 3))
    geometry.setAttribute('color', new BufferAttribute(color, 3))
    geometry.computeBoundingSphere()

    return geometry
  }
}
