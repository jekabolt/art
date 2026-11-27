// WATERCOLOR: the logo stamped fat and wet in rainbow watercolour, and the sheet tilted, so the paint
// runs. Where it pools it breaks out of the wash and slides downhill in wide runs that meander, bead at
// their tips and leave a darker edge where they stop. The sheet leans a little by itself; drag to lean
// it your way (or tilt the phone), scroll for how steep, click to drop clean water: a big puddle, never
// the same twice, that lifts the paint and pushes it out into a bloom with a dark rim.
//
// The sheet is a small simulation on the GPU, finer where the screen is sharp. Each pixel holds water, the
// pigment floating in it, the pigment settled into the paper while the wash is wet, and the pigment
// fixed for good once it has dried. Every step the water runs from the full middle of a wash to its thin
// edges and leaves its pigment there as a rim; what the paper cannot hold slides downhill, pigment with
// it; the wet front creeps into dry paper in lobes; and the water evaporates. Pigment is only ever
// moved, never made, and every cell is kept in range, so no amount of water or clicking piles it up to
// black. What shows is white light filtered through all of the pigment on the sheet.
import '../core/embed'
import { EMBEDDED } from '../core/embed'
import { logoBars } from '../core/logo-bars'
import { LOGO_MIN, LOGO_SPAN, LOGO_STROKE } from '../core/logo-path'
import '../fonts/fonts.css'
import './watercolor.css'

type RGB = [number, number, number]

// pigments round the rainbow: the logo takes three of them, a third of the way round from each other
const RAINBOW: [RGB, RGB][] = [
  [[0.47, 0.3, 0.88], [0.12, 0.38, 0.92]], // ultramarine violet → cobalt
  [[0.14, 0.4, 0.93], [0.2, 0.72, 0.62]], // phthalo blue → turquoise
  [[0.95, 0.17, 0.28], [0.98, 0.55, 0.15]], // permanent rose → orange
  [[0.5, 0.86, 0.26], [0.98, 0.82, 0.2]], // sap green → lemon
  [[0.98, 0.78, 0.25], [0.95, 0.3, 0.22]], // gamboge → scarlet
  [[0.88, 0.24, 0.62], [0.47, 0.3, 0.88]], // opera magenta → violet
]

const LOOK = {
  logo: EMBEDDED ? 0.78 : 0.7, // the mark's width, of the shorter side of the screen
  fat: 1.4, // the stamp's stroke, of the mark's
  at: 0.4, // seconds before the logo is stamped
  // the sheet's own lean when nobody leans it: a slow sway, mostly downhill
  sway: [0.08, 0.3, 0.05],
  drag: 150, // css px of drag for a full lean
  lean: 1.4, // the steepest lean
  // a drop of clean water: its radius (of the mark's stroke), and how much each varies
  drop: 3.2,
  dropSize: [0.6, 1.6],
  dropWater: [0.7, 1.5],
  dropPush: [0.35, 1],
}

// The sheet. start/stop/trail: water dry paper, the stamped wash and a run's wet trail hold before
// the excess goes on downhill.
const SHEET = {
  start: 1.15,
  stop: 0.55,
  trail: 0.27,
  creep: 0.55, // how readily the wet front creeps into dry paper
  creepWet: 2.4,
  bloom: 0.3, // how readily fresh water pushes into a damp wash
  pdiff: 0.06, // pigment spreading through wet paper
  wdiff: 0.24, // water evening out along a run
  pr: 2.5, // sim px that spread reaches
  lift: 10, // how much fresh water lifts settled pigment
  // paint carried from a wash's full middle toward its thin edge (the rim): down the water's slope,
  // wandering on the paper, at most flowCap cells a step
  flowG: 3,
  flowN: 0.12,
  flowCap: 0.06,
  evap: 0.0006, // water lost a step
  float: 60, // seconds: pigment left floating fades
  wloss: 0.03,
  dep: 0.0012, // pigment settling a step
  rim: 7, // how much faster it settles at a wash's edge
  gran: 0.4, // granulation
  sub: 2, // steps a 60th of a second
  kp: 0.55, // strength of the floating pigment
  kd: 1.1, // strength of the settled pigment
}

for (const [k, v] of new URLSearchParams(location.search)) {
  const key = k.startsWith('sheet.') ? (k.slice(6) as keyof typeof SHEET) : null
  if (key && key in SHEET && Number.isFinite(+v)) (SHEET as Record<string, number>)[key] = +v
}

// --- the hand ----------------------------------------------------------------------------------------
const query = new URLSearchParams(location.search)
// a small seeded generator, so ?seed= repeats the logo
let seed = (parseInt(query.get('seed') || '', 10) || Math.floor(Math.random() * 2 ** 31)) >>> 0
function rnd(): number {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const between = (a: number, b: number) => a + (b - a) * rnd()
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
function hash2(ix: number, iy: number): number {
  let x = (Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1)) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x85ebca6b) >>> 0
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0
  x = (x ^ (x >>> 16)) >>> 0
  return x / 4294967296
}
function rng(s: number): () => number {
  let t = s >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// --- GL ----------------------------------------------------------------------------------------------
const canvas = document.getElementById('watercolor') as HTMLCanvasElement
const maybeGl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false })
if (!maybeGl) throw new Error('watercolor: no WebGL2')
const gl: WebGL2RenderingContext = maybeGl
// the sheet lives in half floats; Safari and older GPUs only offer the half-float extension
if (!gl.getExtension('EXT_color_buffer_float')) gl.getExtension('EXT_color_buffer_half_float')

const GLSL_COMMON = `
float hash2(ivec2 p) {
  uint x = (uint(p.x) * 0x27d4eb2du) ^ (uint(p.y) * 0x165667b1u);
  x = (x ^ (x >> 15u)) * 0x85ebca6bu;
  x = (x ^ (x >> 13u)) * 0xc2b2ae35u;
  x ^= x >> 16u;
  return float(x) / 4294967296.0;
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = p - i, u = f * f * (3.0 - 2.0 * f);
  ivec2 ii = ivec2(i);
  float a = hash2(ii), b = hash2(ii + ivec2(1, 0)), c = hash2(ii + ivec2(0, 1)), d = hash2(ii + ivec2(1, 1));
  return a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y;
}`

const FULL_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

