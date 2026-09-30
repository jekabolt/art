import"./modulepreload-polyfill.b7f2da20.js";import{W as nt,S as at,O as st,e as rt,j as O,M as I,g as B}from"./vendor.0b7086df.js";import{b as ct}from"./logo-path.248ebb5a.js";import{l as it}from"./logo-bars.39a8bdb8.js";const U=document.getElementById("frost"),G=new nt({canvas:U,antialias:!1}),P=new at,lt=new st(-1,1,1,-1,0,1),q=new rt(2,2),F=new O(1,1),K=new I(q,new B({depthTest:!1,depthWrite:!1,uniforms:{resolution:{value:F}},vertexShader:`
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
    `}));K.renderOrder=-1;P.add(K);const X=`
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
`,Y=`
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
`,Z=[.09,.09,.09],d=it().map(t=>{const e=t.ax-300,a=300-t.ay,o=t.bx-300,n=300-t.by,s={resolution:{value:F},center:{value:new O},angle:{value:0},halfSize:{value:new O},sigma:{value:0},opacity:{value:1},ink:{value:Z}},r=new I(q,new B({uniforms:s,vertexShader:X,fragmentShader:Y,transparent:!0,depthTest:!1,depthWrite:!1}));r.frustumCulled=!1,P.add(r);const l=(e+o)/2,c=(a+n)/2,i=Math.atan2(n-a,o-e);return{mesh:r,u:s,rx:l,ry:c,ra:i,len:Math.hypot(o-e,n-a),x:l,y:c,z:0,a:i,t:0,vx:0,vy:0,vz:0,va:0,vt:0,mode:"rest",homeAt:0}}),T=new I(q,new B({uniforms:{resolution:{value:F},center:{value:new O},angle:{value:0},halfSize:{value:new O},sigma:{value:.4},opacity:{value:.35},ink:{value:Z}},vertexShader:X,fragmentShader:Y,transparent:!0,depthTest:!1,depthWrite:!1}));T.frustumCulled=!1;T.renderOrder=-.5;P.add(T);const m=ct/2,H=700,L=900,vt=.055,ft=1/1500,ht=520,mt=1.1,ut=1.6,S=.12,C=3.2,xt=3e3,yt=260;let p={x:600,top:600,floor:-500};const M=t=>(Math.random()*2-1)*t;function D(t){const e=Math.cos(t.t);return[Math.cos(t.a)*e,Math.sin(t.a)*e,Math.sin(t.t)]}function W(t){t.mode==="rest"&&(t.mode="free"),t.mode==="home"&&(t.mode="free")}function J(t,e,a,o){W(t);const n=t.x-e,s=t.y-a,r=Math.hypot(n,s)||1;t.vx+=n/r*260*o+M(60),t.vy+=s/r*260*o+120*o,t.vz+=(140+Math.random()*260)*o,t.va+=M(1.6)*o,t.vt+=M(1.2)*o}function dt(t){t.vy+=420+Math.random()*380,t.vz+=M(160),t.vx+=M(160),t.va+=M(1.2),t.vt+=M(1)}function Q(t,e,a,o){const n=[t[0]-a[0],t[1]-a[1],t[2]-a[2]],s=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],r=o[0]*o[0]+o[1]*o[1]+o[2]*o[2],l=o[0]*n[0]+o[1]*n[1]+o[2]*n[2],c=e[0]*n[0]+e[1]*n[1]+e[2]*n[2],i=e[0]*o[0]+e[1]*o[1]+e[2]*o[2],y=s*r-i*i;let u=y>1e-9?Math.min(1,Math.max(0,(i*l-c*r)/y)):0,h=(i*u+l)/r;return h<0?(h=0,u=Math.min(1,Math.max(0,-c/s))):h>1&&(h=1,u=Math.min(1,Math.max(0,(i-c)/s))),[n[0]+e[0]*u-o[0]*h,n[1]+e[1]*u-o[1]*h,n[2]+e[2]*u-o[2]*h]}function k(t){const[e,a,o]=D(t),n=Math.max(t.len/2-m,0);return[[t.x-e*n,t.y-a*n,t.z-o*n],[e*2*n,a*2*n,o*2*n]]}const $=new Set;d.forEach((t,e)=>d.forEach((a,o)=>{if(o<=e)return;const[n,s]=k(t),[r,l]=k(a),c=Q(n,s,r,l);Math.hypot(c[0],c[1],c[2])<2*m+2&&$.add(e*1e3+o)}));function Mt(){for(let t=0;t<d.length;t++){const e=d[t];if(e.mode!=="home")for(let a=t+1;a<d.length;a++){const o=d[a];if(o.mode==="home"||e.mode==="rest"&&o.mode==="rest"||$.has(t*1e3+a)&&(Math.hypot(e.x-e.rx,e.y-e.ry,e.z)<2*m||Math.hypot(o.x-o.rx,o.y-o.ry,o.z)<2*m))continue;const[n,s]=k(e),[r,l]=k(o),c=Q(n,s,r,l),i=Math.hypot(c[0],c[1],c[2]);if(i>=2*m||i<1e-6)continue;const y=c[0]/i,u=c[1]/i,h=c[2]/i,z=(e.vx-o.vx)*y+(e.vy-o.vy)*u+(e.vz-o.vz)*h;z<-yt&&(e.mode==="rest"&&W(e),o.mode==="rest"&&W(o));const v=e.mode==="rest"?0:1,f=o.mode==="rest"?0:1;if(v+f===0)continue;const g=2*m-i;if(e.x+=y*g*(v/(v+f)),e.y+=u*g*(v/(v+f)),e.z+=h*g*(v/(v+f)),o.x-=y*g*(f/(v+f)),o.y-=u*g*(f/(v+f)),o.z-=h*g*(f/(v+f)),z<0){const w=-(1+S)*z/(v+f);e.vx+=y*w*v,e.vy+=u*w*v,e.vz+=h*w*v,o.vx-=y*w*f,o.vy-=u*w*f,o.vz-=h*w*f,e.va+=M(.004)*-z*v,o.va+=M(.004)*-z*f}}}}function j(t,e){const a=Math.exp(-mt*e),o=Math.exp(-ut*e);t.vy-=ht*e,t.vx*=a,t.vy*=a,t.vz*=a,t.va*=o,t.vt*=o,t.x+=t.vx*e,t.y+=t.vy*e,t.z+=t.vz*e,t.a+=t.va*e,t.t+=t.vt*e;const n=(L+t.z)/L;t.z<0&&(t.z=0,t.vz<0&&(t.vz=-t.vz*S)),t.z>H&&(t.z=H,t.vz>0&&(t.vz=-t.vz*S));const s=p.x*n-m;Math.abs(t.x)>s&&(t.x=Math.sign(t.x)*s,t.x*t.vx>0&&(t.vx=-t.vx*S));const r=p.top*n-m;t.y>r&&(t.y=r,t.vy>0&&(t.vy=-t.vy*S));const[,l]=D(t),c=t.y-Math.abs(l)*(t.len/2)-m;if(c<p.floor){t.y+=p.floor-c,t.vy<0&&(t.vy=-t.vy*S);const i=Math.exp(-4*e);t.vx*=i,t.vz*=i,t.va*=i;const y=Math.round(t.a/Math.PI)*Math.PI;t.a+=(y-t.a)*Math.min(1,2.5*e)}}function pt(t,e){const a=C*C,o=2*C;let n=t.a-t.ra;n=Math.atan2(Math.sin(n),Math.cos(n));const s=Math.atan2(Math.sin(t.t),Math.cos(t.t));t.vx+=(-a*(t.x-t.rx)-o*t.vx)*e,t.vy+=(-a*(t.y-t.ry)-o*t.vy)*e,t.vz+=(-a*t.z-o*t.vz)*e,t.va+=(-a*n-o*t.va)*e,t.vt+=(-a*s-o*t.vt)*e,t.x+=t.vx*e,t.y+=t.vy*e,t.z=Math.max(0,t.z+t.vz*e),t.a+=t.va*e,t.t+=t.vt*e;const r=Math.hypot(t.x-t.rx,t.y-t.ry,t.z)+Math.abs(n)*50+Math.abs(s)*50,l=Math.hypot(t.vx,t.vy,t.vz);r<.4&&l<4&&Object.assign(t,{x:t.rx,y:t.ry,z:0,a:t.ra,t:0,vx:0,vy:0,vz:0,va:0,vt:0,mode:"rest"})}let x=1,A=0,R=0;function b(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,2);G.setPixelRatio(a),G.setSize(t,e,!1),F.set(t*a,e*a),x=Math.min(t<=768?.6*t:.3*t,.6*e)/516*a,A=t*a/2,R=e*a/2;const n=A/x,s=R/x;p={x:n*.94,top:s*.94,floor:-Math.min(s*.86,258+(s-258)*.75)};const r=T.material;r.uniforms.center.value.set(A,R+p.floor*x),r.uniforms.halfSize.value.set(n*.94*x,.5*a)}function zt(){d.slice().sort((e,a)=>a.z-e.z).forEach((e,a)=>{const o=L/(L+e.z),n=e.u;n.center.value.set(A+e.x*o*x,R+e.y*o*x),n.angle.value=e.a;const s=e.len/2*Math.abs(Math.cos(e.t));n.halfSize.value.set(Math.max(s,m)*o*x,m*o*x),n.sigma.value=e.z*vt*o*x,n.opacity.value=Math.exp(-e.z*ft),e.mesh.renderOrder=a}),G.render(P,lt)}let _=-1e9;const tt=t=>{const e=Math.min(window.devicePixelRatio||1,2);return[(t.clientX*e-A)/x,(R-t.clientY*e)/x]};function et(t,e,a){return d.filter(o=>{const n=L/(L+o.z),s=Math.cos(o.a),r=Math.sin(o.a),l=(t-o.x*n)*s+(e-o.y*n)*r,c=-(t-o.x*n)*r+(e-o.y*n)*s,i=o.len/2*Math.abs(Math.cos(o.t))*n;return Math.hypot(Math.max(Math.abs(l)-i,0),c)<a*n+m*n})}let E={x:0,y:0,t:0};U.addEventListener("pointerdown",t=>{const[e,a]=tt(t);et(e,a,40).forEach(n=>J(n,e,a,1)),_=performance.now(),E={x:e,y:a,t:_}});U.addEventListener("pointermove",t=>{const[e,a]=tt(t),o=performance.now(),n=Math.hypot(e-E.x,a-E.y)/Math.max(1,o-E.t);if(E={x:e,y:a,t:o},t.pointerType!=="mouse"&&!t.buttons||n<.25)return;const s=et(e,a,16);!s.length||(s.forEach(r=>J(r,e,a,Math.min(1.4,n*.5))),_=o)});let N=performance.now(),V=0;function ot(t){const e=Math.min(.05,(t-N)/1e3);N=t;const a=t-_>xt,o=d.filter(s=>s.mode==="free");if(a&&o.length)for(const s of o)s.mode="home",s.homeAt=t+Math.random()*900;if(!a&&o.length&&t>V){const s=o.filter(r=>r.y-r.len/2*Math.abs(D(r)[1])-m<p.floor+4);s.length&&dt(s[Math.floor(Math.random()*s.length)]),V=t+260+Math.random()*520}const n=3;for(let s=0;s<n;s++){for(const r of d)r.mode==="free"?j(r,e/n):r.mode==="home"&&(t>=r.homeAt?pt(r,e/n):j(r,e/n));Mt()}zt(),requestAnimationFrame(ot)}window.addEventListener("resize",b);b();requestAnimationFrame(ot);
