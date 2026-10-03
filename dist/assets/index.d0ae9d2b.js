import"./modulepreload-polyfill.b7f2da20.js";import{E as S}from"./embed.d17cc095.js";import{p as m,_ as A,ae as D,q as I,v as G,z as X,aq as _,an as F,U as W,X as q,w as H,at as z,J as w,ar as Y,K as j}from"./vendor.e03c1737.js";import{c as M,a as L,b as K,L as V}from"./logo-path.248ebb5a.js";const n={ink:new m("#311eee"),wave:new m("#ff0000"),plate:new m("#ffffff"),lines:120,tapLines:90,angle:.2,lift:.1,plateXs:.72,plateLg:.42,rest:{x:-.5,y:0},turn:{x:[-1.2,-.1],y:[-.7,.7]},margin:.025},s=512;function B(){const e=n.margin*s,a=document.createElement("canvas");a.width=a.height=s;const t=a.getContext("2d");t.fillStyle="#000",t.fillRect(0,0,s,s),t.translate(e,e),t.scale((s-2*e)/M,(s-2*e)/M),t.translate(-L,-L),t.lineWidth=K,t.strokeStyle="#fff",t.stroke(new Path2D(V));const o=document.createElement("canvas");o.width=o.height=s;const i=o.getContext("2d");return i.fillStyle="#000",i.fillRect(0,0,s,s),i.globalCompositeOperation="lighter",i.globalAlpha=.82,i.filter=`blur(${s*.009}px)`,i.drawImage(a,0,0),i.globalAlpha=.18,i.filter=`blur(${s*.03}px)`,i.drawImage(a,0,0),o}const g=new A(B());g.minFilter=D;g.generateMipmaps=!1;const d=document.getElementById("lines"),v=new I({canvas:d,antialias:!0});v.setClearColor(15921906,1);const E=new G,l=new X(30,1,.1,100),c={height:{value:g},lift:{value:n.lift},ink:{value:n.ink},wave:{value:n.wave},plate:{value:n.plate},count:{value:n.lines},dir:{value:new w(-Math.sin(n.angle),Math.cos(n.angle))},dpr:{value:1},rippleAt:{value:new w(0,0)},rippleT:{value:99}},N=new _({uniforms:c,side:F,extensions:{derivatives:!0},vertexShader:`
    uniform sampler2D height;
    uniform float lift, rippleT;
    uniform vec2 rippleAt;
    varying vec2 vP;
    varying float vRed;
    float env(vec2 p) {
      if (rippleT > 4.0) return 0.0;
      float r = distance(p, rippleAt);
      return exp(-pow((r - rippleT * 0.55) / 0.2, 2.0)) * exp(-rippleT * 0.7);
    }
    void main() {
      vP = position.xy; // plate units, -0.5..0.5
      float e = env(vP);
      float r = distance(vP, rippleAt) - rippleT * 0.55;
      vRed = e;
      float h = texture2D(height, uv).r * lift + sin(r * 30.0) * e * 0.06;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy, h, 1.0);
    }`,fragmentShader:`
    uniform vec3 ink, plate, wave;
    uniform float count, dpr;
    uniform vec2 dir;
    varying vec2 vP;
    varying float vRed;
    void main() {
      // Lines a constant ~0.8 px wide whatever the slope or the turn (measured through fwidth), but
      // never more than a quarter of the gap: where they crowd \u2014 steep flanks, more lines after a
      // tap \u2014 they thin out instead of closing up, so the plate keeps its white.
      float s = dot(vP, dir) * count;
      float fw = max(fwidth(s), 1e-4);
      float d = abs(fract(s + 0.5) - 0.5);
      float hw = min(0.4 * dpr * fw, 0.25);
      float a = 1.0 - smoothstep(hw - 0.6 * fw, hw + 0.6 * fw, d);
      a *= clamp(hw / fw * 1.5, 0.35, 1.0); // sub-pixel lines fade rather than flicker
      // the ripple's ring turns the lines red as it passes
      vec3 col = mix(ink, wave, smoothstep(0.25, 0.7, vRed));
      gl_FragColor = vec4(mix(plate, col, a), 1.0);
    }`}),x=new W(new q(1,1,400,400),N),y=new H;y.add(x);E.add(y);function T(){const e=window.innerWidth,a=window.innerHeight,t=Math.min(window.devicePixelRatio||1,2);v.setPixelRatio(t),v.setSize(e,a,!1),c.dpr.value=t,l.aspect=e/a;const o=Math.min(e<=768?n.plateXs:n.plateLg,.8*a/e),h=1/o/l.aspect;l.position.set(0,0,h/2/Math.tan(Y.degToRad(l.fov/2))),l.updateProjectionMatrix()}window.addEventListener("resize",T);T();const f={x:n.rest.x,y:n.rest.y},p={x:n.rest.x,y:n.rest.y};let r=null,O=-99;const P=(e,[a,t])=>Math.max(a,Math.min(t,e)),b=new z;d.addEventListener("pointerdown",e=>{r={id:e.pointerId,x:e.clientX,y:e.clientY,ox:f.x,oy:f.y,t:performance.now()},d.setPointerCapture(e.pointerId)});d.addEventListener("pointermove",e=>{!r||e.pointerId!==r.id||(f.y=P(r.oy+(e.clientX-r.x)*.006,n.turn.y),f.x=P(r.ox+(e.clientY-r.y)*.006,n.turn.x))});const k=e=>{if(!r||e.pointerId!==r.id)return;const a=e.type==="pointerup"&&Math.hypot(e.clientX-r.x,e.clientY-r.y)<12&&performance.now()-r.t<350;if(r=null,!a)return;const t=new w(e.clientX/window.innerWidth*2-1,-(e.clientY/window.innerHeight)*2+1);b.setFromCamera(t,l);const o=b.intersectObject(x)[0],i=o?x.worldToLocal(o.point.clone()):new j;c.rippleAt.value.set(i.x,i.y),O=performance.now()};d.addEventListener("pointerup",k);d.addEventListener("pointercancel",k);S||window.addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});const U=performance.now();function C(e){const a=(e-U)/1e3;p.x+=(f.x-p.x)*.1,p.y+=(f.y-p.y)*.1,y.rotation.set(p.x+Math.sin(a*.3)*.03,p.y+Math.sin(a*.21+1)*.05,0),c.rippleT.value=(e-O)/1e3;const t=c.rippleT.value,o=(i,h,R)=>{const u=Math.min(1,Math.max(0,(R-i)/(h-i)));return u*u*(3-2*u)};c.count.value=n.lines+n.tapLines*o(0,.25,t)*(1-o(.8,3,t)),v.render(E,l),requestAnimationFrame(C)}requestAnimationFrame(C);
