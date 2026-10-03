// FLARE: a light behind the logo. The mark is a dark stencil; the light comes through its empty
// cells and round its edge and spreads in rays through the air (screen-space light scattering:
// each pixel gathers the light along its line to the source). The rays split a little into colour
// at their ends, as in a lens. The light follows the finger (or the mouse) a short way and drifts
// back; a tap is a flash: the light flares, the rays shoot long, a flat streak crosses the source
// and lens ghosts — rings and hexagons — flash along the line from the light through the tap.
import '../core/embed'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { LinearFilter } from 'three/src/constants'
import { Vector2 } from 'three/src/math/Vector2'
import { EMBEDDED } from '../core/embed'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './flare.css'

const LOOK = {
  markXs: 0.62, // mark width / screen width on a phone
  markLg: 0.32, // … on a desktop
  reach: 0.38, // how far the light may follow the finger, in mark widths
  samples: 40, // steps along each pixel's line to the light
}

// --- the stencil: the logo's strokes, white on transparent ---------------------------------------
const MASK = 1024
const maskCanvas = document.createElement('canvas')
maskCanvas.width = maskCanvas.height = MASK
{
  const g = maskCanvas.getContext('2d')!
  g.scale(MASK / LOGO_SPAN, MASK / LOGO_SPAN)
  g.translate(-LOGO_MIN, -LOGO_MIN)
  g.lineWidth = LOGO_STROKE
  g.strokeStyle = '#fff'
  g.stroke(new Path2D(LOGO_PATH))
}
const maskTex = new CanvasTexture(maskCanvas)
maskTex.minFilter = LinearFilter
maskTex.generateMipmaps = false

// --- the picture ---------------------------------------------------------------------------------------
const canvas = document.getElementById('flare') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  resolution: { value: new Vector2() },
  centre: { value: new Vector2() }, // the mark's centre, device px (y up)
  side: { value: 1 }, // the mark's width, device px
  light: { value: new Vector2() }, // the source, device px
  tapDir: { value: new Vector2(1, 0) }, // ghosts run from the light along this
  flash: { value: 0 }, // seconds since the last tap
  time: { value: 0 },
  mask: { value: maskTex },
}

