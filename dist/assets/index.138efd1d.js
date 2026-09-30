import"./modulepreload-polyfill.b7f2da20.js";import{n as w,j as y,W as E,S as P,O as Y,g as D,M as T,e as z}from"./vendor.0b7086df.js";import{b as B}from"./logo-path.248ebb5a.js";import{l as L}from"./logo-bars.36bf556b.js";const v=L().map(e=>{const m=e.ax-300,i=300-e.ay,s=e.bx-300,p=300-e.by,l=Math.hypot(s-m,p-i);return{c:new w((m+s)/2,(i+p)/2,(s-m)/l,(p-i)/l),h:new y(l/2,B/2)}}),d=document.getElementById("moire"),h=new E({canvas:d,antialias:!1}),b=new P,N=new Y(-1,1,1,-1,0,1),t={resolution:{value:new y},ppu:{value:1},period:{value:8},mode:{value:0},hub:{value:1e3},move:{value:new w},bars:{value:v.map(e=>e.c)},halves:{value:v.map(e=>e.h)}},R=new D({uniforms:t,defines:{NB:v.length},vertexShader:`
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
    const float DUTY = 0.36;
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
  `}),g=new T(new z(2,2),R);g.frustumCulled=!1;b.add(g);let n=1,a=1,r=1;function q(){a=window.innerWidth,r=window.innerHeight,n=Math.min(window.devicePixelRatio||1,2),h.setPixelRatio(n),h.setSize(a,r,!1),t.resolution.value.set(a*n,r*n);const e=Math.min(a<=768?.72*a:.42*a,.66*r);t.ppu.value=e*n/516,t.period.value=(a<=768?4.5:5.5)*n,t.hub.value=1.1*r*n}const c={x:0,y:0},o={x:0,y:0};let M=-1e9,u=null;function k(e){c.x=e.clientX/a*2-1,c.y=e.clientY/r*2-1,M=performance.now()}d.addEventListener("pointerdown",e=>{u={x:e.clientX,y:e.clientY},k(e)});d.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&k(e)});d.addEventListener("pointerup",e=>{u&&Math.hypot(e.clientX-u.x,e.clientY-u.y)<8&&(t.mode.value=(t.mode.value+1)%3),u=null});let x=performance.now();function S(e){const m=Math.min(.05,(e-x)/1e3);if(x=e,e-M>3e3){const f=e/1e3;c.x=Math.sin(f*.11)*.5,c.y=Math.sin(f*.07+1.1)*.5}const i=1-Math.exp(-m*4);o.x+=(c.x-o.x)*i,o.y+=(c.y-o.y)*i;const s=t.mode.value,p=Math.min(a,r)*n,l=t.period.value;s===0?t.move.value.set(o.x*.09,o.y*2,0,0):s===1?t.move.value.set(0,0,o.x*l*9,-o.y*l*9):t.move.value.set(o.x*.012,0,0,o.y*p*.12),h.render(b,N),requestAnimationFrame(S)}window.addEventListener("resize",q);q();requestAnimationFrame(S);
