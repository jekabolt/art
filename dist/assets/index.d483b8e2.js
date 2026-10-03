import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{q as z,v as E,z as G,ao as P,X as k,ap as I,aq as F,U as N,w as R,ar as S,K as C,as as D}from"./vendor.008209b9.js";import{l as H}from"./logo-bars.36bf556b.js";import{b as g}from"./logo-path.248ebb5a.js";const t={markXs:.5,markLg:.22,depth:2.6,rest:{x:-20,y:-32},reach:24,dragGain:.12,face:.56,side:[.36,.62],far:.06},s=document.getElementById("extrude"),m=new z({canvas:s,antialias:!0});m.setPixelRatio(Math.min(window.devicePixelRatio,2));m.setClearColor(0,1);const w=new E,n=new G(38,1,1,1e5),d=516*t.depth,O=H().flatMap(e=>{const o=Math.hypot(e.bx-e.ax,e.by-e.ay),l=x=>(x.rotateZ(-Math.atan2(e.by-e.ay,e.bx-e.ax)),x.translate((e.ax+e.bx)/2-300,300-(e.ay+e.by)/2,0),x),v=new P(o,g,d-1);v.translate(0,0,-(d-1)/2-1);const f=new k(o,g);return[l(v.toNonIndexed()),l(f.toNonIndexed())]}),X=I(O),B=new F({uniforms:{face:{value:t.face},sideLo:{value:t.side[0]},sideHi:{value:t.side[1]},far:{value:t.far},depth:{value:d}},vertexShader:`
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    uniform float depth;
    void main() {
      vN = normalize(mat3(modelMatrix) * normal);
      vFace = step(0.99, normal.z);
      vDepth = clamp(-position.z / depth, 0.0, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,fragmentShader:`
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    uniform float face, sideLo, sideHi, far;
    void main() {
      vec3 n = normalize(vN);
      // a soft light from the upper left, in front: the faces turned to it read lighter
      float l = dot(n, normalize(vec3(-0.5, 0.7, 0.6))) * 0.5 + 0.5;
      float g = mix(sideLo, sideHi, l);
      g = mix(g, face, vFace);
      // the body sinks into the dark towards its far end
      g = mix(g, far, pow(vDepth, 0.75));
      gl_FragColor = vec4(vec3(g) * vec3(0.98, 0.97, 1.0), 1.0);
    }`}),h=new N(X,B);h.position.z=d*.3;const p=new R;p.add(h);w.add(p);const c=S.degToRad;let r={x:0,y:0},i={x:0,y:0},a=null;const u=e=>Math.max(-t.reach,Math.min(t.reach,e));s.addEventListener("pointerdown",e=>{a={id:e.pointerId,x:e.clientX,y:e.clientY,ox:r.x,oy:r.y},s.setPointerCapture(e.pointerId)});s.addEventListener("pointermove",e=>{!a||e.pointerId!==a.id||(r.y=u(a.oy+(e.clientX-a.x)*t.dragGain),r.x=u(a.ox+(e.clientY-a.y)*t.dragGain))});const M=e=>{a&&e.pointerId===a.id&&(a=null)};s.addEventListener("pointerup",M);s.addEventListener("pointercancel",M);function b(){const e=window.innerWidth,o=window.innerHeight;m.setSize(e,o,!1),n.aspect=e/o;const l=e*(e<=768?t.markXs:t.markLg),f=516/l*e/n.aspect;n.position.set(0,0,f/2/Math.tan(c(n.fov/2))),n.near=1,n.far=n.position.z+d*3,n.updateProjectionMatrix()}window.addEventListener("resize",b);b();const y=new C(0,0,-d*.22).add(h.position);y.applyEuler(new D(c(t.rest.x),c(t.rest.y),0));const W=performance.now();function L(){const e=(performance.now()-W)/1e3;a||(r.x*=.96,r.y*=.96),i.x+=(r.x-i.x)*.12,i.y+=(r.y-i.y)*.12;const o={x:Math.sin(e*.35)*2,y:Math.sin(e*.27+1)*3};p.rotation.set(c(t.rest.x+i.x+o.x),c(t.rest.y+i.y+o.y),0),p.position.set(-y.x,-y.y,0),m.render(w,n),requestAnimationFrame(L)}L();
