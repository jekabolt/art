// MELT (after the grbpwr × melt logo, 02.10.2023): the white logo on black. Moving the pointer or a
// finger leaves a trail in a velocity field; the field smears the logo along the motion, lets it drip
// down a little, splits the colour channels and lights the smear with an oil-film rainbow. The trail
// spreads and fades on its own, so the logo sets back into shape when left alone.
import '../core/embed'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { Vector2 } from 'three/src/math/Vector2'
import { HalfFloatType, LinearFilter, LinearMipmapLinearFilter, RGBAFormat } from 'three/src/constants'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './melt.css'

/** Empty margin around the logo in its texture, per side: the smear flows out past the mark instead
 *  of being cut off by the square (a cut edge reads as an outline). */
const PAD = 0.2

/** The logo in white on a transparent square of `px` (a power of two); a small one, stretched, is
 *  the blurred copy. */
function logoTexture(px: number): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const k = (px * (1 - 2 * PAD)) / LOGO_SPAN
  g.translate(px * PAD, px * PAD)
  g.scale(k, k)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
  const t = new CanvasTexture(c)
  // mipmapped: the 2048 logo is shown at a few hundred px, and plain linear sampling would alias
  t.minFilter = LinearMipmapLinearFilter
  t.magFilter = LinearFilter
  return t
}

const canvas = document.getElementById('melt') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false })
renderer.setClearColor(0x000000, 1)
renderer.autoClear = false

const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
const quad = new PlaneGeometry(2, 2)
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// --- velocity field: ping-pong targets, spread + fade + a splat along the pointer segment ----------
const FADE_PER_60FPS_FRAME = 0.982
const FIELD_SCALE = 0.25 // field resolution relative to the screen
const targetOpts = { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false }
let fieldA = new WebGLRenderTarget(4, 4, targetOpts)
let fieldB = new WebGLRenderTarget(4, 4, targetOpts)
const fieldSoft = new WebGLRenderTarget(4, 4, targetOpts)

const fieldMat = new ShaderMaterial({
  uniforms: {
    prev: { value: null },
    texel: { value: new Vector2() },
    aspect: { value: 1 },
    from: { value: new Vector2(-9, -9) },
    to: { value: new Vector2(-9, -9) },
    vel: { value: new Vector2() },
    radius: { value: 0.07 },
    fade: { value: 0.972 }, // set every frame from FADE_PER_60FPS_FRAME
  },
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D prev;
    uniform vec2 texel;
    uniform float aspect;
    uniform vec2 from;
    uniform vec2 to;
    uniform vec2 vel;
    uniform float radius;
    uniform float fade;
    varying vec2 vUv;

    // distance from p to the segment a..b, in screen-height units
    float segDist(vec2 p, vec2 a, vec2 b) {
      vec2 s = vec2(aspect, 1.0);
      p *= s; a *= s; b *= s;
      vec2 ab = b - a;
      float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
      return length(p - a - ab * h);
    }

    void main() {
      // the field carries itself along (a stroke keeps flowing like syrup), spreads into the
      // neighbours (the smear widens and softens as it goes), then fades
      vec2 back = vUv - texture2D(prev, vUv).xy * texel * 5.0;
      vec2 v = texture2D(prev, back).xy * 0.4
        + (texture2D(prev, back + vec2(texel.x, 0.0)).xy
         + texture2D(prev, back - vec2(texel.x, 0.0)).xy
         + texture2D(prev, back + vec2(0.0, texel.y)).xy
         + texture2D(prev, back - vec2(0.0, texel.y)).xy) * 0.15;
      v *= fade;
      float d = segDist(vUv, from, to);
      v += vel * exp(-(d * d) / (radius * radius));
      float m = length(v);
      if (m > 1.0) v /= m;
      if (m < 0.004) v = vec2(0.0); // the last trace snaps back instead of lingering
      gl_FragColor = vec4(v, 0.0, 1.0);
    }
  `,
})
const fieldScene = new Scene()
fieldScene.add(new Mesh(quad, fieldMat))

// the field through a wide soft kernel, at field resolution: the smear then has no hard rim where it
// folds, for the price of a small pass instead of 25 taps per screen pixel
const blurMat = new ShaderMaterial({
  uniforms: { src: { value: null }, texel: { value: new Vector2() } },
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D src;
    uniform vec2 texel;
    varying vec2 vUv;
    void main() {
      vec2 v = vec2(0.0);
      float wsum = 0.0;
      for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
          float w = exp(-float(i * i + j * j) / 4.0);
          v += texture2D(src, vUv + vec2(float(i), float(j)) * texel * 2.0).xy * w;
          wsum += w;
        }
      }
      gl_FragColor = vec4(v / wsum, 0.0, 1.0);
    }
  `,
})
const blurScene = new Scene()
blurScene.add(new Mesh(quad, blurMat))

