import"./modulepreload-polyfill.b7f2da20.js";import{W as R,O as G,e as P,H as _,k as A,L as m,l as y,g as b,j as u,S as L,M as D,i as W}from"./vendor.297632cb.js";import{a as p,b as q,L as z,c as H}from"./logo-path.248ebb5a.js";function x(t){const n=document.createElement("canvas");n.width=n.height=t;const a=n.getContext("2d"),r=t/H;a.scale(r,r),a.translate(-p,-p),a.lineWidth=q,a.strokeStyle="#fff",a.stroke(new Path2D(z));const i=new W(n);return i.minFilter=i.magFilter=m,i.generateMipmaps=!1,i}const s=document.getElementById("melt"),o=new R({canvas:s,antialias:!1,alpha:!1});o.setClearColor(0,1);o.autoClear=!1;const h=new G(-1,1,1,-1,0,1),S=new P(2,2),M=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,g=.25,U={type:_,format:A,minFilter:m,magFilter:m,depthBuffer:!1};let l=new y(4,4,U),f=new y(4,4,U);const v=new b({uniforms:{prev:{value:null},texel:{value:new u},aspect:{value:1},from:{value:new u(-9,-9)},to:{value:new u(-9,-9)},vel:{value:new u},radius:{value:.07},fade:{value:.972}},vertexShader:M,fragmentShader:`
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
      // spread a little into the neighbours (the smear widens as it fades), then fade
      vec2 v = texture2D(prev, vUv).xy * 0.6
        + (texture2D(prev, vUv + vec2(texel.x, 0.0)).xy
         + texture2D(prev, vUv - vec2(texel.x, 0.0)).xy
         + texture2D(prev, vUv + vec2(0.0, texel.y)).xy
         + texture2D(prev, vUv - vec2(0.0, texel.y)).xy) * 0.1;
      v *= fade;
      float d = segDist(vUv, from, to);
      v += vel * exp(-(d * d) / (radius * radius));
      float m = length(v);
      if (m > 1.0) v /= m;
      if (m < 0.004) v = vec2(0.0); // the last trace snaps back instead of lingering
      gl_FragColor = vec4(v, 0.0, 1.0);
    }
  `}),k=new L;k.add(new D(S,v));const c=new b({uniforms:{field:{value:null},logo:{value:x(2048)},soft:{value:x(96)},aspect:{value:1},side:{value:.5},time:{value:0}},vertexShader:M,fragmentShader:`
    uniform sampler2D field;
    uniform sampler2D logo;
    uniform sampler2D soft;
    uniform float aspect;
    uniform float side;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 17853.77); }

    // oil-film rainbow: a cosine palette running through time and across the logo
    vec3 film(float t) { return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67))); }

    float ink(sampler2D tex, vec2 uv) {
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
      return texture2D(tex, uv).a;
    }

    void main() {
      vec2 v = texture2D(field, vUv).xy;
      float m = clamp(length(v), 0.0, 1.0);

      // screen \u2192 logo square
      vec2 luv = (vUv - 0.5) * vec2(aspect, 1.0) / side + 0.5;

      // smear against the motion, drip down, grain where it is disturbed, and a slow breathing
      // so the logo is never quite still
      vec2 off = -v * 0.22;
      off.y += m * m * 0.07;
      off += (hash(luv * 512.0 + fract(time)) - 0.5) * 0.025 * m;
      off += 0.0025 * vec2(sin(luv.y * 7.0 + time * 0.7), cos(luv.x * 6.0 + time * 0.5));
      vec2 p = luv + off;

      // channel split, strongest where the field is
      float split = sin((luv.x + luv.y) * 18.0) * 0.035 * m;
      vec3 col = vec3(
        ink(logo, p + vec2(split * sin(time * 2.0), 0.0)),
        ink(logo, p),
        ink(logo, p - vec2(split * sin(time + luv.x), 0.0))
      );

      // the rainbow, only in the smear: it tints the ink and glows in a halo around it
      vec3 rainbow = film(time * 0.4 + luv.x * luv.y * 1.5 + m * 0.5);
      float glow = ink(soft, p);
      col = mix(col, col * rainbow, clamp(glow * m * 1.4, 0.0, 0.85));
      col += max(glow - col.g, 0.0) * rainbow * m * 2.2;

      gl_FragColor = vec4(min(col, 1.0), 1.0);
    }
  `}),E=new L;E.add(new D(S,c));function F(){const t=window.innerWidth,n=window.innerHeight,a=Math.min(window.devicePixelRatio||1,2);o.setPixelRatio(a),o.setSize(t,n,!1);const r=Math.max(8,Math.round(t*a*g)),i=Math.max(8,Math.round(n*a*g));l.setSize(r,i),f.setSize(r,i),v.uniforms.texel.value.set(1/r,1/i),v.uniforms.aspect.value=t/n,c.uniforms.aspect.value=t/n;const d=Math.min(t<=768?.6*t:.3*t,.6*n);c.uniforms.side.value=d/n,v.uniforms.radius.value=(t<=768?.09:.06)*(d/n)*2}const e={x:-9,y:-9,px:-9,py:-9,active:!1},O=t=>[t.clientX/window.innerWidth,1-t.clientY/window.innerHeight];s.addEventListener("pointerdown",t=>{const[n,a]=O(t);e.x=e.px=n,e.y=e.py=a,e.active=!0});s.addEventListener("pointermove",t=>{const[n,a]=O(t);e.active||(e.px=n,e.py=a,e.active=!0),e.x=n,e.y=a});const T=t=>{t.pointerType!=="mouse"&&(e.active=!1)};s.addEventListener("pointerup",T);s.addEventListener("pointercancel",T);s.addEventListener("pointerleave",()=>e.active=!1);let w=performance.now();function C(t){const n=Math.min(.05,(t-w)/1e3);w=t;const a=v.uniforms;if(e.active&&(e.x!==e.px||e.y!==e.py)){const r=a.aspect.value,i=60*n>0?1/(60*n):1;a.vel.value.set((e.x-e.px)*r*i*9,(e.y-e.py)*i*9),a.from.value.set(e.px,e.py),a.to.value.set(e.x,e.y)}else a.vel.value.set(0,0),a.from.value.set(-9,-9),a.to.value.set(-9,-9);e.px=e.x,e.py=e.y,a.prev.value=l.texture,o.setRenderTarget(f),o.render(k,h),o.setRenderTarget(null),[l,f]=[f,l],c.uniforms.field.value=l.texture,c.uniforms.time.value=t/1e3,o.clear(),o.render(E,h),requestAnimationFrame(C)}window.addEventListener("resize",F);F();requestAnimationFrame(C);
