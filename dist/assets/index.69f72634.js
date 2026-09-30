import"./modulepreload-polyfill.b7f2da20.js";import{W as z,C as D,S as T,c as _,G as k,M,e as y,f as G,D as P,g as I,h as W,i as j,j as F}from"./vendor.0b7086df.js";import{L as U}from"./logo-path.248ebb5a.js";function b(){const t=document.createElement("canvas");t.width=t.height=1024;const a=t.getContext("2d"),v=1024*.035,f=(1024-2*v)/516;a.translate(v,v),a.scale(f,f),a.translate(-42,-42),a.lineWidth=36,a.strokeStyle="#000",a.stroke(new Path2D(U));const g=new j(t);return g.anisotropy=4,g}const c=document.getElementById("sticker"),m=new z({canvas:c,antialias:!0});m.setClearColor(new D(657930),1);const E=new T,i=new _(35,1,.01,100);i.position.z=3;const u=new k;E.add(u);const S=new M(new y(1,1),new G({color:16777215,side:P}));u.add(S);const X=new I({side:P,transparent:!0,uniforms:{map:{value:b()},roll:{value:0},radius:{value:.07}},vertexShader:`
    uniform float roll;
    uniform float radius;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      // the unrolled part lies flat; from 'edge' to the right the layer winds up into a spiral
      float edge = 0.5 - roll * 1.02;
      if (p.x > edge) {
        float s = p.x - edge;                                     // length already rolled
        float r = radius * (1.0 + 0.12 * s / radius / 6.2831853); // grows a little per turn
        float th = s / r;
        p.x = edge + r * sin(th);
        p.z = r * (1.0 - cos(th));
      }
      p.z += 0.0015; // printed on top of the paper
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D map;
    varying vec2 vUv;
    void main() {
      float a = texture2D(map, vUv).a;
      if (a < 0.5) discard;
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  `});u.add(new M(new y(1,1,256,1),X));function C(){const e=window.innerWidth,t=window.innerHeight;m.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),m.setSize(e,t,!1),i.aspect=e/t;const a=Math.min(e<=768?.55*e:.28*e,.5*t);h=a,i.position.z=t/a/(2*Math.tan(i.fov*Math.PI/360)),i.updateProjectionMatrix()}let w=0,s=0,r=.12,o=-.45,l=0,d=0,h=300;const A=.12,H=-.45,O=2e3;let p=-1e9,n=null;const x=new W,q=(e,t)=>{const a=new F(e/window.innerWidth*2-1,-(t/window.innerHeight)*2+1);return x.setFromCamera(a,i),x.intersectObject(S).length>0},L=e=>Math.min(1,Math.max(0,e));c.addEventListener("pointerdown",e=>{c.setPointerCapture(e.pointerId),n={mode:q(e.clientX,e.clientY)?"roll":"turn",x:e.clientX,y:e.clientY,startX:e.clientX,startRoll:s},l=d=0,p=performance.now()});c.addEventListener("pointermove",e=>{!n||(n.mode==="roll"?s=L(n.startRoll+(n.startX-e.clientX)/h):(d=(e.clientX-n.x)*.004,l=(e.clientY-n.y)*.004,o+=d,r+=l),n.x=e.clientX,n.y=e.clientY,p=performance.now())});const Y=()=>{n=null,p=performance.now()};c.addEventListener("pointerup",Y);c.addEventListener("pointercancel",Y);window.addEventListener("wheel",e=>{e.preventDefault();const t=e.deltaMode===1?e.deltaY*16:e.deltaY;s=L(s+t/(h*2)),p=performance.now()},{passive:!1});function R(e){!n&&e-p>O&&(s+=(0-s)*.04,o+=(H-o)*.04,r+=(A-r)*.04,l=d=0),w+=(s-w)*(n?.mode==="roll"?.5:.15),X.uniforms.roll.value=w,n?.mode!=="turn"&&(o+=d,r+=l,l*=.92,d*=.92),r=Math.max(-.9,Math.min(.9,r)),o=Math.max(-1,Math.min(1,o)),u.rotation.set(r,o,0),m.render(E,i),requestAnimationFrame(R)}window.addEventListener("resize",C);C();requestAnimationFrame(R);
