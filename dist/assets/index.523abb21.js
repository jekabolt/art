import"./modulepreload-polyfill.b7f2da20.js";import{E as T}from"./embed.d17cc095.js";import{p as x,_ as A,ae as k,q as D,v as I,z as R,aq as G,an as X,U as _,X as F,w as W,at as H,J as u,ar as q,K as z}from"./vendor.c86e50e8.js";import{c as g,a as y,b as Y,L as j}from"./logo-path.248ebb5a.js";const a={ink:new x("#311eee"),plate:new x("#ffffff"),lines:120,angle:.2,lift:.1,plateXs:.86,plateLg:.42,rest:{x:-.5,y:0},turn:{x:[-1.2,-.1],y:[-.7,.7]},margin:.025},o=512;function K(){const e=a.margin*o,t=document.createElement("canvas");t.width=t.height=o;const n=t.getContext("2d");n.fillStyle="#000",n.fillRect(0,0,o,o),n.translate(e,e),n.scale((o-2*e)/g,(o-2*e)/g),n.translate(-y,-y),n.lineWidth=Y,n.strokeStyle="#fff",n.stroke(new Path2D(j));const s=document.createElement("canvas");s.width=s.height=o;const i=s.getContext("2d");return i.fillStyle="#000",i.fillRect(0,0,o,o),i.globalCompositeOperation="lighter",i.globalAlpha=.82,i.filter=`blur(${o*.009}px)`,i.drawImage(t,0,0),i.globalAlpha=.18,i.filter=`blur(${o*.03}px)`,i.drawImage(t,0,0),s}const h=new A(K());h.minFilter=k;h.generateMipmaps=!1;const c=document.getElementById("lines"),f=new D({canvas:c,antialias:!0});f.setClearColor(15921906,1);const P=new I,l=new R(30,1,.1,100),v={height:{value:h},lift:{value:a.lift},ink:{value:a.ink},plate:{value:a.plate},count:{value:a.lines},dir:{value:new u(-Math.sin(a.angle),Math.cos(a.angle))},dpr:{value:1},rippleAt:{value:new u(0,0)},rippleT:{value:99}},V=new G({uniforms:v,side:X,extensions:{derivatives:!0},vertexShader:`
    uniform sampler2D height;
    uniform float lift, rippleT;
    uniform vec2 rippleAt;
    varying vec2 vP;
    float ripple(vec2 p) {
      if (rippleT > 4.0) return 0.0;
      float r = distance(p, rippleAt);
      float front = rippleT * 0.55;
      float env = exp(-pow((r - front) / 0.2, 2.0)) * exp(-rippleT * 0.7);
      return sin((r - front) * 30.0) * env * 0.06;
    }
    void main() {
      vP = position.xy; // plate units, -0.5..0.5
      float h = texture2D(height, uv).r * lift + ripple(vP);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, h, 1.0);
    }`,fragmentShader:`
    uniform vec3 ink, plate;
    uniform float count, dpr;
    uniform vec2 dir;
    varying vec2 vP;
    void main() {
      // distance to the nearest line, measured in screen pixels, so every line is ~0.8 px wide
      // whatever the slope or the turn; steep flanks crowd the lines together, as in an engraving
      float s = dot(vP, dir) * count;
      float d = abs(fract(s + 0.5) - 0.5) / max(fwidth(s), 1e-4);
      float a = 1.0 - smoothstep(0.25 * dpr, 0.8 * dpr, d);
      gl_FragColor = vec4(mix(plate, ink, a), 1.0);
    }`}),m=new _(new F(1,1,400,400),V),w=new W;w.add(m);P.add(w);function E(){const e=window.innerWidth,t=window.innerHeight,n=Math.min(window.devicePixelRatio||1,2);f.setPixelRatio(n),f.setSize(e,t,!1),v.dpr.value=n,l.aspect=e/t;const s=Math.min(e<=768?a.plateXs:a.plateLg,.8*t/e),S=1/s/l.aspect;l.position.set(0,0,S/2/Math.tan(q.degToRad(l.fov/2))),l.updateProjectionMatrix()}window.addEventListener("resize",E);E();const d={x:a.rest.x,y:a.rest.y},p={x:a.rest.x,y:a.rest.y};let r=null,b=-99;const M=(e,[t,n])=>Math.max(t,Math.min(n,e)),L=new H;c.addEventListener("pointerdown",e=>{r={id:e.pointerId,x:e.clientX,y:e.clientY,ox:d.x,oy:d.y,t:performance.now()},c.setPointerCapture(e.pointerId)});c.addEventListener("pointermove",e=>{!r||e.pointerId!==r.id||(d.y=M(r.oy+(e.clientX-r.x)*.006,a.turn.y),d.x=M(r.ox+(e.clientY-r.y)*.006,a.turn.x))});const O=e=>{if(!r||e.pointerId!==r.id)return;const t=e.type==="pointerup"&&Math.hypot(e.clientX-r.x,e.clientY-r.y)<12&&performance.now()-r.t<350;if(r=null,!t)return;const n=new u(e.clientX/window.innerWidth*2-1,-(e.clientY/window.innerHeight)*2+1);L.setFromCamera(n,l);const s=L.intersectObject(m)[0],i=s?m.worldToLocal(s.point.clone()):new z;v.rippleAt.value.set(i.x,i.y),b=performance.now()};c.addEventListener("pointerup",O);c.addEventListener("pointercancel",O);T||window.addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});const B=performance.now();function C(e){const t=(e-B)/1e3;p.x+=(d.x-p.x)*.1,p.y+=(d.y-p.y)*.1,w.rotation.set(p.x+Math.sin(t*.3)*.03,p.y+Math.sin(t*.21+1)*.05,0),v.rippleT.value=(e-b)/1e3,f.render(P,l),requestAnimationFrame(C)}requestAnimationFrame(C);
