import"./modulepreload-polyfill.b7f2da20.js";import{E as w}from"./embed.d17cc095.js";import{q as b,v as M,aA as B,J as i,aq as P,U as Y,X as L,_ as E,ae as I}from"./vendor.5c090fbc.js";import{h as O}from"./haptic.02f05cb2.js";import{c as v,a as u,b as S,L as _}from"./logo-path.248ebb5a.js";const l={mark:.8,pad:1.25,margin:.025,cellY:11,cellB:6,pass:.42},s=document.getElementById("riso"),p=new b({canvas:s,antialias:!1});p.setPixelRatio(Math.min(devicePixelRatio,2));const y=new M,q=new B(-1,1,1,-1,0,1);function D(){const a=document.createElement("canvas");a.width=a.height=1024;const n=a.getContext("2d"),f=1024/l.pad;n.translate((1024-f)/2,(1024-f)/2),n.scale(f/v,f/v),n.translate(-u,-u),n.lineWidth=S,n.strokeStyle="#fff",n.stroke(new Path2D(_));const m=new E(a);return m.minFilter=I,m.generateMipmaps=!1,m}const t={logo:{value:D()},res:{value:new i},side:{value:1},margin:{value:1},cellY:{value:1},cellB:{value:1},offY:{value:new i},offP:{value:new i},offB:{value:new i},rotP:{value:0},rotB:{value:0},seed:{value:Math.random()*100},feed:{value:0}},F=new P({uniforms:t,vertexShader:"void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:`
    uniform sampler2D logo;
    uniform vec2 res, offY, offP, offB;
    uniform float side, margin, cellY, cellB, rotP, rotB, seed, feed;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + seed * 13.7) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) { return vnoise(p) * 0.55 + vnoise(p * 2.1) * 0.3 + vnoise(p * 4.3) * 0.15; }
    mat2 rot(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }

    // the logo plate under a drum that has slipped by shift and turned by a
    float mark(vec2 p, vec2 shift, float a, float rough) {
      vec2 q = rot(a) * (p - res * 0.5 - shift);
      vec2 uv = q / (side * ${l.pad.toFixed(2)}) + 0.5;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
      float m = texture2D(logo, uv).a;
      float edge = 0.5 + (fbm(p / 1.8 + rough) - 0.5) * 0.7; // the stencil's edge is never clean
      return smoothstep(edge - 0.1, edge + 0.1, m);
    }
    // halftone dot coverage for a tone on a screen of the given cell and angle
    float dots(vec2 p, float tone, float cell, float a) {
      vec2 sp = rot(a) * p / cell;
      float r = sqrt(clamp(tone, 0.0, 1.0)) * 0.72 + (hash(floor(sp)) - 0.5) * 0.05;
      float d = length(fract(sp) - 0.5);
      float aa = 1.0 / cell;
      return smoothstep(r + aa, r - aa, d);
    }
    // stencil ink: mottled, with pinholes and a density that drifts across the sheet
    float grain(vec2 p, float k) {
      float mottle = smoothstep(0.18, 0.42, fbm(p / 1.4 + k * 17.0));
      float drift = 0.8 + 0.2 * smoothstep(0.2, 0.8, fbm(vec2(p.x / 240.0, p.y / 30.0) + k));
      float holes = 1.0 - step(0.996, hash(floor(p / 1.5) + k));
      return mix(0.72, 1.0, mottle) * drift * holes;
    }
    // how far a drum has rolled: it lays ink from the top of the sheet down
    float rolled(vec2 p, float drum) {
      float y = 1.0 - p.y / res.y; // 0 at the top
      float t = clamp(feed - drum, 0.0, 1.0) * 1.08;
      return smoothstep(y, y + 0.02, t);
    }

    void main() {
      vec2 p = gl_FragCoord.xy;
      vec3 paper = vec3(0.968, 0.957, 0.925) * (0.97 + 0.03 * hash(floor(p)));
      paper *= 0.985 + 0.015 * fbm(p / 3.0);
      // the border the machine cannot print to
      vec2 b = min(p, res - p);
      float sheet = step(margin, min(b.x, b.y));

      // yellow: a coarse ramp from corner to corner, and a little heavier behind the mark
      vec2 py = p - offY;
      float ramp = dot((py - res * 0.5) / max(res.x, res.y), normalize(vec2(1.0, 1.0)));
      float toneY = 0.12 + 0.7 * smoothstep(-0.55, 0.55, ramp);
      float yellow = dots(py, toneY, cellY, 0.0) * grain(p, 1.0) * sheet * rolled(p, 0.0);

      // pink: the logo solid
      float pink = mark(p, offP, rotP, 3.0) * grain(p, 2.0) * sheet * rolled(p, 1.0);

      // blue: the logo again, a halftone fading from solid at the top of the mark to light at its foot
      float mb = mark(p, offB, rotB, 5.0);
      float fy = clamp((p.y - offB.y - (res.y * 0.5 - side * 0.5)) / side, 0.0, 1.0); // 0 at the foot
      float blue = mb * dots(p - offB, mix(0.18, 1.0, fy * fy), cellB, 0.785) * grain(p, 3.0) * sheet * rolled(p, 2.0);

      // toner dust
      pink = max(pink, step(0.9994, hash(floor(p / 2.0) + 11.0)) * 0.7 * rolled(p, 1.0));
      blue = max(blue, step(0.9996, hash(floor(p / 2.0) + 23.0)) * 0.6 * rolled(p, 2.0));

      // transparent inks multiply over the paper and each other
      vec3 yInk = vec3(1.0, 0.91, 0.0);
      vec3 pInk = vec3(1.0, 0.28, 0.69);
      vec3 bInk = vec3(0.0, 0.47, 0.75);
      vec3 col = paper;
      col *= mix(vec3(1.0), yInk, yellow * 0.92);
      col *= mix(vec3(1.0), pInk, pink * 0.94);
      col *= mix(vec3(1.0), bInk, blue * 0.9);
      gl_FragColor = vec4(col, 1.0);
    }`});y.add(new Y(new L(2,2),F));let r=1;function g(){r=p.getPixelRatio(),p.setSize(innerWidth,innerHeight,!1);const e=Math.min(innerWidth,innerHeight);t.res.value.set(innerWidth*r,innerHeight*r),t.side.value=e*l.mark*r,t.margin.value=e*l.margin*r,t.cellY.value=l.cellY*r,t.cellB.value=l.cellB*r,d()}let c=-1;function x(){const e=a=>new i((Math.random()-.5)*a*r,(Math.random()-.5)*a*r);t.seed.value=Math.random()*100,t.offY.value.copy(e(10)),t.offP.value.copy(e(18)),t.offB.value.copy(e(10)),t.rotP.value=(Math.random()-.5)*.02,t.rotB.value=(Math.random()-.5)*.012,t.feed.value=0,c=performance.now(),O([10,l.pass*1e3-10,10,l.pass*1e3-10,10]),d()}let h=!1;function d(){h||(h=!0,requestAnimationFrame(()=>{if(h=!1,c>=0){const e=(performance.now()-c)/1e3/l.pass;t.feed.value=Math.min(3,e),e<3?d():c=-1}p.render(y,q)}))}addEventListener("resize",g);g();x();let o=null;s.addEventListener("pointerdown",e=>{s.setPointerCapture(e.pointerId),o={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()}});s.addEventListener("pointermove",e=>{if(!o||e.pointerId!==o.id)return;const a=t.offP.value,n=t.side.value*.12;a.x=Math.max(-n,Math.min(n,a.x+(e.clientX-o.x)*r)),a.y=Math.max(-n,Math.min(n,a.y-(e.clientY-o.y)*r)),o.x=e.clientX,o.y=e.clientY,d()});const k=e=>{if(!o||e.pointerId!==o.id)return;const a=e.type==="pointerup"&&Math.hypot(e.clientX-o.sx,e.clientY-o.sy)<10&&performance.now()-o.t<300;o=null,a&&x()};s.addEventListener("pointerup",k);s.addEventListener("pointercancel",k);w||addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});