// One step of the sheet. W = (water, wet-paper flag, -, -), P floating, D settled while wet, F fixed.
const STEP_FS = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uW, uP, uD, uF, uPaper;
uniform vec2 uTexel;
uniform float uScale, uSimH, uK;
uniform float uEvap, uFadeP, uWLoss, uDep, uRim, uGran;
uniform vec2 uGrav;
uniform float uStart, uStop, uTrail, uCreep, uCreepWet, uPDiff, uWDiff, uLiftK, uPR, uBloom;
uniform float uFlowG, uFlowN, uFlowCap;
// sim px for every one the look was tuned at: spans and speeds in cells grow with it
uniform float uR1;
layout(location = 0) out vec4 oW;
layout(location = 1) out vec4 oP;
layout(location = 2) out vec4 oD;
layout(location = 3) out vec4 oF;
${GLSL_COMMON}
vec4 Wt(vec2 p) { return texture(uW, p * uTexel); }
float W(vec2 p) { return texture(uW, p * uTexel).r; }
vec3 P(vec2 p) { return texture(uP, p * uTexel).rgb; }
// what a pixel holds before the excess slides on. Flag 1: paper wetted by the stamp or a drop;
// 0.6: the thin wet trail a run leaves behind; 0: dry paper, which pins the water until it pools.
float holdOf(float g, float hd, float hw) { return g > 0.8 ? uStop * hw : (g > 0.3 ? uTrail * hw : uStart * hd); }
// lanes along the slope: where a run breaks out of a wash and where it holds back
float laneAt(vec2 q, vec2 gd, vec2 gn) {
  q /= uR1;
  return vnoise(vec2(dot(q, gn) / 62.0, dot(q, gd) / 220.0) + 17.0) * 0.78
       + vnoise(vec2(dot(q, gn) / 17.0, dot(q, gd) / 40.0) + 5.0) * 0.22;
}
float holdAt(vec2 q, float g, vec2 gd, vec2 gn) {
  float lane = laneAt(q, gd, gn);
  float ppq = texture(uPaper, vec2(q.x, uSimH - q.y) / uScale / 512.0).r;
  return holdOf(g, 0.45 + 1.1 * lane + (ppq - 0.5) * 0.3, 0.85 + 0.3 * lane);
}
// pigment per unit water, worked out the same from both sides of a face (so the flow stays
// conservative); the flow out of a cell is at most its excess water, so this never carries more than P
vec3 conc(vec3 P, float w) { return P / max(w, 1e-3); }
// the slope at a face, wandering a little across it so runs meander
vec2 faceVel(vec2 f, vec2 gk, float gm, vec2 gd, vec2 gn) {
  vec2 fr = f / uR1;
  vec2 u = gk + gn * gm * (vnoise(vec2(dot(fr, gn) / 70.0, dot(fr, gd) / 110.0) + 4.0) - 0.5) * 1.1;
  float cap = min(0.24 * uR1, 0.45);
  return clamp(u, vec2(-cap), vec2(cap));
}
// the flow across a face toward +ax, in cells a step: down the water's slope over six cells and
// wandering on the paper, only between two wet cells. Worked out from the face alone, so both cells
// agree on it; capped so a cell never sends out more than it holds
float faceU(vec2 f, vec2 ax, float wetf, float comp) {
  float k = max(1.0, floor(3.0 * uR1 + 0.5));
  float g = (W(f + ax * (k + 0.5)) + W(f + ax * (k - 0.5)) - W(f - ax * (k - 0.5)) - W(f - ax * (k + 0.5))) / (4.0 * k);
  float n = texture(uPaper, vec2(f.x, uSimH - f.y) / uScale / 900.0 + comp).r - 0.5;
  return clamp((-g * uFlowG * uR1 * uR1 + n * uFlowN * uR1) * wetf * uK, -uFlowCap * uR1, uFlowCap * uR1);
}
// the wet front creeping into dry paper (cauliflower edges) and fresh water pushing into a damp wash
// (a bloom), per face: the water (x) and the share of the donor's paint (y) that go from a donor
// holding wd (flag gd) into the receiver at r holding wr. The donor loses what the receiver gains.
vec2 creepAt(vec2 r, float wr, float wd, float gd) {
  if (wd < min(uBloom, uCreep * 0.7) || wr >= wd * 0.3) return vec2(0.0);
  vec2 c = vec2(r.x, uSimH - r.y) / uScale;
  float lobe = texture(uPaper, c / 2400.0).r;
  float lobe2 = vnoise(c / 9.0 + 4.4);
  if (wr < 0.01) {
    float cthr = uCreep + 0.6 * lobe + 0.25 * lobe2;
    float tthr = uCreep * 0.7 + 0.55 * vnoise(c / 24.0 + 8.8) + 0.3 * lobe2;
    // a run's bead creeps sideways readily (lumpy edges); a stamped wash only bleeds from its pools
    if ((gd > 0.3 && gd < 0.8 && wd > tthr) || wd > cthr * uCreepWet) return vec2(wd * 0.2, 0.2);
  }
  if (uBloom > 0.0 && wd > uBloom + 0.5 * lobe2) return vec2((wd - wr) * 0.12, 0.0);
  return vec2(0.0);
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 css = vec2(p.x, uSimH - p.y) / uScale;
  float pp = texture(uPaper, css / 512.0).r;
  vec4 w4 = Wt(p);
  float w0 = w4.r, w = w0, flag = w4.g;
  vec4 nl = Wt(p - vec2(1, 0)), nr = Wt(p + vec2(1, 0)), nd = Wt(p - vec2(0, 1)), nu = Wt(p + vec2(0, 1));
  float wl = nl.r, wr = nr.r, wd = nd.r, wu = nu.r;
  vec3 P0 = P(p);
  vec3 Pl = P(p - vec2(1, 0)), Pr = P(p + vec2(1, 0)), Pd = P(p - vec2(0, 1)), Pu = P(p + vec2(0, 1));
  // the share of what a cell holds it may give away this step (kept from the last step in W.b, so
  // both sides of a face read the same number): a cell never gives more than it has
  float lp = 1.0 - w4.b, ll = 1.0 - nl.b, lr = 1.0 - nr.b, ld = 1.0 - nd.b, lu = 1.0 - nu.b;

  float wet = smoothstep(0.0, 0.03, w0);
  float sl = smoothstep(0.0, 0.03, wl), sr = smoothstep(0.0, 0.03, wr), sd = smoothstep(0.0, 0.03, wd), su = smoothstep(0.0, 0.03, wu);
  float k3 = max(1.0, floor(3.0 * uR1 + 0.5)), k2 = max(1.0, floor(2.0 * uR1 + 0.5));
  float avg3 = (W(p + vec2(k3, 0)) + W(p - vec2(k3, 0)) + W(p + vec2(0, k3)) + W(p - vec2(0, k3))
              + W(p + vec2(k2, k2)) + W(p - vec2(k2, k2)) + W(p + vec2(k2, -k2)) + W(p - vec2(k2, -k2))) / 8.0;
  float edge = clamp((w - avg3) * 4.5, 0.0, 1.0) * wet;

  // gravity: what the paper cannot hold slides downhill as wide runs, pigment with it.
  // Dry paper pins the water until it pools (uStart); wet paper lets the excess go (uStop).
  vec2 gk = vec2(uGrav.x, -uGrav.y) * uK;
  float gm = length(gk);
  float hd = 1.0;
  float dWg = 0.0, gout = 0.0; vec3 dPg = vec3(0.0);
  if (gm > 1e-4) {
    // conservative upwind transport: every face's flow is worked out the same way from both sides
    vec2 gd = gk / gm, gn = vec2(-gd.y, gd.x);
    hd = 0.45 + 1.1 * laneAt(p, gd, gn) + (pp - 0.5) * 0.3;
    float e0 = max(0.0, w0 - holdAt(p, flag, gd, gn));
    float el = max(0.0, wl - holdAt(p - vec2(1, 0), nl.g, gd, gn));
    float er = max(0.0, wr - holdAt(p + vec2(1, 0), nr.g, gd, gn));
    float ed = max(0.0, wd - holdAt(p - vec2(0, 1), nd.g, gd, gn));
    float eu = max(0.0, wu - holdAt(p + vec2(0, 1), nu.g, gd, gn));
    float uR = faceVel(p + vec2(0.5, 0.0), gk, gm, gd, gn).x;
    float uL = faceVel(p - vec2(0.5, 0.0), gk, gm, gd, gn).x;
    float uU = faceVel(p + vec2(0.0, 0.5), gk, gm, gd, gn).y;
    float uD = faceVel(p - vec2(0.0, 0.5), gk, gm, gd, gn).y;
    float cR = uR > 0.0 ? -e0 * uR * lp : er * -uR * lr;  // + into p, - out of p
    float cL = uL > 0.0 ? el * uL * ll : -e0 * -uL * lp;
    float cU = uU > 0.0 ? -e0 * uU * lp : eu * -uU * lu;
    float cD = uD > 0.0 ? ed * uD * ld : -e0 * -uD * lp;
    gout = e0 * (max(uR, 0.0) + max(-uL, 0.0) + max(uU, 0.0) + max(-uD, 0.0)) / max(w0, 1e-3);
    dWg = cR + cL + cU + cD;
    vec3 c0 = conc(P0, w0);
    dPg = (cR > 0.0 ? conc(Pr, wr) : c0) * cR + (cL > 0.0 ? conc(Pl, wl) : c0) * cL
        + (cU > 0.0 ? conc(Pu, wu) : c0) * cU + (cD > 0.0 ? conc(Pd, wd) : c0) * cD;
  }

  // Everything below moves paint between cells and never makes it: each exchange is worked out the
  // same way from both sides of a face, so one cell loses exactly what the other gains.
  // water runs from the full middle of a wash toward its thin edges, carrying pigment
  float aR = faceU(p + vec2(0.5, 0.0), vec2(1, 0), min(wet, sr), 0.0);
  float aL = faceU(p - vec2(0.5, 0.0), vec2(1, 0), min(wet, sl), 0.0);
  float aU = faceU(p + vec2(0.0, 0.5), vec2(0, 1), min(wet, su), 0.37);
  float aD = faceU(p - vec2(0.0, 0.5), vec2(0, 1), min(wet, sd), 0.37);
  vec3 P0g = P0 * lp, Plg = Pl * ll, Prg = Pr * lr, Pdg = Pd * ld, Pug = Pu * lu;
  vec3 adv = (aL > 0.0 ? Plg : P0g) * aL - (aR > 0.0 ? P0g : Prg) * aR
           + (aD > 0.0 ? Pdg : P0g) * aD - (aU > 0.0 ? P0g : Pug) * aU;
  // bleeding into wet neighbours (dry paper takes none), reaching as far in the look at any resolution
  float kb = max(1.0, floor(uR1 + 0.5));
  vec2 bx = vec2(kb, 0.0), by = vec2(0.0, kb);
  vec4 bl = Wt(p - bx), br = Wt(p + bx), bd = Wt(p - by), bu = Wt(p + by);
  float tl = smoothstep(0.0, 0.03, bl.r), tr = smoothstep(0.0, 0.03, br.r), td = smoothstep(0.0, 0.03, bd.r), tu = smoothstep(0.0, 0.03, bu.r);
  vec3 bleed = 0.15 * wet * ((P(p - bx) * (1.0 - bl.b) - P0g) * tl + (P(p + bx) * (1.0 - br.b) - P0g) * tr
                           + (P(p - by) * (1.0 - bd.b) - P0g) * td + (P(p + by) * (1.0 - bu.b) - P0g) * tu);
  float out0 = gout + max(aR, 0.0) + max(-aL, 0.0) + max(aU, 0.0) + max(-aD, 0.0) + 0.15 * wet * (tl + tr + td + tu);

  // wide spread through wet paper: paint runs along a wet shape, feathering on the grain; a run's
  // trail evens out its water across (blunt, lumpy fronts), a stamped wash keeps its pools
  vec3 spread = vec3(0.0); float wsp = 0.0;
  float s0 = smoothstep(0.02, 0.08, w0);
  if (uPDiff > 0.0 && s0 > 0.0) {
    float wk0 = (flag > 0.3 && flag < 0.8) ? 1.0 : 0.25;
    for (int i = 0; i < 4; i++) {
      float a = float(i) * 0.7853982 + 0.4;
      vec2 o = floor(vec2(cos(a), sin(a)) * uPR + 0.5);
      for (int k = 0; k < 2; k++) {
        vec2 oo = k == 0 ? o : -o;
        vec4 q4 = Wt(p + oo);
        float sq = smoothstep(0.02, 0.08, q4.r);
        if (sq <= 0.0) continue;
        vec2 mc = vec2(p.x + oo.x * 0.5, uSimH - (p.y + oo.y * 0.5)) / uScale;
        float grain = 0.25 + 1.5 * vnoise(mc / 11.0 + 3.7) * vnoise(mc / 37.0 + 9.1) + 0.6 * (texture(uPaper, mc / 512.0).r - 0.5);
        float kk = uPDiff * max(grain, 0.05) * clamp(min(w0, q4.r) * 1.4, 0.2, 1.8) * s0 * sq / 8.0;
        spread += (P(p + oo) * (1.0 - q4.b) - P0g) * kk;
        out0 += kk;
        float wkq = (q4.g > 0.3 && q4.g < 0.8) ? 1.0 : 0.25;
        wsp += (q4.r - w0) * uWDiff * max(wk0, wkq) * s0 * sq / 8.0;
      }
    }
  }

  // the wet front creeps into dry paper unevenly; fresh water pushes into a damp wash the same way
  vec2 iL = creepAt(p, w0, wl, nl.g), iR = creepAt(p, w0, wr, nr.g), iD = creepAt(p, w0, wd, nd.g), iU = creepAt(p, w0, wu, nu.g);
  vec2 xL = creepAt(p - vec2(1, 0), wl, w0, flag), xR = creepAt(p + vec2(1, 0), wr, w0, flag);
  vec2 xD = creepAt(p - vec2(0, 1), wd, w0, flag), xU = creepAt(p + vec2(0, 1), wu, w0, flag);
  float dWc = iL.x * ll + iR.x * lr + iD.x * ld + iU.x * lu - (xL.x + xR.x + xD.x + xU.x) * lp;
  vec3 dPc = Plg * iL.y + Prg * iR.y + Pdg * iD.y + Pug * iU.y - P0g * (xL.y + xR.y + xD.y + xU.y);
  out0 += xL.y + xR.y + xD.y + xU.y;

  w = w0 + dWg + wsp + dWc;
  vec3 pg = max(P0 + adv + bleed + spread + dPc + dPg, vec3(0.0));
  w = mix(w, (wl + wr + wd + wu) * 0.25, uWLoss * wet);
  float ev = uEvap * uK * (1.0 + 1.5 * edge) * (0.65 + 0.7 * vnoise(css / 160.0 + 9.0));
  w = max(0.0, w - ev);

  // settling: faster where it dries, much faster at the rim, granulating in the paper's valleys
  vec3 d = texture(uD, p * uTexel).rgb;
  vec3 f = texture(uF, p * uTexel).rgb;
  // granulation: pigment settles faster in the paper's fine valleys (moved, not multiplied)
  float gv = 1.0 - (pp - 0.5) * 0.8 - (vnoise(css / 1.7 + 2.2) * 0.55 + vnoise(css / 3.9 + 6.1) * 0.45 - 0.5) * 1.2;
  float rate = clamp((uDep + 0.2 * (1.0 - wet)) * (1.0 + uRim * edge) * uK * clamp(1.0 - uGran + uGran * gv, 0.0, 2.0), 0.0, 1.0);
  vec3 dep = pg * rate;
  if (w <= 0.0) dep = pg;
  d += dep;
  pg -= dep;
  // fresh water arriving on a damp wash lifts what had settled: blooms
  float rise = w - w0;
  if (uLiftK > 0.0 && rise > 0.004) { vec3 l = d * clamp(rise * uLiftK, 0.0, 0.4); d -= l; pg += l; }
  if (w <= 0.0) { f += d; d = vec3(0.0); }

  if (w > uStart * hd && flag < 0.3) flag = 0.6;
  if (w < 0.008) flag = 0.0;
  // whatever came in, a cell stays in range; a cell gone non-finite is reset to dry paper
  vec4 chk = vec4(w + flag, pg.r + pg.g + pg.b, d.r + d.g + d.b, f.r + f.g + f.b);
  if (any(isnan(chk)) || any(isinf(chk))) { w = 0.0; flag = 0.0; pg = vec3(0.0); d = vec3(0.0); f = vec3(0.0); }
  w = clamp(w, 0.0, 3.0);
  pg = clamp(pg, 0.0, 8.0); d = clamp(d, 0.0, 8.0); f = clamp(f, 0.0, 8.0);
  oW = vec4(w, flag, 1.0 - min(1.0, 0.9 / max(out0, 1e-3)), 0.0);
  oP = vec4(pg * uFadeP, 0.0);
  oD = vec4(d, 0.0);
  oF = vec4(f, 0.0);
}`

// Stamps over the whole sheet: kind 0 a drop of clean water, kind 1 the logo stamped wet
const STAMP_FS = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uW, uP, uD, uF, uPaper, uMask;
uniform vec2 uTexel, uSimSize;
uniform float uScale, uSimH;
uniform int uKind;
uniform vec2 uC;
uniform float uR, uSeed, uWater, uPig, uSkip, uPud;
uniform vec3 uA, uB, uE;
layout(location = 0) out vec4 oW;
layout(location = 1) out vec4 oP;
layout(location = 2) out vec4 oD;
layout(location = 3) out vec4 oF;
${GLSL_COMMON}
float maskAt(vec2 css) { return texture(uMask, css * uScale / uSimSize).r; }
vec3 absorb(vec3 c) { return -log(clamp(c, 0.03, 1.0)); }
void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 css = vec2(p.x, uSimH - p.y) / uScale;
  float pp = texture(uPaper, css / 512.0).r;
  vec4 w4 = texture(uW, p * uTexel), p4 = texture(uP, p * uTexel), d4 = texture(uD, p * uTexel), f4 = texture(uF, p * uTexel);
  float s = uSeed;
  float W = w4.r, G = w4.g;
  vec3 Pn = p4.rgb, Dn = d4.rgb, Fn = f4.rgb;
  float addW = 0.0;
  vec3 addP = vec3(0.0);
  if (uKind == 0) {
    // clean water: a big puddle with an outline never the same. It lifts what had settled (and a
    // little of the dry) and pushes the paint out to a dark rim: paint is moved, never made.
    vec2 q = css - uC; float r = length(q);
    vec2 dir = r > 0.0 ? q / r : vec2(1.0, 0.0);
    float th = atan(dir.y, dir.x);
    float R = uR * (1.0 + 0.36 * (vnoise(dir * 1.2 + s) - 0.5) + 0.22 * (vnoise(dir * 3.1 + s * 1.7) - 0.5)
                  + 0.1 * (vnoise(dir * 8.0 + s * 2.3) - 0.5) + 0.04 * (vnoise(dir * 22.0 + s * 3.1) - 0.5)
                  + uSkip * cos(2.0 * (th - s)));
    float t = r / R;
    if (t < 1.0) {
      // radial remap t <- ts = t^(1/g): the paint at ts lands at t, spread by the area ratio J.
      // Into a puddle still standing, water only merges: no new push (repeated drops cannot
      // squeeze the paint into an ever thinner, darker ring)
      float wc = texture(uW, vec2(uC.x * uScale, uSimH - uC.y * uScale) * uTexel).r;
      float g = mix(1.0, 0.5, clamp(uPig, 0.0, 1.0) * (1.0 - smoothstep(0.25, 0.9, wc)));
      float tc = max(t, 1e-3);
      float ts = pow(tc, 1.0 / g);
      float J = pow(tc, 2.0 / g - 2.0) / g;
      vec2 sc = uC + dir * ts * R;
      vec2 suv = vec2(sc.x * uScale, uSimH - sc.y * uScale) * uTexel;
      float la = 0.65, lb = 0.08 + 0.1 * uPig;
      vec3 moved = (texture(uP, suv).rgb + texture(uD, suv).rgb * la + texture(uF, suv).rgb * lb) * J;
      float e = 1.0 - smoothstep(0.975, 1.0, t);
      Pn = mix(Pn, moved, e);
      Dn *= 1.0 - la * e;
      Fn *= 1.0 - lb * e;
    }
    float m = 1.0 - smoothstep(0.84, 1.02, t);
    float dome = sqrt(max(0.0, 1.0 - min(t * t, 1.0)));
    addW = m * uWater * (0.5 + 0.5 * dome) * (0.8 + 0.4 * vnoise(css / 55.0 + s * 1.3));
  } else {
    // the logo stamped: wobbly edge, uneven paint — light skips, mottling, granulation
    vec2 warp = (vec2(vnoise(css / 38.0 + s), vnoise(css / 38.0 + s + 7.3)) - 0.5) * 8.0
              + (vec2(vnoise(css / 8.0 + s * 2.0), vnoise(css / 8.0 + s * 2.0 + 3.1)) - 0.5) * 2.5;
    float m = smoothstep(0.3, 0.7, maskAt(css - uC + warp));
    float big = vnoise(css / 230.0 + s * 1.1);
    float mid = vnoise(css / 64.0 + s * 1.7);
    float fine = vnoise(css / 13.0 + s * 2.3);
    // where the stamp did not touch the paint stays light: patches with a torn edge
    float sk = big * 0.45 + mid * 0.33 + fine * 0.22 + (pp - 0.5) * 0.4;
    float skip = smoothstep(0.3, 0.4, sk);
    float speck = smoothstep(0.25, 0.55, vnoise(css / 2.3 + s * 9.0) * 0.6 + vnoise(css / 5.5 + s * 3.0) * 0.4);
    float ink = mix(1.0 - uSkip, 1.0, skip) * (0.7 + 0.6 * mid) * (0.82 + 0.36 * fine) * mix(1.0, 0.35 + 0.9 * speck, uSkip * 0.6);
    float c1 = smoothstep(0.36, 0.64, vnoise(css / 300.0 + s * 3.1));
    float c2 = smoothstep(0.45, 0.72, vnoise(css / 260.0 + s * 4.7 + 11.0));
    vec3 pig = mix(mix(uA, uB, c1), uE, c2);
    addP = absorb(pig) * m * ink * uPig;
    // uneven water, with a few pools that will run or bloom
    float pud = smoothstep(0.64, 0.74, vnoise(css / 75.0 + s * 6.0) * 0.8 + vnoise(css / 20.0 + s * 2.0) * 0.2);
    addW = m * (uWater * (0.55 + 0.9 * vnoise(css / 120.0 + s * 5.0)) + pud * uPud);
    vec3 l = Dn * m * 0.3; Dn -= l; Pn += l;
  }
  addP *= max(0.0, 1.0 - (Pn.r + Pn.g + Pn.b) / 9.0);
  oW = vec4(min(W + addW, 3.0), addW > 0.03 ? 1.0 : G, w4.b, 0.0);
  oP = vec4(min(Pn + addP, vec3(8.0)), 0.0);
  oD = vec4(Dn, 0.0);
  oF = vec4(Fn, 0.0);
}`

