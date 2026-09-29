import"./modulepreload-polyfill.b7f2da20.js";import{W as C,C as E,S as P,c as S,G as z,M as v,e as h,f as Y,D as f,g as k,h as D}from"./vendor.0f9013a5.js";const G="M216 60H184.927M216 60V91.0733M216 60H350.122M216 300H184.927M216 300V268.927M216 300V331.073M216 300H300M216 300L258 540M184.927 60H138.073H91.2188L60 91.2188L60.0778 180L60 268.201V300M60 300H91.7993M60 300V420M384 60V93.8779M384 60H350.122M384 60H508.946H540V91.0538V148.655V180M384 300H540M384 300V180M384 300V420M384 300L216 180M384 300H300M384 300L342 540M540 420V435.527V540H384M384 540V420M384 540H363M540 540L384 420M184.927 60L216 91.0733M216 91.0733V180M60 268.201L91.7993 300M91.7993 300H184.927M184.927 300L216 268.927M184.927 300L216 331.073M216 268.927V180M216 331.073L216 388.8L184.8 420H60M384 93.8779L350.122 60M384 93.8779V148.866M540 300V268.946V211.346V180M540 300V331.054V388.623V420M216 180H138.073M216 180H352.866M384 180V148.866M384 180H540M384 180H352.866M60 420V540H216H258M384 420H540M384 420L363 540M352.866 180L384 148.866M300 300L258 540M300 300L342 540M258 540H300H342M342 540H363";function X(){const t=document.createElement("canvas");t.width=t.height=1024;const n=t.getContext("2d"),c=1024*.1,u=(1024-2*c)/516;n.translate(c,c),n.scale(u,u),n.translate(-42,-42),n.lineWidth=36,n.strokeStyle="#000",n.stroke(new Path2D(G));const w=new D(t);return w.anisotropy=4,w}const H=document.getElementById("sticker"),s=new C({canvas:H,antialias:!0});s.setClearColor(new E(657930),1);const V=new P,r=new S(35,1,.01,100);r.position.z=3;const M=new z;V.add(M);M.add(new v(new h(1,1),new Y({color:16777215,side:f})));const L=new k({side:f,transparent:!0,uniforms:{map:{value:X()},roll:{value:0},radius:{value:.07}},vertexShader:`
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
  `});M.add(new v(new h(1,1,256,1),L));function g(){const e=window.innerWidth,t=window.innerHeight;s.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),s.setSize(e,t,!1),r.aspect=e/t;const n=Math.min(e<=768?.78*e:.42*e,.75*t);r.position.z=t/n/(2*Math.tan(r.fov*Math.PI/360)),r.updateProjectionMatrix()}let p=0;const R=()=>{const e=document.documentElement.scrollHeight-window.innerHeight;return e>0?Math.min(1,Math.max(0,window.scrollY/e)):0};let a=.12,i=-.45,l=0,d=0,o=null,m=-1e9;H.addEventListener("pointerdown",e=>{o={x:e.clientX,y:e.clientY},m=performance.now()});window.addEventListener("pointermove",e=>{if(!o)return;const t=e.clientX-o.x,n=e.clientY-o.y;o={x:e.clientX,y:e.clientY},d=t*.008,l=e.pointerType==="mouse"?n*.008:0,i+=d,a+=l,m=performance.now()});const x=()=>{o=null};window.addEventListener("pointerup",x);window.addEventListener("pointercancel",x);function y(e){p+=(R()-p)*.15,L.uniforms.roll.value=p,o||(i+=d,a+=l,l*=.94,d*=.94,e-m>3e3&&(i+=(-.45+.25*Math.sin(e*4e-4)-i)*.01,a+=(.12+.08*Math.sin(e*3e-4)-a)*.01)),a=Math.max(-1.2,Math.min(1.2,a)),M.rotation.set(a,i,0),s.render(V,r),requestAnimationFrame(y)}window.addEventListener("resize",g);g();requestAnimationFrame(y);
