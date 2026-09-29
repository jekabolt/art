import"./modulepreload-polyfill.b7f2da20.js";import{W as st,S as ct,O as rt,e as it,j as R,M as I,g as W}from"./vendor.114acf59.js";import{b as X,L as lt}from"./logo-path.248ebb5a.js";function ht(){const t=lt.match(/[MHVL]|-?\d*\.?\d+/g),e=[];let a=0,n=0,o=0,s="M";const c=()=>parseFloat(t[o++]);for(;o<t.length;){/[MHVL]/.test(t[o])&&(s=t[o++]);const h=a,i=n;if(s==="M"){a=c(),n=c();continue}s==="H"?a=c():(s==="V"||(a=c()),n=c());const r=e[e.length-1],y=l=>Math.atan2(l.by-l.ay,l.bx-l.ax),f={ax:h,ay:i,bx:a,by:n};r&&r.bx===h&&r.by===i&&Math.abs(y(r)-y(f))<.02?(r.bx=a,r.by=n):e.push(f)}return e}const q=document.getElementById("frost"),C=new st({canvas:q,antialias:!1}),_=new ct,ft=new rt(-1,1,1,-1,0,1),B=new it(2,2),F=new R(1,1),Y=new I(B,new W({depthTest:!1,depthWrite:!1,uniforms:{resolution:{value:F}},vertexShader:`
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
    `}));Y.renderOrder=-1;_.add(Y);const J=`
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
`,Z=`
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
`,Q=[.09,.09,.09];function vt(t){const e=X,a=(o,s,c,h)=>Math.hypot(o-c,s-h)<.5,n=(o,s,c,h,i)=>{const r=h-s,y=i-c;let f=0;for(const l of t){if(l===o)continue;let M,v;if(a(l.ax,l.ay,s,c))M=l.bx,v=l.by;else if(a(l.bx,l.by,s,c))M=l.ax,v=l.ay;else continue;const x=M-s,p=v-c,g=(r*x+y*p)/(Math.hypot(r,y)*Math.hypot(x,p)),V=Math.acos(Math.max(-1,Math.min(1,g)));V<Math.PI/2-.01||(f=Math.max(f,Math.min(e/2,e/2/Math.tan(V/2))))}return f};return t.map(o=>{const s=Math.hypot(o.bx-o.ax,o.by-o.ay),c=(o.bx-o.ax)/s,h=(o.by-o.ay)/s,i=n(o,o.ax,o.ay,o.bx,o.by),r=n(o,o.bx,o.by,o.ax,o.ay);return{ax:o.ax-c*i,ay:o.ay-h*i,bx:o.bx+c*r,by:o.by+h*r}})}const d=vt(ht()).map(t=>{const e=t.ax-300,a=300-t.ay,n=t.bx-300,o=300-t.by,s={resolution:{value:F},center:{value:new R},angle:{value:0},halfSize:{value:new R},sigma:{value:0},opacity:{value:1},ink:{value:Q}},c=new I(B,new W({uniforms:s,vertexShader:J,fragmentShader:Z,transparent:!0,depthTest:!1,depthWrite:!1}));c.frustumCulled=!1,_.add(c);const h=(e+n)/2,i=(a+o)/2,r=Math.atan2(o-a,n-e);return{mesh:c,u:s,rx:h,ry:i,ra:r,len:Math.hypot(n-e,o-a),x:h,y:i,z:0,a:r,t:0,vx:0,vy:0,vz:0,va:0,vt:0,mode:"rest",homeAt:0}}),T=new I(B,new W({uniforms:{resolution:{value:F},center:{value:new R},angle:{value:0},halfSize:{value:new R},sigma:{value:.4},opacity:{value:.35},ink:{value:Q}},vertexShader:J,fragmentShader:Z,transparent:!0,depthTest:!1,depthWrite:!1}));T.frustumCulled=!1;T.renderOrder=-.5;_.add(T);const m=X/2,D=700,L=900,xt=.055,yt=1/1500,mt=520,ut=1.1,Mt=1.6,S=.12,G=3.2,dt=3e3,pt=260;let w={x:600,top:600,floor:-500};const z=t=>(Math.random()*2-1)*t;function U(t){const e=Math.cos(t.t);return[Math.cos(t.a)*e,Math.sin(t.a)*e,Math.sin(t.t)]}function H(t){t.mode==="rest"&&(t.mode="free"),t.mode==="home"&&(t.mode="free")}function $(t,e,a,n){H(t);const o=t.x-e,s=t.y-a,c=Math.hypot(o,s)||1;t.vx+=o/c*260*n+z(60),t.vy+=s/c*260*n+120*n,t.vz+=(140+Math.random()*260)*n,t.va+=z(1.6)*n,t.vt+=z(1.2)*n}function zt(t){t.vy+=420+Math.random()*380,t.vz+=z(160),t.vx+=z(160),t.va+=z(1.2),t.vt+=z(1)}function b(t,e,a,n){const o=[t[0]-a[0],t[1]-a[1],t[2]-a[2]],s=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],c=n[0]*n[0]+n[1]*n[1]+n[2]*n[2],h=n[0]*o[0]+n[1]*o[1]+n[2]*o[2],i=e[0]*o[0]+e[1]*o[1]+e[2]*o[2],r=e[0]*n[0]+e[1]*n[1]+e[2]*n[2],y=s*c-r*r;let f=y>1e-9?Math.min(1,Math.max(0,(r*h-i*c)/y)):0,l=(r*f+h)/c;return l<0?(l=0,f=Math.min(1,Math.max(0,-i/s))):l>1&&(l=1,f=Math.min(1,Math.max(0,(r-i)/s))),[o[0]+e[0]*f-n[0]*l,o[1]+e[1]*f-n[1]*l,o[2]+e[2]*f-n[2]*l]}function k(t){const[e,a,n]=U(t),o=Math.max(t.len/2-m,0);return[[t.x-e*o,t.y-a*o,t.z-n*o],[e*2*o,a*2*o,n*2*o]]}const tt=new Set;d.forEach((t,e)=>d.forEach((a,n)=>{if(n<=e)return;const[o,s]=k(t),[c,h]=k(a),i=b(o,s,c,h);Math.hypot(i[0],i[1],i[2])<2*m+2&&tt.add(e*1e3+n)}));function gt(){for(let t=0;t<d.length;t++){const e=d[t];if(e.mode!=="home")for(let a=t+1;a<d.length;a++){const n=d[a];if(n.mode==="home"||e.mode==="rest"&&n.mode==="rest"||tt.has(t*1e3+a)&&(Math.hypot(e.x-e.rx,e.y-e.ry,e.z)<2*m||Math.hypot(n.x-n.rx,n.y-n.ry,n.z)<2*m))continue;const[o,s]=k(e),[c,h]=k(n),i=b(o,s,c,h),r=Math.hypot(i[0],i[1],i[2]);if(r>=2*m||r<1e-6)continue;const y=i[0]/r,f=i[1]/r,l=i[2]/r,M=(e.vx-n.vx)*y+(e.vy-n.vy)*f+(e.vz-n.vz)*l;M<-pt&&(e.mode==="rest"&&H(e),n.mode==="rest"&&H(n));const v=e.mode==="rest"?0:1,x=n.mode==="rest"?0:1;if(v+x===0)continue;const p=2*m-r;if(e.x+=y*p*(v/(v+x)),e.y+=f*p*(v/(v+x)),e.z+=l*p*(v/(v+x)),n.x-=y*p*(x/(v+x)),n.y-=f*p*(x/(v+x)),n.z-=l*p*(x/(v+x)),M<0){const g=-(1+S)*M/(v+x);e.vx+=y*g*v,e.vy+=f*g*v,e.vz+=l*g*v,n.vx-=y*g*x,n.vy-=f*g*x,n.vz-=l*g*x,e.va+=z(.004)*-M*v,n.va+=z(.004)*-M*x}}}}function j(t,e){const a=Math.exp(-ut*e),n=Math.exp(-Mt*e);t.vy-=mt*e,t.vx*=a,t.vy*=a,t.vz*=a,t.va*=n,t.vt*=n,t.x+=t.vx*e,t.y+=t.vy*e,t.z+=t.vz*e,t.a+=t.va*e,t.t+=t.vt*e;const o=(L+t.z)/L;t.z<0&&(t.z=0,t.vz<0&&(t.vz=-t.vz*S)),t.z>D&&(t.z=D,t.vz>0&&(t.vz=-t.vz*S));const s=w.x*o-m;Math.abs(t.x)>s&&(t.x=Math.sign(t.x)*s,t.x*t.vx>0&&(t.vx=-t.vx*S));const c=w.top*o-m;t.y>c&&(t.y=c,t.vy>0&&(t.vy=-t.vy*S));const[,h]=U(t),i=t.y-Math.abs(h)*(t.len/2)-m;if(i<w.floor){t.y+=w.floor-i,t.vy<0&&(t.vy=-t.vy*S);const r=Math.exp(-4*e);t.vx*=r,t.vz*=r,t.va*=r;const y=Math.round(t.a/Math.PI)*Math.PI;t.a+=(y-t.a)*Math.min(1,2.5*e)}}function wt(t,e){const a=G*G,n=2*G;let o=t.a-t.ra;o=Math.atan2(Math.sin(o),Math.cos(o));const s=Math.atan2(Math.sin(t.t),Math.cos(t.t));t.vx+=(-a*(t.x-t.rx)-n*t.vx)*e,t.vy+=(-a*(t.y-t.ry)-n*t.vy)*e,t.vz+=(-a*t.z-n*t.vz)*e,t.va+=(-a*o-n*t.va)*e,t.vt+=(-a*s-n*t.vt)*e,t.x+=t.vx*e,t.y+=t.vy*e,t.z=Math.max(0,t.z+t.vz*e),t.a+=t.va*e,t.t+=t.vt*e;const c=Math.hypot(t.x-t.rx,t.y-t.ry,t.z)+Math.abs(o)*50+Math.abs(s)*50,h=Math.hypot(t.vx,t.vy,t.vz);c<.4&&h<4&&Object.assign(t,{x:t.rx,y:t.ry,z:0,a:t.ra,t:0,vx:0,vy:0,vz:0,va:0,vt:0,mode:"rest"})}let u=1,E=0,O=0;function et(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,2);C.setPixelRatio(a),C.setSize(t,e,!1),F.set(t*a,e*a),u=Math.min(t<=768?.6*t:.3*t,.6*e)/516*a,E=t*a/2,O=e*a/2;const o=E/u,s=O/u;w={x:o*.94,top:s*.94,floor:-Math.min(s*.86,258+(s-258)*.75)};const c=T.material;c.uniforms.center.value.set(E,O+w.floor*u),c.uniforms.halfSize.value.set(o*.94*u,.5*a)}function St(){d.slice().sort((e,a)=>a.z-e.z).forEach((e,a)=>{const n=L/(L+e.z),o=e.u;o.center.value.set(E+e.x*n*u,O+e.y*n*u),o.angle.value=e.a;const s=e.len/2*Math.abs(Math.cos(e.t));o.halfSize.value.set(Math.max(s,m)*n*u,m*n*u),o.sigma.value=e.z*xt*n*u,o.opacity.value=Math.exp(-e.z*yt),e.mesh.renderOrder=a}),C.render(_,ft)}let P=-1e9;const nt=t=>{const e=Math.min(window.devicePixelRatio||1,2);return[(t.clientX*e-E)/u,(O-t.clientY*e)/u]};function ot(t,e,a){return d.filter(n=>{const o=L/(L+n.z),s=Math.cos(n.a),c=Math.sin(n.a),h=(t-n.x*o)*s+(e-n.y*o)*c,i=-(t-n.x*o)*c+(e-n.y*o)*s,r=n.len/2*Math.abs(Math.cos(n.t))*o;return Math.hypot(Math.max(Math.abs(h)-r,0),i)<a*o+m*o})}let A={x:0,y:0,t:0};q.addEventListener("pointerdown",t=>{const[e,a]=nt(t);ot(e,a,40).forEach(o=>$(o,e,a,1)),P=performance.now(),A={x:e,y:a,t:P}});q.addEventListener("pointermove",t=>{const[e,a]=nt(t),n=performance.now(),o=Math.hypot(e-A.x,a-A.y)/Math.max(1,n-A.t);if(A={x:e,y:a,t:n},t.pointerType!=="mouse"&&!t.buttons||o<.25)return;const s=ot(e,a,16);!s.length||(s.forEach(c=>$(c,e,a,Math.min(1.4,o*.5))),P=n)});let N=performance.now(),K=0;function at(t){const e=Math.min(.05,(t-N)/1e3);N=t;const a=t-P>dt,n=d.filter(s=>s.mode==="free");if(a&&n.length)for(const s of n)s.mode="home",s.homeAt=t+Math.random()*900;if(!a&&n.length&&t>K){const s=n.filter(c=>c.y-c.len/2*Math.abs(U(c)[1])-m<w.floor+4);s.length&&zt(s[Math.floor(Math.random()*s.length)]),K=t+260+Math.random()*520}const o=3;for(let s=0;s<o;s++){for(const c of d)c.mode==="free"?j(c,e/o):c.mode==="home"&&(t>=c.homeAt?wt(c,e/o):j(c,e/o));gt()}St(),requestAnimationFrame(at)}window.addEventListener("resize",et);et();requestAnimationFrame(at);
