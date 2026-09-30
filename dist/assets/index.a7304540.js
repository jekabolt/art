import"./modulepreload-polyfill.b7f2da20.js";import{n as D,j as T,W as R,S as I,O as U,V as g,g as C,M as F,e as V}from"./vendor.c6995a63.js";import{b as W}from"./logo-path.248ebb5a.js";import{l as G}from"./logo-bars.36bf556b.js";const M=G().map(e=>{const c=e.ax-300,i=300-e.ay,r=e.bx-300,p=300-e.by,s=Math.hypot(r-c,p-i);return{c:new D((c+r)/2,(i+p)/2,(r-c)/s,(p-i)/s),h:new T(s/2,W/2)}}),w=document.getElementById("moire"),k=new R({canvas:w,antialias:!1}),A=new I,K=new U(-1,1,1,-1,0,1),t={resolution:{value:new T},ppu:{value:1},period:{value:8},mode:{value:0},hub:{value:1e3},move:{value:new D},plateA:{value:new g(1,0,0)},plateB:{value:new g(0,1,0)},plateN:{value:new g(0,0,1)},eye:{value:3e3},bars:{value:M.map(e=>e.c)},halves:{value:M.map(e=>e.h)}},X=new C({uniforms:t,defines:{NB:M.length},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float ppu;
    uniform float period;
    uniform int mode;
    uniform float hub;
    uniform vec4 move;
    uniform vec3 plateA;
    uniform vec3 plateB;
    uniform vec3 plateN;
    uniform float eye;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.965);
    const vec3 INK = vec3(0.0);

    float logoSD(vec2 p) {
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

    // the line pattern's phase at pixel position q (device px from the middle), in periods
    float phase(vec2 q, vec2 centre, float turn) {
      if (mode == 0) {
        float c = cos(turn);
        float s = sin(turn);
        return (c * q.x + s * q.y) / period;
      }
      if (mode == 1) return length(q - centre) / period;
      // rays from a hub far below, as many as it takes for them to be a period apart across the mark
      vec2 r = q - centre + vec2(0.0, hub);
      return (atan(r.x, r.y) + turn) * hub / period;
    }

    // lines DUTY of a period wide, antialiased by the phase's own slope; the slope comes from the smooth
    // phase, so the half-period jump at the mark stays crisp. Where lines crowd under three pixels
    // apart (the hub of the rays) they would alias into noise, so they fade to their average grey
    const float DUTY = 0.27;
    float line(float u, float slope) {
      float px = 1.0 / max(slope, 1e-4); // device px per period here
      float c = abs(fract(u - 0.5 * DUTY + 0.5) - 0.5); // periods from the nearest line's centre
      float cov = clamp(0.5 - (c - 0.5 * DUTY) * px, 0.0, 1.0);
      return mix(DUTY, cov, smoothstep(2.5, 4.5, px));
    }

    // where the ray from the eye through this pixel meets the tipped plate, in the plate's own px
    vec2 onPlate(vec2 q) {
      vec3 d = vec3(q, eye);
      float t = eye * plateN.z / dot(d, plateN);
      vec3 hit = vec3(0.0, 0.0, -eye) + t * d;
      return vec2(dot(hit, plateA), dot(hit, plateB));
    }

    void main() {
      vec2 q = gl_FragCoord.xy - 0.5 * resolution;
      // the mark and its lines belong to the plate, so they lean with it; the sheet around stays flat
      vec2 pq = onPlate(q);
      float mark = clamp(0.5 - logoSD(pq / ppu) * ppu, 0.0, 1.0);

      float flat_ = phase(q, vec2(0.0), 0.0);
      float tipped = phase(pq, vec2(0.0), 0.0);
      float onMark = step(0.5, mark);
      float lower = line(mix(flat_, tipped, onMark) + 0.5 * mark, mix(fwidth(flat_), fwidth(tipped), onMark));

      float up = phase(q, move.zw, move.x) + move.y;
      float upper = line(up, fwidth(up));

      // two transparencies over each other: ink wherever either has a line
      float ink = 1.0 - (1.0 - lower) * (1.0 - upper);
      gl_FragColor = vec4(mix(PAPER, INK, ink), 1.0);
    }
  `}),Y=new F(new V(2,2),X);Y.frustumCulled=!1;A.add(Y);let l=1,n=1,m=1;function z(){n=window.innerWidth,m=window.innerHeight,l=Math.min(window.devicePixelRatio||1,2),k.setPixelRatio(l),k.setSize(n,m,!1),t.resolution.value.set(n*l,m*l);const e=Math.min(n<=768?.72*n:.42*n,.66*m);t.ppu.value=e*l/516,t.period.value=(n<=768?4:5)*l,t.hub.value=1.1*m*l,t.eye.value=2.2*Math.max(n,m)*l}const u={x:0,y:0},a={x:0,y:0};let E=-1e9,v=null;function O(e){u.x=e.clientX/n*2-1,u.y=e.clientY/m*2-1,E=performance.now()}w.addEventListener("pointerdown",e=>{v={x:e.clientX,y:e.clientY},O(e)});w.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&O(e)});w.addEventListener("pointerup",e=>{v&&Math.hypot(e.clientX-v.x,e.clientY-v.y)<8&&(t.mode.value=(t.mode.value+1)%3),v=null});const o={on:!1,b0:0,g0:0},P=e=>Math.max(-1,Math.min(1,e));function L(e){e.beta==null||e.gamma==null||(o.on||(o.on=!0,o.b0=e.beta,o.g0=e.gamma),o.b0+=(e.beta-o.b0)*.002,o.g0+=(e.gamma-o.g0)*.002,u.x=P((e.gamma-o.g0)/15),u.y=P((e.beta-o.b0)/15),E=performance.now())}const q=document.querySelector(".l-motion"),f=window.DeviceOrientationEvent,N=window.matchMedia("(pointer: coarse)").matches;N&&f&&typeof f.requestPermission=="function"?(q?.classList.remove("-none"),q?.addEventListener("click",()=>{f.requestPermission().then(e=>e==="granted"&&window.addEventListener("deviceorientation",L)).finally(()=>q.classList.add("-none"))})):N&&f&&window.addEventListener("deviceorientation",L);const B=.075;function j(e,c){const i=Math.cos(e),r=Math.sin(e),p=Math.cos(c),s=Math.sin(c),d=h=>[h[0],h[1]*p-h[2]*s,h[1]*s+h[2]*p],y=d([i,0,-r]),x=d([0,1,0]),b=d([r,0,i]);t.plateA.value.set(y[0],y[1],y[2]),t.plateB.value.set(x[0],x[1],x[2]),t.plateN.value.set(b[0],b[1],b[2])}let S=performance.now();function _(e){const c=Math.min(.05,(e-S)/1e3);if(S=e,e-E>3e3){const d=e/1e3;u.x=Math.sin(d*.11)*.5,u.y=Math.sin(d*.07+1.1)*.5}const i=1-Math.exp(-c*4);a.x+=(u.x-a.x)*i,a.y+=(u.y-a.y)*i;const r=t.mode.value,p=Math.min(n,m)*l,s=t.period.value;r===0?t.move.value.set(a.x*.09,a.y*2,0,0):r===1?t.move.value.set(0,0,a.x*s*9,-a.y*s*9):t.move.value.set(a.x*.012,0,0,a.y*p*.12),j(a.x*B,-a.y*B),k.render(A,K),requestAnimationFrame(_)}window.addEventListener("resize",z);z();requestAnimationFrame(_);
