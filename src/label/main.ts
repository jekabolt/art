// LABEL: the logo as a woven damask label, rendered thread by thread. Black warp runs down the
// label, wefts run across; the ground is warp-faced satin (black threads running down), the logo
// weft-faced satin (white threads running across), so the mark is stepped on the thread grid like
// a real woven label. Each visible thread is a shaded cylinder with a twisted-ply texture,
// Kajiya–Kay sheen along its length, dips where it goes under, and a little unevenness. Because
// ground and logo shine along different directions, moving the light flips their contrast.
//
// The back is woven too, as a two-weft damask's is: a mirrored, striped, low-contrast negative of
// loose weft floats with ragged float ends, sagging floats over bound picks, and sheared, frayed
// floats in the wide fields.
//
// Light: the cursor, or tilting the phone; idle, it drifts around by itself.
// Turn: drag to turn the label and look at the back; a tap turns it over.
// Zoom: wheel or pinch, double click to reset.
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene'
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera'
import { Mesh } from 'three/src/objects/Mesh'
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'
import { LinearFilter } from 'three/src/constants'
import { LOGO_MIN, LOGO_PATH, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import './label.css'

const WARP_ENDS = 200 // threads across the label
const ASPECT = 1.3 // label width / height

/** The logo as a white-on-black mask, edge to edge; read per thread cell, so it steps on the grid. */
function maskTexture(): CanvasTexture {
  const px = 1024
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, px, px)
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

const canvas = document.getElementById('label') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, antialias: false })
const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

const uniforms = {
  resolution: { value: new Vector2() },
  center: { value: new Vector2() }, // label centre, device px (y up)
  halfSize: { value: new Vector2() }, // label half size, device px
  cells: { value: new Vector2(WARP_ENDS, Math.round(WARP_ENDS / ASPECT)) },
  mask: { value: maskTexture() },
  logoHalf: { value: 1 }, // logo half side, device px
  light: { value: new Vector3() }, // device px, z = height above the label
  ss: { value: 1 }, // supersampling per axis when threads get small
  turn: { value: new Vector2() }, // flip angle, tilt
}

