import"./modulepreload-polyfill.b7f2da20.js";import{W as S,C as Y,S as z,c as D,G as R,M as H,e as V,f as k,D as L,g as G,h as W,i as j,j as F}from"./vendor.1a2da625.js";const U="M216 60H184.927M216 60V91.0733M216 60H350.122M216 300H184.927M216 300V268.927M216 300V331.073M216 300H300M216 300L258 540M184.927 60H138.073H91.2188L60 91.2188L60.0778 180L60 268.201V300M60 300H91.7993M60 300V420M384 60V93.8779M384 60H350.122M384 60H508.946H540V91.0538V148.655V180M384 300H540M384 300V180M384 300V420M384 300L216 180M384 300H300M384 300L342 540M540 420V435.527V540H384M384 540V420M384 540H363M540 540L384 420M184.927 60L216 91.0733M216 91.0733V180M60 268.201L91.7993 300M91.7993 300H184.927M184.927 300L216 268.927M184.927 300L216 331.073M216 268.927V180M216 331.073L216 388.8L184.8 420H60M384 93.8779L350.122 60M384 93.8779V148.866M540 300V268.946V211.346V180M540 300V331.054V388.623V420M216 180H138.073M216 180H352.866M384 180V148.866M384 180H540M384 180H352.866M60 420V540H216H258M384 420H540M384 420L363 540M352.866 180L384 148.866M300 300L258 540M300 300L342 540M258 540H300H342M342 540H363";function b(){const t=document.createElement("canvas");t.width=t.height=1024;const a=t.getContext("2d"),m=1024*.1,h=(1024-2*m)/516;a.translate(m,m),a.scale(h,h),a.translate(-42,-42),a.lineWidth=36,a.strokeStyle="#000",a.stroke(new Path2D(U));const w=new j(t);return w.anisotropy=4,w}const o=document.getElementById("sticker"),M=new S({canvas:o,antialias:!0});M.setClearColor(new Y(657930),1);const g=new z,r=new D(35,1,.01,100);r.position.z=3;const p=new R;g.add(p);const x=new H(new V(1,1),new k({color:16777215,side:L}));p.add(x);const y=new G({side:L,transparent:!0,uniforms:{map:{value:b()},roll:{value:0},radius:{value:.07}},vertexShader:`
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
  `});p.add(new H(new V(1,1,256,1),y));function P(){const e=window.innerWidth,t=window.innerHeight;M.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),M.setSize(e,t,!1),r.aspect=e/t;const a=Math.min(e<=768?.78*e:.42*e,.75*t);v=a,r.position.z=t/a/(2*Math.tan(r.fov*Math.PI/360)),r.updateProjectionMatrix()}let u=0,l=0,i=.12,s=-.45,d=0,c=0,v=300,n=null;const f=new W,I=(e,t)=>{const a=new F(e/window.innerWidth*2-1,-(t/window.innerHeight)*2+1);return f.setFromCamera(a,r),f.intersectObject(x).length>0},C=e=>Math.min(1,Math.max(0,e));o.addEventListener("pointerdown",e=>{o.setPointerCapture(e.pointerId),n={mode:I(e.clientX,e.clientY)?"roll":"turn",x:e.clientX,y:e.clientY,startX:e.clientX,startRoll:l},d=c=0});o.addEventListener("pointermove",e=>{!n||(n.mode==="roll"?l=C(n.startRoll+(n.startX-e.clientX)/v):(c=(e.clientX-n.x)*.004,d=(e.clientY-n.y)*.004,s+=c,i+=d),n.x=e.clientX,n.y=e.clientY)});const X=()=>{n=null};o.addEventListener("pointerup",X);o.addEventListener("pointercancel",X);window.addEventListener("wheel",e=>{e.preventDefault();const t=e.deltaMode===1?e.deltaY*16:e.deltaY;l=C(l+t/(v*2))},{passive:!1});function E(){u+=(l-u)*(n?.mode==="roll"?.5:.15),y.uniforms.roll.value=u,n?.mode!=="turn"&&(s+=c,i+=d,d*=.92,c*=.92),i=Math.max(-.9,Math.min(.9,i)),s=Math.max(-1,Math.min(1,s)),p.rotation.set(i,s,0),M.render(g,r),requestAnimationFrame(E)}window.addEventListener("resize",P);P();requestAnimationFrame(E);
