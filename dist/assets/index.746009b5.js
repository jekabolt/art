import"./modulepreload-polyfill.b7f2da20.js";import{n as F,j as T,W as B,S as H,O,o as R,k as C,F as G,N as _,g as K,M as W,e as X}from"./vendor.c6995a63.js";import{b as Y}from"./logo-path.248ebb5a.js";import{l as U}from"./logo-bars.36bf556b.js";const x=180,M=U().map(e=>{const a=e.ax-300,l=300-e.ay,c=e.bx-300,d=300-e.by,m=Math.hypot(c-a,d-l);return{c:new F((a+c)/2,(l+d)/2,(c-a)/m,(d-l)/m),h:new T(m/2,Y/2)}}),y=document.getElementById("timeslit"),S=new B({canvas:y,antialias:!1}),L=new H,V=new O(-1,1,1,-1,0,1),f=new Float32Array(x*4),p=new R(f,x,1,C,G);p.minFilter=p.magFilter=_;p.needsUpdate=!0;const r={resolution:{value:new T},ppu:{value:1},hist:{value:p},head:{value:0},now:{value:new F},reach:{value:2e3},mode:{value:0},bars:{value:M.map(e=>e.c)},halves:{value:M.map(e=>e.h)}},j=new K({uniforms:r,defines:{NB:M.length,HIST:x.toFixed(1)},vertexShader:`
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
  `}),I=new W(new X(2,2),j);I.frustumCulled=!1;L.add(I);let o=1,s=1,i=1;function P(){o=window.innerWidth,s=window.innerHeight,i=Math.min(window.devicePixelRatio||1,2),S.setPixelRatio(i),S.setSize(o,s,!1),r.resolution.value.set(o*i,s*i);const e=Math.min(o<=768?.5*o:.24*o,.36*s);r.ppu.value=e*i/516,r.reach.value=1.2*Math.max(o,s)*i}const t={x:0,y:0,vx:0,vy:0,a:0,va:0},v={x:0,y:0};let A=-1e9,u=null;function D(e){v.x=e.clientX-o/2,v.y=e.clientY-s/2,A=performance.now()}y.addEventListener("pointerdown",e=>{u={x:e.clientX,y:e.clientY},D(e)});y.addEventListener("pointermove",e=>{(e.pointerType==="mouse"||e.buttons)&&D(e)});y.addEventListener("pointerup",e=>{u&&Math.hypot(e.clientX-u.x,e.clientY-u.y)<8&&(r.mode.value=(r.mode.value+1)%3),u=null});const n={on:!1,x:0,y:0,b0:0,g0:0};function q(e){e.beta==null||e.gamma==null||(n.on||(n.on=!0,n.b0=e.beta,n.g0=e.gamma),n.b0+=(e.beta-n.b0)*.002,n.g0+=(e.gamma-n.g0)*.002,n.x=Math.max(-1,Math.min(1,(e.gamma-n.g0)/20)),n.y=Math.max(-1,Math.min(1,(e.beta-n.b0)/20)))}const b=document.querySelector(".l-motion"),w=window.DeviceOrientationEvent,k=window.matchMedia("(pointer: coarse)").matches;k&&w&&typeof w.requestPermission=="function"?(b?.classList.remove("-none"),b?.addEventListener("click",()=>{w.requestPermission().then(e=>e==="granted"&&window.addEventListener("deviceorientation",q)).finally(()=>b.classList.add("-none"))})):k&&w&&window.addEventListener("deviceorientation",q);let h=0;function N(){h=(h+1)%x;const e=h*4;f[e]=t.x*i,f[e+1]=-t.y*i,f[e+2]=t.a,f[e+3]=0,p.needsUpdate=!0,r.head.value=h,r.now.value.set(t.x*i,-t.y*i,t.a,0)}function J(){for(let e=0;e<x;e++)h=e,N()}let E=performance.now(),g=0;function z(e){const a=Math.min(.05,(e-E)/1e3);if(E=e,e-A>2500){const m=e/1e3;v.x=Math.sin(m*.53)*o*.22+n.x*o*.3,v.y=Math.sin(m*.37+1.2)*s*.18+n.y*s*.3}const l=38,c=9;t.vx+=((v.x-t.x)*l-t.vx*c)*a,t.vy+=((v.y-t.y)*l-t.vy*c)*a,t.x+=t.vx*a,t.y+=t.vy*a;const d=Math.max(-.6,Math.min(.6,-t.vx*.0012));for(t.va+=((d-t.a)*60-t.va*10)*a,t.a+=t.va*a,g+=a;g>=1/60;)g-=1/60,N();S.render(L,V),requestAnimationFrame(z)}window.addEventListener("resize",P);P();J();requestAnimationFrame(z);