const material = new ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */ `
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 resolution;
    uniform vec2 center;
    uniform vec2 halfSize;
    uniform vec2 cells;
    uniform sampler2D mask;
    uniform float logoHalf;
    uniform vec3 light;
    uniform float ss;
    uniform vec2 turn; // rotation about the vertical axis (flip), then a small tilt about the horizontal

    // colours in linear light
    const vec3 WARP = vec3(0.0032, 0.0032, 0.0036);
    const vec3 WEFT_BLACK = vec3(0.0042, 0.0042, 0.0046);
    const vec3 WEFT_WHITE = vec3(0.80, 0.79, 0.75);

    float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    // is the thread cell part of the logo? (the mask is read at the cell centre: a stepped edge)
    float inLogo(vec2 cell) {
      vec2 p = ((cell + 0.5) / cells * 2.0 - 1.0) * halfSize;
      vec2 uv = p / (2.0 * logoHalf) + 0.5;
      float m = texture2D(mask, clamp(uv, 0.0, 1.0)).r;
      float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
      return step(0.5, m) * inside;
    }

    // face: 5-end satin, step 2 — the ground shows warp on 4 of 5 cells, the logo weft on 4 of 5
    float warpUpFace(vec2 cell) {
      float satinPoint = 1.0 - step(0.5, mod(cell.x + 2.0 * cell.y, 5.0));
      return inLogo(cell) > 0.5 ? satinPoint : 1.0 - satinPoint;
    }

    // one yarn seen from above: T along it, A across, d ∈ [-1, 1] across the yarn, alongG the
    // position along it in cells (continuous, for the twist), dips where it goes under at either end
    vec3 yarn(vec3 T, vec3 A, float d, float alongG, float idx, vec3 base, float dipPrev, float dipNext, vec2 g, vec3 L, vec3 V, float back) {
      float along = fract(alongG);
      base *= 0.88 + 0.24 * h1(idx * 1.37);
      // pressed yarn: a flattened oval, not a round rod
      float z = pow(max(1.0 - d * d, 0.0), 0.35);
      float e0 = mix(1.0, smoothstep(0.0, 0.45, along), dipPrev);
      float e1 = mix(1.0, smoothstep(0.0, 0.45, 1.0 - along), dipNext);
      float lift = e0 * e1;
      float slope = dipPrev * (1.0 - smoothstep(0.0, 0.45, along)) - dipNext * (1.0 - smoothstep(0.0, 0.45, 1.0 - along));

      vec2 q = g / cells;
      vec2 wav = vec2(vnoise(q * 4.4 + 3.0), vnoise(q * 4.4 + 11.0)) - 0.5;
      vec3 N = normalize(A * d * 0.7 + T * slope * 0.8 + vec3(wav * 0.25, 0.0) + vec3(0.0, 0.0, 0.6 + 0.4 * z * lift));

      // plied yarn: diagonal twist lines, continuous along the whole float
      float ply = 0.84 + 0.16 * sin((alongG * 2.6 + d * 0.5 + h1(idx) * 7.0) * 6.2831853);
      float fuzz = 0.92 + 0.16 * h2(floor(gl_FragCoord.xy)) + back * 0.14 * (h2(floor(gl_FragCoord.xy * 0.5)) - 0.5);

      vec3 H = normalize(L + V);
      float diff = max(dot(N, L), 0.0);
      float spec = pow(max(dot(N, H), 0.0), 55.0) * 0.8 + pow(max(dot(N, H), 0.0), 9.0) * 0.07;
      // Kajiya–Kay sheen along the fibres
      float tl = dot(T, L);
      float tv = dot(T, V);
      float kk = max(sqrt(max(1.0 - tl * tl, 0.0)) * sqrt(max(1.0 - tv * tv, 0.0)) - tl * tv, 0.0);
      spec += pow(kk, 40.0) * 0.18;
      spec *= smoothstep(0.0, 0.2, L.z);
      float ao = mix(0.45, 1.0, z) * mix(0.3, 1.0, lift);
      float gloss = (base.r > 0.1 ? 0.5 : 0.28) * (1.0 - back * 0.45);
      return base * (0.03 + 1.0 * diff) * ao * ply * fuzz + vec3(spec * gloss) * ao * ply;
    }

    vec3 face(vec2 g, vec3 L, vec3 V) {
      vec2 cell = floor(g);
      vec2 f = fract(g);
      float wu = warpUpFace(cell);
      float logo = inLogo(cell);
      if (wu > 0.5) {
        float wdt = 0.93 + 0.06 * h1(cell.x * 2.71);
        float d = (f.x - 0.5) / (0.5 * wdt);
        if (abs(d) > 1.0) return WEFT_BLACK * 0.3;
        return yarn(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), d, g.y, cell.x, WARP,
          1.0 - warpUpFace(cell - vec2(0.0, 1.0)), 1.0 - warpUpFace(cell + vec2(0.0, 1.0)), g, L, V, 0.0);
      }
      float wdt = 0.93 + 0.06 * h1((cell.y + 1000.0) * 2.71);
      float d = (f.y - 0.5) / (0.5 * wdt);
      if (abs(d) > 1.0) return WARP * 0.3;
      return yarn(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), d, g.x, cell.y + 1000.0, logo > 0.5 ? WEFT_WHITE : WEFT_BLACK,
        warpUpFace(cell - vec2(1.0, 0.0)), warpUpFace(cell + vec2(1.0, 0.0)), g, L, V, 0.0);
    }

    // --- the back of a two-weft damask ----------------------------------------------------------
    // Picks alternate: even rows the black ground weft, odd rows the white figure weft. Each weft
    // floats loose on the back wherever the face does not need it (white behind the ground, black
    // behind the mark), tied down by the warp every eighth end; where the face needs it, it is
    // bound in tightly and the back shows it only as specks between warp. The float ends drift a
    // cell or two from the mark's edge row by row, long floats sag over their neighbours, and in
    // wide fields they are sheared, leaving frayed ends.
    float backShift(float row) { return floor((h1(row * 3.1 + 5.0) - 0.5) * 3.4); }
    float floatsBack(float x, float row) {
      float white = mod(row, 2.0);
      float logo = inLogo(vec2(x + backShift(row), row));
      return white > 0.5 ? 1.0 - logo : logo;
    }
    float tieBack(float x, float row) { return 1.0 - step(0.5, mod(x + 3.0 * row, 8.0)); }
    // position within the shear period of a row: the first 0.8 cell of each period is cut away
    float shearAt(float gx, float row) {
      float period = 24.0 + 16.0 * h1(row * 1.7);
      return fract(gx / period + h1(row * 9.3)) * period;
    }
    float sag(float row, float gx) {
      return 0.3 * sin(gx * 0.33 + h1(row) * 6.2831853) * (0.55 + 0.45 * sin(gx * 0.09 + row * 1.3));
    }
    vec3 pickColour(float row) { return mod(row, 2.0) > 0.5 ? WEFT_WHITE : WEFT_BLACK; }

    // where point g lies across a loose float of that pick (|d| <= 1 on it; -9 when there is none)
    float floatD(vec2 g, float row) {
      float x = floor(g.x);
      if (floatsBack(x, row) < 0.5 || tieBack(x, row) > 0.5 || shearAt(g.x, row) < 0.8) return -9.0;
      return (g.y - (row + 0.5 + sag(row, g.x))) / (0.58 + 0.04 * h1(row * 4.1));
    }
    vec3 floatYarn(vec2 g, float row, float d, vec3 L, vec3 V) {
      float x = floor(g.x);
      float dp = clamp(tieBack(x - 1.0, row) + 1.0 - floatsBack(x - 1.0, row), 0.0, 1.0);
      float dn = clamp(tieBack(x + 1.0, row) + 1.0 - floatsBack(x + 1.0, row), 0.0, 1.0);
      // sheared ends: the last fibres of a cut float fray out
      float sh = shearAt(g.x, row);
      float fray = smoothstep(1.6, 0.8, sh);
      if (fray > 0.0 && h2(floor(gl_FragCoord.xy * 0.8) + row) < fray * 0.7) return WARP * 0.4;
      return yarn(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), d, g.x, row + 1000.0, pickColour(row), dp, dn, g, L, V, 1.0) * 1.05;
    }

    vec3 back(vec2 g, vec3 L, vec3 V) {
      vec2 cell = floor(g);
      vec2 f = fract(g);
      float row = cell.y;

      // own float first, then a sagging float from the row above or below lying over this one
      float d0 = floatD(g, row);
      if (abs(d0) <= 1.0) return floatYarn(g, row, d0, L, V);
      float du = floatD(g, row + 1.0);
      if (abs(du) <= 1.0) return floatYarn(g, row + 1.0, du, L, V);
      float dd = floatD(g, row - 1.0);
      if (abs(dd) <= 1.0) return floatYarn(g, row - 1.0, dd, L, V);

      if (floatsBack(cell.x, row) > 0.5) {
        // under a float's gap, a tie, or a shear: the warp, low and dark
        float wdt = 0.9;
        float d = (f.x - 0.5) / (0.5 * wdt);
        if (abs(d) > 1.0 || shearAt(g.x, row) < 0.8) return WARP * 0.25;
        return yarn(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), d, g.y, cell.x, WARP, 1.0, 1.0, g, L, V, 1.0) * 0.8;
      }
      // a bound pick: plain weave with the warp, the pick showing as specks
      float warpShows = 1.0 - step(0.5, mod(cell.x + row, 2.0));
      if (warpShows > 0.5) {
        float d = (f.x - 0.5) / 0.45;
        if (abs(d) > 1.0) return WARP * 0.25;
        return yarn(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), d, g.y, cell.x, WARP, 1.0, 1.0, g, L, V, 1.0) * 0.75;
      }
      float d = (f.y - 0.5) / 0.44;
      if (abs(d) > 1.0) return WARP * 0.25;
      return yarn(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), d, g.x, row + 1000.0, pickColour(row), 1.0, 1.0, g, L, V, 1.0) * 0.7;
    }

    vec3 cloth(vec2 g, vec3 L, vec3 V, float isBack) {
      return isBack > 0.5 ? back(g, L, V) : face(g, L, V);
    }

    vec3 background(vec2 frag, float shadowW) {
      vec3 Lb = normalize(light - vec3(frag, 0.0));
      vec3 col = vec3(0.012) * (0.85 + 0.3 * vnoise(frag * 0.35)) * (0.35 + 0.9 * max(Lb.z, 0.0));
      vec2 hs = vec2(halfSize.x * shadowW, halfSize.y);
      vec2 sh = abs(frag - center - vec2(0.012, -0.02) * halfSize.y) - hs;
      float sd = length(max(sh, 0.0)) + min(max(sh.x, sh.y), 0.0);
      col *= 1.0 - 0.75 * exp(-max(sd, 0.0) / (0.035 * halfSize.y));
      return col;
    }

    vec3 shade(vec2 frag) {
      // the label is a plane through the centre, turned; a pinhole camera in front of the screen
      float cy = cos(turn.x); float sy = sin(turn.x);
      float cx = cos(turn.y); float sx = sin(turn.y);
      vec3 ex = vec3(cy, 0.0, -sy);
      vec3 ey = vec3(sy * sx, cx, cy * sx);
      vec3 n = vec3(sy * cx, -sx, cy * cx);
      vec3 C = vec3(center, 0.0);
      vec3 E = vec3(center, 5.0 * halfSize.x);
      vec3 dir = vec3(frag, 0.0) - E;
      float dn = dot(dir, n);
      if (abs(dn) < 1e-4) return background(frag, abs(cy));
      vec3 X = E + dir * (dot(C - E, n) / dn);
      vec2 lp = vec2(dot(X - C, ex), dot(X - C, ey));
      float back = step(0.0, dot(n, -dir)) < 0.5 ? 1.0 : 0.0; // facing away: the back is towards us
      vec3 Lw = light - X;
      vec3 Vw = E - X;
      vec3 L = normalize(vec3(dot(Lw, ex), dot(Lw, ey), dot(Lw, n)));
      vec3 V = normalize(vec3(dot(Vw, ex), dot(Vw, ey), dot(Vw, n)));
      if (back > 0.5) {
        // seen from behind: the same threads (so the mark reads mirrored), lit on the other side —
        // reflecting z turns the back surface into one the shading below can treat as a face
        L.z = -L.z;
        V.z = -V.z;
      }
      vec2 q = lp / halfSize;
      vec2 gg = (q * 0.5 + 0.5) * cells;
      float row = floor(gg.y);
      float jl = 0.15 + 0.6 * h1(row * 7.13 + 1.0);
      float jr = 0.15 + 0.6 * h1(row * 3.37 + 9.0);
      if (gg.y < 0.0 || gg.y > cells.y || gg.x < jl || gg.x > cells.x - jr) return background(frag, abs(cy));
      vec3 col = cloth(gg, L, V, back);
      // selvedges roll over at top and bottom; the cut ends are heat-sealed, a touch darker
      col *= mix(0.45, 1.0, smoothstep(0.0, 1.2, min(gg.y, cells.y - gg.y)));
      col *= mix(0.55, 1.0, smoothstep(0.0, 0.6, min(gg.x - jl, cells.x - jr - gg.x)));
      return col;
    }

    void main() {
      vec3 col = vec3(0.0);
      if (ss > 1.5) {
        col += shade(gl_FragCoord.xy + vec2(-0.25, -0.25));
        col += shade(gl_FragCoord.xy + vec2(0.25, -0.25));
        col += shade(gl_FragCoord.xy + vec2(-0.25, 0.25));
        col += shade(gl_FragCoord.xy + vec2(0.25, 0.25));
        col *= 0.25;
      } else {
        col = shade(gl_FragCoord.xy);
      }
      col = col / (1.0 + col * 0.35);
      gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
    }
  `,
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

