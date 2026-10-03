import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{q as P,v as X,z as C,ao as G,X as I,ap as D,aq as N,an as R,U as Y,w as A,ar as H,K as O,as as _}from"./vendor.008209b9.js";import{l as B}from"./logo-bars.36bf556b.js";import{b}from"./logo-path.248ebb5a.js";const M=["sin","plasma","fbm","warp","cells","ridge","tan"],U=new URLSearchParams(location.search).get("f");let y=Math.max(0,M.indexOf(U??"sin"));const j=document.getElementById("fn");function L(){j.replaceChildren(...M.map((e,a)=>{const o=document.createElement("button");return o.type="button",o.textContent=e,o.setAttribute("aria-pressed",String(a===y)),o.addEventListener("click",()=>{y=a;const l=new URLSearchParams(location.search);l.set("f",e),history.replaceState(null,"",`${location.pathname}?${l}`),L()}),o}))}L();const t={markXs:.5,markLg:.22,depth:2.6,rest:{x:-20,y:-32},reach:24,dragGain:.12,face:.56,side:[.36,.62],far:.06},s=document.getElementById("extrude"),m=new P({canvas:s,antialias:!0});m.setPixelRatio(Math.min(window.devicePixelRatio,2));m.setClearColor(0,1);const S=new X,r=new C(38,1,1,1e5),f=516*t.depth,W=B().flatMap(e=>{const a=Math.hypot(e.bx-e.ax,e.by-e.ay),o=g=>(g.rotateZ(-Math.atan2(e.by-e.ay,e.bx-e.ax)),g.translate((e.ax+e.bx)/2-300,300-(e.ay+e.by)/2,0),g),l=new G(a,b,f-1,1,1,64);l.translate(0,0,-(f-1)/2-1);const u=new I(a,b);return[o(l.toNonIndexed()),o(u.toNonIndexed())]}),K=D(W),h=new N({uniforms:{face:{value:t.face},sideLo:{value:t.side[0]},sideHi:{value:t.side[1]},far:{value:t.far},depth:{value:f},time:{value:0},fn:{value:0},pulse:{value:99}},side:R,vertexShader:`
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
    uniform float face, sideLo, sideHi, far, time, fn, pulse;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec2 hash2(vec2 p) {
      return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float a = 0.5, s = 0.0;
      for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; }
      return s / 0.97;
    }

    // How far back the body reaches at this point of the mark (0 = the face, 1 = the full length).
    float reachAt(vec2 p, float t) {
      if (fn < 0.5) {
        // sin: a diagonal wave, |sin|, swung by a slower cross wave
        float w = sin((p.x + p.y) * 3.1 + t * 1.4);
        float c = sin((p.x - p.y) * 4.7 - t * 0.9) * 0.5 + 0.5;
        return abs(w) * (0.5 + 0.5 * c);
      }
      if (fn < 1.5) {
        // plasma: four waves at different angles and speeds, summed and folded
        float v = sin(p.x * 5.0 + t) + sin(p.y * 6.3 - t * 1.3) + sin((p.x + p.y) * 4.1 + t * 0.7)
          + sin(length(p - vec2(0.3 * sin(t * 0.5), 0.3 * cos(t * 0.4))) * 9.0 - t * 2.0);
        return abs(sin(v * 1.3));
      }
      if (fn < 2.5) {
        // fbm: five octaves of value noise drifting along
        return smoothstep(0.25, 0.75, fbm(p * 3.0 + vec2(t * 0.35, -t * 0.2)));
      }
      if (fn < 3.5) {
        // warp: noise sampled through noise (domain warping), slow smoke
        vec2 q = vec2(fbm(p * 2.5 + t * 0.15), fbm(p * 2.5 + vec2(5.2, 1.3) - t * 0.12));
        vec2 r = vec2(fbm(p * 2.5 + 4.0 * q + vec2(1.7, 9.2) + t * 0.2), fbm(p * 2.5 + 4.0 * q + vec2(8.3, 2.8)));
        return smoothstep(0.2, 0.8, fbm(p * 2.5 + 4.0 * r));
      }
      if (fn < 4.5) {
        // cells: moving Voronoi seeds; the body is long at the seeds and short at the borders
        vec2 g = p * 5.0;
        vec2 i = floor(g), f = fract(g);
        float d1 = 8.0, d2 = 8.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 o = vec2(float(x), float(y));
          vec2 h = hash2(i + o);
          vec2 c = o + 0.5 + 0.45 * sin(t * 0.8 + 6.2831 * h) - f;
          float d = dot(c, c);
          if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
        }
        return smoothstep(0.0, 0.6, sqrt(d2) - sqrt(d1));
      }
      if (fn < 5.5) {
        // ridge: the creases of noise, 1 - |n|, stacked: thin bright veins like lightning
        float s = 0.0, a = 0.6;
        vec2 q = p * 2.2 + vec2(t * 0.25, t * 0.1);
        for (int i = 0; i < 4; i++) { s += a * (1.0 - abs(vnoise(q) * 2.0 - 1.0)); q = mat2(1.6, 1.2, -1.2, 1.6) * q; a *= 0.5; }
        return pow(clamp(s / 1.1, 0.0, 1.0), 3.0);
      }
      // tan: tangent of a travelling wave, clamped: long calm stretches broken by sudden jumps
      float v = tan((p.x * 1.7 + p.y * 2.3) * 2.0 + t * 0.9) * 0.25 + sin(p.y * 7.0 - t * 1.7) * 0.15;
      return clamp(abs(v), 0.0, 1.0);
    }

    void main() {
      // The tail: where the body ends is a field, not a plane (one of the functions above, picked
      // below the picture); the cut edge gets a per-pixel jitter re-rolled twelve times a second, so
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
    }`}),x=new Y(K,h);x.position.z=f*.3;const v=new A;v.add(x);S.add(v);const p=H.degToRad;let i={x:0,y:0},c={x:0,y:0},n=null;const k=e=>Math.max(-t.reach,Math.min(t.reach,e));s.addEventListener("pointerdown",e=>{n={id:e.pointerId,x:e.clientX,y:e.clientY,ox:i.x,oy:i.y},s.setPointerCapture(e.pointerId)});s.addEventListener("pointermove",e=>{!n||e.pointerId!==n.id||(i.y=k(n.oy+(e.clientX-n.x)*t.dragGain),i.x=k(n.ox+(e.clientY-n.y)*t.dragGain))});let q=-99,d=null;s.addEventListener("pointerdown",e=>d={x:e.clientX,y:e.clientY,t:performance.now()});const E=e=>{n&&e.pointerId===n.id&&(n=null),d&&e.type==="pointerup"&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<12&&performance.now()-d.t<350&&(q=performance.now()),d=null};s.addEventListener("pointerup",E);s.addEventListener("pointercancel",E);function z(){const e=window.innerWidth,a=window.innerHeight;m.setSize(e,a,!1),r.aspect=e/a;const o=e*(e<=768?t.markXs:t.markLg),u=516/o*e/r.aspect;r.position.set(0,0,u/2/Math.tan(p(r.fov/2))),r.near=1,r.far=r.position.z+f*3,r.updateProjectionMatrix()}window.addEventListener("resize",z);z();const w=new O(0,0,-f*.22).add(x.position);w.applyEuler(new _(p(t.rest.x),p(t.rest.y),0));const T=performance.now();function F(){const e=(performance.now()-T)/1e3;n||(i.x*=.96,i.y*=.96),c.x+=(i.x-c.x)*.12,c.y+=(i.y-c.y)*.12;const a={x:Math.sin(e*.35)*2,y:Math.sin(e*.27+1)*3};v.rotation.set(p(t.rest.x+c.x+a.x),p(t.rest.y+c.y+a.y),0),v.position.set(-w.x,-w.y,0),h.uniforms.time.value=e,h.uniforms.fn.value=y,h.uniforms.pulse.value=(performance.now()-q)/1e3,m.render(S,r),requestAnimationFrame(F)}F();
