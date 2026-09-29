import"./modulepreload-polyfill.b7f2da20.js";import{W as I,S as R,c as j,g as q,D as z,i as H,m as N,L as K,e as V,b as X,M as Y}from"./vendor.114acf59.js";import{a as P,b as J,L as Q,c as Z}from"./logo-path.248ebb5a.js";const T=()=>window.innerWidth<=768,F=window.matchMedia("(hover: none)").matches;function $(n){const o=document.createElement("canvas");o.width=o.height=n;const e=o.getContext("2d"),t=n*.02,r=(n-2*t)/Z;e.translate(t,t),e.scale(r,r),e.translate(-P,-P),e.lineWidth=J,e.strokeStyle="#fff",e.stroke(new Path2D(Q));const i=new H(o);return i.minFilter=N,i.magFilter=K,i}const m=document.getElementById("jelly"),g=new I({canvas:m,antialias:!0});g.setClearColor(0,1);const A=new R,p=new j(50,1,1,2e4),ee=new q({transparent:!0,side:z,depthTest:!1,uniforms:{map:{value:$(2048)}},vertexShader:`
    attribute vec2 rate; // |velocity| per step, x and y, in px
    varying vec2 vUv;
    varying vec3 vBurn;
    void main() {
      vUv = uv;
      // fast parts lose green and blue first: white \u2192 yellow \u2192 red / pink
      vBurn = vec3(0.0, rate.y * 2.0, rate.x + rate.y);
      // and lean toward the viewer the faster they move sideways
      vec3 p = vec3(position.xy, rate.x * 50.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D map;
    varying vec2 vUv;
    varying vec3 vBurn;
    void main() {
      vec4 c = texture2D(map, vUv);
      c.rgb = clamp(c.rgb - vBurn, 0.0, 1.0);
      gl_FragColor = c;
    }
  `});let s=0,f=new Float32Array(0),a=new Float32Array(0),v=new Float32Array(0),w=new Uint8Array(0),h=1,l=null,x=new Float32Array(0);function te(n){s=T()?26:44,h=n/(s-1);const o=s*s;f=new Float32Array(o*2),w=new Uint8Array(o);for(let t=0;t<s;t++)for(let r=0;r<s;r++){const i=t*s+r;f[i*2]=-n/2+r*h,f[i*2+1]=n/2-t*h,w[i]=t===0||r===0||t===s-1||r===s-1?1:0}a=f.slice(),v=f.slice(),x=new Float32Array(o*2),l&&(A.remove(l),l.geometry.dispose());const e=new V(1,1,s-1,s-1);e.setAttribute("rate",new X(x,2)),l=new Y(e,ee),l.frustumCulled=!1,A.add(l),B()}function B(){if(!l)return;const n=l.geometry.attributes.position,o=n.array;for(let e=0;e<s*s;e++)o[e*3]=a[e*2],o[e*3+1]=a[e*2+1],o[e*3+2]=0;n.needsUpdate=!0,l.geometry.attributes.rate.needsUpdate=!0}const c={x:0,y:0,down:!1,inside:!1};let y=20;function D(n){c.x=n.clientX-window.innerWidth/2,c.y=window.innerHeight/2-n.clientY}m.addEventListener("pointerdown",n=>{D(n),c.down=!0,c.inside=!0});m.addEventListener("pointermove",n=>{D(n),c.inside=!0});const W=()=>{c.down=!1,F&&(c.inside=!1)};m.addEventListener("pointerup",W);m.addEventListener("pointercancel",W);m.addEventListener("pointerleave",()=>c.inside=!1);const O=.97,ne=.6,U=.003,re=2;function ae(){const n=s*s;for(let e=0;e<n;e++){if(w[e])continue;const t=e*2,r=t+1,i=(a[t]-v[t])*O,d=(a[r]-v[r])*O;v[t]=a[t],v[r]=a[r],a[t]+=i+(f[t]-a[t])*U,a[r]+=d+(f[r]-a[r])*U}if(c.inside&&(!F||c.down)){const e=y*y;for(let t=0;t<n;t++){if(w[t])continue;const r=a[t*2]-c.x,i=a[t*2+1]-c.y,d=r*r+i*i;if(d<e&&d>1e-6){const u=Math.sqrt(d);a[t*2]=c.x+r/u*y,a[t*2+1]=c.y+i/u*y}}}for(let e=0;e<re;e++)for(let t=0;t<s;t++)for(let r=0;r<s;r++){const i=t*s+r;r<s-1&&C(i,i+1),t<s-1&&C(i,i+s)}for(let e=0;e<n;e++)x[e*2]=Math.abs(a[e*2]-v[e*2]),x[e*2+1]=Math.abs(a[e*2+1]-v[e*2+1])}function C(n,o){const e=n*2,t=o*2,r=a[t]-a[e],i=a[t+1]-a[e+1],d=Math.sqrt(r*r+i*i)||1e-6,u=(d-h)/d*ne,M=w[n],b=w[o];if(M&&b)return;const S=M?0:b?1:.5,E=b?0:M?1:.5;a[e]+=r*u*S,a[e+1]+=i*u*S,a[t]-=r*u*E,a[t+1]-=i*u*E}function _(){const n=window.innerWidth,o=window.innerHeight;g.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),g.setSize(n,o,!1),p.aspect=n/o,p.position.z=o/2/Math.tan(p.fov*Math.PI/360),p.updateProjectionMatrix();const e=Math.min(T()?.6*n:.3*n,.6*o);y=e*(F?.08:.06),te(e)}let G=performance.now(),L=0;function k(n){for(L+=Math.min(100,n-G),G=n;L>=1e3/60;)ae(),L-=1e3/60;B(),g.render(A,p),requestAnimationFrame(k)}window.addEventListener("resize",_);_();requestAnimationFrame(k);
