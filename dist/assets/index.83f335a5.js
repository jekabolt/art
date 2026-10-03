import"./modulepreload-polyfill.b7f2da20.js";import{E as w}from"./embed.d17cc095.js";import{q as b,v as M,aA as L,J as h,aq as P,U as E,X as O,_ as I,ae as q}from"./vendor.5c090fbc.js";import{h as D}from"./haptic.02f05cb2.js";import{c as u,a as m,b as S,L as _}from"./logo-path.248ebb5a.js";const c={mark:.62,pad:1.6,cell:5.5};function x(e){const n=document.createElement("canvas");n.width=n.height=1024;const r=n.getContext("2d"),l=1024/c.pad;r.filter=e?`blur(${e*l}px)`:"none",r.translate((1024-l)/2,(1024-l)/2),r.scale(l/u,l/u),r.translate(-m,-m),r.lineWidth=S,r.strokeStyle="#fff",r.stroke(new Path2D(_));const v=new I(n);return v.minFilter=q,v.generateMipmaps=!1,v}const i=document.getElementById("riso"),p=new b({canvas:i,antialias:!1});p.setPixelRatio(Math.min(devicePixelRatio,2));const g=new M,B=new L(-1,1,1,-1,0,1),s={sharp:{value:x(.004)},soft:{value:x(.09)},res:{value:new h},side:{value:1},cell:{value:c.cell},off:{value:new h(5,-3)},rot:{value:.006},seed:{value:Math.random()*100}},C=new P({uniforms:s,vertexShader:"void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:`
    uniform sampler2D sharp, soft;
    uniform vec2 res, off;
    uniform float side, cell, rot, seed;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 13.7) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) { return vnoise(p) * 0.6 + vnoise(p * 2.1) * 0.28 + vnoise(p * 4.3) * 0.12; }
    // a point on screen \u2192 the plate's texture, with the plate shifted and turned
    vec2 plateUv(vec2 p, vec2 shift, float a) {
      vec2 q = p - res * 0.5 - shift;
      q = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
      vec2 uv = q / (side * ${c.pad.toFixed(2)}) + 0.5;
      return uv;
    }
    float inside(vec2 uv) { return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }

    void main() {
      vec2 p = gl_FragCoord.xy;
      vec3 paper = vec3(0.965, 0.953, 0.918) * (0.975 + 0.025 * hash(floor(p)));
      paper *= 0.985 + 0.015 * fbm(p / 3.0);

      // --- pink: a halftone of the glow, on a screen turned 15\xB0, ink starved in bands along the drum
      vec2 uvP = plateUv(p, off, rot);
      float tone = texture2D(soft, uvP).a * inside(uvP);
      vec2 c = res * 0.5 + off;
      float halo = 1.0 - smoothstep(0.0, side * 0.95, length(p - c));
      tone = clamp(tone * 0.8 + halo * 0.1, 0.0, 1.0);
      float sa = 0.2618;
      vec2 sp = mat2(cos(sa), sin(sa), -sin(sa), cos(sa)) * (p - c) / cell;
      vec2 f = fract(sp) - 0.5;
      float r = pow(tone, 1.15) * 0.7 + (hash(floor(sp)) - 0.5) * 0.06;
      float d = length(f);
      float aa = 1.2 / cell;
      float pink = smoothstep(r + aa, r - aa, d);
      float starveP = 0.78 + 0.22 * smoothstep(0.25, 0.75, fbm(vec2(p.x / 200.0, p.y / 18.0)));
      pink *= starveP;

      // --- blue: the logo solid, the edge ragged by grain, pinholes where the ink skipped
      vec2 uvB = plateUv(p, vec2(0.0), 0.0);
      float m = texture2D(sharp, uvB).a * inside(uvB);
      float edge = 0.5 + (fbm(p / 2.2) - 0.5) * 0.55;
      float blue = smoothstep(edge - 0.08, edge + 0.08, m);
      blue *= 0.86 + 0.14 * smoothstep(0.3, 0.8, fbm(vec2(p.x / 14.0, p.y / 260.0) + 7.0));
      blue *= 1.0 - step(0.9965, hash(floor(p / 1.5) + 3.1)) * 0.85;

      // toner dust: the odd fleck of each ink anywhere on the sheet
      pink = max(pink, step(0.9993, hash(floor(p / 2.0) + 11.0)) * 0.7);
      blue = max(blue, step(0.9996, hash(floor(p / 2.0) + 23.0)) * 0.6);

      // transparent inks multiply over the paper and each other
      vec3 pinkInk = vec3(1.0, 0.28, 0.66);
      vec3 blueInk = vec3(0.16, 0.27, 0.66);
      vec3 col = paper * mix(vec3(1.0), pinkInk, pink * 0.95) * mix(vec3(1.0), blueInk, blue * 0.93);
      gl_FragColor = vec4(col, 1.0);
    }`});g.add(new E(new O(2,2),C));let o=1;function y(){o=p.getPixelRatio(),p.setSize(innerWidth,innerHeight,!1),s.res.value.set(innerWidth*o,innerHeight*o),s.side.value=Math.min(innerWidth,innerHeight)*c.mark*o,s.cell.value=c.cell*o,d()}let f=!1;function d(){f||(f=!0,requestAnimationFrame(()=>{f=!1,p.render(g,B)}))}addEventListener("resize",y);y();let t=null;i.addEventListener("pointerdown",e=>{i.setPointerCapture(e.pointerId),t={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()}});i.addEventListener("pointermove",e=>{if(!t||e.pointerId!==t.id)return;const a=s.off.value;a.x+=(e.clientX-t.x)*o,a.y-=(e.clientY-t.y)*o;const n=s.side.value*.6;a.x=Math.max(-n,Math.min(n,a.x)),a.y=Math.max(-n,Math.min(n,a.y)),t.x=e.clientX,t.y=e.clientY,d()});const k=e=>{if(!t||e.pointerId!==t.id)return;const a=e.type==="pointerup"&&Math.hypot(e.clientX-t.sx,e.clientY-t.sy)<10&&performance.now()-t.t<300;t=null,!!a&&(s.seed.value=Math.random()*100,s.off.value.set((Math.random()-.5)*14*o,(Math.random()-.5)*14*o),s.rot.value=(Math.random()-.5)*.02,D([10,30,10]),d())};i.addEventListener("pointerup",k);i.addEventListener("pointercancel",k);w||addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});
