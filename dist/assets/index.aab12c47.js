import"./modulepreload-polyfill.b7f2da20.js";import{n as E,j as L,W as Y,S as O,O as z,g as B,M as N,e as R}from"./vendor.0b7086df.js";import{b as U}from"./logo-path.248ebb5a.js";import{l as A}from"./logo-bars.36bf556b.js";const w=A().map(e=>{const u=e.ax-300,l=300-e.ay,c=e.bx-300,d=300-e.by,m=Math.hypot(c-u,d-l);return{c:new E((u+c)/2,(l+d)/2,(c-u)/m,(d-l)/m),h:new L(m/2,U/2)}}),f=document.getElementById("moire"),x=new Y({canvas:f,antialias:!1}),k=new O,C=new z(-1,1,1,-1,0,1),t={resolution:{value:new L},ppu:{value:1},period:{value:8},mode:{value:0},hub:{value:1e3},move:{value:new E},bars:{value:w.map(e=>e.c)},halves:{value:w.map(e=>e.h)}},F=new B({uniforms:t,defines:{NB:w.length},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float ppu;
    uniform float period;
    uniform int mode;
    uniform float hub;
    uniform vec4 move;
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

    void main() {
      vec2 q = gl_FragCoord.xy - 0.5 * resolution;
      float mark = clamp(0.5 - logoSD(q / ppu) * ppu, 0.0, 1.0);

      float base = phase(q, vec2(0.0), 0.0);
      float lower = line(base + 0.5 * mark, fwidth(base));

      float up = phase(q, move.zw, move.x) + move.y;
      float upper = line(up, fwidth(up));

      // two transparencies over each other: ink wherever either has a line
      float ink = 1.0 - (1.0 - lower) * (1.0 - upper);
      gl_FragColor = vec4(mix(PAPER, INK, ink), 1.0);
    }
  `}),P=new N(new R(2,2),F);P.frustumCulled=!1;k.add(P);let i=1,a=1,s=1;function S(){a=window.innerWidth,s=window.innerHeight,i=Math.min(window.devicePixelRatio||1,2),x.setPixelRatio(i),x.setSize(a,s,!1),t.resolution.value.set(a*i,s*i);const e=Math.min(a<=768?.72*a:.42*a,.66*s);t.ppu.value=e*i/516,t.period.value=(a<=768?4:5)*i,t.hub.value=1.1*s*i}const r={x:0,y:0},o={x:0,y:0};let b=-1e9,p=null;function D(e){r.x=e.clientX/a*2-1,r.y=e.clientY/s*2-1,b=performance.now()}f.addEventListener("pointerdown",e=>{p={x:e.clientX,y:e.clientY},D(e)});f.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&D(e)});f.addEventListener("pointerup",e=>{p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<8&&(t.mode.value=(t.mode.value+1)%3),p=null});const n={on:!1,b0:0,g0:0},g=e=>Math.max(-1,Math.min(1,e));function q(e){e.beta==null||e.gamma==null||(n.on||(n.on=!0,n.b0=e.beta,n.g0=e.gamma),n.b0+=(e.beta-n.b0)*.002,n.g0+=(e.gamma-n.g0)*.002,r.x=g((e.gamma-n.g0)/15),r.y=g((e.beta-n.b0)/15),b=performance.now())}const h=document.querySelector(".l-motion"),v=window.DeviceOrientationEvent;v&&typeof v.requestPermission=="function"?(h?.classList.remove("-none"),h?.addEventListener("click",()=>{v.requestPermission().then(e=>e==="granted"&&window.addEventListener("deviceorientation",q)).finally(()=>h.classList.add("-none"))})):v&&window.addEventListener("deviceorientation",q);let M=performance.now();function T(e){const u=Math.min(.05,(e-M)/1e3);if(M=e,e-b>3e3){const y=e/1e3;r.x=Math.sin(y*.11)*.5,r.y=Math.sin(y*.07+1.1)*.5}const l=1-Math.exp(-u*4);o.x+=(r.x-o.x)*l,o.y+=(r.y-o.y)*l;const c=t.mode.value,d=Math.min(a,s)*i,m=t.period.value;c===0?t.move.value.set(o.x*.09,o.y*2,0,0):c===1?t.move.value.set(0,0,o.x*m*9,-o.y*m*9):t.move.value.set(o.x*.012,0,0,o.y*d*.12),x.render(k,C),requestAnimationFrame(T)}window.addEventListener("resize",S);S();requestAnimationFrame(T);
