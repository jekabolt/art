import"./modulepreload-polyfill.b7f2da20.js";import{p as V,s as U,A as X,q as E,r as D,t as Y,u as _,v as $,w as q,x as Z,y as j,z as y,E as z,I as P,J as B,K as J,Q as K,T as N,U as O,X as Q,Y as ee,Z as g,_ as W,$ as te,a0 as oe,a1 as ne,a2 as ae,a3 as re,a4 as se}from"./vendor.f7790c4c.js";const I=document.getElementById("bit"),v=new V({canvas:I,antialias:!1,powerPreference:"high-performance"});v.outputEncoding=U;v.toneMapping=X;v.toneMappingExposure=1;v.physicallyCorrectLights=!0;const h=new E;h.background=new D(16777215);function ie(){const e=new E,n=new ne(10,48,24),t=[],s=n.getAttribute("position");for(let l=0;l<s.count;l++){const f=s.getY(l)/10,d=f>0?.62+.18*f:.62+.3*f;t.push(d,d,d)}n.setAttribute("color",new ae(t,3)),e.add(new y(n,new P({vertexColors:!0,side:re})));const o=(l,f,d,u,p,m)=>{const r=new y(new z(l,f),new P({color:d,side:se}));r.position.set(u,p,m),r.lookAt(0,.5,0),e.add(r)},c=l=>new D(l,l,l);return o(7,5,c(5),0,8,1),o(1.4,8,c(7),-6,2,3),o(1.2,8,c(4),6.5,2,-1.5),o(8,.5,c(3),0,3,-7),o(1.2,1.2,new D(6,4.6,2.2),5,.8,4),o(2.2,9,c(.015),-3.5,1,-6),o(1.6,9,c(.02),4.5,1,5.5),o(9,1.2,c(.03),0,-1.2,6),e}let L=!1;function ce(){const e=new oe(v);h.environment=e.fromScene(ie(),.015).texture,e.dispose(),L=!0}const F=new Y(16777215,1.2);F.position.set(-3,6,4);h.add(F);const G=new _(16762726,18,0,2);G.position.set(2.6,1.2,1.6);h.add(G);const w=new $(28,1,.01,100);w.position.set(1.5,1.35,2.2);function le(){const t=document.createElement("canvas");t.width=1024,t.height=8;const s=t.getContext("2d"),o=s.createImageData(1024,8);let c=7;const l=()=>(c=c*16807%2147483647)/2147483647,f=new Float32Array(1024);for(let u=0;u<4;u++){const p=1<<u;let m=0;for(let r=0;r<1024;r++)r%p===0&&(m=l()),f[r]+=(m-.5)/(u+1)}for(let u=0;u<8;u++)for(let p=0;p<1024;p++){const m=Math.max(0,Math.min(255,128+f[p]*110)),r=(u*1024+p)*4;o.data[r]=o.data[r+1]=o.data[r+2]=m,o.data[r+3]=255}s.putImageData(o,0,0);const d=new B(t);return d.wrapS=d.wrapT=ee,d.anisotropy=v.capabilities.getMaxAnisotropy(),d}const T=le();T.repeat.set(3,1);const ue=new q({color:13948633,metalness:1,roughness:.3,roughnessMap:T,clearcoat:.25,clearcoatRoughness:.12,envMapIntensity:1.15});function de(e,n){const t=e.getAttribute("position"),s=t.count,o=[],c=new g,l=new g,f=new g;for(let a=0;a<s/3;a++)c.fromBufferAttribute(t,a*3),l.fromBufferAttribute(t,a*3+1),f.fromBufferAttribute(t,a*3+2),o.push(new g().subVectors(f,l).cross(new g().subVectors(c,l)).normalize());const d=a=>`${Math.round(t.getX(a)*1e4)},${Math.round(t.getY(a)*1e4)},${Math.round(t.getZ(a)*1e4)}`,u=new Map;for(let a=0;a<s;a++){const M=d(a),x=u.get(M);x?x.push(Math.floor(a/3)):u.set(M,[Math.floor(a/3)])}const p=Math.cos(n*Math.PI/180),m=new Float32Array(s*3),r=new g;for(let a=0;a<s;a++){const M=o[Math.floor(a/3)];r.set(0,0,0);for(const x of u.get(d(a)))o[x].dot(M)>=p&&r.add(o[x]);r.normalize(),m[a*3]=r.x,m[a*3+1]=r.y,m[a*3+2]=r.z}e.setAttribute("normal",new W(m,3))}function fe(e,n){const t=e.getAttribute("position"),s=new Float32Array(t.count*2);for(let o=0;o<t.count;o++)s[o*2]=(Math.atan2(t.getZ(o),t.getX(o))/(Math.PI*2)+.5)*1,s[o*2+1]=t.getY(o)/n;e.setAttribute("uv",new W(s,2))}function me(){const e=document.createElement("canvas");e.width=e.height=256;const n=e.getContext("2d"),t=n.createRadialGradient(128,128,0,128,128,128);return t.addColorStop(0,"rgba(0,0,0,0.42)"),t.addColorStop(.25,"rgba(0,0,0,0.22)"),t.addColorStop(.6,"rgba(0,0,0,0.06)"),t.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=t,n.fillRect(0,0,256,256),new B(e)}const A=new Z;h.add(A);let C=1;new j().load("/assets/models/bit.stl",e=>{e.rotateX(-Math.PI/2),e.computeBoundingBox();const n=e.boundingBox,t=new g;n.getSize(t);const s=1/t.y;e.translate(-(n.min.x+n.max.x)/2,-n.min.y,-(n.min.z+n.max.z)/2),e.scale(s,s,s),C=1,de(e,32),fe(e,C);const o=new y(e,ue);A.add(o);const c=new y(new z(.75,.75),new P({map:me(),transparent:!0,depthWrite:!1,toneMapped:!1}));c.rotation.x=-Math.PI/2,c.position.y=5e-4,A.add(c),i.target.set(0,.45,0),i.update()});const i=new J(w,I);i.enablePan=!1;i.enableDamping=!0;i.dampingFactor=.06;i.rotateSpeed=.7;i.minDistance=1.1;i.maxDistance=6;i.minPolarAngle=.12;i.maxPolarAngle=Math.PI/2-.04;i.autoRotate=!0;i.autoRotateSpeed=.6;let S=-1e9;i.addEventListener("start",()=>{i.autoRotate=!1,S=performance.now()});i.addEventListener("end",()=>S=performance.now());const pe={uniforms:{tDiffuse:{value:null},resolution:{value:new te(1,1)},time:{value:0}},vertexShader:`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    void main() {
      vec2 px = 1.0 / resolution;
      vec2 c = vUv - 0.5;
      float edge = dot(c, c) * 2.0; // 0 in the middle, ~1 in the corners

      // softness: a small blur everywhere, a little more toward the edges (a real lens is sharpest in the middle)
      float r = 0.6 + 1.6 * edge;
      vec3 col = texture2D(tDiffuse, vUv).rgb * 0.36;
      col += texture2D(tDiffuse, vUv + vec2( r, 0.0) * px).rgb * 0.16;
      col += texture2D(tDiffuse, vUv + vec2(-r, 0.0) * px).rgb * 0.16;
      col += texture2D(tDiffuse, vUv + vec2(0.0,  r) * px).rgb * 0.16;
      col += texture2D(tDiffuse, vUv + vec2(0.0, -r) * px).rgb * 0.16;

      // a faint colour fringe toward the corners
      vec2 ca = c * px * 2.2 * resolution.x * 0.0022;
      col.r = mix(col.r, texture2D(tDiffuse, vUv + ca).r, 0.5 * edge);
      col.b = mix(col.b, texture2D(tDiffuse, vUv - ca).b, 0.5 * edge);

      // the warm lamp's glow: barely there, from the lower right
      float glow = exp(-dot(vUv - vec2(0.86, 0.3), vUv - vec2(0.86, 0.3)) * 5.0);
      col = mix(col, col * vec3(1.0, 0.975, 0.9), 0.55 * glow);

      // grain: fine, changing every frame, strongest in the mid tones like film
      float g = hash(gl_FragCoord.xy + fract(time) * 173.0) - 0.5;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += g * 0.035 * (0.35 + 0.65 * (1.0 - abs(lum - 0.5) * 2.0));

      gl_FragColor = vec4(col, 1.0);
    }
  `},ve=new K(1,1,{encoding:U}),b=new N(v,ve);b.addPass(new O(h,w));const R=new Q(pe);b.addPass(R);function k(){const e=window.innerWidth,n=window.innerHeight,t=Math.min(window.devicePixelRatio||1,2);v.setPixelRatio(t),v.setSize(e,n,!1),b.setPixelRatio(t),b.setSize(e,n),R.uniforms.resolution.value.set(e*t,n*t),w.aspect=e/n,w.fov=e<n?40:28,w.updateProjectionMatrix()}function H(e){L||ce(),!i.autoRotate&&e-S>4e3&&(i.autoRotate=!0),i.update(),R.uniforms.time.value=e/1e3,b.render(),requestAnimationFrame(H)}window.addEventListener("resize",k);k();requestAnimationFrame(H);
