import"./modulepreload-polyfill.b7f2da20.js";import{E as de}from"./embed.d17cc095.js";import{l as ke}from"./logo-bars.dd01370b.js";import{b as me,c as ve,a as Me}from"./logo-path.248ebb5a.js";/* empty css              */const G=[[[.47,.3,.88],[.12,.38,.92]],[[.14,.4,.93],[.2,.72,.62]],[[.95,.17,.28],[.98,.55,.15]],[[.5,.86,.26],[.98,.82,.2]],[[.98,.78,.25],[.95,.3,.22]],[[.88,.24,.62],[.47,.3,.88]]],f={logo:de?.78:.7,fat:1.4,at:.4,sway:[.08,.3,.05],drag:150,lean:1.4,drop:3.2,dropSize:[.6,1.6],dropWater:[.7,1.5],dropPush:[.35,1]},c={start:1.15,stop:.55,trail:.27,creep:.55,creepWet:2.4,bloom:.3,pdiff:.06,wdiff:.24,pr:2.5,lift:10,evap:6e-4,float:60,wloss:.03,dep:.0012,rim:7,gran:.4,sub:2,kp:.55,kd:1.1},Fe=new URLSearchParams(location.search);let J=(parseInt(Fe.get("seed")||"",10)||Math.floor(Math.random()*2**31))>>>0;function re(){J=J+1831565813>>>0;let t=J;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}const E=(t,o)=>t+(o-t)*re(),ge=(t,o=0,a=1)=>Math.min(a,Math.max(o,t));function N(t,o){let a=(Math.imul(t|0,668265261)^Math.imul(o|0,374761393))>>>0;return a=Math.imul(a^a>>>15,2246822507)>>>0,a=Math.imul(a^a>>>13,3266489909)>>>0,a=(a^a>>>16)>>>0,a/4294967296}function We(t){let o=t>>>0;return()=>{o=o+1831565813>>>0;let a=Math.imul(o^o>>>15,o|1);return a^=a+Math.imul(a^a>>>7,a|61),((a^a>>>14)>>>0)/4294967296}}const x=document.getElementById("watercolor"),he=x.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1});if(!he)throw new Error("watercolor: no WebGL2");const e=he;e.getExtension("EXT_color_buffer_float")||e.getExtension("EXT_color_buffer_half_float");const xe=`
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
}`,q=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,Le=`#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uW, uP, uD, uF, uPaper;
uniform vec2 uTexel;
uniform float uScale, uSimH, uK;
uniform float uEvap, uFadeP, uWLoss, uDep, uRim, uGran;
uniform vec2 uGrav;
uniform float uStart, uStop, uTrail, uCreep, uCreepWet, uPDiff, uWDiff, uLiftK, uPR, uBloom;
layout(location = 0) out vec4 oW;
layout(location = 1) out vec4 oP;
layout(location = 2) out vec4 oD;
layout(location = 3) out vec4 oF;
${xe}
vec4 Wt(vec2 p) { return texture(uW, p * uTexel); }
float W(vec2 p) { return texture(uW, p * uTexel).r; }
vec3 P(vec2 p) { return texture(uP, p * uTexel).rgb; }
// what a pixel holds before the excess slides on. Flag 1: paper wetted by the stamp or a drop;
// 0.6: the thin wet trail a run leaves behind; 0: dry paper, which pins the water until it pools.
float holdOf(float g, float hd, float hw) { return g > 0.8 ? uStop * hw : (g > 0.3 ? uTrail * hw : uStart * hd); }
// lanes along the slope: where a run breaks out of a wash and where it holds back
float laneAt(vec2 q, vec2 gd, vec2 gn) {
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
  vec2 u = gk + gn * gm * (vnoise(vec2(dot(f, gn) / 70.0, dot(f, gd) / 110.0) + 4.0) - 0.5) * 1.1;
  return clamp(u, vec2(-0.24), vec2(0.24));
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

  // water runs from the full middle of a wash toward its thin edges, carrying pigment
  vec2 g3 = vec2(W(p + vec2(3, 0)) - W(p - vec2(3, 0)), W(p + vec2(0, 3)) - W(p - vec2(0, 3))) / 6.0;
  float wet = smoothstep(0.0, 0.03, w);
  vec2 v = -g3 * 9.0 * wet;
  vec2 tp = css / 900.0;
  v += (vec2(texture(uPaper, tp).r, texture(uPaper, tp + 0.37).r) - 0.5) * 1.6 * wet;
  float vl = length(v); if (vl > 1.4) v *= 1.4 / vl;
  float avg3 = (W(p + vec2(3, 0)) + W(p - vec2(3, 0)) + W(p + vec2(0, 3)) + W(p - vec2(0, 3))
              + W(p + vec2(2, 2)) + W(p - vec2(2, 2)) + W(p + vec2(2, -2)) + W(p - vec2(2, -2))) / 8.0;
  float edge = clamp((w - avg3) * 4.5, 0.0, 1.0) * wet;

  // gravity: what the paper cannot hold slides downhill as wide runs, pigment with it.
  // Dry paper pins the water until it pools (uStart); wet paper lets the excess go (uStop).
  vec2 gk = vec2(uGrav.x, -uGrav.y) * uK;
  float gm = length(gk);
  float hd = 1.0;
  float dWg = 0.0; vec3 dPg = vec3(0.0);
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
    float cR = uR > 0.0 ? -e0 * uR : er * -uR;  // + into p, - out of p
    float cL = uL > 0.0 ? el * uL : -e0 * -uL;
    float cU = uU > 0.0 ? -e0 * uU : eu * -uU;
    float cD = uD > 0.0 ? ed * uD : -e0 * -uD;
    dWg = cR + cL + cU + cD;
    vec3 c0 = conc(P0, w0);
    dPg = (cR > 0.0 ? conc(Pr, wr) : c0) * cR + (cL > 0.0 ? conc(Pl, wl) : c0) * cL
        + (cU > 0.0 ? conc(Pu, wu) : c0) * cU + (cD > 0.0 ? conc(Pd, wd) : c0) * cD;
  }

  // pigment: carried by the flow, bleeding into wet neighbours (dry paper takes none)
  vec3 pg = P(p - v * uK);
  float sl = smoothstep(0.0, 0.03, wl), sr = smoothstep(0.0, 0.03, wr), sd = smoothstep(0.0, 0.03, wd), su = smoothstep(0.0, 0.03, wu);
  float sn = sl + sr + sd + su;
  vec3 pav = Pl * sl + Pr * sr + Pd * sd + Pu * su;
  pav = sn > 0.0 ? pav / sn : vec3(0.0);
  pg = mix(pg, pav, 0.6 * wet * sn * 0.25);

  // wide spread through wet paper: paint runs along a wet shape, feathering on the grain
  if (uPDiff > 0.0 && w0 > 0.02) {
    vec3 acc = vec3(0.0); float ws = 0.0, wacc = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982 + 0.4;
      vec2 q = p + vec2(cos(a), sin(a)) * uPR;
      float wi = W(q);
      float s = smoothstep(0.02, 0.08, wi);
      acc += P(q) * s; ws += s; wacc += wi * s;
    }
    if (ws > 0.0) {
      float grain = 0.25 + 1.5 * vnoise(css / 11.0 + 3.7) * vnoise(css / 37.0 + 9.1) + 0.6 * (pp - 0.5);
      float rate = uPDiff * max(grain, 0.05) * clamp(w0 * 1.4, 0.2, 1.8) * (ws / 8.0);
      pg = mix(pg, acc / ws, clamp(rate, 0.0, 0.9));
      // a run's trail evens out across (blunt, lumpy fronts); a stamped wash keeps its pools
      float wk = (flag > 0.3 && flag < 0.8) ? 1.0 : 0.25;
      w = mix(w, wacc / ws, clamp(uWDiff * wk * ws / 8.0, 0.0, 0.9));
    }
  }

  // the wet front creeps into dry paper unevenly: cauliflower edges; fresh water pushes into a damp
  // wash the same way (a bloom)
  float nmax = max(max(wl, wr), max(wd, wu));
  float lobe = texture(uPaper, css / 2400.0).r;
  float lobe2 = vnoise(css / 9.0 + 4.4);
  // a run's bead creeps sideways readily (lumpy edges); a stamped wash only bleeds from its pools
  float ntr = max(max(nl.g > 0.3 && nl.g < 0.8 ? wl : 0.0, nr.g > 0.3 && nr.g < 0.8 ? wr : 0.0),
                  max(nd.g > 0.3 && nd.g < 0.8 ? wd : 0.0, nu.g > 0.3 && nu.g < 0.8 ? wu : 0.0));
  float cthr = uCreep + 0.6 * lobe + 0.25 * lobe2;
  float tthr = uCreep * 0.7 + 0.55 * vnoise(css / 24.0 + 8.8) + 0.3 * lobe2;
  if (w0 < 0.01 && (ntr > tthr || nmax > cthr * uCreepWet)) { w = nmax * 0.55; pg = pav * 0.6; }
  else if (uBloom > 0.0 && w0 < nmax * 0.3 && nmax > uBloom + 0.5 * lobe2) { w = max(w, nmax * 0.6); }

  w += dWg;
  pg = max(pg + dPg, vec3(0.0));
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
  oW = vec4(w, flag, 0.0, 0.0);
  oP = vec4(pg * uFadeP, 0.0);
  oD = vec4(d, 0.0);
  oF = vec4(f, 0.0);
}`,Ue=`#version 300 es
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
${xe}
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
  oW = vec4(min(W + addW, 3.0), addW > 0.03 ? 1.0 : G, 0.0, 0.0);
  oP = vec4(min(Pn + addP, vec3(8.0)), 0.0);
  oD = vec4(Dn, 0.0);
  oF = vec4(Fn, 0.0);
}`,Ce=`#version 300 es
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
  // mud: the darkness all three channels share eases off toward a limit, so a pile of mixed pigment
  // (the bead at a run's tip) stays a deep colour and never goes black
  float n = min(k.r, min(k.g, k.b));
  k -= n - (n < 0.45 ? n : 0.45 + 0.55 * (1.0 - exp((0.45 - n) / 0.55)));
  outColor = vec4(exp(-k), 1.0);
}`,Ie=`#version 300 es
precision highp float;
uniform sampler2D uA, uB, uC, uE;
uniform ivec2 uOff;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
layout(location = 2) out vec4 o2;
layout(location = 3) out vec4 o3;
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy) - uOff;
  ivec2 n = textureSize(uA, 0);
  if (q.x < 0 || q.y < 0 || q.x >= n.x || q.y >= n.y) { o0 = o1 = o2 = o3 = vec4(0.0); return; }
  o0 = texelFetch(uA, q, 0); o1 = texelFetch(uB, q, 0); o2 = texelFetch(uC, q, 0); o3 = texelFetch(uE, q, 0);
}`;function K(t,o){const a=e.createProgram();for(const[r,n]of[[e.VERTEX_SHADER,t],[e.FRAGMENT_SHADER,o]]){const i=e.createShader(r);if(e.shaderSource(i,n),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(i)||"shader");e.attachShader(a,i)}if(e.linkProgram(a),!e.getProgramParameter(a,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(a)||"program");return a}function H(t,o){return Object.fromEntries(o.map(a=>[a,e.getUniformLocation(t,a)]))}const we=K(q,Le),Ee=K(q,Ue),Te=K(q,Ce),Pe=K(q,Ie),l=H(we,["uW","uP","uD","uF","uPaper","uTexel","uScale","uSimH","uK","uEvap","uFadeP","uWLoss","uDep","uRim","uGran","uGrav","uStart","uStop","uTrail","uCreep","uCreepWet","uPDiff","uWDiff","uLiftK","uPR","uBloom"]),d=H(Ee,["uW","uP","uD","uF","uPaper","uMask","uTexel","uSimSize","uScale","uSimH","uKind","uC","uR","uSeed","uWater","uPig","uSkip","uPud","uA","uB","uE"]),W=H(Te,["uP","uD","uF","uKp","uKd"]),L=H(Pe,["uA","uB","uC","uE","uOff"]),z=e.createVertexArray(),C=.75;let p=null;function Xe(t,o){const a=[0,1].map(()=>{const r=[0,1,2,3].map(()=>{const i=e.createTexture();return e.bindTexture(e.TEXTURE_2D,i),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,t,o,0,e.RGBA,e.HALF_FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),i}),n=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,n),r.forEach((i,m)=>e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+m,e.TEXTURE_2D,i,0)),e.drawBuffers([e.COLOR_ATTACHMENT0,e.COLOR_ATTACHMENT1,e.COLOR_ATTACHMENT2,e.COLOR_ATTACHMENT3]),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),{tex:r,fbo:n}});return e.bindFramebuffer(e.FRAMEBUFFER,null),{w:t,h:o,states:a,cur:0}}function Oe(t){for(const o of t.states)o.tex.forEach(a=>e.deleteTexture(a)),e.deleteFramebuffer(o.fbo)}const Be=1024,be=e.createTexture();function Ne(){const t=Be,o=new Float32Array(t*t),a=[[2,.22,11],[4,.3,23],[8,.22,37],[16,.12,51],[64,.09,67],[256,.05,79]];for(const[u,_,k]of a){const w=t/u,P=k*1e3;for(let T=0;T<t;T++){const M=T/u,b=Math.floor(M),F=M-b,X=F*F*(3-2*F),R=b%w,y=(b+1)%w;for(let O=0;O<t;O++){const ne=O/u,V=Math.floor(ne),Y=ne-V,ie=Y*Y*(3-2*Y),se=V%w+P,ue=(V+1)%w+P,B=N(se,R),ce=N(ue,R),le=N(se,y),_e=N(ue,y);o[T*t+O]+=(B+(ce-B)*ie+(le-B)*X+(B-ce-le+_e)*ie*X)*_}}}const r=document.createElement("canvas");r.width=r.height=t;const n=r.getContext("2d"),i=We(4242);n.fillStyle="#000",n.fillRect(0,0,t,t),n.lineCap="round";for(let u=0;u<900;u++){const _=i()*t,k=i()*t,w=i()*Math.PI*2,P=14+i()*70,T=(i()-.5)*P*.8,M=_+Math.cos(w)*P,b=k+Math.sin(w)*P,F=(_+M)/2-Math.sin(w)*T,X=(k+b)/2+Math.cos(w)*T;n.strokeStyle=`rgba(255,255,255,${.12+i()*.3})`,n.lineWidth=.6+i()*1.2;for(const R of[-t,0,t])for(const y of[-t,0,t])n.beginPath(),n.moveTo(_+R,k+y),n.quadraticCurveTo(F+R,X+y,M+R,b+y),n.stroke()}const m=n.getImageData(0,0,t,t).data;let v=1e9,g=-1e9;for(let u=0;u<t*t;u++)o[u]+=m[u*4]/255*.12,o[u]<v&&(v=o[u]),o[u]>g&&(g=o[u]);const A=new Uint8Array(t*t);for(let u=0;u<t*t;u++)A[u]=(o[u]-v)/(g-v)*255;e.bindTexture(e.TEXTURE_2D,be),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.R8,t,t,0,e.RED,e.UNSIGNED_BYTE,A),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT)}const Re=e.createTexture(),h={size:0,s:1,stroke:0},Ge=ke(me*f.fat);let $=0,j=0,te=0,oe=0;function qe(){const t=p,o=document.createElement("canvas");o.width=t.w,o.height=t.h;const a=o.getContext("2d");a.fillStyle="#000",a.fillRect(0,0,o.width,o.height),a.scale(C,C),a.strokeStyle="#fff",a.lineWidth=h.stroke*f.fat,a.lineCap="butt";const r=Me+ve/2;for(const n of Ge)a.beginPath(),a.moveTo(te+(n.ax-r)*h.s,oe+(n.ay-r)*h.s),a.lineTo(te+(n.bx-r)*h.s,oe+(n.by-r)*h.s),a.stroke();e.bindTexture(e.TEXTURE_2D,Re),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.R8,e.RED,e.UNSIGNED_BYTE,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}let ae=!1;function ye(){const t=Math.min(window.devicePixelRatio||1,2);x.width=Math.ceil(innerWidth*t),x.height=Math.ceil(innerHeight*t);const o=Math.ceil(innerWidth*C),a=Math.ceil(innerHeight*C);if(p&&p.w===o&&p.h===a)return;const r=Xe(o,a);if(p){const n=p.states[p.cur];e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,r.states[0].fbo),e.viewport(0,0,o,a),e.useProgram(Pe),e.bindVertexArray(z),n.tex.forEach((i,m)=>{e.activeTexture(e.TEXTURE0+m),e.bindTexture(e.TEXTURE_2D,i)}),e.uniform1i(L.uA,0),e.uniform1i(L.uB,1),e.uniform1i(L.uC,2),e.uniform1i(L.uE,3),e.uniform2i(L.uOff,Math.round((o-p.w)/2),Math.round((a-p.h)/2)),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,null),Oe(p)}p=r,$=innerWidth,j=innerHeight,te=$/2,oe=j/2,ae||(h.size=Math.min($,j)*f.logo,h.s=h.size/ve,h.stroke=me*h.s,qe())}function Se(t,o){const a=p;t.tex.forEach((r,n)=>{e.activeTexture(e.TEXTURE0+n),e.bindTexture(e.TEXTURE_2D,r)}),e.activeTexture(e.TEXTURE4),e.bindTexture(e.TEXTURE_2D,be),e.activeTexture(e.TEXTURE5),e.bindTexture(e.TEXTURE_2D,Re),e.uniform1i(o.uW,0),e.uniform1i(o.uP,1),e.uniform1i(o.uD,2),e.uniform1i(o.uF,3),e.uniform1i(o.uPaper,4),e.uniform2f(o.uTexel,1/a.w,1/a.h),e.uniform1f(o.uScale,C),e.uniform1f(o.uSimH,a.h)}const D={x:0,y:f.sway[1]};function Ke(t){const o=p,a=o.states[o.cur],r=o.states[1-o.cur];e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,r.fbo),e.viewport(0,0,o.w,o.h),e.useProgram(we),e.bindVertexArray(z),Se(a,l),e.uniform1f(l.uK,t),e.uniform1f(l.uEvap,c.evap),e.uniform1f(l.uFadeP,Math.exp(-t/60/c.float)),e.uniform1f(l.uWLoss,c.wloss),e.uniform1f(l.uDep,c.dep),e.uniform1f(l.uRim,c.rim),e.uniform1f(l.uGran,c.gran),e.uniform2f(l.uGrav,D.x,D.y),e.uniform1f(l.uStart,c.start),e.uniform1f(l.uStop,c.stop),e.uniform1f(l.uTrail,c.trail),e.uniform1f(l.uCreep,c.creep),e.uniform1f(l.uCreepWet,c.creepWet),e.uniform1f(l.uPDiff,c.pdiff),e.uniform1f(l.uWDiff,c.wdiff),e.uniform1f(l.uLiftK,c.lift),e.uniform1f(l.uPR,c.pr),e.uniform1f(l.uBloom,c.bloom),e.drawArrays(e.TRIANGLES,0,3),o.cur=1-o.cur}const He=0,ze=1,Q=[1,1,1],I=[];function Ve(t){const o=p,a=o.states[o.cur],r=o.states[1-o.cur];e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,r.fbo),e.viewport(0,0,o.w,o.h),e.useProgram(Ee),e.bindVertexArray(z),Se(a,d),e.uniform1i(d.uMask,5),e.uniform2f(d.uSimSize,o.w,o.h),e.uniform1i(d.uKind,t.kind),e.uniform2f(d.uC,t.x,t.y),e.uniform1f(d.uR,t.r),e.uniform1f(d.uSeed,t.seed),e.uniform1f(d.uWater,t.water),e.uniform1f(d.uPig,t.pig),e.uniform1f(d.uSkip,t.skip),e.uniform1f(d.uPud,t.pud),e.uniform3f(d.uA,t.a[0],t.a[1],t.a[2]),e.uniform3f(d.uB,t.b[0],t.b[1],t.b[2]),e.uniform3f(d.uE,t.e[0],t.e[1],t.e[2]),e.drawArrays(e.TRIANGLES,0,3),o.cur=1-o.cur}function Ye(){const t=p.states[p.cur];e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,x.width,x.height),e.useProgram(Te),e.bindVertexArray(z);for(let o=1;o<=3;o++)e.activeTexture(e.TEXTURE0+o),e.bindTexture(e.TEXTURE_2D,t.tex[o]);e.uniform1i(W.uP,1),e.uniform1i(W.uD,2),e.uniform1i(W.uF,3),e.uniform1f(W.uKp,c.kp),e.uniform1f(W.uKd,c.kd),e.drawArrays(e.TRIANGLES,0,3),e.activeTexture(e.TEXTURE0),e.bindVertexArray(null)}const Z=Math.floor(re()*G.length);function Je(){I.push({kind:ze,x:0,y:0,r:0,water:.4,pud:1.15,pig:1.3,skip:.12,seed:re()*100,a:G[Z][0],b:G[(Z+2)%6][1],e:G[(Z+4)%6][0]})}function $e(t,o){const a=h.stroke*f.drop*E(f.dropSize[0],f.dropSize[1]),r=E(f.dropWater[0],f.dropWater[1]),n=E(f.dropPush[0],f.dropPush[1]),i={kind:He,pud:0,a:Q,b:Q,e:Q};I.push({...i,x:t,y:o,r:a,water:r,pig:n,skip:E(0,.2),seed:Math.random()*100});const m=Math.random()<.45?0:Math.random()<.6?1:2;for(let v=0;v<m;v++){const g=Math.random()*Math.PI*2,A=a*E(.95,1.35);I.push({...i,x:t+Math.cos(g)*A,y:o+Math.sin(g)*A,r:a*E(.14,.32),water:r*E(.7,1.1),pig:n,skip:E(0,.15),seed:Math.random()*100})}}const s={drag:!1,tx:0,ty:0,orient:!1,ox:0,oy:0,asked:!1,k:1};function je(){if(s.asked)return;s.asked=!0;const t=window.DeviceOrientationEvent,o=()=>addEventListener("deviceorientation",a=>{if(a.beta==null||a.gamma==null)return;const r=Math.sin(a.gamma*Math.PI/180),n=Math.sin(ge(a.beta,-90,90)*Math.PI/180),m=(screen.orientation?screen.orientation.angle:Number(window.orientation)||0)*Math.PI/180,v=Math.cos(m),g=Math.sin(m);s.orient=!0,s.ox=r*v+n*g,s.oy=-r*g+n*v});!t||(typeof t.requestPermission=="function"?t.requestPermission().then(a=>a==="granted"&&o()).catch(()=>{}):o())}function Qe(t,o){let a,r;if(s.drag)a=s.tx,r=s.ty;else if(s.orient)a=s.ox*.9,r=s.oy*.9;else{const[m,v,g]=f.sway;a=Math.sin(o/4.3)*m,r=v+Math.sin(o/6.1)*g}a*=s.k,r*=s.k;const n=Math.hypot(a,r);n>f.lean&&(a*=f.lean/n,r*=f.lean/n);const i=Math.min(1,t*3);D.x+=(a-D.x)*i,D.y+=(r-D.y)*i}const U=new Map;x.addEventListener("contextmenu",t=>t.preventDefault());x.addEventListener("pointerdown",t=>{if(t.button===0){try{x.setPointerCapture(t.pointerId)}catch{}document.body.classList.add("taken"),t.pointerType!=="mouse"&&je(),U.set(t.pointerId,{x0:t.clientX,y0:t.clientY,moved:!1})}});x.addEventListener("pointermove",t=>{const o=U.get(t.pointerId);if(!o)return;const a=t.clientX-o.x0,r=t.clientY-o.y0;!o.moved&&Math.hypot(a,r)>8&&(o.moved=!0),!!o.moved&&(s.drag=!0,s.tx=a/f.drag,s.ty=r/f.drag)});const De=t=>{const o=U.get(t.pointerId);U.delete(t.pointerId),U.size||(s.drag=!1),!(!o||o.moved||t.type==="pointercancel")&&$e(o.x0,o.y0)};x.addEventListener("pointerup",De);x.addEventListener("pointercancel",De);de||(addEventListener("touchmove",t=>t.preventDefault(),{passive:!1}),addEventListener("wheel",t=>{t.preventDefault();const o=t.deltaMode===1?t.deltaY*16:t.deltaY;s.k===0&&o>0&&(s.k=.12),s.k=ge(s.k*Math.exp(o*.0016),0,3),s.k<.08&&o<0&&(s.k=0)},{passive:!1}));Ne();ye();let fe=0;addEventListener("resize",()=>{clearTimeout(fe),fe=window.setTimeout(ye,150)});let pe=performance.now(),S=0,ee=0;function Ae(t){requestAnimationFrame(Ae);const o=Math.min(.1,Math.max(0,(t-pe)/1e3));for(pe=t,ee+=o,!ae&&ee>=f.at&&(ae=!0,Je()),Qe(o,ee);I.length;)Ve(I.shift());S+=o;const a=Math.min(3,Math.floor(S*60+.01));if(!!a){S=Math.max(0,S-a/60),S>.05&&(S=0);for(let r=0;r<a;r++)for(let n=0;n<c.sub;n++)Ke(1/c.sub);Ye()}}requestAnimationFrame(Ae);
