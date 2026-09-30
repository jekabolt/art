import"./modulepreload-polyfill.b7f2da20.js";import{n as v,j as g,W as z,S as C,O as T,V as H,g as I,M as L,e as B}from"./vendor.5d5a970a.js";import{b as R}from"./logo-path.248ebb5a.js";import{l as A}from"./logo-bars.36bf556b.js";const c=18,u=A().map(e=>{const n=e.ax-300,t=300-e.ay,o=e.bx-300,d=300-e.by,p=Math.hypot(o-n,d-t);return{c:new v((n+o)/2,(t+d)/2,(o-n)/p,(d-t)/p),h:new g(p/2,R/2)}}),m=document.getElementById("dots"),f=new z({canvas:m,antialias:!1}),y=new C,F=new T(-1,1,1,-1,0,1),r={resolution:{value:new g},ppu:{value:1},inner:{value:new v},frame:{value:new v},ink:{value:new H},bars:{value:u.map(e=>e.c)},halves:{value:u.map(e=>e.h)}},O=new I({uniforms:r,defines:{NB:u.length,PITCH:c.toFixed(1)},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float ppu;
    uniform vec4 inner;
    uniform vec4 frame;
    uniform vec3 ink;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.945, 0.937, 0.918);

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

      float cover = outer;
      if (sq > 0.0) cover = mix(cover, grid(p, frame.xyz, px), sq);
      if (mark > 0.0) cover = mix(cover, grid(p, inner.xyz, px), mark);

      gl_FragColor = vec4(mix(PAPER, ink, cover), 1.0);
    }
  `}),b=new L(new B(2,2),O);b.frustumCulled=!1;y.add(b);function q(){const e=window.innerWidth,n=window.innerHeight,t=Math.min(window.devicePixelRatio||1,2);f.setPixelRatio(t),f.setSize(e,n,!1),r.resolution.value.set(e*t,n*t);const o=Math.min(e<=768?.86*e:.5*e,.72*n);r.ppu.value=o*t/(516+60)}const h=[16711680,3219182,0,5247113],P=e=>[(e>>16&255)/255,(e>>8&255)/255,(e&255)/255];let x=0,i=P(h[0]),k=-1e9;r.ink.value.set(i[0],i[1],i[2]);let l=null;m.addEventListener("pointerdown",e=>l={x:e.clientX,y:e.clientY});m.addEventListener("pointerup",e=>{if(l&&Math.hypot(e.clientX-l.x,e.clientY-l.y)<8){const n=r.ink.value;i=[n.x,n.y,n.z],x=(x+1)%h.length,k=performance.now()}l=null});function D(e){const n=Math.min(1,(e-k)/350),t=n*n*(3-2*n),o=P(h[x]);r.ink.value.set(i[0]+(o[0]-i[0])*t,i[1]+(o[1]-i[1])*t,i[2]+(o[2]-i[2])*t)}const s={x:0,y:0},a={x:0,y:0};let M=-1e9;function E(e){s.x=e.clientX/window.innerWidth*2-1,s.y=e.clientY/window.innerHeight*2-1,M=performance.now()}m.addEventListener("pointerdown",E);m.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&E(e)});let w=performance.now();function S(e){const n=Math.min(.05,(e-w)/1e3);if(w=e,e-M>2500){const o=e/1e3;s.x=Math.sin(o*.23)*.6,s.y=Math.sin(o*.17+1.3)*.5}const t=1-Math.exp(-n*5);a.x+=(s.x-a.x)*t,a.y+=(s.y-a.y)*t,r.inner.value.set(a.x*c*1.5,-a.y*c*1.5,.06+a.x*.1,0),r.frame.value.set(-a.x*c*.6,a.y*c*.6,-.05-a.y*.06,0),D(e),f.render(y,F),requestAnimationFrame(S)}window.addEventListener("resize",q);q();requestAnimationFrame(S);
