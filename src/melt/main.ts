// MELT (after the grbpwr × melt logo, 02.10.2023): the white logo on black. Moving the pointer or a
// finger leaves a trail in a velocity field; the field smears the logo along the motion, lets it drip
// down a little, splits the colour channels and lights the smear with an oil-film rainbow. The trail
// spreads and fades on its own, so the logo sets back into shape when left alone.
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { Vector2 } from 'three/src/math/Vector2'
import { HalfFloatType, LinearFilter, RGBAFormat } from 'three/src/constants'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './melt.css'

/** The logo in white on a transparent square of `px`; small sizes, stretched, give the soft copy. */
function logoTexture(px: number): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  const k = px / LOGO_SPAN
  g.scale(k, k)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
  const t = new CanvasTexture(c)
  t.minFilter = t.magFilter = LinearFilter
  t.generateMipmaps = false
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
const FIELD_SCALE = 0.25 // field resolution relative to the screen
const targetOpts = { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false }
let fieldA = new WebGLRenderTarget(4, 4, targetOpts)
let fieldB = new WebGLRenderTarget(4, 4, targetOpts)

const fieldMat = new ShaderMaterial({
  uniforms: {
    prev: { value: null },
    texel: { value: new Vector2() },
    aspect: { value: 1 },
    from: { value: new Vector2(-9, -9) },
    to: { value: new Vector2(-9, -9) },
    vel: { value: new Vector2() },
    radius: { value: 0.07 },
    fade: { value: 0.972 },
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
      // spread a little into the neighbours (the smear widens as it fades), then fade
      vec2 v = texture2D(prev, vUv).xy * 0.6
        + (texture2D(prev, vUv + vec2(texel.x, 0.0)).xy
         + texture2D(prev, vUv - vec2(texel.x, 0.0)).xy
         + texture2D(prev, vUv + vec2(0.0, texel.y)).xy
         + texture2D(prev, vUv - vec2(0.0, texel.y)).xy) * 0.1;
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

// --- display: the logo read through the field -----------------------------------------------------
const showMat = new ShaderMaterial({
  uniforms: {
    field: { value: null },
    logo: { value: logoTexture(2048) },
    soft: { value: logoTexture(96) },
    aspect: { value: 1 },
    side: { value: 0.5 }, // logo side in screen heights
    time: { value: 0 },
  },
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D field;
    uniform sampler2D logo;
    uniform sampler2D soft;
    uniform float aspect;
    uniform float side;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 17853.77); }

    // oil-film rainbow: a cosine palette running through time and across the logo
    vec3 film(float t) { return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67))); }

    float ink(sampler2D tex, vec2 uv) {
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
      return texture2D(tex, uv).a;
    }

    void main() {
      vec2 v = texture2D(field, vUv).xy;
      float m = clamp(length(v), 0.0, 1.0);

      // screen → logo square
      vec2 luv = (vUv - 0.5) * vec2(aspect, 1.0) / side + 0.5;

      // smear against the motion, drip down, grain where it is disturbed, and a slow breathing
      // so the logo is never quite still
      vec2 off = -v * 0.22;
      off.y += m * m * 0.07;
      off += (hash(luv * 512.0 + fract(time)) - 0.5) * 0.025 * m;
      off += 0.0025 * vec2(sin(luv.y * 7.0 + time * 0.7), cos(luv.x * 6.0 + time * 0.5));
      vec2 p = luv + off;

      // channel split, strongest where the field is
      float split = sin((luv.x + luv.y) * 18.0) * 0.035 * m;
      vec3 col = vec3(
        ink(logo, p + vec2(split * sin(time * 2.0), 0.0)),
        ink(logo, p),
        ink(logo, p - vec2(split * sin(time + luv.x), 0.0))
      );

      // the rainbow, only in the smear: it tints the ink and glows in a halo around it
      vec3 rainbow = film(time * 0.4 + luv.x * luv.y * 1.5 + m * 0.5);
      float glow = ink(soft, p);
      col = mix(col, col * rainbow, clamp(glow * m * 1.4, 0.0, 0.85));
      col += max(glow - col.g, 0.0) * rainbow * m * 2.2;

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
  fieldMat.uniforms.aspect.value = w / h
  showMat.uniforms.aspect.value = w / h
  // as wide as the mark on the logo pages: about half the width on phones, a third on desktop
  const sidePx = Math.min(w <= 768 ? 0.6 * w : 0.3 * w, 0.6 * h)
  showMat.uniforms.side.value = sidePx / h
  fieldMat.uniforms.radius.value = (w <= 768 ? 0.09 : 0.06) * (sidePx / h) * 2
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

  showMat.uniforms.field.value = fieldA.texture
  showMat.uniforms.time.value = now / 1000
  renderer.clear()
  renderer.render(showScene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
requestAnimationFrame(frame)