// --- display: the logo read through the field -----------------------------------------------------
const showMat = new ShaderMaterial({
  uniforms: {
    field: { value: null },
    logo: { value: logoTexture(2048) },
    goo: { value: logoTexture(256) },
    aspect: { value: 1 },
    side: { value: 0.5 }, // texture side (logo + PAD) in screen heights
    time: { value: 0 },
  },
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D field;
    uniform sampler2D logo;
    uniform sampler2D goo;
    uniform float aspect;
    uniform float side;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 17853.77); }

    // oil-film rainbow: a cosine palette running through time and across the logo
    vec3 film(float t) { return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67))); }

    // sample first, mask after: a texture read inside a branch has no reliable derivatives, and on
    // real GPUs the square's edge then picks the smallest mip (the logo's average) — a dashed frame
    float ink(sampler2D tex, vec2 uv) {
      float a = texture2D(tex, uv).a;
      vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
      return a * inside.x * inside.y;
    }

    // the ink turns to goo where it is disturbed: the crisp mark gives way to a blurred copy cut at
    // half, which rounds every corner and fuses nearby strokes like melting wax
    float melt(vec2 uv, float m) {
      float sharp = ink(logo, uv);
      float blob = smoothstep(0.32, 0.62, ink(goo, uv));
      return mix(sharp, blob, smoothstep(0.0, 0.45, m));
    }

    void main() {
      vec2 v = texture2D(field, vUv).xy;
      float m = clamp(length(v), 0.0, 1.0);

      // screen → logo square
      vec2 luv = (vUv - 0.5) * vec2(aspect, 1.0) / side + 0.5;

      // smear against the motion, drip down, grain where it is disturbed, and a slow breathing so
      // the logo is never quite still
      vec2 off = -v * 0.17;
      off.y += m * m * 0.06;
      off += (hash(luv * 512.0 + fract(time)) - 0.5) * 0.025 * m;
      off += 0.0025 * vec2(sin(luv.y * 7.0 + time * 0.7), cos(luv.x * 6.0 + time * 0.5));
      vec2 p = luv + off;

      // channel split, strongest where the field is
      float split = sin((luv.x + luv.y) * 12.0) * 0.022 * m;
      vec3 col = vec3(
        melt(p + vec2(split * sin(time * 2.0), 0.0), m),
        melt(p, m),
        melt(p - vec2(split * sin(time + luv.x), 0.0), m)
      );

      // the rainbow, only in the smear and only on the ink itself (a halo around it outlines the mark)
      vec3 rainbow = film(time * 0.4 + luv.x * luv.y * 1.5 + m * 0.5);
      col = mix(col, col * rainbow, clamp(m * 1.4, 0.0, 0.85));

      gl_FragColor = vec4(min(col, 1.0), 1.0);
    }
  `,
})
const showScene = new Scene()
showScene.add(new Mesh(quad, showMat))

// --- size -------------------------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  const fw = Math.max(8, Math.round(w * dpr * FIELD_SCALE))
  const fh = Math.max(8, Math.round(h * dpr * FIELD_SCALE))
  fieldA.setSize(fw, fh)
  fieldB.setSize(fw, fh)
  fieldMat.uniforms.texel.value.set(1 / fw, 1 / fh)
  fieldSoft.setSize(fw, fh)
  blurMat.uniforms.texel.value.set(1 / fw, 1 / fh)
  fieldMat.uniforms.aspect.value = w / h
  showMat.uniforms.aspect.value = w / h
  // as wide as the mark on the logo pages: about half the width on phones, a third on desktop
  const sidePx = Math.min(w <= 768 ? 0.6 * w : 0.3 * w, 0.6 * h)
  showMat.uniforms.side.value = sidePx / h / (1 - 2 * PAD)
  fieldMat.uniforms.radius.value = (w <= 768 ? 0.12 : 0.09) * (sidePx / h) * 2
}

// --- input ------------------------------------------------------------------------------------------
const pointer = { x: -9, y: -9, px: -9, py: -9, active: false }
const toUv = (e: PointerEvent) => [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight]

canvas.addEventListener('pointerdown', (e) => {
  const [x, y] = toUv(e)
  pointer.x = pointer.px = x
  pointer.y = pointer.py = y
  pointer.active = true
})
canvas.addEventListener('pointermove', (e) => {
  const [x, y] = toUv(e)
  if (!pointer.active) {
    // first move of a mouse: start the trail here instead of from the corner
    pointer.px = x
    pointer.py = y
    pointer.active = true
  }
  pointer.x = x
  pointer.y = y
})
const end = (e: PointerEvent) => {
  if (e.pointerType !== 'mouse') pointer.active = false
}
canvas.addEventListener('pointerup', end)
canvas.addEventListener('pointercancel', end)
canvas.addEventListener('pointerleave', () => (pointer.active = false))

// --- loop -------------------------------------------------------------------------------------------
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now

  const u = fieldMat.uniforms
  // fade by time, not by frame, so a slow phone clears the smear as fast as a fast screen
  u.fade.value = Math.pow(FADE_PER_60FPS_FRAME, dt * 60)
  if (pointer.active && (pointer.x !== pointer.px || pointer.y !== pointer.py)) {
    const aspect = u.aspect.value as number
    // velocity in screen heights per frame at 60 fps, gained so a brisk swipe saturates
    const k = 60 * dt > 0 ? 1 / (60 * dt) : 1
    u.vel.value.set((pointer.x - pointer.px) * aspect * k * 9, (pointer.y - pointer.py) * k * 9)
    u.from.value.set(pointer.px, pointer.py)
    u.to.value.set(pointer.x, pointer.y)
  } else {
    u.vel.value.set(0, 0)
    u.from.value.set(-9, -9)
    u.to.value.set(-9, -9)
  }
  pointer.px = pointer.x
  pointer.py = pointer.y

  u.prev.value = fieldA.texture
  renderer.setRenderTarget(fieldB)
  renderer.render(fieldScene, camera)
  renderer.setRenderTarget(null)
  ;[fieldA, fieldB] = [fieldB, fieldA]

  blurMat.uniforms.src.value = fieldA.texture
  renderer.setRenderTarget(fieldSoft)
  renderer.render(blurScene, camera)
  renderer.setRenderTarget(null)

  showMat.uniforms.field.value = fieldSoft.texture
  showMat.uniforms.time.value = now / 1000
  renderer.clear()
  renderer.render(showScene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