// white light filtered by the floating and the settled pigment; nothing it is given can make it black
const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uP, uD, uF;
uniform float uKp, uKd;
out vec4 outColor;
vec3 S(vec2 uv) { return texture(uD, uv).rgb + texture(uF, uv).rgb; }
void main() {
  vec2 t = 1.0 / vec2(textureSize(uD, 0));
  vec3 d = S(vUv) * 0.6
         + (S(vUv + vec2(t.x, 0)) + S(vUv - vec2(t.x, 0)) + S(vUv + vec2(0, t.y)) + S(vUv - vec2(0, t.y))) * 0.1;
  vec3 k = texture(uP, vUv).rgb * uKp + d * uKd;
  if (any(isnan(k)) || any(isinf(k))) k = vec3(0.0);
  k = clamp(k, 0.0, 24.0);
  // only a runaway pile (far darker than any wash) is eased off before it reaches black
  float n = min(k.r, min(k.g, k.b));
  if (n > 2.5) k -= n - 2.5 - 0.5 * (1.0 - exp((2.5 - n) / 0.5));
  outColor = vec4(exp(-k), 1.0);
}`

// a resized sheet keeps its middle where the middle of the screen is
const COPY_FS = `#version 300 es
precision highp float;
uniform sampler2D uA, uB, uC, uE;
uniform vec2 uDst, uSrc;
uniform float uK2; // source px per px
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
layout(location = 2) out vec4 o2;
layout(location = 3) out vec4 o3;
void main() {
  vec2 q = (gl_FragCoord.xy - uDst) * uK2 + uSrc;
  vec2 n = vec2(textureSize(uA, 0));
  if (q.x < 0.0 || q.y < 0.0 || q.x >= n.x || q.y >= n.y) { o0 = o1 = o2 = o3 = vec4(0.0); return; }
  q /= n;
  o0 = texture(uA, q); o1 = texture(uB, q); o2 = texture(uC, q); o3 = texture(uE, q);
}`

function program(vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as [number, string][]) {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    gl.attachShader(p, s)
  }
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program')
  return p
}
function uniforms<K extends string>(p: WebGLProgram, names: K[]): Record<K, WebGLUniformLocation | null> {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) as Record<K, WebGLUniformLocation | null>
}
const stProg = program(FULL_VS, STEP_FS)
const spProg = program(FULL_VS, STAMP_FS)
const cpProg = program(FULL_VS, COMP_FS)
const cyProg = program(FULL_VS, COPY_FS)
const STU = uniforms(stProg, [
  'uW', 'uP', 'uD', 'uF', 'uPaper', 'uTexel', 'uScale', 'uSimH', 'uK', 'uEvap', 'uFadeP', 'uWLoss', 'uDep',
  'uRim', 'uGran', 'uGrav', 'uStart', 'uStop', 'uTrail', 'uCreep', 'uCreepWet', 'uPDiff', 'uWDiff', 'uLiftK', 'uPR', 'uBloom',
  'uFlowG', 'uFlowN', 'uFlowCap', 'uR1',
])
const SPU = uniforms(spProg, [
  'uW', 'uP', 'uD', 'uF', 'uPaper', 'uMask', 'uTexel', 'uSimSize', 'uScale', 'uSimH', 'uKind', 'uC', 'uR', 'uSeed', 'uWater',
  'uPig', 'uSkip', 'uPud', 'uA', 'uB', 'uE',
])
const CPU = uniforms(cpProg, ['uP', 'uD', 'uF', 'uKp', 'uKd'])
const CYU = uniforms(cyProg, ['uA', 'uB', 'uC', 'uE', 'uDst', 'uSrc', 'uK2'])
const fullVao = gl.createVertexArray()

// Every look is drawn for the logo on a 1440×900 desktop (630 css px) at 0.75 sim px per css px. A
// screen draws it in design px (css px × design), so a phone shows the same painting as a desktop,
// and runs the sim finer where the screen is sharp, within a budget of cells.
const REF_LOGO = 630
let simScale = 0.75 // sim px per css px
let quality = 1 // drops when the frames come too slow
const CELLS = +(query.get('cells') || 0) // a cell budget to try instead
let design = 1 // design px per css px
const ratio = () => simScale / design / 0.75 // sim px for every one the look was tuned at
type State = { tex: WebGLTexture[]; fbo: WebGLFramebuffer }
type Sim = { w: number; h: number; states: State[]; cur: number }
let sim: Sim | null = null

function makeSim(w: number, h: number): Sim {
  const states = [0, 1].map(() => {
    const tex = [0, 1, 2, 3].map(() => {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    })
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    tex.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0))
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3])
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return { tex, fbo }
  })
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { w, h, states, cur: 0 }
}

function dropSim(s: Sim) {
  for (const st of s.states) {
    st.tex.forEach((t) => gl.deleteTexture(t))
    gl.deleteFramebuffer(st.fbo)
  }
}

// --- paper: not drawn, only felt by the paint (granulation, ragged edges, lobes, swirls) -------------
const PAPER_N = 1024 // texels, laid over 512 css px
const paperTex = gl.createTexture()
function makePaper() {
  const N = PAPER_N
  const H = new Float32Array(N * N)
  // value noise that wraps every N px: six octaves, coarse to fine
  const OCT = [
    [2, 0.22, 11],
    [4, 0.3, 23],
    [8, 0.22, 37],
    [16, 0.12, 51],
    [64, 0.09, 67],
    [256, 0.05, 79],
  ]
  for (const [cell, weight, sd] of OCT) {
    const P = N / cell
    const s = sd * 1000
    for (let y = 0; y < N; y++) {
      const gy = y / cell
      const iy = Math.floor(gy)
      const fy = gy - iy
      const uy = fy * fy * (3 - 2 * fy)
      const y0 = iy % P
      const y1 = (iy + 1) % P
      for (let x = 0; x < N; x++) {
        const gx = x / cell
        const ix = Math.floor(gx)
        const fx = gx - ix
        const ux = fx * fx * (3 - 2 * fx)
        const x0 = (ix % P) + s
        const x1 = ((ix + 1) % P) + s
        const a = hash2(x0, y0)
        const b = hash2(x1, y0)
        const c = hash2(x0, y1)
        const d = hash2(x1, y1)
        H[y * N + x] += (a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy) * weight
      }
    }
  }
  // fibres: short curved hairs pressed into the sheet
  const fc = document.createElement('canvas')
  fc.width = fc.height = N
  const fx = fc.getContext('2d')!
  const R = rng(4242)
  fx.fillStyle = '#000'
  fx.fillRect(0, 0, N, N)
  fx.lineCap = 'round'
  for (let i = 0; i < 900; i++) {
    const x = R() * N
    const y = R() * N
    const a = R() * Math.PI * 2
    const l = 14 + R() * 70
    const bend = (R() - 0.5) * l * 0.8
    const ex = x + Math.cos(a) * l
    const ey = y + Math.sin(a) * l
    const mx = (x + ex) / 2 - Math.sin(a) * bend
    const my = (y + ey) / 2 + Math.cos(a) * bend
    fx.strokeStyle = `rgba(255,255,255,${0.12 + R() * 0.3})`
    fx.lineWidth = 0.6 + R() * 1.2
    for (const ox of [-N, 0, N]) {
      for (const oy of [-N, 0, N]) {
        fx.beginPath()
        fx.moveTo(x + ox, y + oy)
        fx.quadraticCurveTo(mx + ox, my + oy, ex + ox, ey + oy)
        fx.stroke()
      }
    }
  }
  const fd = fx.getImageData(0, 0, N, N).data
  let lo = 1e9
  let hi = -1e9
  for (let i = 0; i < N * N; i++) {
    H[i] += (fd[i * 4] / 255) * 0.12
    if (H[i] < lo) lo = H[i]
    if (H[i] > hi) hi = H[i]
  }
  const h8 = new Uint8Array(N * N)
  for (let i = 0; i < N * N; i++) h8[i] = ((H[i] - lo) / (hi - lo)) * 255
  gl.bindTexture(gl.TEXTURE_2D, paperTex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, N, N, 0, gl.RED, gl.UNSIGNED_BYTE, h8)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
}

// --- the logo as a mask, in sim px (row 0 at the top, like css) ---------------------------------------
const maskTex = gl.createTexture()
const logo = { size: 0, s: 1, stroke: 0 } // css px; stroke is the mark's, before it is made fat
const FAT_BARS = logoBars(LOGO_STROKE * LOOK.fat) // a fat logo closes its joins for its own width
let vw = 0
let vh = 0
let cx = 0
let cy = 0

function makeMask() {
  const s = sim!
  const c = document.createElement('canvas')
  c.width = s.w
  c.height = s.h
  const x = c.getContext('2d')!
  x.fillStyle = '#000'
  x.fillRect(0, 0, c.width, c.height)
  x.scale(simScale, simScale)
  x.strokeStyle = '#fff'
  x.lineWidth = logo.stroke * LOOK.fat
  x.lineCap = 'butt'
  const mid = LOGO_MIN + LOGO_SPAN / 2
  for (const b of FAT_BARS) {
    x.beginPath()
    x.moveTo(cx + (b.ax - mid) * logo.s, cy + (b.ay - mid) * logo.s)
    x.lineTo(cx + (b.bx - mid) * logo.s, cy + (b.by - mid) * logo.s)
    x.stroke()
  }
  gl.bindTexture(gl.TEXTURE_2D, maskTex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, c)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

// --- the view ----------------------------------------------------------------------------------------
let stamped = false // the logo is on the sheet: from then on it is paint, and a resize keeps it
function resize(slower = false) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const was = simScale
  canvas.width = Math.ceil(innerWidth * dpr)
  canvas.height = Math.ceil(innerHeight * dpr)
  // a resize after the stamp keeps the scale (and the logo), so the paint stays where it is
  if (!stamped) design = REF_LOGO / (Math.min(innerWidth, innerHeight) * LOOK.logo)
  if (!stamped || slower) {
    const budget = CELLS || (matchMedia('(pointer: coarse)').matches ? 0.5e6 : 1.3e6)
    simScale = Math.min(Math.max(0.75 * dpr, 0.75 * design), Math.sqrt(budget / (innerWidth * innerHeight)), 1.5 * design) * quality
  }
  const w = Math.ceil(innerWidth * simScale)
  const h = Math.ceil(innerHeight * simScale)
  if (sim && sim.w === w && sim.h === h && was === simScale) return
  const next = makeSim(w, h)
  if (sim) {
    const from = sim.states[sim.cur]
    gl.disable(gl.BLEND)
    gl.bindFramebuffer(gl.FRAMEBUFFER, next.states[0].fbo)
    gl.viewport(0, 0, w, h)
    gl.useProgram(cyProg)
    gl.bindVertexArray(fullVao)
    from.tex.forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, t)
    })
    gl.uniform1i(CYU.uA, 0)
    gl.uniform1i(CYU.uB, 1)
    gl.uniform1i(CYU.uC, 2)
    gl.uniform1i(CYU.uE, 3)
    if (was === simScale) {
      gl.uniform2f(CYU.uDst, Math.round((w - sim.w) / 2), Math.round((h - sim.h) / 2))
      gl.uniform2f(CYU.uSrc, 0, 0)
    } else {
      gl.uniform2f(CYU.uDst, w / 2, h / 2)
      gl.uniform2f(CYU.uSrc, sim.w / 2, sim.h / 2)
    }
    gl.uniform1f(CYU.uK2, was / simScale)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    dropSim(sim)
  }
  sim = next
  vw = innerWidth
  vh = innerHeight
  cx = vw / 2
  cy = vh / 2
  if (!stamped) {
    logo.size = Math.min(vw, vh) * LOOK.logo
    logo.s = logo.size / LOGO_SPAN
    logo.stroke = LOGO_STROKE * logo.s
    makeMask()
  }
}

// --- passes ------------------------------------------------------------------------------------------
function bindState(st: State, U: Record<'uW' | 'uP' | 'uD' | 'uF' | 'uPaper' | 'uTexel' | 'uScale' | 'uSimH', WebGLUniformLocation | null>) {
  const s = sim!
  st.tex.forEach((t, i) => {
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, t)
  })
  gl.activeTexture(gl.TEXTURE4)
  gl.bindTexture(gl.TEXTURE_2D, paperTex)
  gl.activeTexture(gl.TEXTURE5)
  gl.bindTexture(gl.TEXTURE_2D, maskTex)
  gl.uniform1i(U.uW, 0)
  gl.uniform1i(U.uP, 1)
  gl.uniform1i(U.uD, 2)
  gl.uniform1i(U.uF, 3)
  gl.uniform1i(U.uPaper, 4)
  gl.uniform2f(U.uTexel, 1 / s.w, 1 / s.h)
  gl.uniform1f(U.uScale, simScale / design)
  gl.uniform1f(U.uSimH, s.h)
}

// where the sheet leans now: css px a 60th of a second the excess water slides
const grav = { x: 0, y: LOOK.sway[1] }
function step(K: number) {
  const s = sim!
  const A = s.states[s.cur]
  const B = s.states[1 - s.cur]
  gl.disable(gl.BLEND)
  gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo)
  gl.viewport(0, 0, s.w, s.h)
  gl.useProgram(stProg)
  gl.bindVertexArray(fullVao)
  bindState(A, STU)
  gl.uniform1f(STU.uK, K)
  gl.uniform1f(STU.uEvap, SHEET.evap)
  gl.uniform1f(STU.uFadeP, Math.exp(-K / 60 / SHEET.float))
  gl.uniform1f(STU.uWLoss, SHEET.wloss)
  gl.uniform1f(STU.uDep, SHEET.dep)
  gl.uniform1f(STU.uRim, SHEET.rim)
  gl.uniform1f(STU.uGran, SHEET.gran)
  gl.uniform2f(STU.uGrav, grav.x * ratio(), grav.y * ratio())
  gl.uniform1f(STU.uR1, ratio())
  gl.uniform1f(STU.uStart, SHEET.start)
  gl.uniform1f(STU.uStop, SHEET.stop)
  gl.uniform1f(STU.uTrail, SHEET.trail)
  gl.uniform1f(STU.uCreep, SHEET.creep)
  gl.uniform1f(STU.uCreepWet, SHEET.creepWet)
  gl.uniform1f(STU.uPDiff, SHEET.pdiff)
  gl.uniform1f(STU.uWDiff, SHEET.wdiff)
  gl.uniform1f(STU.uLiftK, SHEET.lift)
  gl.uniform1f(STU.uPR, SHEET.pr * ratio())
  gl.uniform1f(STU.uBloom, SHEET.bloom)
  gl.uniform1f(STU.uFlowG, SHEET.flowG)
  gl.uniform1f(STU.uFlowN, SHEET.flowN)
  gl.uniform1f(STU.uFlowCap, SHEET.flowCap)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  s.cur = 1 - s.cur
}

// ?stats: the water and the paint on the sheet (floating, settled, fixed), to check nothing makes paint
if (query.has('stats')) {
  ;(window as unknown as { __wcTotal: () => number[] }).__wcTotal = () => {
    const s = sim!
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, s.states[s.cur].fbo)
    const buf = new Float32Array(s.w * s.h * 4)
    const out: number[] = []
    for (let i = 0; i < 4; i++) {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i)
      gl.readPixels(0, 0, s.w, s.h, gl.RGBA, gl.FLOAT, buf)
      let t = 0
      for (let j = 0; j < buf.length; j += 4) t += i ? buf[j] + buf[j + 1] + buf[j + 2] : buf[j]
      out.push(Math.round(t))
    }
    gl.readBuffer(gl.COLOR_ATTACHMENT0)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
    return out
  }
  ;(window as unknown as { __wcScale: () => number[] }).__wcScale = () => [simScale, ratio(), sim!.w, sim!.h, quality]
}

const WATER = 0
const LOGO = 1
type Stamp = {
  kind: number
  x: number
  y: number
  r: number
  water: number
  pig: number
  skip: number
  pud: number
  seed: number
  a: RGB
  b: RGB
  e: RGB
}
const WHITE: RGB = [1, 1, 1]
const pending: Stamp[] = []

function stamp(o: Stamp) {
  const s = sim!
  const A = s.states[s.cur]
  const B = s.states[1 - s.cur]
  gl.disable(gl.BLEND)
  gl.bindFramebuffer(gl.FRAMEBUFFER, B.fbo)
  gl.viewport(0, 0, s.w, s.h)
  gl.useProgram(spProg)
  gl.bindVertexArray(fullVao)
  bindState(A, SPU)
  gl.uniform1i(SPU.uMask, 5)
  gl.uniform2f(SPU.uSimSize, s.w, s.h)
  gl.uniform1i(SPU.uKind, o.kind)
  gl.uniform2f(SPU.uC, o.x * design, o.y * design)
  gl.uniform1f(SPU.uR, o.r * design)
  gl.uniform1f(SPU.uSeed, o.seed)
  gl.uniform1f(SPU.uWater, o.water)
  gl.uniform1f(SPU.uPig, o.pig)
  gl.uniform1f(SPU.uSkip, o.skip)
  gl.uniform1f(SPU.uPud, o.pud)
  gl.uniform3f(SPU.uA, o.a[0], o.a[1], o.a[2])
  gl.uniform3f(SPU.uB, o.b[0], o.b[1], o.b[2])
  gl.uniform3f(SPU.uE, o.e[0], o.e[1], o.e[2])
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  s.cur = 1 - s.cur
}

function show() {
  const C = sim!.states[sim!.cur]
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.useProgram(cpProg)
  gl.bindVertexArray(fullVao)
  for (let i = 1; i <= 3; i++) {
    gl.activeTexture(gl.TEXTURE0 + i)
    gl.bindTexture(gl.TEXTURE_2D, C.tex[i])
  }
  gl.uniform1i(CPU.uP, 1)
  gl.uniform1i(CPU.uD, 2)
  gl.uniform1i(CPU.uF, 3)
  gl.uniform1f(CPU.uKp, SHEET.kp)
  gl.uniform1f(CPU.uKd, SHEET.kd)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindVertexArray(null)
}

// --- the logo ----------------------------------------------------------------------------------------
const hue = Math.floor(rnd() * RAINBOW.length)
function stampLogo() {
  pending.push({
    kind: LOGO,
    x: 0,
    y: 0,
    r: 0,
    water: 0.4, // the wash
    pud: 1.15, // and its pools, which will run
    pig: 1.3,
    skip: 0.12,
    seed: rnd() * 100,
    a: RAINBOW[hue][0],
    b: RAINBOW[(hue + 2) % 6][1],
    e: RAINBOW[(hue + 4) % 6][0],
  })
}

// a big puddle of clean water, never the same twice: size, outline, how much water, how hard it
// pushes the paint out, and sometimes a smaller drop or two splashed beside it
function dropWater(x: number, y: number) {
  const r = logo.stroke * LOOK.drop * between(LOOK.dropSize[0], LOOK.dropSize[1])
  const water = between(LOOK.dropWater[0], LOOK.dropWater[1])
  const push = between(LOOK.dropPush[0], LOOK.dropPush[1])
  const drop = { kind: WATER, pud: 0, a: WHITE, b: WHITE, e: WHITE }
  pending.push({ ...drop, x, y, r, water, pig: push, skip: between(0, 0.2), seed: Math.random() * 100 })
  const n = Math.random() < 0.45 ? 0 : Math.random() < 0.6 ? 1 : 2
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const d = r * between(0.95, 1.35)
    pending.push({
      ...drop,
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d,
      r: r * between(0.14, 0.32),
      water: water * between(0.7, 1.1),
      pig: push,
      skip: between(0, 0.15),
      seed: Math.random() * 100,
    })
  }
}

// --- the lean ----------------------------------------------------------------------------------------
// a drag, else the phone's own tilt, else the sheet by itself; the wheel sets how steep
const tilt = { drag: false, tx: 0, ty: 0, orient: false, ox: 0, oy: 0, asked: false, k: 1 }
function askOrientation() {
  if (tilt.asked) return
  tilt.asked = true
  const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined
  const listen = () =>
    addEventListener('deviceorientation', (e) => {
      if (e.beta == null || e.gamma == null) return
      // portrait: gamma leans left and right, beta toward and away; turned with the screen
      const gx = Math.sin((e.gamma * Math.PI) / 180)
      const gy = Math.sin((clamp(e.beta, -90, 90) * Math.PI) / 180)
      const turned = screen.orientation ? screen.orientation.angle : Number((window as unknown as { orientation?: number }).orientation) || 0
      const ang = (turned * Math.PI) / 180
      const c = Math.cos(ang)
      const s = Math.sin(ang)
      tilt.orient = true
      tilt.ox = gx * c + gy * s
      tilt.oy = -gx * s + gy * c
    })
  if (!D) return
  // iOS asks first, and only from a tap
  if (typeof D.requestPermission === 'function') {
    D.requestPermission()
      .then((r) => r === 'granted' && listen())
      .catch(() => {
        // refused or not allowed here (an embed): the sheet leans by itself
      })
  } else listen()
}

function lean(dt: number, clock: number) {
  let tx: number
  let ty: number
  if (tilt.drag) {
    tx = tilt.tx
    ty = tilt.ty
  } else if (tilt.orient) {
    tx = tilt.ox * 0.9
    ty = tilt.oy * 0.9
  } else {
    const [sx, sy, sw] = LOOK.sway
    tx = Math.sin(clock / 4.3) * sx
    ty = sy + Math.sin(clock / 6.1) * sw
  }
  tx *= tilt.k
  ty *= tilt.k
  const m = Math.hypot(tx, ty)
  if (m > LOOK.lean) {
    tx *= LOOK.lean / m
    ty *= LOOK.lean / m
  }
  const ease = Math.min(1, dt * 3)
  grav.x += (tx - grav.x) * ease
  grav.y += (ty - grav.y) * ease
}

// --- the visitor's hand ------------------------------------------------------------------------------
// a press that does not move is a drop of water, on release (one a press, however long it is held);
// one that moves leans the sheet
type Press = { x0: number; y0: number; moved: boolean }
const presses = new Map<number, Press>()
canvas.addEventListener('contextmenu', (e) => e.preventDefault())
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  try {
    canvas.setPointerCapture(e.pointerId)
  } catch {
    // a pointer the browser no longer tracks: go on without capture
  }
  document.body.classList.add('taken')
  if (e.pointerType !== 'mouse') askOrientation()
  presses.set(e.pointerId, { x0: e.clientX, y0: e.clientY, moved: false })
})
canvas.addEventListener('pointermove', (e) => {
  const pr = presses.get(e.pointerId)
  if (!pr) return
  const dx = e.clientX - pr.x0
  const dy = e.clientY - pr.y0
  if (!pr.moved && Math.hypot(dx, dy) > 8) pr.moved = true
  if (!pr.moved) return
  tilt.drag = true
  tilt.tx = dx / LOOK.drag
  tilt.ty = dy / LOOK.drag
})
const release = (e: PointerEvent) => {
  const pr = presses.get(e.pointerId)
  presses.delete(e.pointerId)
  if (!presses.size) tilt.drag = false
  if (!pr || pr.moved || e.type === 'pointercancel') return
  dropWater(pr.x0, pr.y0)
}
canvas.addEventListener('pointerup', release)
canvas.addEventListener('pointercancel', release)

if (!EMBEDDED) {
  addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
  // the wheel: down steeper, up flatter until the runs stop
  addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      if (tilt.k === 0 && dy > 0) tilt.k = 0.12
      tilt.k = clamp(tilt.k * Math.exp(dy * 0.0016), 0, 3)
      if (tilt.k < 0.08 && dy < 0) tilt.k = 0
    },
    { passive: false },
  )
}

// --- the frame ---------------------------------------------------------------------------------------
makePaper()
resize()
let resizeTimer = 0
addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(resize, 150)
})

// The water moves in fixed steps of a 60th of a second, whatever the screen's rate: a longer step
// makes the sheet unstable (paint piles up to black), so a slow frame runs up to three steps and a
// slower one lets the sheet fall behind.
let last = performance.now()
let owed = 0
let clock = 0
let ema = 1 / 60
let slow = 0
function frame(nowMs: number) {
  requestAnimationFrame(frame)
  const dt = Math.min(0.1, Math.max(0, (nowMs - last) / 1000))
  last = nowMs
  clock += dt
  if (!stamped && clock >= LOOK.at) {
    stamped = true
    stampLogo()
  }
  lean(dt, clock)
  while (pending.length) stamp(pending.shift()!)
  // frames too slow for a second: a coarser sheet (twice at most)
  ema += (dt - ema) * 0.1
  slow = stamped && clock > 2 && quality > 0.5 && ema > 0.02 ? slow + dt : 0
  if (slow > 1) {
    slow = 0
    ema = 1 / 60
    quality *= 0.7
    resize(true)
  }
  owed += dt
  const steps = Math.min(3, Math.floor(owed * 60 + 0.01))
  if (!steps) return
  owed = Math.max(0, owed - steps / 60)
  if (owed > 0.05) owed = 0
  for (let i = 0; i < steps; i++) for (let j = 0; j < SHEET.sub; j++) step(1 / SHEET.sub)
  show()
}
requestAnimationFrame(frame)
