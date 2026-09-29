import"./modulepreload-polyfill.b7f2da20.js";import{W as Y,C as R,S as z,c as D,G as k,M as L,e as V,f as G,D as g,g as I,h as T,i as W,j as _}from"./vendor.1a2da625.js";const j="M216 60H184.927M216 60V91.0733M216 60H350.122M216 300H184.927M216 300V268.927M216 300V331.073M216 300H300M216 300L258 540M184.927 60H138.073H91.2188L60 91.2188L60.0778 180L60 268.201V300M60 300H91.7993M60 300V420M384 60V93.8779M384 60H350.122M384 60H508.946H540V91.0538V148.655V180M384 300H540M384 300V180M384 300V420M384 300L216 180M384 300H300M384 300L342 540M540 420V435.527V540H384M384 540V420M384 540H363M540 540L384 420M184.927 60L216 91.0733M216 91.0733V180M60 268.201L91.7993 300M91.7993 300H184.927M184.927 300L216 268.927M184.927 300L216 331.073M216 268.927V180M216 331.073L216 388.8L184.8 420H60M384 93.8779L350.122 60M384 93.8779V148.866M540 300V268.946V211.346V180M540 300V331.054V388.623V420M216 180H138.073M216 180H352.866M384 180V148.866M384 180H540M384 180H352.866M60 420V540H216H258M384 420H540M384 420L363 540M352.866 180L384 148.866M300 300L258 540M300 300L342 540M258 540H300H342M342 540H363";function F(){const t=document.createElement("canvas");t.width=t.height=1024;const a=t.getContext("2d"),u=1024*.1,h=(1024-2*u)/516;a.translate(u,u),a.scale(h,h),a.translate(-42,-42),a.lineWidth=36,a.strokeStyle="#000",a.stroke(new Path2D(j));const f=new W(t);return f.anisotropy=4,f}const d=document.getElementById("sticker"),p=new Y({canvas:d,antialias:!0});p.setClearColor(new R(657930),1);const x=new z,i=new D(35,1,.01,100);i.position.z=3;const m=new k;x.add(m);const y=new L(new V(1,1),new G({color:16777215,side:g}));m.add(y);const E=new I({side:g,transparent:!0,uniforms:{map:{value:F()},roll:{value:0},radius:{value:.07}},vertexShader:`
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
  `});m.add(new L(new V(1,1,256,1),E));function P(){const e=window.innerWidth,t=window.innerHeight;p.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),p.setSize(e,t,!1),i.aspect=e/t;const a=Math.min(e<=768?.55*e:.28*e,.5*t);w=a,i.position.z=t/a/(2*Math.tan(i.fov*Math.PI/360)),i.updateProjectionMatrix()}let v=0,s=0,r=.12,o=-.45,l=0,c=0,w=300;const U=.12,b=-.45,O=2e3;let M=-1e9,n=null;const H=new T,q=(e,t)=>{const a=new _(e/window.innerWidth*2-1,-(t/window.innerHeight)*2+1);return H.setFromCamera(a,i),H.intersectObject(y).length>0},S=e=>Math.min(1,Math.max(0,e));d.addEventListener("pointerdown",e=>{d.setPointerCapture(e.pointerId),n={mode:q(e.clientX,e.clientY)?"roll":"turn",x:e.clientX,y:e.clientY,startX:e.clientX,startRoll:s},l=c=0,M=performance.now()});d.addEventListener("pointermove",e=>{!n||(n.mode==="roll"?s=S(n.startRoll+(n.startX-e.clientX)/w):(c=(e.clientX-n.x)*.004,l=(e.clientY-n.y)*.004,o+=c,r+=l),n.x=e.clientX,n.y=e.clientY,M=performance.now())});const X=()=>{n=null,M=performance.now()};d.addEventListener("pointerup",X);d.addEventListener("pointercancel",X);window.addEventListener("wheel",e=>{e.preventDefault();const t=e.deltaMode===1?e.deltaY*16:e.deltaY;s=S(s+t/(w*2)),M=performance.now()},{passive:!1});function C(e){!n&&e-M>O&&(s+=(0-s)*.04,o+=(b-o)*.04,r+=(U-r)*.04,l=c=0),v+=(s-v)*(n?.mode==="roll"?.5:.15),E.uniforms.roll.value=v,n?.mode!=="turn"&&(o+=c,r+=l,l*=.92,c*=.92),r=Math.max(-.9,Math.min(.9,r)),o=Math.max(-1,Math.min(1,o)),m.rotation.set(r,o,0),p.render(x,i),requestAnimationFrame(C)}window.addEventListener("resize",P);P();requestAnimationFrame(C);
