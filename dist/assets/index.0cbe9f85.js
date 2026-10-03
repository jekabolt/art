import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{q as S,v as X,z as F,ao as C,X as G,ap as A,aq as D,an as P,U as Y,w as q,ar as H,K as I,as as N}from"./vendor.5cf285bc.js";import{l as R}from"./logo-bars.36bf556b.js";import{b as w}from"./logo-path.248ebb5a.js";function _(e=12){try{if(typeof navigator.vibrate=="function"){navigator.vibrate(e);return}const t=document.createElement("label");t.ariaHidden="true",t.style.display="none";const i=document.createElement("input");i.type="checkbox",i.setAttribute("switch",""),t.appendChild(i),document.head.appendChild(t),t.click(),t.remove()}catch{}}const a={markXs:.5,markLg:.22,depth:2.6,rest:{x:-20,y:-32},reach:24,dragGain:.12,face:.56,side:[.36,.62],far:.06},s=document.getElementById("extrude"),v=new S({canvas:s,antialias:!0});v.setPixelRatio(Math.min(window.devicePixelRatio,2));v.setClearColor(0,1);const k=new X,o=new F(38,1,1,1e5),d=516*a.depth,O=R().flatMap(e=>{const t=Math.hypot(e.bx-e.ax,e.by-e.ay),i=u=>(u.rotateZ(-Math.atan2(e.by-e.ay,e.bx-e.ax)),u.translate((e.ax+e.bx)/2-300,300-(e.ay+e.by)/2,0),u),f=new C(t,w,d-1,1,1,64);f.translate(0,0,-(d-1)/2-1);const m=new G(t,w);return[i(f.toNonIndexed()),i(m.toNonIndexed())]}),B=A(O),y=new D({uniforms:{face:{value:a.face},sideLo:{value:a.side[0]},sideHi:{value:a.side[1]},far:{value:a.far},depth:{value:d},time:{value:0},pulse:{value:99}},side:P,vertexShader:`
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    varying vec2 vXY;
    varying float vSwell;
    uniform float depth, pulse;
    // where the swell is along the body (0 = face, 1 = the end) and how strong, after a tap
    float swellAt(float d) {
      float at = pulse * 0.9 - 0.08;
      float k = exp(-pow((d - at) / 0.07, 2.0));
      return k * exp(-pulse * 0.9) * step(pulse, 3.0);
    }
    void main() {
      vXY = position.xy / 516.0; // the mark's width = 1
      vN = normalize(mat3(modelMatrix) * normal);
      vFace = step(0.99, normal.z);
      vDepth = clamp(-position.z / depth, 0.0, 1.0);
      vSwell = swellAt(vDepth);
      vec3 p = position;
      p.xy *= 1.0 + 0.16 * vSwell; // the section swells about the mark's centre
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,fragmentShader:`
    varying vec3 vN;
    varying float vFace;
    varying float vDepth;
    varying vec2 vXY;
    varying float vSwell;
    uniform float face, sideLo, sideHi, far, time, pulse;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }

    // How far back the body reaches at this point of the mark (0 = the face, 1 = the full length):
    // the creases of drifting noise, 1 - |n| over four octaves, cubed \u2014 thin bright veins with
    // torn, branching edges, like lightning.
    float reachAt(vec2 p, float t) {
      float s = 0.0, a = 0.6;
      vec2 q = p * 2.2 + vec2(t * 0.25, t * 0.1);
      for (int i = 0; i < 4; i++) { s += a * (1.0 - abs(vnoise(q) * 2.0 - 1.0)); q = mat2(1.6, 1.2, -1.2, 1.6) * q; a *= 0.5; }
      return pow(clamp(s / 1.1, 0.0, 1.0), 3.0);
    }

    void main() {
      // The tail: where the body ends is a field, not a plane (reachAt above); the cut edge gets a per-pixel jitter re-rolled twelve times a second, so
      // it flickers like the story did. Near zero the cut reaches into the face.
      float reach = 0.02 + 0.8 * reachAt(vXY, time);
      // behind the running swell the material is pushed out whole, then the cut eats back into it
      float pushed = clamp(pulse * 0.9, 0.0, 1.0) * (1.0 - smoothstep(1.2, 2.6, pulse));
      reach = max(reach, pushed);
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
      g = min(1.0, g + vSwell * 0.45); // the swell catches the light
      gl_FragColor = vec4(vec3(g) * vec3(0.98, 0.97, 1.0), 1.0);
    }`}),g=new Y(B,y);g.position.z=d*.3;const p=new q;p.add(g);k.add(p);const h=H.degToRad;let r={x:0,y:0},l={x:0,y:0},n=null;const b=e=>Math.max(-a.reach,Math.min(a.reach,e));s.addEventListener("pointerdown",e=>{n={id:e.pointerId,x:e.clientX,y:e.clientY,ox:r.x,oy:r.y},s.setPointerCapture(e.pointerId)});s.addEventListener("pointermove",e=>{!n||e.pointerId!==n.id||(r.y=b(n.oy+(e.clientX-n.x)*a.dragGain),r.x=b(n.ox+(e.clientY-n.y)*a.dragGain))});let M=-99,c=null;s.addEventListener("pointerdown",e=>c={x:e.clientX,y:e.clientY,t:performance.now()});const L=e=>{n&&e.pointerId===n.id&&(n=null),c&&e.type==="pointerup"&&Math.hypot(e.clientX-c.x,e.clientY-c.y)<12&&performance.now()-c.t<350&&(M=performance.now(),_([18,60,28])),c=null};s.addEventListener("pointerup",L);s.addEventListener("pointercancel",L);function z(){const e=window.innerWidth,t=window.innerHeight;v.setSize(e,t,!1),o.aspect=e/t;const i=e*(e<=768?a.markXs:a.markLg),m=516/i*e/o.aspect;o.position.set(0,0,m/2/Math.tan(h(o.fov/2))),o.near=1,o.far=o.position.z+d*3,o.updateProjectionMatrix()}window.addEventListener("resize",z);z();const x=new I(0,0,-d*.22).add(g.position);x.applyEuler(new N(h(a.rest.x),h(a.rest.y),0));const W=performance.now();function E(){const e=(performance.now()-W)/1e3;n||(r.x*=.96,r.y*=.96),l.x+=(r.x-l.x)*.12,l.y+=(r.y-l.y)*.12;const t={x:Math.sin(e*.35)*2,y:Math.sin(e*.27+1)*3};p.rotation.set(h(a.rest.x+l.x+t.x),h(a.rest.y+l.y+t.y),0),p.position.set(-x.x,-x.y,0),y.uniforms.time.value=e,y.uniforms.pulse.value=(performance.now()-M)/1e3,v.render(k,o),requestAnimationFrame(E)}E();
