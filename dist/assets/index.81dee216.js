import"./modulepreload-polyfill.b7f2da20.js";import{E}from"./embed.d17cc095.js";import{q as M,v as O,aA as _,J as v,aq as P,U as C,X as F,_ as b,ae as A}from"./vendor.536cba25.js";import{h as S}from"./haptic.02f05cb2.js";import{c as f,a as g,b as k,L as D}from"./logo-path.248ebb5a.js";const a={view:3,trap:.9,iters:80,layers:7,grow:.32,shapes:[[-.8,.156],[.285,.01],[-.4,.6],[-.70176,-.3842],[.355,.355],[-.54,.54],[-.12,.75]]};function G(){const t=document.createElement("canvas");t.width=t.height=512;const r=t.getContext("2d");r.scale(512/f,512/f),r.translate(-g,-g),r.lineWidth=k,r.strokeStyle="#fff",r.stroke(new Path2D(D));const o=new b(t);return o.minFilter=A,o.generateMipmaps=!1,o}const s=document.getElementById("trap"),c=new M({canvas:s,antialias:!1});c.setPixelRatio(Math.min(devicePixelRatio,2));const w=new O,I=new _(-1,1,1,-1,0,1),d={logo:{value:G()},res:{value:new v},c:{value:new v(...a.shapes[0])},view:{value:a.view},trap:{value:a.trap},depth:{value:1}},R=new P({uniforms:d,vertexShader:"void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:`
    uniform sampler2D logo;
    uniform vec2 res, c;
    uniform float view, trap, depth;
    // the parity of the orbit's landings on the mark, counting the first depth steps (step 0 is
    // the point itself, so the logo stands whole in the middle): 1 white, 0 blue
    float caught(vec2 p) {
      vec2 z = (p - res * 0.5) / min(res.x, res.y) * view;
      float hits = 0.0;
      for (int i = 0; i < ${a.layers}; i++) {
        if (float(i) >= depth) break;
        vec2 uv = z / trap + 0.5; // y up, as the texture (flipped on upload) has it
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && texture2D(logo, uv).a > 0.5) hits += 1.0;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 16.0) break;
      }
      return mod(hits, 2.0);
    }
    void main() {
      // four samples a pixel, so the coastline is smooth
      float w = 0.25 * (caught(gl_FragCoord.xy + vec2(-0.25, -0.25)) + caught(gl_FragCoord.xy + vec2(0.25, -0.25))
        + caught(gl_FragCoord.xy + vec2(-0.25, 0.25)) + caught(gl_FragCoord.xy + vec2(0.25, 0.25)));
      vec3 blue = vec3(0.04, 0.11, 1.0);
      gl_FragColor = vec4(mix(blue, vec3(1.0), w), 1.0);
    }`});w.add(new C(new F(2,2),R));function x(){c.setSize(innerWidth,innerHeight,!1),d.res.value.set(innerWidth*c.getPixelRatio(),innerHeight*c.getPixelRatio())}addEventListener("resize",x);x();let i=[...a.shapes[0]],l=[...i],p=-1,u=0,n=null;s.addEventListener("pointerdown",e=>{s.setPointerCapture(e.pointerId),n={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()}});s.addEventListener("pointermove",e=>{if(!n||e.pointerId!==n.id)return;const t=.35/Math.min(innerWidth,innerHeight);i[0]+=(e.clientX-n.x)*t,i[1]-=(e.clientY-n.y)*t,p=-1,n.x=e.clientX,n.y=e.clientY});const y=e=>{if(!n||e.pointerId!==n.id)return;const t=e.type==="pointerup"&&Math.hypot(e.clientX-n.sx,e.clientY-n.sy)<10&&performance.now()-n.t<300;n=null,!!t&&(u=(u+1)%a.shapes.length,l=[...i],i=[...a.shapes[u]],p=performance.now(),X())};s.addEventListener("pointerup",y);s.addEventListener("pointercancel",y);E||addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});let z=performance.now();function X(){z=performance.now();const e=a.grow*1e3;S(Array.from({length:a.layers*2-1},(t,r)=>r%2?e-10:10))}const W=performance.now();function L(e){const t=(e-W)/1e3;let r=i[0],o=i[1];if(p>=0){const h=Math.min(1,(e-p)/1400),m=h*h*(3-2*h);r=l[0]+(i[0]-l[0])*m,o=l[1]+(i[1]-l[1])*m,h>=1&&(p=-1)}d.depth.value=Math.min(a.layers,1+Math.floor((e-z)/1e3/a.grow)),d.c.value.set(r+Math.cos(t*.23)*.012,o+Math.sin(t*.31)*.012),c.render(w,I),requestAnimationFrame(L)}requestAnimationFrame(L);
