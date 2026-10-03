import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{q as X,v as z,z as F,ao as E,X as G,ap as Y,aq as P,an as C,U as D,w as I,ar as S,K as N,as as R}from"./vendor.008209b9.js";import{l as _}from"./logo-bars.36bf556b.js";import{b as g}from"./logo-path.248ebb5a.js";const t={markXs:.5,markLg:.22,depth:2.6,rest:{x:-20,y:-32},reach:24,dragGain:.12,face:.56,side:[.36,.62],far:.06},s=document.getElementById("extrude"),f=new X({canvas:s,antialias:!0});f.setPixelRatio(Math.min(window.devicePixelRatio,2));f.setClearColor(0,1);const u=new z,o=new F(38,1,1,1e5),d=516*t.depth,H=_().flatMap(e=>{const i=Math.hypot(e.bx-e.ax,e.by-e.ay),l=m=>(m.rotateZ(-Math.atan2(e.by-e.ay,e.bx-e.ax)),m.translate((e.ax+e.bx)/2-300,300-(e.ay+e.by)/2,0),m),h=new E(i,g,d-1);h.translate(0,0,-(d-1)/2-1);const p=new G(i,g);return[l(h.toNonIndexed()),l(p.toNonIndexed())]}),O=Y(H),b=new P({uniforms:{face:{value:t.face},sideLo:{value:t.side[0]},sideHi:{value:t.side[1]},far:{value:t.far},depth:{value:d},time:{value:0}},side:C,vertexShader:`
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    varying vec2 vXY;
    uniform float depth;
    void main() {
      vXY = position.xy / 516.0; // the mark's width = 1
      vN = normalize(mat3(modelMatrix) * normal);
      vFace = step(0.99, normal.z);
      vDepth = clamp(-position.z / depth, 0.0, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,fragmentShader:`
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    varying vec2 vXY;
    uniform float face, sideLo, sideHi, far, time;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      // The tail: where the body ends is a field, not a plane. A diagonal wave runs across the mark
      // and the depth it reaches is |sin| of it, swinging with a slower cross wave; the cut edge
      // gets a per-pixel jitter re-rolled twelve times a second, so it flickers like the story did.
      float w = sin((vXY.x + vXY.y) * 3.1 + time * 1.4);
      float cross = sin((vXY.x - vXY.y) * 4.7 - time * 0.9) * 0.5 + 0.5;
      float reach = 0.02 + 0.8 * abs(w) * (0.5 + 0.5 * cross); // near a node of the wave it cuts into the face
      float shiver = (hash(floor(gl_FragCoord.xy / 2.0) + floor(time * 12.0)) - 0.5) * 0.05;
      if (vDepth > reach + shiver) discard;

      // inside of the cut: the hollow of the walls, dark
      if (!gl_FrontFacing) { gl_FragColor = vec4(vec3(far * 0.6), 1.0); return; }

      vec3 n = normalize(vN);
      // a soft light from the upper left, in front: the faces turned to it read lighter
      float l = dot(n, normalize(vec3(-0.5, 0.7, 0.6))) * 0.5 + 0.5;
      float g = mix(sideLo, sideHi, l);
      g = mix(g, face, vFace);
      // the body sinks into the dark towards its far end
      g = mix(g, far, pow(vDepth / 0.8, 0.9) * 0.85);
      gl_FragColor = vec4(vec3(g) * vec3(0.98, 0.97, 1.0), 1.0);
    }`}),y=new D(O,b);y.position.z=d*.3;const v=new I;v.add(y);u.add(v);const c=S.degToRad;let r={x:0,y:0},n={x:0,y:0},a=null;const w=e=>Math.max(-t.reach,Math.min(t.reach,e));s.addEventListener("pointerdown",e=>{a={id:e.pointerId,x:e.clientX,y:e.clientY,ox:r.x,oy:r.y},s.setPointerCapture(e.pointerId)});s.addEventListener("pointermove",e=>{!a||e.pointerId!==a.id||(r.y=w(a.oy+(e.clientX-a.x)*t.dragGain),r.x=w(a.ox+(e.clientY-a.y)*t.dragGain))});const M=e=>{a&&e.pointerId===a.id&&(a=null)};s.addEventListener("pointerup",M);s.addEventListener("pointercancel",M);function L(){const e=window.innerWidth,i=window.innerHeight;f.setSize(e,i,!1),o.aspect=e/i;const l=e*(e<=768?t.markXs:t.markLg),p=516/l*e/o.aspect;o.position.set(0,0,p/2/Math.tan(c(o.fov/2))),o.near=1,o.far=o.position.z+d*3,o.updateProjectionMatrix()}window.addEventListener("resize",L);L();const x=new N(0,0,-d*.22).add(y.position);x.applyEuler(new R(c(t.rest.x),c(t.rest.y),0));const B=performance.now();function k(){const e=(performance.now()-B)/1e3;a||(r.x*=.96,r.y*=.96),n.x+=(r.x-n.x)*.12,n.y+=(r.y-n.y)*.12;const i={x:Math.sin(e*.35)*2,y:Math.sin(e*.27+1)*3};v.rotation.set(c(t.rest.x+n.x+i.x),c(t.rest.y+n.y+i.y),0),v.position.set(-x.x,-x.y,0),b.uniforms.time.value=e,f.render(u,o),requestAnimationFrame(k)}k();
