import"./modulepreload-polyfill.b7f2da20.js";import{W as X,S as j,O as J,e as N,j as g,M as q,g as G}from"./vendor.114acf59.js";import{L as Y,b as z}from"./logo-path.248ebb5a.js";function Z(){const a=Y.match(/[MHVL]|-?\d*\.?\d+/g),t=[];let n=0,o=0,e=0,r="M";const s=()=>parseFloat(a[e++]);for(;e<a.length;){/[MHVL]/.test(a[e])&&(r=a[e++]);const c=n,v=o;if(r==="M"){n=s(),o=s();continue}r==="H"?n=s():(r==="V"||(n=s()),o=s());const l=t[t.length-1],x=i=>Math.atan2(i.by-i.ay,i.bx-i.ax),f={ax:c,ay:v,bx:n,by:o};l&&l.bx===c&&l.by===v&&Math.abs(x(l)-x(f))<.02?(l.bx=n,l.by=o):t.push(f)}return t}const L=document.getElementById("frost"),w=new X({canvas:L,antialias:!1}),S=new j,Q=new J(-1,1,1,-1,0,1),H=new N(2,2),A=new g(1,1),U=new q(H,new G({depthTest:!1,depthWrite:!1,uniforms:{resolution:{value:A}},vertexShader:`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,fragmentShader:`
      uniform vec2 resolution;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 p = vUv * vec2(resolution.x / resolution.y, 1.0);
        float light = exp(-2.2 * distance(p, vec2(0.25 * resolution.x / resolution.y, 0.85)));
        vec3 c = mix(vec3(0.855, 0.867, 0.851), vec3(0.95, 0.955, 0.945), light);
        c += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 2.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `}));U.renderOrder=-1;S.add(U);const $=`
  uniform vec2 resolution;
  uniform vec2 center;   // px, y up
  uniform float angle;
  uniform vec2 halfSize; // half length, half width, px
  uniform float sigma;   // gaussian blur, px
  varying vec2 vLocal;
  void main() {
    vec2 ext = halfSize + 3.0 * sigma + 1.0;
    vLocal = position.xy * ext;
    vec2 cs = vec2(cos(angle), sin(angle));
    vec2 p = center + vec2(vLocal.x * cs.x - vLocal.y * cs.y, vLocal.x * cs.y + vLocal.y * cs.x);
    gl_Position = vec4(p / resolution * 2.0 - 1.0, 0.0, 1.0);
  }
`,tt=`
  uniform vec2 halfSize;
  uniform float sigma;
  uniform float opacity;
  uniform vec3 ink;
  varying vec2 vLocal;

  // erf, Abramowitz\u2013Stegun 7.1.26 (|error| < 1.5e-7)
  float erf1(float x) {
    float s = sign(x);
    x = abs(x);
    float t = 1.0 / (1.0 + 0.3275911 * x);
    float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x);
    return s * y;
  }
  // share of a gaussian (sigma s) that falls inside [-h, h] around x
  float cover(float x, float h, float s) {
    float k = 0.70710678 / s;
    return 0.5 * (erf1((x + h) * k) - erf1((x - h) * k));
  }

  void main() {
    float s = max(sigma, 0.35);
    float a = cover(vLocal.x, halfSize.x, s) * cover(vLocal.y, halfSize.y, s) * opacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(ink, a);
  }
`,at=[.09,.09,.09];function et(a){const t=z,n=(e,r,s,c)=>Math.hypot(e-s,r-c)<.5,o=(e,r,s,c,v)=>{const l=c-r,x=v-s;let f=0;for(const i of a){if(i===e)continue;let M,p;if(n(i.ax,i.ay,r,s))M=i.bx,p=i.by;else if(n(i.bx,i.by,r,s))M=i.ax,p=i.ay;else continue;const R=M-r,F=p-s,D=(l*R+x*F)/(Math.hypot(l,x)*Math.hypot(R,F)),_=Math.acos(Math.max(-1,Math.min(1,D)));_<Math.PI/2-.01||(f=Math.max(f,Math.min(t/2,t/2/Math.tan(_/2))))}return f};return a.map(e=>{const r=Math.hypot(e.bx-e.ax,e.by-e.ay),s=(e.bx-e.ax)/r,c=(e.by-e.ay)/r,v=o(e,e.ax,e.ay,e.bx,e.by),l=o(e,e.bx,e.by,e.ax,e.ay);return{ax:e.ax-s*v,ay:e.ay-c*v,bx:e.bx+s*l,by:e.by+c*l}})}const d=et(Z()).map(a=>{const t=a.ax-300,n=300-a.ay,o=a.bx-300,e=300-a.by,r={resolution:{value:A},center:{value:new g},angle:{value:0},halfSize:{value:new g},sigma:{value:0},opacity:{value:1},ink:{value:at}},s=new q(H,new G({uniforms:r,vertexShader:$,fragmentShader:tt,transparent:!0,depthTest:!1,depthWrite:!1}));s.frustumCulled=!1,S.add(s);const c=(t+o)/2,v=(n+e)/2;return{mesh:s,u:r,rx:c,ry:v,ra:Math.atan2(e-n,o-t),len:Math.hypot(o-t,e-n),x:c+(Math.random()-.5)*500,y:v+(Math.random()-.5)*500,z:500+Math.random()*700,a:Math.random()*Math.PI*2,t:(Math.random()-.5)*2,vx:0,vy:0,vz:0,va:0,vt:0}}),m=16,u=2.6,E=1400,T=900,nt=.075,ot=1/900;function P(a,t){a.vz+=(700+Math.random()*900)*t,a.vx+=(Math.random()-.5)*500*t,a.vy+=(Math.random()-.5)*500*t,a.va+=(Math.random()-.5)*14*t,a.vt+=(Math.random()-.5)*10*t}function B(a){for(const t of d){let n=t.a-t.ra;n=Math.atan2(Math.sin(n),Math.cos(n)),t.vx+=(-m*(t.x-t.rx)-u*t.vx)*a,t.vy+=(-m*(t.y-t.ry)-u*t.vy)*a,t.vz+=(-m*t.z-u*t.vz)*a,t.va+=(-m*n-u*t.va)*a,t.vt+=(-m*t.t-u*t.vt)*a,t.x+=t.vx*a,t.y+=t.vy*a,t.z+=t.vz*a,t.a+=t.va*a,t.t+=t.vt*a,t.z<0&&(t.z=0,t.vz<0&&(t.vz=-t.vz*.35)),t.z>E&&(t.z=E,t.vz>0&&(t.vz=0))}}let h=1,k=0,O=0;function V(){const a=window.innerWidth,t=window.innerHeight,n=Math.min(window.devicePixelRatio||1,2);w.setPixelRatio(n),w.setSize(a,t,!1),A.set(a*n,t*n),h=Math.min(a<=768?.6*a:.3*a,.6*t)/516*n,k=a*n/2,O=t*n/2}function rt(){d.slice().sort((t,n)=>n.z-t.z).forEach((t,n)=>{const o=T/(T+t.z),e=t.u;e.center.value.set(k+t.x*o*h,O+t.y*o*h),e.angle.value=t.a;const r=t.len/2*Math.abs(Math.cos(t.t));e.halfSize.value.set(Math.max(r,z/2)*o*h,z/2*o*h),e.sigma.value=t.z*nt*o*h,e.opacity.value=Math.exp(-t.z*ot),t.mesh.renderOrder=n}),w.render(S,Q)}const W=a=>{const t=Math.min(window.devicePixelRatio||1,2);return[(a.clientX*t-k)/h,(O-a.clientY*t)/h]},I=(a,t,n)=>d.filter(o=>o.z<200&&st(o,a,t)<n);function st(a,t,n){const o=Math.cos(a.a),e=Math.sin(a.a),r=(t-a.x)*o+(n-a.y)*e,s=-(t-a.x)*e+(n-a.y)*o,c=Math.max(Math.abs(r)-a.len/2,0);return Math.hypot(c,s)}let y={x:0,y:0,t:0};L.addEventListener("pointerdown",a=>{const[t,n]=W(a);for(const o of I(t,n,70))P(o,1);y={x:t,y:n,t:performance.now()}});L.addEventListener("pointermove",a=>{const[t,n]=W(a),o=performance.now(),e=Math.hypot(t-y.x,n-y.y)/Math.max(1,o-y.t);if(y={x:t,y:n,t:o},a.pointerType==="mouse"||a.buttons)for(const r of I(t,n,40))P(r,Math.min(1,e*.6))});let b=performance.now(),C=b+1800;function K(a){const t=Math.min(.05,(a-b)/1e3);if(b=a,a>C){const n=Math.random()<.25?2:1;for(let o=0;o<n;o++)P(d[Math.floor(Math.random()*d.length)],.6+Math.random()*.6);C=a+350+Math.random()*900}B(t/2),B(t/2),rt(),requestAnimationFrame(K)}window.addEventListener("resize",V);V();requestAnimationFrame(K);