// --- layout, zoom and pan ---------------------------------------------------------------------------
let dpr = 1
let base = { cx: 0, cy: 0, hw: 1, hh: 1 } // the label at zoom 1, device px
let zoom = 1
let pan = { x: 0, y: 0 } // device px

function resize() {
  const w = window.innerWidth
  const h = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(w, h, false)
  uniforms.resolution.value.set(w * dpr, h * dpr)
  const labelH = Math.min(0.5 * h, (w <= 768 ? 0.86 * w : 0.5 * w) / ASPECT)
  base = { cx: (w * dpr) / 2, cy: (h * dpr) / 2, hw: (labelH * ASPECT * dpr) / 2, hh: (labelH * dpr) / 2 }
  apply()
}

function apply() {
  uniforms.center.value.set(base.cx + pan.x, base.cy + pan.y)
  uniforms.halfSize.value.set(base.hw * zoom, base.hh * zoom)
  uniforms.logoHalf.value = base.hh * 0.66 * zoom
  const cellPx = (2 * base.hw * zoom) / WARP_ENDS
  uniforms.ss.value = cellPx < 7 ? 2 : 1
}

/** Zoom by `k` keeping the device-px point (x, y) where it is. */
function zoomAt(k: number, x: number, y: number) {
  const nz = Math.min(6, Math.max(1, zoom * k))
  const r = nz / zoom
  const cx = base.cx + pan.x
  const cy = base.cy + pan.y
  pan.x = x + (cx - x) * r - base.cx
  pan.y = y + (cy - y) * r - base.cy
  zoom = nz
  if (zoom === 1) pan = { x: 0, y: 0 }
  apply()
}

