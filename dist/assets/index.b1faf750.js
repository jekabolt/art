import"./modulepreload-polyfill.b7f2da20.js";import{n as m,j as u,W as q,S as P,O as k,g as S,M as C,e as M}from"./vendor.0b7086df.js";import{b as z}from"./logo-path.248ebb5a.js";import{l as E}from"./logo-bars.36bf556b.js";const r=18,p=E().map(e=>{const o=e.ax-300,n=300-e.ay,a=e.bx-300,c=300-e.by,l=Math.hypot(a-o,c-n);return{c:new m((o+a)/2,(n+c)/2,(a-o)/l,(c-n)/l),h:new u(l/2,z/2)}}),v=document.getElementById("dots"),d=new q({canvas:v,antialias:!1}),x=new P,H=new k(-1,1,1,-1,0,1),s={resolution:{value:new u},ppu:{value:1},inner:{value:new m},frame:{value:new m},bars:{value:p.map(e=>e.c)},halves:{value:p.map(e=>e.h)}},I=new S({uniforms:s,defines:{NB:p.length,PITCH:r.toFixed(1)},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float ppu;
    uniform vec4 inner;
    uniform vec4 frame;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.945, 0.937, 0.918);
    const vec3 RED = vec3(0.925, 0.215, 0.13);

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
    float boxSD(vec2 p, float h) {
      vec2 q = abs(p) - vec2(h);
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    }

    // coverage of a dot grid at p: pitch PITCH, dots 0.78 of the pitch across, turned and shifted
    float grid(vec2 p, vec3 g, float px) {
      float c = cos(g.z);
      float s = sin(g.z);
      vec2 q = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) + g.xy;
      vec2 cell = mod(q, PITCH) - 0.5 * PITCH;
      float d = length(cell) - 0.39 * PITCH;
      return clamp(0.5 - d / px, 0.0, 1.0);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / ppu;
      float px = 1.0 / ppu; // one device pixel in logo units

      float outer = grid(p, vec3(0.0), px);
      float sq = clamp(0.5 - boxSD(p, 258.0 + 30.0) / px, 0.0, 1.0);   // the mark's square, with a margin
      float mark = clamp(0.5 - logoSD(p) / px, 0.0, 1.0);             // the strokes

      float ink = outer;
      if (sq > 0.0) ink = mix(ink, grid(p, frame.xyz, px), sq);
      if (mark > 0.0) ink = mix(ink, grid(p, inner.xyz, px), mark);

      gl_FragColor = vec4(mix(PAPER, RED, ink), 1.0);
    }
  `}),h=new C(new M(2,2),I);h.frustumCulled=!1;x.add(h);function g(){const e=window.innerWidth,o=window.innerHeight,n=Math.min(window.devicePixelRatio||1,2);d.setPixelRatio(n),d.setSize(e,o,!1),s.resolution.value.set(e*n,o*n);const a=Math.min(e<=768?.86*e:.5*e,.72*o);s.ppu.value=a*n/(516+60)}const i={x:0,y:0},t={x:0,y:0};let w=-1e9;function y(e){i.x=e.clientX/window.innerWidth*2-1,i.y=e.clientY/window.innerHeight*2-1,w=performance.now()}v.addEventListener("pointerdown",y);v.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&y(e)});let f=performance.now();function b(e){const o=Math.min(.05,(e-f)/1e3);if(f=e,e-w>2500){const a=e/1e3;i.x=Math.sin(a*.23)*.6,i.y=Math.sin(a*.17+1.3)*.5}const n=1-Math.exp(-o*5);t.x+=(i.x-t.x)*n,t.y+=(i.y-t.y)*n,s.inner.value.set(t.x*r*1.5,-t.y*r*1.5,.06+t.x*.1,0),s.frame.value.set(-t.x*r*.6,t.y*r*.6,-.05-t.y*.06,0),d.render(x,H),requestAnimationFrame(b)}window.addEventListener("resize",g);g();requestAnimationFrame(b);
