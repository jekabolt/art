import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{n as S,j as M,W as N,S as P,O as z,o as B,k as H,F as R,N as D,g as L,M as O,e as C}from"./vendor.af344eb3.js";import{b as G}from"./logo-path.248ebb5a.js";import{l as _}from"./logo-bars.36bf556b.js";const h=180,y=_().map(e=>{const a=e.ax-300,s=300-e.ay,l=e.bx-300,v=300-e.by,c=Math.hypot(l-a,v-s);return{c:new S((a+l)/2,(s+v)/2,(l-a)/c,(v-s)/c),h:new M(c/2,G/2)}}),x=document.getElementById("timeslit"),b=new N({canvas:x,antialias:!1}),k=new P,K=new z(-1,1,1,-1,0,1),f=new Float32Array(h*4),p=new B(f,h,1,H,R);p.minFilter=p.magFilter=D;p.needsUpdate=!0;const i={resolution:{value:new M},ppu:{value:1},hist:{value:p},head:{value:0},now:{value:new S},reach:{value:2e3},mode:{value:0},bars:{value:y.map(e=>e.c)},halves:{value:y.map(e=>e.h)}},W=new L({uniforms:i,defines:{NB:y.length,HIST:h.toFixed(1)},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float ppu;
    uniform sampler2D hist;
    uniform float head;
    uniform vec4 now;
    uniform float reach;
    uniform int mode;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.957, 0.953, 0.937);
    const vec3 INK = vec3(0.043);

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

    vec4 poseAt(float k) {
      // k frames back from the newest
      float i = mod(head - k + HIST, HIST);
      return texture2D(hist, vec2((floor(i) + 0.5) / HIST, 0.5));
    }

    void main() {
      vec2 q = gl_FragCoord.xy - 0.5 * resolution;
      // how far this pixel lies from the slit's live line, in device px
      float off;
      if (mode == 0) off = abs(q.y - now.y);
      else if (mode == 1) off = abs(q.x - now.x);
      else off = length(q - now.xy);
      float k = clamp(off / reach, 0.0, 1.0) * (HIST - 2.0);
      vec4 a = poseAt(floor(k));
      vec4 b = poseAt(floor(k) + 1.0);
      vec4 pose = mix(a, b, fract(k));

      vec2 r = q - pose.xy;
      float c = cos(pose.z);
      float s = sin(pose.z);
      vec2 p = vec2(c * r.x + s * r.y, -s * r.x + c * r.y) / ppu;
      float ink = clamp(0.5 - logoSD(p) * ppu, 0.0, 1.0);
      gl_FragColor = vec4(mix(PAPER, INK, ink), 1.0);
    }
  `}),q=new O(new C(2,2),W);q.frustumCulled=!1;k.add(q);let n=1,r=1,o=1;function F(){n=window.innerWidth,r=window.innerHeight,o=Math.min(window.devicePixelRatio||1,2),b.setPixelRatio(o),b.setSize(n,r,!1),i.resolution.value.set(n*o,r*o);const e=Math.min(n<=768?.5*n:.24*n,.36*r);i.ppu.value=e*o/516,i.reach.value=1.2*Math.max(n,r)*o}const t={x:0,y:0,vx:0,vy:0,a:0,va:0},m={x:0,y:0};let T=-1e9,d=null;function I(e){m.x=e.clientX-n/2,m.y=e.clientY-r/2,T=performance.now()}x.addEventListener("pointerdown",e=>{d={x:e.clientX,y:e.clientY},I(e)});x.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&I(e)});x.addEventListener("pointerup",e=>{d&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8&&(i.mode.value=(i.mode.value+1)%3),d=null});let u=0;function A(){u=(u+1)%h;const e=u*4;f[e]=t.x*o,f[e+1]=-t.y*o,f[e+2]=t.a,f[e+3]=0,p.needsUpdate=!0,i.head.value=u,i.now.value.set(t.x*o,-t.y*o,t.a,0)}function X(){for(let e=0;e<h;e++)u=e,A()}let g=performance.now(),w=0;function E(e){const a=Math.min(.05,(e-g)/1e3);if(g=e,e-T>2500){const c=e/1e3;m.x=Math.sin(c*.53)*n*.22,m.y=Math.sin(c*.37+1.2)*r*.18}const s=38,l=9;t.vx+=((m.x-t.x)*s-t.vx*l)*a,t.vy+=((m.y-t.y)*s-t.vy*l)*a,t.x+=t.vx*a,t.y+=t.vy*a;const v=Math.max(-.6,Math.min(.6,-t.vx*.0012));for(t.va+=((v-t.a)*60-t.va*10)*a,t.a+=t.va*a,w+=a;w>=1/60;)w-=1/60,A();b.render(k,K),requestAnimationFrame(E)}window.addEventListener("resize",F);F();X();requestAnimationFrame(E);