// --- light ------------------------------------------------------------------------------------------
const target = { x: 0, y: 0 }
const lamp = { x: 0, y: 0 }
let lastInput = -1e9
let lastTilt = -1e9
let orbit = 0

const toDevice = (e: PointerEvent | WheelEvent | MouseEvent) => [e.clientX * dpr, (window.innerHeight - e.clientY) * dpr]

const pointers = new Map<number, { x: number; y: number }>()
let pinch: { d: number; mx: number; my: number } | null = null

// turning the label: drag to turn it (and see the back), let go and it settles face or back on;
// a tap turns it over
const turn = { a: 0, t: 0, aTo: 0, tTo: 0 }
let drag: { x: number; y: number; a: number; t: number; moved: number } | null = null

canvas.addEventListener('pointerdown', (e) => {
  const [x, y] = toDevice(e)
  pointers.set(e.pointerId, { x, y })
  canvas.setPointerCapture(e.pointerId)
  drag = pointers.size === 1 ? { x, y, a: turn.a, t: turn.t, moved: 0 } : null
})
canvas.addEventListener('pointermove', (e) => {
  const [x, y] = toDevice(e)
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x, y })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    if (pinch) {
      pan.x += mx - pinch.mx
      pan.y += my - pinch.my
      zoomAt(d / pinch.d, mx, my)
    }
    pinch = { d, mx, my }
    return
  }
  if (drag && pointers.has(e.pointerId)) {
    const w = base.hw * 2
    drag.moved = Math.max(drag.moved, Math.hypot(x - drag.x, y - drag.y))
    turn.a = turn.aTo = drag.a + ((x - drag.x) / w) * Math.PI
    turn.t = turn.tTo = Math.max(-0.5, Math.min(0.5, drag.t + ((y - drag.y) / w) * 1.2))
    return
  }
  if (e.pointerType === 'mouse') {
    target.x = x
    target.y = y
    lastInput = performance.now()
  }
})
const lift = (e: PointerEvent) => {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = null
  if (drag && pointers.size === 0) {
    if (drag.moved < 6 * dpr) turn.aTo = Math.round(turn.a / Math.PI) * Math.PI + Math.PI // a tap: turn over
    else turn.aTo = Math.round(turn.a / Math.PI) * Math.PI // settle face or back on
    turn.tTo = 0
    drag = null
  }
}
canvas.addEventListener('pointerup', lift)
canvas.addEventListener('pointercancel', lift)
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    const [x, y] = toDevice(e)
    zoomAt(Math.exp(-e.deltaY * 0.0015), x, y)
  },
  { passive: false },
)
canvas.addEventListener('dblclick', () => {
  // two clicks are two turns: back where it was, and the zoom reset
  zoom = 1
  pan = { x: 0, y: 0 }
  apply()
})

