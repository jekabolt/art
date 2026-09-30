import"./modulepreload-polyfill.b7f2da20.js";import{n as C,j as u,W as B,S as I,O as M,g as O,M as P,e as F}from"./vendor.0d80995e.js";import{b as Q}from"./logo-path.248ebb5a.js";import{l as Y}from"./logo-bars.36bf556b.js";const z=40,m=42-z,h=558+z,w={x:462,y:600-240},N=84-2*3,r=N/(h-m),x=(m+h)/2,g={x:(w.x-r*x)/(1-r),y:(w.y-r*x)/(1-r)},p=Y().map(e=>{const n=e.ax,o=600-e.ay,l=e.bx,v=600-e.by,d=Math.hypot(l-n,v-o);return{c:new C((n+l)/2,(o+v)/2,(l-n)/d,(v-o)/d),h:new u(d/2,Q/2)}}),i=document.getElementById("droste"),f=new B({canvas:i,antialias:!1}),b=new I,R=new M(-1,1,1,-1,0,1),c={resolution:{value:new u},ppu:{value:1},offset:{value:new u},bars:{value:p.map(e=>e.c)},halves:{value:p.map(e=>e.h)}},k=new O({uniforms:c,defines:{NB:p.length,S:r.toFixed(8),CX:g.x.toFixed(6),CY:g.y.toFixed(6),QLO:m.toFixed(1),QHI:h.toFixed(1)},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float ppu;
    uniform vec2 offset;
    uniform vec4 bars[NB];   // centre, direction
    uniform vec2 halves[NB]; // half length, half width

    const vec3 PAPER = vec3(0.965);
    const vec3 INK = vec3(0.0);

    vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }

    // signed distance to the mark (logo units)
    float logoSD(vec2 p) {
      vec2 o = max(max(vec2(42.0) - p, p - vec2(558.0)), 0.0);
      float away = length(o);
      if (away > 30.0) return away;
      float d = 1e9;
      for (int i = 0; i < NB; i++) {
        vec4 b = bars[i];
        vec2 r = p - b.xy;
        vec2 l = vec2(dot(r, b.zw), dot(r, vec2(-b.w, b.z)));
        vec2 q = abs(l) - halves[i];
        d = min(d, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
      }
      return d;
    }

    bool inSquare(vec2 p, float lo, float hi) { return all(greaterThanEqual(p, vec2(lo))) && all(lessThanEqual(p, vec2(hi))); }

    void main() {
      vec2 c = vec2(CX, CY);
      float L = log(S); // one nesting step in log-radius (negative)
      vec2 z = (gl_FragCoord.xy - 0.5 * resolution) / ppu;
      float r = max(length(z), 1e-6);

      // Escher: w = \u03B2 \xB7 (log z + offset), \u03B2 = 1 \u2212 i ln S / 2\u03C0
      vec2 beta = vec2(1.0, -L / 6.2831853);
      vec2 w = cmul(vec2(log(r), atan(z.y, z.x)) + offset, beta);
      // one step of scale changes nothing, so keep the log-radius near the picture's own size
      float r0 = log(250.0);
      w.x = r0 + mod(w.x - r0, -L);
      vec2 p = c + exp(w.x) * vec2(cos(w.y), sin(w.y));

      // Droste: outside the picture is its parent, inside the opening its child
      vec2 qlo = c + S * (vec2(QLO) - c); // the opening's square: the picture sent through z \u2192 c + S(z \u2212 c)
      vec2 qhi = c + S * (vec2(QHI) - c);
      for (int i = 0; i < 6; i++) {
        if (!inSquare(p, QLO, QHI)) p = c + (p - c) * S;
        else if (all(greaterThanEqual(p, qlo)) && all(lessThanEqual(p, qhi))) p = c + (p - c) / S;
        else break;
      }

      // pixel footprint in logo units at p: |dp/dz| = |\u03B2| \xB7 |p \u2212 c| / |z|
      float fp = length(beta) * length(p - c) / r / ppu;
      float d = logoSD(p);
      float ink = clamp(0.5 - d / max(fp, 1e-4), 0.0, 1.0);
      vec3 col = mix(PAPER, INK, ink);
      gl_FragColor = vec4(col, 1.0);
    }
  `}),S=new P(new F(2,2),k);S.frustumCulled=!1;b.add(S);function q(){const e=window.innerWidth,n=window.innerHeight,o=Math.min(window.devicePixelRatio||1,2);f.setPixelRatio(o),f.setSize(e,n,!1),c.resolution.value.set(e*o,n*o),c.ppu.value=Math.min(e,n)*o/900}const t={zoom:0,turn:0,vz:0,vt:0};let a=null,s=-1e9;i.addEventListener("pointerdown",e=>{i.setPointerCapture(e.pointerId),a={x:e.clientX,y:e.clientY},t.vz=t.vt=0});i.addEventListener("pointermove",e=>{if(!a)return;const n=3/Math.min(window.innerWidth,window.innerHeight);t.vt=(e.clientX-a.x)*n,t.vz=(e.clientY-a.y)*n,t.turn+=t.vt,t.zoom+=t.vz,a={x:e.clientX,y:e.clientY},s=performance.now()});const L=()=>{a=null,s=performance.now()};i.addEventListener("pointerup",L);i.addEventListener("pointercancel",L);window.addEventListener("wheel",e=>{e.preventDefault(),t.zoom+=(e.deltaMode===1?e.deltaY*16:e.deltaY)*.002,s=performance.now()},{passive:!1});let y=performance.now();function E(e){const n=Math.min(.05,(e-y)/1e3);if(y=e,!a){t.turn+=t.vt,t.zoom+=t.vz,t.vt*=.9,t.vz*=.9;const o=e-s>1500?1:0;t.zoom-=n*.16*o}c.offset.value.set(t.zoom,t.turn),f.render(b,R),requestAnimationFrame(E)}window.addEventListener("resize",q);q();requestAnimationFrame(E);
