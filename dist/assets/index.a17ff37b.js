import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{q as X,v as E,z as F,ao as G,X as D,ap as P,aq as Y,an as q,U as A,w as C,ar as I,K as N,as as H}from"./vendor.5cf285bc.js";import{l as R}from"./logo-bars.36bf556b.js";import{b as g}from"./logo-path.248ebb5a.js";const t={markXs:.5,markLg:.22,depth:2.6,rest:{x:-20,y:-32},reach:24,dragGain:.12,face:.56,side:[.36,.62],far:.06},i=document.getElementById("extrude"),v=new X({canvas:i,antialias:!0});v.setPixelRatio(Math.min(window.devicePixelRatio,2));v.setClearColor(0,1);const k=new E,o=new F(38,1,1,1e5),c=516*t.depth,_=R().flatMap(e=>{const n=Math.hypot(e.bx-e.ax,e.by-e.ay),h=u=>(u.rotateZ(-Math.atan2(e.by-e.ay,e.bx-e.ax)),u.translate((e.ax+e.bx)/2-300,300-(e.ay+e.by)/2,0),u),f=new G(n,g,c-1,1,1,64);f.translate(0,0,-(c-1)/2-1);const m=new D(n,g);return[h(f.toNonIndexed()),h(m.toNonIndexed())]}),O=P(_),x=new Y({uniforms:{face:{value:t.face},sideLo:{value:t.side[0]},sideHi:{value:t.side[1]},far:{value:t.far},depth:{value:c},time:{value:0},pulse:{value:99}},side:q,vertexShader:`
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
    }`}),y=new A(O,x);y.position.z=c*.3;const p=new C;p.add(y);k.add(p);const d=I.degToRad;let r={x:0,y:0},s={x:0,y:0},a=null;const b=e=>Math.max(-t.reach,Math.min(t.reach,e));i.addEventListener("pointerdown",e=>{a={id:e.pointerId,x:e.clientX,y:e.clientY,ox:r.x,oy:r.y},i.setPointerCapture(e.pointerId)});i.addEventListener("pointermove",e=>{!a||e.pointerId!==a.id||(r.y=b(a.oy+(e.clientX-a.x)*t.dragGain),r.x=b(a.ox+(e.clientY-a.y)*t.dragGain))});let M=-99,l=null;i.addEventListener("pointerdown",e=>l={x:e.clientX,y:e.clientY,t:performance.now()});const L=e=>{a&&e.pointerId===a.id&&(a=null),l&&e.type==="pointerup"&&Math.hypot(e.clientX-l.x,e.clientY-l.y)<12&&performance.now()-l.t<350&&(M=performance.now()),l=null};i.addEventListener("pointerup",L);i.addEventListener("pointercancel",L);function z(){const e=window.innerWidth,n=window.innerHeight;v.setSize(e,n,!1),o.aspect=e/n;const h=e*(e<=768?t.markXs:t.markLg),m=516/h*e/o.aspect;o.position.set(0,0,m/2/Math.tan(d(o.fov/2))),o.near=1,o.far=o.position.z+c*3,o.updateProjectionMatrix()}window.addEventListener("resize",z);z();const w=new N(0,0,-c*.22).add(y.position);w.applyEuler(new H(d(t.rest.x),d(t.rest.y),0));const B=performance.now();function S(){const e=(performance.now()-B)/1e3;a||(r.x*=.96,r.y*=.96),s.x+=(r.x-s.x)*.12,s.y+=(r.y-s.y)*.12;const n={x:Math.sin(e*.35)*2,y:Math.sin(e*.27+1)*3};p.rotation.set(d(t.rest.x+s.x+n.x),d(t.rest.y+s.y+n.y),0),p.position.set(-w.x,-w.y,0),x.uniforms.time.value=e,x.uniforms.pulse.value=(performance.now()-M)/1e3,v.render(k,o),requestAnimationFrame(S)}S();