// tilting the phone moves the lamp; iOS asks once, on the first tap
function onTilt(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return
  const gx = Math.max(-1, Math.min(1, e.gamma / 35))
  const gy = Math.max(-1, Math.min(1, (e.beta - 40) / 35))
  target.x = base.cx + pan.x + gx * base.hw * zoom * 1.4
  target.y = base.cy + pan.y - gy * base.hh * zoom * 1.4
  lastTilt = performance.now()
}
window.addEventListener('deviceorientation', onTilt)
const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
if (typeof DOE?.requestPermission === 'function') {
  canvas.addEventListener(
    'pointerup',
    () => {
      DOE.requestPermission!().catch(() => undefined)
    },
    { once: true },
  )
}

// --- loop -------------------------------------------------------------------------------------------
let last = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const cx = base.cx + pan.x
  const cy = base.cy + pan.y
  if (now - lastInput > 4000 && now - lastTilt > 1000) {
    // nobody is steering: the lamp drifts slowly around the label
    orbit += dt * 0.45
    target.x = cx + Math.cos(orbit) * base.hw * zoom * 1.1
    target.y = cy + Math.sin(orbit * 0.8) * base.hh * zoom * 1.1
  }
  const k = 1 - Math.exp(-dt * 7)
  lamp.x += (target.x - lamp.x) * k
  lamp.y += (target.y - lamp.y) * k
  uniforms.light.value.set(lamp.x, lamp.y, base.hh * zoom * 1.6)
  if (!drag) {
    const e = 1 - Math.exp(-dt * 6)
    turn.a += (turn.aTo - turn.a) * e
    turn.t += (turn.tTo - turn.t) * e
  }
  uniforms.turn.value.set(turn.a, turn.t)
  renderer.render(scene, camera)
  requestAnimationFrame(frame)
}

window.addEventListener('resize', resize)
resize()
lamp.x = target.x = base.cx + base.hw
lamp.y = target.y = base.cy + base.hh
requestAnimationFrame(frame)
