import"./modulepreload-polyfill.b7f2da20.js";import{p as j,q as fe,r as W,s as ve,t as pe,u as ge,v as ee,w as te,x as we,y as xe,z as be,I as ye,A as Me,E as A,J as b,K as q,Q as Se,T as k,U as Z,X as Ce,Y as E,Z as X,_ as Pe,$ as Te,a0 as ze,a1 as ae,a2 as De,a3 as Ae,a4 as ke,a5 as Re,a6 as Ve,a7 as Be,a8 as _e,a9 as je,aa as Fe,ab as Ne,ac as Ee,ad as Oe,ae as Ue,af as oe,ag as Le,ah as Ie,ai as Ge,aj as Ze,ak as Xe,al as K,am as Ye,an as $e}from"./vendor.c0b6b9f3.js";const Qe="/assets/bit/steel-grain.jpg",f={bitFraction:.38,fov:60,backdrop:new j(5.4,4.565,3.347),lamp:new j(8.4,8,7.4),bloom:{threshold:6.2,strength:.12,radius:.55},steel:{color:13159633,roughness:.1,envMapIntensity:1},hex:{color:5988197,roughness:.3,from:.593,blend:.008},detail:{scale:1,normal:.012,roughVar:.05,albedoVar:.03,wearWidth:.008,wearAmount:.1,aniso:.35,scratches:.6},lens:{barrel:.05,ca:6e-4,vignette:.07,sharpen:.22,sharpenClamp:.018},noise:{glow:0,base:.006,chroma:0,fixed:.15,hz:30},maxDpr:2},re=document.getElementById("bit"),y=new fe({canvas:re,antialias:!1,powerPreference:"high-performance"});y.outputEncoding=W;y.toneMapping=ve;y.physicallyCorrectLights=!0;y.shadowMap.enabled=!0;y.shadowMap.type=pe;ge.init();const ne=y.capabilities.isWebGL2&&(y.extensions.has("EXT_color_buffer_float")||y.extensions.has("EXT_color_buffer_half_float")),J=window.innerWidth<700,P=new ee;P.background=f.backdrop;const _=t=>new j(t,t,t);function He(t){const e=new ee,a=new Ze(10,48,24);if(t){const s=t.width,r=Math.round(s/2),i=Math.round(s/t.width*t.height),h=Math.round((r-i)/2),m=document.createElement("canvas");m.width=s,m.height=r;const u=m.getContext("2d");u.drawImage(t,0,0,t.width,1,0,0,s,h+1),u.drawImage(t,0,t.height-1,t.width,1,0,h+i-1,s,r-h-i+1),u.drawImage(t,0,h,s,i);const v=new X(m);v.encoding=Xe;const p=new k(a,new E({map:v,color:_(.6),side:K}));p.rotation.y=Math.PI/2,e.add(p)}else{const s=[],r=a.getAttribute("position");for(let i=0;i<r.count;i++){const h=r.getY(i)/10,m=r.getX(i)/10,u=r.getZ(i)/10,v=Math.atan2(m,u),p=.55+.45*Math.sin(v*3+.7)*Math.sin(v*5+2.1),c=h<0?1*Math.pow(Math.max(0,-h-.45)/.55,1.4):0,l=.05+.4*p*(1-.6*Math.abs(h))+(h>0?.35*Math.pow(h,1.5):0)+c;s.push(l*.97,l*.99,l*1.02)}a.setAttribute("color",new Ye(s,3)),e.add(new k(a,new E({vertexColors:!0,side:K})))}const d=(s,r,i,h,m,u)=>{const v=new k(new Z(s,r),new E({color:i,side:$e}));v.position.set(h,m,u),v.lookAt(0,.5,0),e.add(v)};d(3.4,3,new j(5.6,5.8,6),-5.2,4.2,3.4),d(.5,.5,_(40),-4.9,6.9,4.3),d(1.2,4,_(2.4),6,1.6,-3.5);const o=_(.012);return d(4.5,2.2,o,0,.6,-7),d(2,3.5,o,-6.5,.8,-2.5),d(3,3.2,_(.05),0,1.4,6),e}let se=!1,qe,ie=!1;function Ke(){const t=new Ge(y),e=P.environment;P.environment=t.fromScene(He(qe),.02).texture,e?.dispose(),t.dispose(),se=!0,ie=!1}const F=new te;P.add(F);const C=new we(16776180,5);C.position.set(-1.9,2.9,1.3);C.castShadow=!0;C.shadow.mapSize.set(J?1024:2048,J?1024:2048);C.shadow.radius=1.6;C.shadow.blurSamples=12;C.shadow.bias=-3e-4;C.shadow.normalBias=.002;const R=C.shadow.camera;R.left=R.bottom=-1.4;R.right=R.top=1.4;R.near=.5;R.far=8;F.add(C);C.target.position.set(0,.3,0);F.add(C.target);const Je=new xe,S=new be(f.fov,1,.01,100),Y=new b(0,.44,0);{const t=1/(f.bitFraction*2*Math.tan(f.fov*Math.PI/360)),e=new _e(t,68*Math.PI/180,22*Math.PI/180);S.position.setFromSpherical(e).add(Y)}function le(t,e,a){let d=0;for(let c=0;c<t.length;c++)d+=t[c];d/=t.length;const o=t.map(c=>Math.min(1,Math.max(0,c-d+.5))),s=14,r=new Float32Array(e*a),i=new Float32Array(e*a);for(let c=0;c<a;c++){let l=0;for(let n=-s;n<=s;n++)l+=o[c*e+(n+e)%e];for(let n=0;n<e;n++)r[c*e+n]=l/(2*s+1),l+=o[c*e+(n+s+1)%e]-o[c*e+(n-s+e)%e]}for(let c=0;c<e;c++){let l=0;for(let n=-s;n<=s;n++)l+=r[(n+a)%a*e+c];for(let n=0;n<a;n++)i[n*e+c]=l/(2*s+1),l+=r[(n+s+1)%a*e+c]-r[(n-s+a)%a*e+c]}let h=1,m=0;for(let c=0;c<i.length;c++)i[c]<h&&(h=i[c]),i[c]>m&&(m=i[c]);const u=new Uint8Array(e*a*4),v=7;for(let c=0;c<a;c++)for(let l=0;l<e;l++){const n=c*e+l,w=o[c*e+(l+1)%e]-o[c*e+(l-1+e)%e],x=o[(c+1)%a*e+l]-o[(c-1+a)%a*e+l],M=-w*v,T=-x*v,z=Math.sqrt(M*M+T*T+1);u[n*4]=M/z*127.5+127.5,u[n*4+1]=T/z*127.5+127.5,u[n*4+2]=o[n]*255,u[n*4+3]=(i[n]-h)/(m-h||1)*255}const p=new je(u,e,a,Fe);return p.wrapS=p.wrapT=Ne,p.minFilter=Ee,p.magFilter=Oe,p.generateMipmaps=!0,p.anisotropy=y.capabilities.getMaxAnisotropy(),p.needsUpdate=!0,p}function We(t){let e=11;const a=()=>(e=e*16807%2147483647)/2147483647,d=new Float32Array(t*t),o=(r,i)=>{const h=new Float32Array(r*r);for(let u=0;u<h.length;u++)h[u]=a();const m=u=>u*u*(3-2*u);for(let u=0;u<t;u++)for(let v=0;v<t;v++){const p=v/t*r,c=u/t*r,l=Math.floor(p),n=Math.floor(c),w=m(p-l),x=m(c-n),M=(I,N)=>h[N%r*r+I%r],T=M(l,n)+(M(l+1,n)-M(l,n))*w,z=M(l,n+1)+(M(l+1,n+1)-M(l,n+1))*w;d[u*t+v]+=(T+(z-T)*x-.5)*i}};o(8,.1),o(32,.08),o(128,.1);for(let r=0;r<d.length;r++)d[r]+=(a()-.5)*.22+.5;for(let r=0;r<t;r++)e=5;const s=new Float32Array(t);for(let r=0;r<t;r++)s[r]=(a()-.5)*.05;for(let r=0;r<t;r++)for(let i=0;i<t;i++)d[r*t+i]+=s[i];return le(d,t,t)}let G=We(512);new ye().load(Qe,t=>{const e=t.width,a=t.height,d=document.createElement("canvas");d.width=e,d.height=a;const o=d.getContext("2d");o.drawImage(t,0,0);const s=o.getImageData(0,0,e,a).data,r=new Float32Array(e*a);for(let h=0;h<r.length;h++)r[h]=(s[h*4]*.299+s[h*4+1]*.587+s[h*4+2]*.114)/255;const i=le(r,e,a);G.dispose(),G=i,V.detailMap.value=i},void 0,()=>{});function et(){const e=document.createElement("canvas");e.width=e.height=1024;const a=e.getContext("2d");a.fillStyle="#000",a.fillRect(0,0,1024,1024);let d=1234567;const o=()=>(d=d*16807%2147483647)/2147483647;a.lineCap="round";for(let r=0;r<170;r++){const i=o()<.8,h=i?Math.PI/2+(o()-.5)*.35:o()*Math.PI,m=(i?60+o()*260:12+o()*70)*(o()<.15?1.8:1),u=o()*1024,v=o()*1024,p=Math.cos(h)*m,c=Math.sin(h)*m,l=a.createLinearGradient(u,v,u+p,v+c),n=.25+o()*.55;l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.2+o()*.2,`rgba(255,255,255,${n})`),l.addColorStop(.7+o()*.2,`rgba(255,255,255,${n*.6})`),l.addColorStop(1,"rgba(255,255,255,0)"),a.strokeStyle=l,a.lineWidth=o()<.85?.7+o()*.6:1.4+o()*.8,a.beginPath(),a.moveTo(u,v),a.lineTo(u+p,v+c),a.stroke();for(const[w,x]of[[-1024,0],[1024,0],[0,-1024],[0,1024]])a.beginPath(),a.moveTo(u+w,v+x),a.lineTo(u+p+w,v+c+x),a.stroke()}const s=new X(e);return s.wrapS=s.wrapT=Ue,s.anisotropy=8,s}const $=new Me({color:f.steel.color,metalness:1,roughness:f.steel.roughness,envMapIntensity:f.steel.envMapIntensity}),V={detailMap:{value:G},scratchMap:{value:et()},scratches:{value:f.detail.scratches},detailScale:{value:f.detail.scale},detailNormal:{value:f.detail.normal},roughVar:{value:f.detail.roughVar},albedoVar:{value:f.detail.albedoVar},wearWidth:{value:f.detail.wearWidth},wearAmount:{value:f.detail.wearAmount},aniso:{value:f.detail.aniso},hexColor:{value:new j(f.hex.color)},hexRough:{value:f.hex.roughness},hexZone:{value:new A(f.hex.from,f.hex.blend)},axisView:{value:new b(0,1,0)},envRot:{value:new q},objToView:{value:new q}};$.onBeforeCompile=t=>{Object.assign(t.uniforms,V),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
      attribute vec3 edgeDist;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
 vObjNormal = objectNormal;`).replace("#include <begin_vertex>",`#include <begin_vertex>
 vObjPos = position; vEdgeDist = edgeDist;`);const e=Se.envmap_physical_pars_fragment.replace("vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );","vec3 worldNormal = envRot * inverseTransformDirection( normal, viewMatrix );").replace("reflectVec = inverseTransformDirection( reflectVec, viewMatrix );","reflectVec = envRot * inverseTransformDirection( reflectVec, viewMatrix );");t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
      uniform sampler2D detailMap, scratchMap; uniform float scratches, detailScale, detailNormal, roughVar, albedoVar, wearWidth, wearAmount, aniso;
      uniform vec3 axisView; uniform vec3 hexColor; uniform float hexRough; uniform vec2 hexZone;
      uniform mat3 envRot; uniform mat3 objToView;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`).replace("#include <envmap_physical_pars_fragment>",e).replace("#include <color_fragment>",`#include <color_fragment>
      // triplanar micro-surface in object space: no seam, grain along the axis on the flats
      vec3 tw = abs(normalize(vObjNormal)); tw = tw * tw * tw * tw; tw /= (tw.x + tw.y + tw.z);
      vec4 dX = texture2D(detailMap, vObjPos.zy * detailScale + vec2(0.13, 0.0));
      vec4 dY = texture2D(detailMap, vObjPos.xz * detailScale + vec2(0.41, 0.37));
      vec4 dZ = texture2D(detailMap, vObjPos.xy * detailScale + vec2(0.77, 0.0));
      vec4 det = dX * tw.x + dY * tw.y + dZ * tw.z;
      // the same texture at a coarser scale: the mottling one can actually see at this distance
      float mottle = texture2D(detailMap, vObjPos.zy * detailScale * 0.21 + 0.5).a * tw.x + texture2D(detailMap, vObjPos.xz * detailScale * 0.21).a * tw.y + texture2D(detailMap, vObjPos.xy * detailScale * 0.21 + 0.25).a * tw.z;
      vec2 nX = dX.xy * 2.0 - 1.0, nY = dY.xy * 2.0 - 1.0, nZ = dZ.xy * 2.0 - 1.0;
      vec3 pert = tw.x * vec3(0.0, nX.y, nX.x) + tw.y * vec3(nY.x, 0.0, nY.y) + tw.z * vec3(nZ.x, nZ.y, 0.0);
      // recesses on the hex shank (the ring groove, the engraving): below the flats' radius they are
      // hidden from most of the room, so they read dark, not as a slit of light
      float rAx = length(vObjPos.xz);
      float shank = smoothstep(0.02, 0.035, vObjPos.y) * (1.0 - smoothstep(0.48, 0.495, vObjPos.y));
      float cavity = (1.0 - smoothstep(0.1232, 0.1262, rAx)) * shank; // the engraving, below the flats
      // use marks: fine scratches, triplanar like the grain (the flats get them along the axis)
      float scr = texture2D(scratchMap, vObjPos.zy * 1.6 + vec2(0.31, 0.0)).r * tw.x + texture2D(scratchMap, vObjPos.xz * 1.6 + vec2(0.6, 0.2)).r * tw.y + texture2D(scratchMap, vObjPos.xy * 1.6 + vec2(0.05, 0.5)).r * tw.z;
      scr *= scratches;
      // wear: the sharp edges, worn smoother and brighter, patchily
      float edgeD = min(vEdgeDist.x, min(vEdgeDist.y, vEdgeDist.z));
      float wear = (1.0 - smoothstep(0.0, wearWidth, edgeD)) * smoothstep(0.25, 0.8, det.a + 0.25) * wearAmount;
      // two finishes: the satin hex shank, the polished neck and tip
      float onHex = 1.0 - smoothstep(hexZone.x - hexZone.y, hexZone.x + hexZone.y, vObjPos.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, hexColor, onHex);
      diffuseColor.rgb *= (1.0 + (det.a - 0.5) * albedoVar + (mottle - 0.5) * albedoVar * 0.8 + (det.b - 0.5) * albedoVar * 0.5) * (1.0 + 0.08 * wear) * (1.0 - 0.72 * cavity) * (1.0 + 0.55 * scr);`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
      roughnessFactor = clamp(mix(roughnessFactor, hexRough, onHex) + (det.b - 0.5) * roughVar + (mottle - 0.5) * 0.03 - 0.04 * wear + 0.45 * cavity + 0.22 * scr, 0.08, 1.0);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal = normalize(normal + objToView * pert * detailNormal * (1.0 - 0.6 * wear));
      // a faint lengthwise grind: bend the normal toward the axis-stretched highlight direction
      {
        vec3 V = normalize(vViewPosition);
        vec3 aT = cross(axisView, V);
        vec3 aN = normalize(cross(normalize(aT), axisView));
        normal = normalize(mix(normal, aN, aniso * (1.0 - roughnessFactor) * (1.0 - abs(dot(normalize(vObjNormal), vec3(0.0, 1.0, 0.0))))));
      }`)};function ce(t){const e=[],a=new b,d=new b,o=new b;for(let s=0;s<t.count/3;s++)a.fromBufferAttribute(t,s*3),d.fromBufferAttribute(t,s*3+1),o.fromBufferAttribute(t,s*3+2),e.push(new b().subVectors(o,d).cross(new b().subVectors(a,d)).normalize());return e}const O=(t,e)=>`${Math.round(t.getX(e)*1e4)},${Math.round(t.getY(e)*1e4)},${Math.round(t.getZ(e)*1e4)}`;function tt(t,e){const a=t.getAttribute("position"),d=a.count,o=ce(a),s=new Map;for(let m=0;m<d;m++){const u=O(a,m),v=s.get(u);v?v.push(Math.floor(m/3)):s.set(u,[Math.floor(m/3)])}const r=Math.cos(e*Math.PI/180),i=new Float32Array(d*3),h=new b;for(let m=0;m<d;m++){const u=o[Math.floor(m/3)];h.set(0,0,0);for(const v of s.get(O(a,m)))o[v].dot(u)>=r&&h.add(o[v]);h.normalize(),i[m*3]=h.x,i[m*3+1]=h.y,i[m*3+2]=h.z}t.setAttribute("normal",new oe(i,3))}function at(t,e){const a=t.getAttribute("position"),d=a.count,o=ce(a),s=new Map,r=(l,n)=>{const w=O(a,l),x=O(a,n);return w<x?`${w}|${x}`:`${x}|${w}`};for(let l=0;l<d/3;l++)for(let n=0;n<3;n++){const w=r(l*3+n,l*3+(n+1)%3),x=s.get(w);x?x.push(l):s.set(w,[l])}const i=Math.cos(e*Math.PI/180),h=new Float32Array(d*3).fill(10),m=new b,u=new b,v=new b,p=new b,c=new b;for(let l=0;l<d/3;l++)for(let n=0;n<3;n++){const w=l*3+n,x=l*3+(n+1)%3,M=l*3+(n+2)%3,T=s.get(r(w,x));let z=!1;for(const N of T)N!==l&&o[N].dot(o[l])<i&&(z=!0);if(!z)continue;m.fromBufferAttribute(a,w),u.fromBufferAttribute(a,x),v.fromBufferAttribute(a,M),p.subVectors(u,m),c.subVectors(v,m);const I=p.clone().cross(c).length()/(p.length()||1);h[w*3+n]=0,h[x*3+n]=0,h[M*3+n]=I}t.setAttribute("edgeDist",new oe(h,3))}function ot(){const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d"),a=e.createRadialGradient(64,64,0,64,64,64);return a.addColorStop(0,"rgba(0,0,0,0.7)"),a.addColorStop(.45,"rgba(0,0,0,0.25)"),a.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=a,e.fillRect(0,0,128,128),new X(t)}const U=new k(new Z(8,8),new Ce({color:2303790,opacity:.55,depthWrite:!1}));U.rotation.x=-Math.PI/2;U.receiveShadow=!0;P.add(U);const L=new k(new Z(.62,.62),new E({map:ot(),transparent:!0,depthWrite:!1}));L.rotation.x=-Math.PI/2;L.position.y=5e-4;P.add(L);const de=new te;P.add(de);new Pe().load("/assets/models/bit.stl",t=>{t.rotateX(-Math.PI/2),t.computeBoundingBox();const e=t.boundingBox,a=new b;e.getSize(a);const d=1/a.y;t.translate(-(e.min.x+e.max.x)/2,-e.min.y,-(e.min.z+e.max.z)/2),t.scale(d,d,d),tt(t,12),at(t,18);const o=new k(t,$);o.castShadow=!0,V.objToView.value=o.normalMatrix,de.add(o),g.target.copy(Y),g.update()});const g=new Te(S,re);g.target.copy(Y);g.enablePan=!1;g.enableDamping=!0;g.dampingFactor=.06;g.rotateSpeed=.7;g.minDistance=1.3;g.maxDistance=4.5;g.minPolarAngle=.12;g.maxPolarAngle=Math.PI/2-.04;g.autoRotate=!0;g.autoRotateSpeed=.6;let Q=-1e9;g.addEventListener("start",()=>{g.autoRotate=!1,Q=performance.now()});g.addEventListener("end",()=>Q=performance.now());const rt={uniforms:{tDiffuse:{value:null},tBloom:{value:null},resolution:{value:new A(1,1)},time:{value:0},shake:{value:new A},barrel:{value:f.lens.barrel},ca:{value:f.lens.ca},vignette:{value:f.lens.vignette},sharpen:{value:f.lens.sharpen},sharpenClamp:{value:f.lens.sharpenClamp},noise:{value:new Le(f.noise.glow,f.noise.base,f.noise.chroma,f.noise.fixed)},noiseHz:{value:f.noise.hz}},vertexShader:`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,fragmentShader:`
    uniform sampler2D tDiffuse, tBloom;
    uniform vec2 resolution, shake;
    uniform float time, barrel, ca, vignette, sharpen, sharpenClamp, noiseHz;
    uniform vec4 noise; // glow, base, chroma, fixed-pattern share
    varying vec2 vUv;

    // ACES filmic as three.js has it (Stephen Hill's fit), exposure folded in
    vec3 aces(vec3 c) {
      c *= 1.0 / 0.6;
      c = vec3(0.59719 * c.r + 0.35458 * c.g + 0.04823 * c.b,
               0.07600 * c.r + 0.90834 * c.g + 0.01566 * c.b,
               0.02840 * c.r + 0.13383 * c.g + 0.83777 * c.b);
      c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
      c = vec3(1.60475 * c.r - 0.53108 * c.g - 0.07367 * c.b,
              -0.10208 * c.r + 1.10813 * c.g - 0.00605 * c.b,
              -0.00327 * c.r - 0.07276 * c.g + 1.07602 * c.b);
      return clamp(c, 0.0, 1.0);
    }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    // hash without sine (Dave Hoskins): behaves on low-precision GPUs
    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

    float aspect() { return resolution.x / resolution.y; }
    // a trace of barrel: the source is sampled a little further out toward the corners, the whole
    // rescaled so the corners stay inside the frame
    vec2 distort(vec2 uv) {
      vec2 c = (uv - 0.5) * vec2(aspect(), 1.0);
      float corner = 0.25 * (aspect() * aspect() + 1.0);
      c *= (1.0 + barrel * dot(c, c)) / (1.0 + barrel * corner);
      return c / vec2(aspect(), 1.0) + 0.5;
    }
    vec3 hdr(vec2 uv) { return texture2D(tDiffuse, uv).rgb + texture2D(tBloom, uv).rgb; }
    vec3 tap(vec2 uv) { return aces(hdr(distort(uv) + shake)); }

    void main() {
      vec2 px = 1.0 / resolution;
      vec2 c = (vUv - 0.5) * vec2(aspect(), 1.0);
      float corner = 0.25 * (aspect() * aspect() + 1.0);
      float r2 = dot(c, c) / corner; // 0 centre \u2026 1 corners

      // centre tap with radial chromatic aberration, tiny
      vec2 duv = distort(vUv) + shake;
      vec2 off = (duv - 0.5) * ca * (0.3 + r2);
      vec3 col = aces(vec3(hdr(duv + off).r, hdr(duv).g, hdr(duv - off).b));

      // ISP sharpening: a 1 px unsharp mask on luma, clamped so the halos stay thin
      float lc = luma(col);
      float ln = (luma(tap(vUv + vec2(px.x, 0.0))) + luma(tap(vUv - vec2(px.x, 0.0))) + luma(tap(vUv + vec2(0.0, px.y))) + luma(tap(vUv - vec2(0.0, px.y)))) * 0.25;
      col += clamp((lc - ln) * sharpen, -sharpenClamp, sharpenClamp);

      // vignette
      col *= 1.0 - vignette * smoothstep(0.15, 1.0, r2);

      col = srgb(col);

      // sensor noise: a fine even grain, mostly temporal at noiseHz, a fixed pattern underneath
      float tick = floor(time * noiseHz);
      vec2 fp = gl_FragCoord.xy;
      vec2 seed = fp + vec2(tick * 13.37, tick * 7.91);
      float nT = hash(seed) + hash(seed + 41.0) - 1.0; // triangular, RMS 0.408
      float nF = hash(fp) + hash(fp + 17.0) - 1.0;
      float n = ((1.0 - noise.w) * nT + noise.w * nF) / 0.408;
      float glowAmt = smoothstep(0.02, 0.6, luma(texture2D(tBloom, duv).rgb));
      float sigma = noise.y + noise.x * glowAmt;
      vec2 cell = floor(fp / 3.0) + tick * 5.3; // chroma in 3 px blotches, as denoised video has it
      vec3 chroma = (vec3(hash(cell + 3.0), hash(cell + 5.0), hash(cell + 9.0)) - 0.5) / 0.29;
      col += n * sigma + chroma * noise.z * glowAmt;

      gl_FragColor = vec4(col, 1.0);
    }
  `};class nt extends Ie{constructor(e,a,d){super(new A(2,2),e,a,d);this.needsSwap=!1;const o=this.materialHighPassFilter;if(o.fragmentShader=`
      uniform sampler2D tDiffuse; uniform float luminosityThreshold; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tDiffuse, vUv);
        float l = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(l - luminosityThreshold, 0.0) / max(l, 1e-4);
        gl_FragColor = vec4(t.rgb * k, 1.0);
      }`,o.needsUpdate=!0,ne)for(const s of[this.renderTargetBright,...this.renderTargetsHorizontal,...this.renderTargetsVertical])s.texture.type=ae}get texture(){return this.renderTargetsHorizontal[0].texture}setSize(e,a){super.setSize(Math.round(e*.6),Math.round(a*.6))}render(e,a,d){const o=this;e.getClearColor(o._oldClearColor),o.oldClearAlpha=e.getClearAlpha();const s=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),o.highPassUniforms.tDiffuse.value=d.texture,o.highPassUniforms.luminosityThreshold.value=this.threshold,o.fsQuad.material=o.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),o.fsQuad.render(e);let r=this.renderTargetBright;for(let i=0;i<this.nMips;i++)o.fsQuad.material=this.separableBlurMaterials[i],this.separableBlurMaterials[i].uniforms.colorTexture.value=r.texture,this.separableBlurMaterials[i].uniforms.direction.value=new A(1,0),e.setRenderTarget(this.renderTargetsHorizontal[i]),e.clear(),o.fsQuad.render(e),this.separableBlurMaterials[i].uniforms.colorTexture.value=this.renderTargetsHorizontal[i].texture,this.separableBlurMaterials[i].uniforms.direction.value=new A(0,1),e.setRenderTarget(this.renderTargetsVertical[i]),e.clear(),o.fsQuad.render(e),r=this.renderTargetsVertical[i];o.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),o.fsQuad.render(e),e.setClearColor(o._oldClearColor,o.oldClearAlpha),e.autoClear=s}}const he=new ze(1,1,{type:ne?ae:De,encoding:W});he.samples=4;const D=new Ae(y,he);D.addPass(new ke(P,S));const H=new nt(f.bloom.strength,f.bloom.radius,f.bloom.threshold);D.addPass(H);const B=new Re(rt);B.uniforms.tBloom.value=H.texture;D.addPass(B);function ue(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,f.maxDpr);y.setPixelRatio(a),y.setSize(t,e,!1),D.setPixelRatio(a),D.setSize(t,e),B.uniforms.resolution.value.set(t*a,e*a),S.aspect=t/e,S.fov=t<e?f.fov+10:f.fov,S.updateProjectionMatrix()}const st=new Ve;function me(t){(!se||ie)&&Ke(),!g.autoRotate&&t-Q>4e3&&(g.autoRotate=!0),g.update();const e=g.getAzimuthalAngle();F.rotation.y=e,V.envRot.value.setFromMatrix4(st.makeRotationY(-e)),S.updateMatrixWorld(),S.matrixWorldInverse.copy(S.matrixWorld).invert(),V.axisView.value.set(0,1,0).transformDirection(S.matrixWorldInverse);const a=t/1e3;B.uniforms.time.value=a,B.uniforms.shake.value.set(9e-4*Math.sin(a*1.7)+5e-4*Math.sin(a*4.3+1),7e-4*Math.sin(a*1.1+2)+4e-4*Math.sin(a*5.1)),D.render(),requestAnimationFrame(me)}window.addEventListener("resize",ue);ue();requestAnimationFrame(me);window.__bit={scene:P,renderer:y,composer:D,bloom:H,lens:B,steel:$,steelUniforms:V,lamp:Je,rig:F,floor:U,contact:L,camera:S,controls:g,LOOK:f,THREE:Be};
