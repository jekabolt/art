import"./modulepreload-polyfill.b7f2da20.js";import{E as L}from"./embed.d17cc095.js";import{q as E,v as O,aA as M,J as h,aq as _,U as P,X as C,_ as F,ae as S}from"./vendor.536cba25.js";import{h as D}from"./haptic.02f05cb2.js";import{c as f,a as g,b as k,L as A}from"./logo-path.248ebb5a.js";const i={view:3,trap:.9,iters:80,shapes:[[-.8,.156],[.285,.01],[-.4,.6],[-.70176,-.3842],[.355,.355],[-.54,.54],[-.12,.75]]};function G(){const n=document.createElement("canvas");n.width=n.height=512;const a=n.getContext("2d");a.scale(512/f,512/f),a.translate(-g,-g),a.lineWidth=k,a.strokeStyle="#fff",a.stroke(new Path2D(A));const o=new F(n);return o.minFilter=S,o.generateMipmaps=!1,o}const s=document.getElementById("trap"),l=new E({canvas:s,antialias:!1});l.setPixelRatio(Math.min(devicePixelRatio,2));const x=new O,I=new M(-1,1,1,-1,0,1),m={logo:{value:G()},res:{value:new h},c:{value:new h(...i.shapes[0])},view:{value:i.view},trap:{value:i.trap}},R=new _({uniforms:m,vertexShader:"void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:`
    uniform sampler2D logo;
    uniform vec2 res, c;
    uniform float view, trap;
    // 1 when the point's orbit lands on the mark, else 0
    float caught(vec2 p) {
      vec2 z = (p - res * 0.5) / min(res.x, res.y) * view;
      for (int i = 0; i < ${i.iters}; i++) {
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 16.0) return 0.0;
        if (i >= 7) continue; // only the first few landings: the mark and its first preimages
        vec2 uv = z / trap + 0.5;
        uv.y = 1.0 - uv.y;
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && texture2D(logo, uv).a > 0.5) return 1.0;
      }
      return 0.0;
    }
    void main() {
      // four samples a pixel, so the coastline is smooth
      float w = 0.25 * (caught(gl_FragCoord.xy + vec2(-0.25, -0.25)) + caught(gl_FragCoord.xy + vec2(0.25, -0.25))
        + caught(gl_FragCoord.xy + vec2(-0.25, 0.25)) + caught(gl_FragCoord.xy + vec2(0.25, 0.25)));
      vec3 blue = vec3(0.04, 0.11, 1.0);
      gl_FragColor = vec4(mix(blue, vec3(1.0), w), 1.0);
    }`});x.add(new P(new C(2,2),R));function y(){l.setSize(innerWidth,innerHeight,!1),m.res.value.set(innerWidth*l.getPixelRatio(),innerHeight*l.getPixelRatio())}addEventListener("resize",y);y();let r=[...i.shapes[0]],c=[...r],p=-1,v=0,t=null;s.addEventListener("pointerdown",e=>{s.setPointerCapture(e.pointerId),t={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()}});s.addEventListener("pointermove",e=>{if(!t||e.pointerId!==t.id)return;const n=.35/Math.min(innerWidth,innerHeight);r[0]+=(e.clientX-t.x)*n,r[1]-=(e.clientY-t.y)*n,p=-1,t.x=e.clientX,t.y=e.clientY});const w=e=>{if(!t||e.pointerId!==t.id)return;const n=e.type==="pointerup"&&Math.hypot(e.clientX-t.sx,e.clientY-t.sy)<10&&performance.now()-t.t<300;t=null,!!n&&(v=(v+1)%i.shapes.length,c=[...r],r=[...i.shapes[v]],p=performance.now(),D([10,30,10]))};s.addEventListener("pointerup",w);s.addEventListener("pointercancel",w);L||addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});const X=performance.now();function z(e){const n=(e-X)/1e3;let a=r[0],o=r[1];if(p>=0){const u=Math.min(1,(e-p)/1400),d=u*u*(3-2*u);a=c[0]+(r[0]-c[0])*d,o=c[1]+(r[1]-c[1])*d,u>=1&&(p=-1)}m.c.value.set(a+Math.cos(n*.23)*.012,o+Math.sin(n*.31)*.012),l.render(x,I),requestAnimationFrame(z)}requestAnimationFrame(z);
