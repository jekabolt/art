import"./modulepreload-polyfill.b7f2da20.js";import"./embed.d17cc095.js";import{W as G,O as j,e as q,H as z,k as W,L as p,l as x,g,j as l,S as w,M as y,i as H,m as B}from"./vendor.7748f494.js";import{a as F,b as I,L as N,c as V}from"./logo-path.248ebb5a.js";const m=.2;function M(t){const n=document.createElement("canvas");n.width=n.height=t;const a=n.getContext("2d"),s=t*(1-2*m)/V;a.translate(t*m,t*m),a.scale(s,s),a.translate(-F,-F),a.lineWidth=I,a.strokeStyle="#fff",a.stroke(new Path2D(N));const r=new H(n);return r.minFilter=B,r.magFilter=p,r}const o=document.getElementById("melt"),i=new G({canvas:o,antialias:!1,alpha:!1});i.setClearColor(0,1);i.autoClear=!1;const d=new j(-1,1,1,-1,0,1),b=new q(2,2),k=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,K=.982,E=.25,S={type:z,format:W,minFilter:p,magFilter:p,depthBuffer:!1};let v=new x(4,4,S),f=new x(4,4,S);const h=new x(4,4,S),c=new g({uniforms:{prev:{value:null},texel:{value:new l},aspect:{value:1},from:{value:new l(-9,-9)},to:{value:new l(-9,-9)},vel:{value:new l},radius:{value:.07},fade:{value:.972}},vertexShader:k,fragmentShader:`
    uniform sampler2D prev;
    uniform vec2 texel;
    uniform float aspect;
    uniform vec2 from;
    uniform vec2 to;
    uniform vec2 vel;
    uniform float radius;
    uniform float fade;
    varying vec2 vUv;

    // distance from p to the segment a..b, in screen-height units
    float segDist(vec2 p, vec2 a, vec2 b) {
      vec2 s = vec2(aspect, 1.0);
      p *= s; a *= s; b *= s;
      vec2 ab = b - a;
      float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
      return length(p - a - ab * h);
    }

    void main() {
      // the field carries itself along (a stroke keeps flowing like syrup), spreads into the
      // neighbours (the smear widens and softens as it goes), then fades
      vec2 back = vUv - texture2D(prev, vUv).xy * texel * 5.0;
      vec2 v = texture2D(prev, back).xy * 0.4
        + (texture2D(prev, back + vec2(texel.x, 0.0)).xy
         + texture2D(prev, back - vec2(texel.x, 0.0)).xy
         + texture2D(prev, back + vec2(0.0, texel.y)).xy
         + texture2D(prev, back - vec2(0.0, texel.y)).xy) * 0.15;
      v *= fade;
      float d = segDist(vUv, from, to);
      v += vel * exp(-(d * d) / (radius * radius));
      float m = length(v);
      if (m > 1.0) v /= m;
      if (m < 0.004) v = vec2(0.0); // the last trace snaps back instead of lingering
      gl_FragColor = vec4(v, 0.0, 1.0);
    }
  `}),U=new w;U.add(new y(b,c));const D=new g({uniforms:{src:{value:null},texel:{value:new l}},vertexShader:k,fragmentShader:`
    uniform sampler2D src;
    uniform vec2 texel;
    varying vec2 vUv;
    void main() {
      vec2 v = vec2(0.0);
      float wsum = 0.0;
      for (int j = -2; j <= 2; j++) {
        for (int i = -2; i <= 2; i++) {
          float w = exp(-float(i * i + j * j) / 4.0);
          v += texture2D(src, vUv + vec2(float(i), float(j)) * texel * 2.0).xy * w;
          wsum += w;
        }
      }
      gl_FragColor = vec4(v / wsum, 0.0, 1.0);
    }
  `}),O=new w;O.add(new y(b,D));const u=new g({uniforms:{field:{value:null},logo:{value:M(2048)},goo:{value:M(256)},aspect:{value:1},side:{value:.5},time:{value:0}},vertexShader:k,fragmentShader:`
    uniform sampler2D field;
    uniform sampler2D logo;
    uniform sampler2D goo;
    uniform float aspect;
    uniform float side;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 17853.77); }

    // oil-film rainbow: a cosine palette running through time and across the logo
    vec3 film(float t) { return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67))); }

    // sample first, mask after: a texture read inside a branch has no reliable derivatives, and on
    // real GPUs the square's edge then picks the smallest mip (the logo's average) \u2014 a dashed frame
    float ink(sampler2D tex, vec2 uv) {
      float a = texture2D(tex, uv).a;
      vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
      return a * inside.x * inside.y;
    }

    // the ink turns to goo where it is disturbed: the crisp mark gives way to a blurred copy cut at
    // half, which rounds every corner and fuses nearby strokes like melting wax
    float melt(vec2 uv, float m) {
      float sharp = ink(logo, uv);
      float blob = smoothstep(0.32, 0.62, ink(goo, uv));
      return mix(sharp, blob, smoothstep(0.0, 0.45, m));
    }

    void main() {
      vec2 v = texture2D(field, vUv).xy;
      float m = clamp(length(v), 0.0, 1.0);

      // screen \u2192 logo square
      vec2 luv = (vUv - 0.5) * vec2(aspect, 1.0) / side + 0.5;

      // smear against the motion, drip down, grain where it is disturbed, and a slow breathing so
      // the logo is never quite still
      vec2 off = -v * 0.17;
      off.y += m * m * 0.06;
      off += (hash(luv * 512.0 + fract(time)) - 0.5) * 0.025 * m;
      off += 0.0025 * vec2(sin(luv.y * 7.0 + time * 0.7), cos(luv.x * 6.0 + time * 0.5));
      vec2 p = luv + off;

      // channel split, strongest where the field is
      float split = sin((luv.x + luv.y) * 12.0) * 0.022 * m;
      vec3 col = vec3(
        melt(p + vec2(split * sin(time * 2.0), 0.0), m),
        melt(p, m),
        melt(p - vec2(split * sin(time + luv.x), 0.0), m)
      );

      // the rainbow, only in the smear and only on the ink itself (a halo around it outlines the mark)
      vec3 rainbow = film(time * 0.4 + luv.x * luv.y * 1.5 + m * 0.5);
      col = mix(col, col * rainbow, clamp(m * 1.4, 0.0, 0.85));

      gl_FragColor = vec4(min(col, 1.0), 1.0);
    }
  `}),P=new w;P.add(new y(b,u));function T(){const t=window.innerWidth,n=window.innerHeight,a=Math.min(window.devicePixelRatio||1,2);i.setPixelRatio(a),i.setSize(t,n,!1);const s=Math.max(8,Math.round(t*a*E)),r=Math.max(8,Math.round(n*a*E));v.setSize(s,r),f.setSize(s,r),c.uniforms.texel.value.set(1/s,1/r),h.setSize(s,r),D.uniforms.texel.value.set(1/s,1/r),c.uniforms.aspect.value=t/n,u.uniforms.aspect.value=t/n;const L=Math.min(t<=768?.6*t:.3*t,.6*n);u.uniforms.side.value=L/n/(1-2*m),c.uniforms.radius.value=(t<=768?.12:.09)*(L/n)*2}const e={x:-9,y:-9,px:-9,py:-9,active:!1},_=t=>[t.clientX/window.innerWidth,1-t.clientY/window.innerHeight];o.addEventListener("pointerdown",t=>{const[n,a]=_(t);e.x=e.px=n,e.y=e.py=a,e.active=!0});o.addEventListener("pointermove",t=>{const[n,a]=_(t);e.active||(e.px=n,e.py=a,e.active=!0),e.x=n,e.y=a});const A=t=>{t.pointerType!=="mouse"&&(e.active=!1)};o.addEventListener("pointerup",A);o.addEventListener("pointercancel",A);o.addEventListener("pointerleave",()=>e.active=!1);let R=performance.now();function C(t){const n=Math.min(.05,(t-R)/1e3);R=t;const a=c.uniforms;if(a.fade.value=Math.pow(K,n*60),e.active&&(e.x!==e.px||e.y!==e.py)){const s=a.aspect.value,r=60*n>0?1/(60*n):1;a.vel.value.set((e.x-e.px)*s*r*9,(e.y-e.py)*r*9),a.from.value.set(e.px,e.py),a.to.value.set(e.x,e.y)}else a.vel.value.set(0,0),a.from.value.set(-9,-9),a.to.value.set(-9,-9);e.px=e.x,e.py=e.y,a.prev.value=v.texture,i.setRenderTarget(f),i.render(U,d),i.setRenderTarget(null),[v,f]=[f,v],D.uniforms.src.value=v.texture,i.setRenderTarget(h),i.render(O,d),i.setRenderTarget(null),u.uniforms.field.value=h.texture,u.uniforms.time.value=t/1e3,i.clear(),i.render(P,d),requestAnimationFrame(C)}window.addEventListener("resize",T);T();requestAnimationFrame(C);