const material = new ShaderMaterial({
  uniforms,
  defines: { STEPS: LOOK.samples },
  vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution, centre, light, tapDir;
    uniform float side, flash, time;
    uniform sampler2D mask;

    float stroke(vec2 p) {
      vec2 uv = (p - centre) / side + 0.5;
      if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
      return texture2D(mask, uv).a;
    }
    // the light as it leaves the stencil: a bright soft source, blocked by the strokes
    float lit(vec2 p) {
      vec2 d = (p - light) / side;
      float src = exp(-dot(d, d) * 5.5) * 1.4 + exp(-dot(d, d) * 60.0) * 2.0;
      return src * (1.0 - stroke(p));
    }
    float hexagon(vec2 p, float r) {
      p = abs(p);
      return max(dot(p, vec2(0.866, 0.5)), p.y) - r;
    }

    void main() {
      vec2 p = gl_FragCoord.xy;
      float f = flash < 3.0 ? exp(-flash * 2.2) * smoothstep(0.0, 0.04, flash) : 0.0;

      // rays: gather along the line to the light; the decay is the length of the rays, longer in
      // a flash. Each channel walks a slightly different length, so the ends split into colour.
      float decay = 0.93 + 0.045 * f;
      vec2 step = (light - p) / float(STEPS) * 0.9;
      vec3 rays = vec3(0.0);
      float w = 1.0;
      // each pixel starts its walk at a random fraction of a step: no stair-steps in the rays
      float jitter = fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453);
      for (int i = 0; i < STEPS; i++) {
        vec2 q = p + step * (float(i) + jitter);
        float l = lit(q);
        rays += l * w * vec3(1.0, 0.0, 0.0);
        rays.g += lit(q + step * 0.06) * w;
        rays.b += lit(q + step * 0.12) * w;
        w *= decay;
      }
      rays *= 0.06 * (1.0 + 2.2 * f);

      float s = stroke(p);
      vec3 warm = vec3(1.0, 0.93, 0.82);
      vec3 col = rays * warm * (1.0 - 0.6 * s) + lit(p) * warm * 0.55;

      // flash: a flat streak through the source, and ghosts along the line through the tap
      vec2 dl = p - light;
      col += vec3(0.75, 0.85, 1.0) * f * exp(-abs(dl.y) / (side * 0.008)) * exp(-abs(dl.x) / (side * 1.4));
      for (int k = 0; k < 6; k++) {
        float fk = float(k);
        float t = -0.7 + fk * 0.55;
        vec2 gc = light + tapDir * side * t * 1.6;
        float r = side * (0.05 + 0.04 * mod(fk * 1.7, 2.3));
        float d = mod(fk, 2.0) < 0.5 ? hexagon(p - gc, r) : length(p - gc) - r;
        float ring = smoothstep(side * 0.012, 0.0, abs(d)) * 0.7 + smoothstep(0.0, -r, d) * 0.35;
        vec3 tint = 0.5 + 0.5 * cos(6.2831 * (fk * 0.17 + vec3(0.0, 0.33, 0.67)));
        float gf = flash < 3.0 ? exp(-flash * 1.4) * smoothstep(0.0, 0.08, flash) : 0.0;
        col += tint * ring * gf * 1.1;
      }

      col = 1.0 - exp(-col * 1.3); // soft shoulder
      col = mix(col, vec3(0.02), s * 0.85); // the stencil stays dark and sharp
      gl_FragColor = vec4(col, 1.0);
    }
  `,
})
scene.add(new Mesh(new PlaneGeometry(2, 2), material))

// --- size ----------------------------------------------------------------------------------------------
let dpr = 1
function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  uniforms.centre.value.set((w * dpr) / 2, (h * dpr) / 2)
  uniforms.side.value = Math.min(w * (w <= 768 ? LOOK.markXs : LOOK.markLg), h * 0.6) * dpr
}
window.addEventListener('resize', resize)
resize()

// --- input: the light follows the finger a little; a tap flashes ---------------------------------------
const aim = new Vector2() // wanted offset of the light from rest, mark widths
const off = new Vector2()
let held = false
let press: { x: number; y: number; t: number } | null = null
let flashAt = -99

const toAim = (x: number, y: number) => {
  const side = uniforms.side.value / dpr
  const dx = (x - window.innerWidth / 2) / side
  const dy = (window.innerHeight / 2 - y) / side
  const len = Math.hypot(dx, dy)
  const k = len > LOOK.reach ? LOOK.reach / len : 1
  aim.set(dx * k, dy * k)
}
canvas.addEventListener('pointerdown', (e) => {
  held = true
  press = { x: e.clientX, y: e.clientY, t: performance.now() }
  toAim(e.clientX, e.clientY)
})
canvas.addEventListener('pointermove', (e) => {
  if (held || e.pointerType === 'mouse') toAim(e.clientX, e.clientY)
})
const up = (e: PointerEvent) => {
  held = false
  if (press && e.type === 'pointerup' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 12 && performance.now() - press.t < 350) {
    flashAt = performance.now()
    // ghosts run from the light towards where the finger was, as a lens throws them
    const c = uniforms.centre.value
    const l = uniforms.light.value
    const d = new Vector2(e.clientX * dpr - l.x, (window.innerHeight - e.clientY) * dpr - l.y)
    if (d.lengthSq() < 1) d.set(c.x - l.x + 1, c.y - l.y)
    uniforms.tapDir.value.copy(d.normalize())
  }
  press = null
}
canvas.addEventListener('pointerup', up)
canvas.addEventListener('pointercancel', up)
canvas.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'mouse') aim.set(0, 0)
})
if (!EMBEDDED) window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

const t0 = performance.now()
function frame(now: number) {
  const t = (now - t0) / 1000
  if (!held && !matchMedia('(pointer: fine)').matches) aim.multiplyScalar(0.97) // a finger let go: drift home
  off.lerp(aim, 0.08)
  const side = uniforms.side.value
  const c = uniforms.centre.value
  // rest: a touch above the middle, breathing slowly
  uniforms.light.value.set(
    c.x + (off.x + Math.sin(t * 0.31) * 0.03) * side,
    c.y + (off.y + 0.06 + Math.sin(t * 0.23 + 1) * 0.03) * side,
  )
  uniforms.time.value = t
  uniforms.flash.value = (now - flashAt) / 1000
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
