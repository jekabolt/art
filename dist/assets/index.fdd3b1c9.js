import"./modulepreload-polyfill.b7f2da20.js";import{E as Ee}from"./embed.d17cc095.js";import{l as Ie}from"./logo-bars.dd01370b.js";import{b as Te,c as Pe,a as qe}from"./logo-path.248ebb5a.js";/* empty css              */const Y=[[[.47,.3,.88],[.12,.38,.92]],[[.14,.4,.93],[.2,.72,.62]],[[.95,.17,.28],[.98,.55,.15]],[[.5,.86,.26],[.98,.82,.2]],[[.98,.78,.25],[.95,.3,.22]],[[.88,.24,.62],[.47,.3,.88]]],d={logo:Ee?.78:.7,fat:1.4,at:.4,sway:[.08,.3,.05],drag:150,lean:1.4,drop:3.2,dropSize:[.6,1.6],dropWater:[.7,1.5],dropPush:[.35,1]},s={start:1.15,stop:.55,trail:.27,creep:.55,creepWet:2.4,bloom:.3,pdiff:.06,wdiff:.24,pr:2.5,lift:10,flowG:3,flowN:.12,flowCap:.06,evap:6e-4,float:60,wloss:.03,dep:.0012,rim:7,gran:.4,sub:2,kp:.55,kd:1.1};for(const[t,o]of new URLSearchParams(location.search)){const a=t.startsWith("sheet.")?t.slice(6):null;a&&a in s&&Number.isFinite(+o)&&(s[a]=+o)}const ce=new URLSearchParams(location.search);let oe=(parseInt(ce.get("seed")||"",10)||Math.floor(Math.random()*2**31))>>>0;function le(){oe=oe+1831565813>>>0;let t=oe;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}const P=(t,o)=>t+(o-t)*le(),be=(t,o=0,a=1)=>Math.min(a,Math.max(o,t));function K(t,o){let a=(Math.imul(t|0,668265261)^Math.imul(o|0,374761393))>>>0;return a=Math.imul(a^a>>>15,2246822507)>>>0,a=Math.imul(a^a>>>13,3266489909)>>>0,a=(a^a>>>16)>>>0,a/4294967296}function Ne(t){let o=t>>>0;return()=>{o=o+1831565813>>>0;let a=Math.imul(o^o>>>15,o|1);return a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}const g=document.getElementById("watercolor"),Re=g.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1});if(!Re)throw new Error("watercolor: no WebGL2");const e=Re;e.getExtension("EXT_color_buffer_float")||e.getExtension("EXT_color_buffer_half_float");const ye=`
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
}`,J=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,Oe=`#version 300 es
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
${ye}
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
}`,Xe=`#version 300 es
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
${ye}
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
    // the logo stamped: wobbly edge, uneven paint \u2014 light skips, mottling, granulation
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
}`,Be=`#version 300 es
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
}`,Ge=`#version 300 es
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
}`;function $(t,o){const a=e.createProgram();for(const[r,n]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,o]]){const i=e.createShader(r);if(e.shaderSource(i,n),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(i)||"shader");e.attachShader(a,i)}if(e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(a)||"program");return a}function Q(t,o){return Object.fromEntries(o.map(a=>[a,e.getUniformLocation(t,a)]))}const ke=$(J,Oe),Se=$(J,Xe),De=$(J,Be),Ae=$(J,Ge),u=Q(ke,["uW","uP","uD","uF","uPaper","uTexel","uScale","uSimH","uK","uEvap","uFadeP","uWLoss","uDep","uRim","uGran","uGrav","uStart","uStop","uTrail","uCreep","uCreepWet","uPDiff","uWDiff","uLiftK","uPR","uBloom","uFlowG","uFlowN","uFlowCap","uR1"]),v=Q(Se,["uW","uP","uD","uF","uPaper","uMask","uTexel","uSimSize","uScale","uSimH","uKind","uC","uR","uSeed","uWater","uPig","uSkip","uPud","uA","uB","uE"]),I=Q(De,["uP","uD","uF","uKp","uKd"]),T=Q(Ae,["uA","uB","uC","uE","uDst","uSrc","uK2"]),Z=e.createVertexArray(),Ke=630;let w=.75,j=1;const He=+(ce.get("cells")||0);let b=1;const q=()=>w/b/.75;let l=null;function ze(t,o){const a=[0,1].map(()=>{const r=[0,1,2,3].map(()=>{const i=e.createTexture();return e.bindTexture(e.TEXTURE_2D,i),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,t,o,0,e.RGBA,e.HALF_FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i}),n=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,n),r.forEach((i,p)=>e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+p,e.TEXTURE_2D,i,0)),e.drawBuffers([e.COLOR_ATTACHMENT0,e.COLOR_ATTACHMENT1,e.COLOR_ATTACHMENT2,e.COLOR_ATTACHMENT3]),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),{tex:r,fbo:n}});return e.bindFramebuffer(e.FRAMEBUFFER,null),{w:t,h:o,states:a,cur:0}}function Ve(t){for(const o of t.states)o.tex.forEach(a=>e.deleteTexture(a)),e.deleteFramebuffer(o.fbo)}const Ye=1024,Fe=e.createTexture();function je(){const t=Ye,o=new Float32Array(t*t),a=[[2,.22,11],[4,.3,23],[8,.22,37],[16,.12,51],[64,.09,67],[256,.05,79]];for(const[f,L,U]of a){const E=t/f,y=U*1e3;for(let R=0;R<t;R++){const W=R/f,k=Math.floor(W),C=W-k,X=C*C*(3-2*C),S=k%E,D=(k+1)%E;for(let B=0;B<t;B++){const de=B/f,ee=Math.floor(de),te=de-ee,pe=te*te*(3-2*te),me=ee%E+y,ve=(ee+1)%E+y,G=K(me,S),he=K(ve,S),ge=K(me,D),Ce=K(ve,D);o[R*t+B]+=(G+(he-G)*pe+(ge-G)*X+(G-he-ge+Ce)*pe*X)*L}}}const r=document.createElement("canvas");r.width=r.height=t;const n=r.getContext("2d"),i=Ne(4242);n.fillStyle="#000",n.fillRect(0,0,t,t),n.lineCap="round";for(let f=0;f<900;f++){const L=i()*t,U=i()*t,E=i()*Math.PI*2,y=14+i()*70,R=(i()-.5)*y*.8,W=L+Math.cos(E)*y,k=U+Math.sin(E)*y,C=(L+W)/2-Math.sin(E)*R,X=(U+k)/2+Math.cos(E)*R;n.strokeStyle=`rgba(255,255,255,${.12+i()*.3})`,n.lineWidth=.6+i()*1.2;for(const S of[-t,0,t])for(const D of[-t,0,t])n.beginPath(),n.moveTo(L+S,U+D),n.quadraticCurveTo(C+S,X+D,W+S,k+D),n.stroke()}const p=n.getImageData(0,0,t,t).data;let m=1e9,h=-1e9;for(let f=0;f<t*t;f++)o[f]+=p[f*4]/255*.12,o[f]<m&&(m=o[f]),o[f]>h&&(h=o[f]);const M=new Uint8Array(t*t);for(let f=0;f<t*t;f++)M[f]=(o[f]-m)/(h-m)*255;e.bindTexture(e.TEXTURE_2D,Fe),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.R8,t,t,0,e.RED,e.UNSIGNED_BYTE,M),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT)}const _e=e.createTexture(),x={size:0,s:1,stroke:0},Je=Ie(Te*d.fat);let ae=0,re=0,se=0,ue=0;function $e(){const t=l,o=document.createElement("canvas");o.width=t.w,o.height=t.h;const a=o.getContext("2d");a.fillStyle="#000",a.fillRect(0,0,o.width,o.height),a.scale(w,w),a.strokeStyle="#fff",a.lineWidth=x.stroke*d.fat,a.lineCap="butt";const r=qe+Pe/2;for(const n of Je)a.beginPath(),a.moveTo(se+(n.ax-r)*x.s,ue+(n.ay-r)*x.s),a.lineTo(se+(n.bx-r)*x.s,ue+(n.by-r)*x.s),a.stroke();e.bindTexture(e.TEXTURE_2D,_e),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.R8,e.RED,e.UNSIGNED_BYTE,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}let _=!1;function fe(t=!1){const o=Math.min(window.devicePixelRatio||1,2),a=w;if(g.width=Math.ceil(innerWidth*o),g.height=Math.ceil(innerHeight*o),_||(b=Ke/(Math.min(innerWidth,innerHeight)*d.logo)),!_||t){const p=He||(matchMedia("(pointer: coarse)").matches?5e5:13e5);w=Math.min(Math.max(.75*o,.75*b),Math.sqrt(p/(innerWidth*innerHeight)),1.5*b)*j}const r=Math.ceil(innerWidth*w),n=Math.ceil(innerHeight*w);if(l&&l.w===r&&l.h===n&&a===w)return;const i=ze(r,n);if(l){const p=l.states[l.cur];e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,i.states[0].fbo),e.viewport(0,0,r,n),e.useProgram(Ae),e.bindVertexArray(Z),p.tex.forEach((m,h)=>{e.activeTexture(e.TEXTURE0+h),e.bindTexture(e.TEXTURE_2D,m)}),e.uniform1i(T.uA,0),e.uniform1i(T.uB,1),e.uniform1i(T.uC,2),e.uniform1i(T.uE,3),a===w?(e.uniform2f(T.uDst,Math.round((r-l.w)/2),Math.round((n-l.h)/2)),e.uniform2f(T.uSrc,0,0)):(e.uniform2f(T.uDst,r/2,n/2),e.uniform2f(T.uSrc,l.w/2,l.h/2)),e.uniform1f(T.uK2,a/w),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,null),Ve(l)}l=i,ae=innerWidth,re=innerHeight,se=ae/2,ue=re/2,_||(x.size=Math.min(ae,re)*d.logo,x.s=x.size/Pe,x.stroke=Te*x.s,$e())}function Me(t,o){const a=l;t.tex.forEach((r,n)=>{e.activeTexture(e.TEXTURE0+n),e.bindTexture(e.TEXTURE_2D,r)}),e.activeTexture(e.TEXTURE4),e.bindTexture(e.TEXTURE_2D,Fe),e.activeTexture(e.TEXTURE5),e.bindTexture(e.TEXTURE_2D,_e),e.uniform1i(o.uW,0),e.uniform1i(o.uP,1),e.uniform1i(o.uD,2),e.uniform1i(o.uF,3),e.uniform1i(o.uPaper,4),e.uniform2f(o.uTexel,1/a.w,1/a.h),e.uniform1f(o.uScale,w/b),e.uniform1f(o.uSimH,a.h)}const F={x:0,y:d.sway[1]};function Qe(t){const o=l,a=o.states[o.cur],r=o.states[1-o.cur];e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,r.fbo),e.viewport(0,0,o.w,o.h),e.useProgram(ke),e.bindVertexArray(Z),Me(a,u),e.uniform1f(u.uK,t),e.uniform1f(u.uEvap,s.evap),e.uniform1f(u.uFadeP,Math.exp(-t/60/s.float)),e.uniform1f(u.uWLoss,s.wloss),e.uniform1f(u.uDep,s.dep),e.uniform1f(u.uRim,s.rim),e.uniform1f(u.uGran,s.gran),e.uniform2f(u.uGrav,F.x*q(),F.y*q()),e.uniform1f(u.uR1,q()),e.uniform1f(u.uStart,s.start),e.uniform1f(u.uStop,s.stop),e.uniform1f(u.uTrail,s.trail),e.uniform1f(u.uCreep,s.creep),e.uniform1f(u.uCreepWet,s.creepWet),e.uniform1f(u.uPDiff,s.pdiff),e.uniform1f(u.uWDiff,s.wdiff),e.uniform1f(u.uLiftK,s.lift),e.uniform1f(u.uPR,s.pr*q()),e.uniform1f(u.uBloom,s.bloom),e.uniform1f(u.uFlowG,s.flowG),e.uniform1f(u.uFlowN,s.flowN),e.uniform1f(u.uFlowCap,s.flowCap),e.drawArrays(e.TRIANGLES,0,3),o.cur=1-o.cur}ce.has("stats")&&(window.__wcTotal=()=>{const t=l;e.bindFramebuffer(e.READ_FRAMEBUFFER,t.states[t.cur].fbo);const o=new Float32Array(t.w*t.h*4),a=[];for(let r=0;r<4;r++){e.readBuffer(e.COLOR_ATTACHMENT0+r),e.readPixels(0,0,t.w,t.h,e.RGBA,e.FLOAT,o);let n=0;for(let i=0;i<o.length;i+=4)n+=r?o[i]+o[i+1]+o[i+2]:o[i];a.push(Math.round(n))}return e.readBuffer(e.COLOR_ATTACHMENT0),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),a},window.__wcScale=()=>[w,q(),l.w,l.h,j]);const Ze=0,et=1,ne=[1,1,1],O=[];function tt(t){const o=l,a=o.states[o.cur],r=o.states[1-o.cur];e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,r.fbo),e.viewport(0,0,o.w,o.h),e.useProgram(Se),e.bindVertexArray(Z),Me(a,v),e.uniform1i(v.uMask,5),e.uniform2f(v.uSimSize,o.w,o.h),e.uniform1i(v.uKind,t.kind),e.uniform2f(v.uC,t.x*b,t.y*b),e.uniform1f(v.uR,t.r*b),e.uniform1f(v.uSeed,t.seed),e.uniform1f(v.uWater,t.water),e.uniform1f(v.uPig,t.pig),e.uniform1f(v.uSkip,t.skip),e.uniform1f(v.uPud,t.pud),e.uniform3f(v.uA,t.a[0],t.a[1],t.a[2]),e.uniform3f(v.uB,t.b[0],t.b[1],t.b[2]),e.uniform3f(v.uE,t.e[0],t.e[1],t.e[2]),e.drawArrays(e.TRIANGLES,0,3),o.cur=1-o.cur}function ot(){const t=l.states[l.cur];e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,g.width,g.height),e.useProgram(De),e.bindVertexArray(Z);for(let o=1;o<=3;o++)e.activeTexture(e.TEXTURE0+o),e.bindTexture(e.TEXTURE_2D,t.tex[o]);e.uniform1i(I.uP,1),e.uniform1i(I.uD,2),e.uniform1i(I.uF,3),e.uniform1f(I.uKp,s.kp),e.uniform1f(I.uKd,s.kd),e.drawArrays(e.TRIANGLES,0,3),e.activeTexture(e.TEXTURE0),e.bindVertexArray(null)}const ie=Math.floor(le()*Y.length);function at(){O.push({kind:et,x:0,y:0,r:0,water:.4,pud:1.15,pig:1.3,skip:.12,seed:le()*100,a:Y[ie][0],b:Y[(ie+2)%6][1],e:Y[(ie+4)%6][0]})}function rt(t,o){const a=x.stroke*d.drop*P(d.dropSize[0],d.dropSize[1]),r=P(d.dropWater[0],d.dropWater[1]),n=P(d.dropPush[0],d.dropPush[1]),i={kind:Ze,pud:0,a:ne,b:ne,e:ne};O.push({...i,x:t,y:o,r:a,water:r,pig:n,skip:P(0,.2),seed:Math.random()*100});const p=Math.random()<.45?0:Math.random()<.6?1:2;for(let m=0;m<p;m++){const h=Math.random()*Math.PI*2,M=a*P(.95,1.35);O.push({...i,x:t+Math.cos(h)*M,y:o+Math.sin(h)*M,r:a*P(.14,.32),water:r*P(.7,1.1),pig:n,skip:P(0,.15),seed:Math.random()*100})}}const c={drag:!1,tx:0,ty:0,orient:!1,ox:0,oy:0,asked:!1,k:1};function Le(){if(c.asked)return;c.asked=!0;const t=window.DeviceOrientationEvent,o=()=>addEventListener("deviceorientation",a=>{if(a.beta==null||a.gamma==null)return;const r=Math.sin(a.gamma*Math.PI/180),n=Math.sin(be(a.beta,-90,90)*Math.PI/180),p=(screen.orientation?screen.orientation.angle:Number(window.orientation)||0)*Math.PI/180,m=Math.cos(p),h=Math.sin(p);c.orient=!0,c.ox=r*m+n*h,c.oy=-r*h+n*m});!t||(typeof t.requestPermission=="function"?t.requestPermission().then(a=>a==="granted"&&o()).catch(()=>{}):o())}function nt(t,o){let a,r;if(c.drag)a=c.tx,r=c.ty;else if(c.orient)a=c.ox*.9,r=c.oy*.9;else{const[p,m,h]=d.sway;a=Math.sin(o/4.3)*p,r=m+Math.sin(o/6.1)*h}a*=c.k,r*=c.k;const n=Math.hypot(a,r);n>d.lean&&(a*=d.lean/n,r*=d.lean/n);const i=Math.min(1,t*3);F.x+=(a-F.x)*i,F.y+=(r-F.y)*i}g.addEventListener("touchend",Le,{passive:!0});g.addEventListener("click",t=>{t.pointerType!=="mouse"&&Le()});const N=new Map;g.addEventListener("contextmenu",t=>t.preventDefault());g.addEventListener("pointerdown",t=>{if(t.button===0){try{g.setPointerCapture(t.pointerId)}catch{}document.body.classList.add("taken"),N.set(t.pointerId,{x0:t.clientX,y0:t.clientY,moved:!1})}});g.addEventListener("pointermove",t=>{const o=N.get(t.pointerId);if(!o)return;const a=t.clientX-o.x0,r=t.clientY-o.y0;!o.moved&&Math.hypot(a,r)>8&&(o.moved=!0),!!o.moved&&(c.drag=!0,c.tx=a/d.drag,c.ty=r/d.drag)});const Ue=t=>{const o=N.get(t.pointerId);N.delete(t.pointerId),N.size||(c.drag=!1),!(!o||o.moved||t.type==="pointercancel")&&rt(o.x0,o.y0)};g.addEventListener("pointerup",Ue);g.addEventListener("pointercancel",Ue);Ee||(addEventListener("touchmove",t=>t.preventDefault(),{passive:!1}),addEventListener("wheel",t=>{t.preventDefault();const o=t.deltaMode===1?t.deltaY*16:t.deltaY;c.k===0&&o>0&&(c.k=.12),c.k=be(c.k*Math.exp(o*.0016),0,3),c.k<.08&&o<0&&(c.k=0)},{passive:!1}));je();fe();let we=0;addEventListener("resize",()=>{clearTimeout(we),we=window.setTimeout(fe,150)});let xe=performance.now(),A=0,H=0,z=1/60,V=0;function We(t){requestAnimationFrame(We);const o=Math.min(.1,Math.max(0,(t-xe)/1e3));for(xe=t,H+=o,!_&&H>=d.at&&(_=!0,at()),nt(o,H);O.length;)tt(O.shift());z+=(o-z)*.1,V=_&&H>2&&j>.5&&z>.02?V+o:0,V>1&&(V=0,z=1/60,j*=.7,fe(!0)),A+=o;const a=Math.min(3,Math.floor(A*60+.01));if(!!a){A=Math.max(0,A-a/60),A>.05&&(A=0);for(let r=0;r<a;r++)for(let n=0;n<s.sub;n++)Qe(1/s.sub);ot()}}requestAnimationFrame(We);
