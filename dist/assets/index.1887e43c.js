import"./modulepreload-polyfill.b7f2da20.js";import{p as V,q as we,r as ee,s as ge,t as be,u as xe,v as te,I as ae,w as oe,x as P,y as L,z as ye,A as Me,E as Se,J as Ae,K as Te,Q as x,T as J,U as Ce,X as ze,Y as U,Z as re,_ as De,$ as Pe,a0 as Ve,a1 as ne,a2 as _e,a3 as Re,a4 as Be,a5 as Fe,a6 as ke,a7 as je,a8 as Ue,a9 as Ee,aa as Le,ab as Ne,ac as Oe,ad as Ie,ae as Ge,af as se,ag as k,ah as Xe,ai as Ye,aj as Ze,ak as Qe,al as $e,am as W,an as qe,ao as He}from"./vendor.5d5a970a.js";const Ke="/assets/bit/steel-grain.jpg",Je="/assets/bit/studio-env.jpg",v={bitFraction:.38,fov:60,backdrop:new V(3.947,3.504,2.282),lamp:new V(7.2,6.8,6),bloom:{threshold:4.3,strength:.16,radius:.6},steel:{color:6449784,roughness:.4,envMapIntensity:1},detail:{scale:1,normal:.08,roughVar:.06,albedoVar:.05,wearWidth:.008,wearAmount:.15,aniso:.25},lens:{barrel:.05,ca:.0016,vignette:.07,sharpen:.6,sharpenClamp:.035},noise:{glow:0,base:.012,chroma:0,fixed:.15,hz:30},maxDpr:1.5},ie=document.getElementById("bit"),y=new we({canvas:ie,antialias:!1,powerPreference:"high-performance"});y.outputEncoding=ee;y.toneMapping=ge;y.physicallyCorrectLights=!0;y.shadowMap.enabled=!0;y.shadowMap.type=be;xe.init();const le=y.capabilities.isWebGL2&&(y.extensions.has("EXT_color_buffer_float")||y.extensions.has("EXT_color_buffer_half_float")),Y=window.innerWidth<700,T=new te;T.background=v.backdrop;const z=t=>new V(t,t,t);function We(t){const e=new te,a=new Qe(10,48,24);if(t){const o=t.width,i=Math.round(o/2),r=Math.round(o/t.width*t.height),n=Math.round((i-r)/2),u=document.createElement("canvas");u.width=o,u.height=i;const m=u.getContext("2d");m.drawImage(t,0,0,t.width,1,0,0,o,n+1),m.drawImage(t,0,t.height-1,t.width,1,0,n+r-1,o,i-n-r+1),m.drawImage(t,0,n,o,r);const h=new re(u);h.encoding=$e;const p=new P(a,new U({map:h,color:z(.6),side:W}));p.rotation.y=Math.PI/2,e.add(p)}else{const o=[],i=a.getAttribute("position");for(let r=0;r<i.count;r++){const n=i.getY(r)/10,u=Math.max(0,-i.getZ(r)/10),m=(n>0?.55+.2*n:.55+.25*n)+.9*u*u;o.push(m,m*.96,m*.88)}a.setAttribute("color",new qe(o,3)),e.add(new P(a,new U({vertexColors:!0,side:W})))}const l=(o,i,r,n,u,m)=>{const h=new P(new L(o,i),new U({color:r,side:He}));h.position.set(n,u,m),h.lookAt(0,.5,0),e.add(h)};return l(3.2,2.4,new V(2.2,2.05,1.85),0,1,-6),l(.9,4,z(1.8),-4.5,1.2,-4.5),l(.9,4,z(1.8),4.5,1.2,-4.5),l(6,4,z(.9),0,8,-1),l(4,3.2,z(.05),0,1,5),l(2.5,6,z(.04),-5,1,4.5),l(2.5,6,z(.04),5,1,4.5),e}let ce=!1,de,Q=!1;function et(){const t=new Ze(y),e=T.environment;T.environment=t.fromScene(We(de),.02).texture,e?.dispose(),t.dispose(),ce=!0,Q=!1}new ae().load(Je,t=>{de=t,Q=!0},void 0,()=>{});const R=new oe;T.add(R);const N=(t,e,a,l,o,i,r)=>{const n=new Ue(a,l,t,e);return n.position.set(o,i,r),R.add(n),n.lookAt(0,.5,0),n};N(1.3,1.8,new V(1,.94,.86),2.4,.7,.95,-1.3);N(.8,2.2,new V(1,.95,.9),1.5,-1.1,.55,-1.1);N(1.6,1.6,new V(.85,.92,1),.45,-1.6,1.4,1.8);N(.5,2,z(1),1,1.7,.7,.2);const O=new P(new L(2.6,2.6),new ye({uniforms:{color:{value:v.lamp}},vertexShader:"varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",fragmentShader:`
      uniform vec3 color; varying vec2 vUv;
      void main() {
        vec2 c = (vUv - 0.5) * 2.0;
        float r2 = dot(c, c);
        float a = exp(-r2 * 6.0) * (1.0 - smoothstep(0.7, 1.0, r2));
        gl_FragColor = vec4(color * a, 1.0);
      }`,blending:Me,transparent:!0,depthWrite:!1}));O.position.set(.25,1.08,-1.7);O.renderOrder=-1;R.add(O);const A=new Se(16773340,3,0,.5,.6,2);A.position.set(.3,2.6,-1.7);A.castShadow=!0;A.shadow.mapSize.set(Y?512:1024,Y?512:1024);A.shadow.radius=14;A.shadow.blurSamples=16;A.shadow.bias=-4e-4;A.shadow.camera.near=.5;A.shadow.camera.far=8;R.add(A);A.target.position.set(0,.25,0);R.add(A.target);const S=new Ae(v.fov,1,.01,100),$=new x(0,.44,0);{const t=1/(v.bitFraction*2*Math.tan(v.fov*Math.PI/360)),e=new Ee(t,68*Math.PI/180,22*Math.PI/180);S.position.setFromSpherical(e).add($)}function ue(t,e,a){let l=0;for(let c=0;c<t.length;c++)l+=t[c];l/=t.length;const o=t.map(c=>Math.min(1,Math.max(0,c-l+.5))),i=14,r=new Float32Array(e*a),n=new Float32Array(e*a);for(let c=0;c<a;c++){let d=0;for(let s=-i;s<=i;s++)d+=o[c*e+(s+e)%e];for(let s=0;s<e;s++)r[c*e+s]=d/(2*i+1),d+=o[c*e+(s+i+1)%e]-o[c*e+(s-i+e)%e]}for(let c=0;c<e;c++){let d=0;for(let s=-i;s<=i;s++)d+=r[(s+a)%a*e+c];for(let s=0;s<a;s++)n[s*e+c]=d/(2*i+1),d+=r[(s+i+1)%a*e+c]-r[(s-i+a)%a*e+c]}let u=1,m=0;for(let c=0;c<n.length;c++)n[c]<u&&(u=n[c]),n[c]>m&&(m=n[c]);const h=new Uint8Array(e*a*4),p=7;for(let c=0;c<a;c++)for(let d=0;d<e;d++){const s=c*e+d,g=o[c*e+(d+1)%e]-o[c*e+(d-1+e)%e],b=o[(c+1)%a*e+d]-o[(c-1+a)%a*e+d],M=-g*p,C=-b*p,D=Math.sqrt(M*M+C*C+1);h[s*4]=M/D*127.5+127.5,h[s*4+1]=C/D*127.5+127.5,h[s*4+2]=o[s]*255,h[s*4+3]=(n[s]-u)/(m-u||1)*255}const w=new Le(h,e,a,Ne);return w.wrapS=w.wrapT=Oe,w.minFilter=Ie,w.magFilter=Ge,w.generateMipmaps=!0,w.anisotropy=y.capabilities.getMaxAnisotropy(),w.needsUpdate=!0,w}function tt(t){let e=11;const a=()=>(e=e*16807%2147483647)/2147483647,l=new Float32Array(t*t),o=(r,n)=>{const u=new Float32Array(r*r);for(let h=0;h<u.length;h++)u[h]=a();const m=h=>h*h*(3-2*h);for(let h=0;h<t;h++)for(let p=0;p<t;p++){const w=p/t*r,c=h/t*r,d=Math.floor(w),s=Math.floor(c),g=m(w-d),b=m(c-s),M=(X,j)=>u[j%r*r+X%r],C=M(d,s)+(M(d+1,s)-M(d,s))*g,D=M(d,s+1)+(M(d+1,s+1)-M(d,s+1))*g;l[h*t+p]+=(C+(D-C)*b-.5)*n}};o(8,.1),o(32,.08),o(128,.1);for(let r=0;r<l.length;r++)l[r]+=(a()-.5)*.22+.5;for(let r=0;r<t;r++)e=5;const i=new Float32Array(t);for(let r=0;r<t;r++)i[r]=(a()-.5)*.05;for(let r=0;r<t;r++)for(let n=0;n<t;n++)l[r*t+n]+=i[n];return ue(l,t,t)}let Z=tt(512);new ae().load(Ke,t=>{const e=t.width,a=t.height,l=document.createElement("canvas");l.width=e,l.height=a;const o=l.getContext("2d");o.drawImage(t,0,0);const i=o.getImageData(0,0,e,a).data,r=new Float32Array(e*a);for(let u=0;u<r.length;u++)r[u]=(i[u*4]*.299+i[u*4+1]*.587+i[u*4+2]*.114)/255;const n=ue(r,e,a);Z.dispose(),Z=n,B.detailMap.value=n},void 0,()=>{});const q=new Te({color:v.steel.color,metalness:1,roughness:v.steel.roughness,envMapIntensity:v.steel.envMapIntensity}),B={detailMap:{value:Z},detailScale:{value:v.detail.scale},detailNormal:{value:v.detail.normal},roughVar:{value:v.detail.roughVar},albedoVar:{value:v.detail.albedoVar},wearWidth:{value:v.detail.wearWidth},wearAmount:{value:v.detail.wearAmount},aniso:{value:v.detail.aniso},axisView:{value:new x(0,1,0)},envRot:{value:new J},objToView:{value:new J}};q.onBeforeCompile=t=>{Object.assign(t.uniforms,B),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
      attribute vec3 edgeDist;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
 vObjNormal = objectNormal;`).replace("#include <begin_vertex>",`#include <begin_vertex>
 vObjPos = position; vEdgeDist = edgeDist;`);const e=Ce.envmap_physical_pars_fragment.replace("vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );","vec3 worldNormal = envRot * inverseTransformDirection( normal, viewMatrix );").replace("reflectVec = inverseTransformDirection( reflectVec, viewMatrix );","reflectVec = envRot * inverseTransformDirection( reflectVec, viewMatrix );");t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
      uniform sampler2D detailMap; uniform float detailScale, detailNormal, roughVar, albedoVar, wearWidth, wearAmount, aniso;
      uniform vec3 axisView;
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
      // wear: the sharp edges, worn smoother and brighter, patchily
      float edgeD = min(vEdgeDist.x, min(vEdgeDist.y, vEdgeDist.z));
      float wear = (1.0 - smoothstep(0.0, wearWidth, edgeD)) * smoothstep(0.25, 0.8, det.a + 0.25) * wearAmount;
      diffuseColor.rgb *= (1.0 + (det.a - 0.5) * albedoVar + (mottle - 0.5) * albedoVar * 0.8 + (det.b - 0.5) * albedoVar * 0.5) * (1.0 + 0.08 * wear);`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + (det.b - 0.5) * roughVar + (mottle - 0.5) * 0.03 - 0.04 * wear, 0.08, 1.0);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal = normalize(normal + objToView * pert * detailNormal * (1.0 - 0.6 * wear));
      // a faint lengthwise grind: bend the normal toward the axis-stretched highlight direction
      {
        vec3 V = normalize(vViewPosition);
        vec3 aT = cross(axisView, V);
        vec3 aN = normalize(cross(normalize(aT), axisView));
        normal = normalize(mix(normal, aN, aniso * (1.0 - roughnessFactor) * (1.0 - abs(dot(normalize(vObjNormal), vec3(0.0, 1.0, 0.0))))));
      }`)};function me(t){const e=[],a=new x,l=new x,o=new x;for(let i=0;i<t.count/3;i++)a.fromBufferAttribute(t,i*3),l.fromBufferAttribute(t,i*3+1),o.fromBufferAttribute(t,i*3+2),e.push(new x().subVectors(o,l).cross(new x().subVectors(a,l)).normalize());return e}const E=(t,e)=>`${Math.round(t.getX(e)*1e4)},${Math.round(t.getY(e)*1e4)},${Math.round(t.getZ(e)*1e4)}`;function at(t,e){const a=t.getAttribute("position"),l=a.count,o=me(a),i=new Map;for(let m=0;m<l;m++){const h=E(a,m),p=i.get(h);p?p.push(Math.floor(m/3)):i.set(h,[Math.floor(m/3)])}const r=Math.cos(e*Math.PI/180),n=new Float32Array(l*3),u=new x;for(let m=0;m<l;m++){const h=o[Math.floor(m/3)];u.set(0,0,0);for(const p of i.get(E(a,m)))o[p].dot(h)>=r&&u.add(o[p]);u.normalize(),n[m*3]=u.x,n[m*3+1]=u.y,n[m*3+2]=u.z}t.setAttribute("normal",new se(n,3))}function ot(t,e){const a=t.getAttribute("position"),l=a.count,o=me(a),i=new Map,r=(d,s)=>{const g=E(a,d),b=E(a,s);return g<b?`${g}|${b}`:`${b}|${g}`};for(let d=0;d<l/3;d++)for(let s=0;s<3;s++){const g=r(d*3+s,d*3+(s+1)%3),b=i.get(g);b?b.push(d):i.set(g,[d])}const n=Math.cos(e*Math.PI/180),u=new Float32Array(l*3).fill(10),m=new x,h=new x,p=new x,w=new x,c=new x;for(let d=0;d<l/3;d++)for(let s=0;s<3;s++){const g=d*3+s,b=d*3+(s+1)%3,M=d*3+(s+2)%3,C=i.get(r(g,b));let D=!1;for(const j of C)j!==d&&o[j].dot(o[d])<n&&(D=!0);if(!D)continue;m.fromBufferAttribute(a,g),h.fromBufferAttribute(a,b),p.fromBufferAttribute(a,M),w.subVectors(h,m),c.subVectors(p,m);const X=w.clone().cross(c).length()/(w.length()||1);u[g*3+s]=0,u[b*3+s]=0,u[M*3+s]=X}t.setAttribute("edgeDist",new se(u,3))}function rt(){const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d"),a=e.createRadialGradient(64,64,0,64,64,64);return a.addColorStop(0,"rgba(0,0,0,0.7)"),a.addColorStop(.45,"rgba(0,0,0,0.25)"),a.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=a,e.fillRect(0,0,128,128),new re(t)}const I=new P(new L(8,8),new ze({color:1710102,opacity:.3,depthWrite:!1}));I.rotation.x=-Math.PI/2;I.receiveShadow=!0;T.add(I);const G=new P(new L(.62,.62),new U({map:rt(),transparent:!0,depthWrite:!1}));G.rotation.x=-Math.PI/2;G.position.y=5e-4;T.add(G);const he=new oe;T.add(he);new De().load("/assets/models/bit.stl",t=>{t.rotateX(-Math.PI/2),t.computeBoundingBox();const e=t.boundingBox,a=new x;e.getSize(a);const l=1/a.y;t.translate(-(e.min.x+e.max.x)/2,-e.min.y,-(e.min.z+e.max.z)/2),t.scale(l,l,l),at(t,32),ot(t,18);const o=new P(t,q);o.castShadow=!0,B.objToView.value=o.normalMatrix,he.add(o),f.target.copy($),f.update()});const f=new Pe(S,ie);f.target.copy($);f.enablePan=!1;f.enableDamping=!0;f.dampingFactor=.06;f.rotateSpeed=.7;f.minDistance=1.3;f.maxDistance=4.5;f.minPolarAngle=.12;f.maxPolarAngle=Math.PI/2-.04;f.autoRotate=!0;f.autoRotateSpeed=.6;let H=-1e9;f.addEventListener("start",()=>{f.autoRotate=!1,H=performance.now()});f.addEventListener("end",()=>H=performance.now());const nt={uniforms:{tDiffuse:{value:null},tBloom:{value:null},resolution:{value:new k(1,1)},time:{value:0},shake:{value:new k},barrel:{value:v.lens.barrel},ca:{value:v.lens.ca},vignette:{value:v.lens.vignette},sharpen:{value:v.lens.sharpen},sharpenClamp:{value:v.lens.sharpenClamp},noise:{value:new Xe(v.noise.glow,v.noise.base,v.noise.chroma,v.noise.fixed)},noiseHz:{value:v.noise.hz}},vertexShader:`
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
  `};class st extends Ye{constructor(e,a,l){super(new k(2,2),e,a,l);this.needsSwap=!1;const o=this.materialHighPassFilter;if(o.fragmentShader=`
      uniform sampler2D tDiffuse; uniform float luminosityThreshold; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tDiffuse, vUv);
        float l = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(l - luminosityThreshold, 0.0) / max(l, 1e-4);
        gl_FragColor = vec4(t.rgb * k, 1.0);
      }`,o.needsUpdate=!0,le)for(const i of[this.renderTargetBright,...this.renderTargetsHorizontal,...this.renderTargetsVertical])i.texture.type=ne}get texture(){return this.renderTargetsHorizontal[0].texture}setSize(e,a){super.setSize(Math.round(e*.6),Math.round(a*.6))}render(e,a,l){const o=this;e.getClearColor(o._oldClearColor),o.oldClearAlpha=e.getClearAlpha();const i=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),o.highPassUniforms.tDiffuse.value=l.texture,o.highPassUniforms.luminosityThreshold.value=this.threshold,o.fsQuad.material=o.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),o.fsQuad.render(e);let r=this.renderTargetBright;for(let n=0;n<this.nMips;n++)o.fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=r.texture,this.separableBlurMaterials[n].uniforms.direction.value=new k(1,0),e.setRenderTarget(this.renderTargetsHorizontal[n]),e.clear(),o.fsQuad.render(e),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=new k(0,1),e.setRenderTarget(this.renderTargetsVertical[n]),e.clear(),o.fsQuad.render(e),r=this.renderTargetsVertical[n];o.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),o.fsQuad.render(e),e.setClearColor(o._oldClearColor,o.oldClearAlpha),e.autoClear=i}}const ve=new Ve(1,1,{type:le?ne:_e,encoding:ee});ve.samples=Y?2:4;const _=new Re(y,ve);_.addPass(new Be(T,S));const K=new st(v.bloom.strength,v.bloom.radius,v.bloom.threshold);_.addPass(K);const F=new Fe(nt);F.uniforms.tBloom.value=K.texture;_.addPass(F);function fe(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,v.maxDpr);y.setPixelRatio(a),y.setSize(t,e,!1),_.setPixelRatio(a),_.setSize(t,e),F.uniforms.resolution.value.set(t*a,e*a),S.aspect=t/e,S.fov=t<e?v.fov-5:v.fov,S.updateProjectionMatrix()}const it=new ke;function pe(t){(!ce||Q)&&et(),!f.autoRotate&&t-H>4e3&&(f.autoRotate=!0),f.update();const e=f.getAzimuthalAngle();R.rotation.y=e,B.envRot.value.setFromMatrix4(it.makeRotationY(-e)),S.updateMatrixWorld(),S.matrixWorldInverse.copy(S.matrixWorld).invert(),B.axisView.value.set(0,1,0).transformDirection(S.matrixWorldInverse);const a=t/1e3;F.uniforms.time.value=a,F.uniforms.shake.value.set(9e-4*Math.sin(a*1.7)+5e-4*Math.sin(a*4.3+1),7e-4*Math.sin(a*1.1+2)+4e-4*Math.sin(a*5.1)),_.render(),requestAnimationFrame(pe)}window.addEventListener("resize",fe);fe();requestAnimationFrame(pe);window.__bit={scene:T,renderer:y,composer:_,bloom:K,lens:F,steel:q,steelUniforms:B,lamp:O,rig:R,floor:I,contact:G,camera:S,controls:f,LOOK:v,THREE:je};
