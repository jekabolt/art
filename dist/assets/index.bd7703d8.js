import"./modulepreload-polyfill.b7f2da20.js";import{n as G,j as R,W as I,S as F,O as N,g as A,M as B,e as Y}from"./vendor.c6995a63.js";import{b as j}from"./logo-path.248ebb5a.js";import{l as K}from"./logo-bars.36bf556b.js";const T=4,W=6,_=Math.acosh(Math.cos(Math.PI/W)/Math.sin(Math.PI/T)),d=Math.tanh(_/2),X=(1+d*d)/(2*d),H=(1-d*d)/(2*d),V=Math.tanh(_),Q=.9,k=K().map(e=>{const t=e.ax-300,a=300-e.ay,o=e.bx-300,n=300-e.by,c=Math.hypot(o-t,n-a);return{c:new G((t+o)/2,(a+n)/2,(o-t)/c,(n-a)/c),h:new R(c/2,j/2)}}),m=document.getElementById("circle"),E=new I({canvas:m,antialias:!1}),P=new F,J=new N(-1,1,1,-1,0,1),f={resolution:{value:new R},radius:{value:400},motion:{value:new G(1,0,0,0)},checker:{value:0},bars:{value:k.map(e=>e.c)},halves:{value:k.map(e=>e.h)}},U=new A({uniforms:f,defines:{NB:k.length,EDGE_C:X.toFixed(6),EDGE_R:H.toFixed(6),TO_LOGO:(258/Q/V).toFixed(6)},vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform float radius;
    uniform vec4 motion;
    uniform float checker;
    uniform vec4 bars[NB];
    uniform vec2 halves[NB];

    const vec3 PAPER = vec3(0.953, 0.945, 0.937);
    const vec3 INK = vec3(0.04);
    const float GREY = 0.36; // the mark's share of ink over its square, for where it is too small to draw

    vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
    vec2 cdiv(vec2 a, vec2 b) { return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b); }
    vec2 conj(vec2 a) { return vec2(a.x, -a.y); }

    float logoSD(vec2 p) {
      float d = 1e9;
      for (int i = 0; i < NB; i++) {
        vec4 b = bars[i];
        vec2 r = p - b.xy;
        vec2 l = vec2(dot(r, b.zw), dot(r, vec2(-b.w, b.z)));
        vec2 q = abs(l) - halves[i];
        d = min(d, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
      }
      return d;
    }

    // one sample: the ink at disk point q (pix: one device pixel in disk units)
    float shade(vec2 q, float pix, out float scale) {
      float r2 = dot(q, q);
      // carry the pixel back by the plane's motion
      vec2 a = motion.xy;
      vec2 b = motion.zw;
      vec2 z = cdiv(cmul(a, q) + b, cmul(conj(b), q) + conj(a));

      // fold into the central square: reflect across any edge it lies beyond (inversion in that
      // edge's circle), until it lies beyond none
      float flips = 0.0;
      bool done = false;
      for (int i = 0; i < 80; i++) {
        bool moved = false;
        for (int k = 0; k < 4; k++) {
          float ang = float(k) * 1.5707963;
          vec2 c = vec2(cos(ang), sin(ang)) * EDGE_C;
          vec2 d = z - c;
          float dd = dot(d, d);
          if (dd < EDGE_R * EDGE_R) {
            z = c + d * (EDGE_R * EDGE_R / dd);
            flips += 1.0;
            moved = true;
          }
        }
        if (!moved) { done = true; break; }
      }
      float odd = mod(flips, 2.0);
      if (odd > 0.5) z.y = -z.y; // undo the mirror: the square is symmetric about this axis

      // to the Klein model (straight edges), then onto the mark
      float w2 = dot(z, z);
      vec2 k = 2.0 * z / (1.0 + w2);
      vec2 p = k * TO_LOGO;

      // the local scale: logo units per device pixel
      scale = (1.0 - w2) / max(1.0 - r2, 1e-6) * (2.0 / (1.0 + w2)) * TO_LOGO * pix;
      float ink = clamp(0.5 - logoSD(p) / scale, 0.0, 1.0);
      ink = mix(ink, GREY, smoothstep(16.0, 48.0, scale));
      if (!done) ink = GREY;
      if (checker > 0.5 && odd > 0.5) ink = 1.0 - ink;
      return ink;
    }

    void main() {
      vec2 q = (gl_FragCoord.xy - 0.5 * resolution) / radius; // the disk is the unit circle
      float r2 = dot(q, q);
      float pix = 1.0 / radius;
      float rim = clamp((1.0 - sqrt(r2)) / pix + 0.5, 0.0, 1.0); // coverage of the disk, antialiased
      if (rim <= 0.0) { gl_FragColor = vec4(PAPER, 1.0); return; }

      float scale;
      float ink = shade(q, pix, scale);
      if (scale > 6.0) {
        // out toward the rim, where marks shrink to a few pixels: four more samples inside the pixel
        float s2;
        float acc = ink;
        acc += shade(q + vec2(-0.3, -0.3) * pix, pix, s2);
        acc += shade(q + vec2(0.3, -0.3) * pix, pix, s2);
        acc += shade(q + vec2(-0.3, 0.3) * pix, pix, s2);
        acc += shade(q + vec2(0.3, 0.3) * pix, pix, s2);
        ink = acc / 5.0;
      }

      vec3 col = mix(PAPER, INK, ink);
      gl_FragColor = vec4(mix(PAPER, col, rim), 1.0);
    }
  `}),O=new B(new Y(2,2),U);O.frustumCulled=!1;P.add(O);let l=1,h=1,v=1,x=1;function D(){l=window.innerWidth,h=window.innerHeight,v=Math.min(window.devicePixelRatio||1,2),E.setPixelRatio(v),E.setSize(l,h,!1),f.resolution.value.set(l*v,h*v),x=Math.min(l,h)*(l<=768?.47:.45),f.radius.value=x*v}const p=(e,t)=>[e[0]*t[0]-e[1]*t[1],e[0]*t[1]+e[1]*t[0]],q=(e,t)=>[e[0]+t[0],e[1]+t[1]],M=e=>[e[0],-e[1]];function y(e,t){const a=q(p(e.a,t.a),p(e.b,M(t.b))),o=q(p(e.a,t.b),p(e.b,M(t.a))),n=Math.sqrt(Math.max(1e-12,a[0]**2+a[1]**2-o[0]**2-o[1]**2));return{a:[a[0]/n,a[1]/n],b:[o[0]/n,o[1]/n]}}function g(e){const t=Math.sqrt(Math.max(1e-12,1-e[0]**2-e[1]**2));return{a:[1/t,0],b:[e[0]/t,e[1]/t]}}let r={a:[1,0],b:[0,0]};const L=e=>{const t=(e.clientX-l/2)/x,a=-(e.clientY-h/2)/x,o=Math.hypot(t,a),n=o>.97?.97/o:1;return[t*n,a*n]};let u=null,s=null,i=[0,0],b=-1e9;m.addEventListener("pointerdown",e=>{u={x:e.clientX,y:e.clientY},s={z:L(e),t:performance.now()},i=[0,0],b=performance.now(),m.setPointerCapture(e.pointerId)});m.addEventListener("pointermove",e=>{if(!s)return;const t=performance.now(),a=L(e),o=s.z;r=y(g(a),y(g([-o[0],-o[1]]),r));const n=Math.max(.008,(t-s.t)/1e3),c=1/Math.max(.05,1-(o[0]**2+o[1]**2));i=[i[0]*.5+(a[0]-o[0])*c*.5/n,i[1]*.5+(a[1]-o[1])*c*.5/n],s={z:a,t},b=t});function S(e){u&&Math.hypot(e.clientX-u.x,e.clientY-u.y)<8&&(f.checker.value=1-f.checker.value,i=[0,0]),s&&performance.now()-s.t>80&&(i=[0,0]),u=null,s=null,b=performance.now()}m.addEventListener("pointerup",S);m.addEventListener("pointercancel",S);let z=performance.now();function C(e){const t=Math.min(.05,(e-z)/1e3);if(z=e,!s){const a=e-b>2500,o=e/1e3,n=a?[Math.cos(o*.05)*.07,Math.sin(o*.05)*.07]:[0,0],c=Math.exp(-t/1.2);i=[i[0]*c,i[1]*c];const w=[(i[0]+n[0])*t,(i[1]+n[1])*t];(w[0]||w[1])&&(r=y(g(w),r))}f.motion.value.set(r.a[0],-r.a[1],-r.b[0],-r.b[1]),E.render(P,J),requestAnimationFrame(C)}window.addEventListener("resize",D);D();requestAnimationFrame(C);
