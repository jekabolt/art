import"./modulepreload-polyfill.b7f2da20.js";import{p as O,q as pe,r as W,s as ve,t as ge,u as we,v as ee,w as te,x as be,y as xe,z as ye,I as Me,A as Se,E as ae,J as D,K as x,Q as q,T as Pe,U as R,X as G,Y as Ae,Z as N,_ as X,$ as Ce,a0 as ze,a1 as ke,a2 as oe,a3 as Te,a4 as De,a5 as Re,a6 as Ve,a7 as _e,a8 as je,a9 as Oe,aa as Be,ab as Fe,ac as Ne,ad as Ee,ae as Le,af as Ue,ag as re,ah as Ie,ai as Ze,aj as Ge,ak as Xe,al as K,am as Ye,an as $e}from"./vendor.0d80995e.js";const Qe="/assets/bit/steel-grain.jpg",f={bitFraction:.38,fov:60,backdrop:new O(5.4,4.565,3.347),lamp:new O(8.4,8,7.4),bloom:{threshold:6.2,strength:.12,radius:.55},steel:{color:13159633,roughness:.1,envMapIntensity:1},hex:{color:5988197,roughness:.3,from:.593,blend:.008},detail:{scale:1,normal:.012,roughVar:.05,albedoVar:.03,wearWidth:.008,wearAmount:.1,aniso:.35,scratches:.6},lens:{barrel:.05,ca:6e-4,vignette:.07,sharpen:.22,sharpenClamp:.018},noise:{glow:0,base:.006,chroma:0,fixed:.15,hz:30},maxDpr:2},ne=document.getElementById("bit"),y=new pe({canvas:ne,antialias:!1,powerPreference:"high-performance"});y.outputEncoding=W;y.toneMapping=ve;y.physicallyCorrectLights=!0;y.shadowMap.enabled=!0;y.shadowMap.type=ge;we.init();const se=y.capabilities.isWebGL2&&(y.extensions.has("EXT_color_buffer_float")||y.extensions.has("EXT_color_buffer_half_float")),J=window.innerWidth<700,A=new ee;A.background=f.backdrop;const j=t=>new O(t,t,t);function He(t){const e=new ee,a=new Ge(10,48,24);if(t){const s=t.width,r=Math.round(s/2),i=Math.round(s/t.width*t.height),d=Math.round((r-i)/2),m=document.createElement("canvas");m.width=s,m.height=r;const u=m.getContext("2d");u.drawImage(t,0,0,t.width,1,0,0,s,d+1),u.drawImage(t,0,t.height-1,t.width,1,0,d+i-1,s,r-d-i+1),u.drawImage(t,0,d,s,i);const p=new X(m);p.encoding=Xe;const v=new R(a,new N({map:p,color:j(.6),side:K}));v.rotation.y=Math.PI/2,e.add(v)}else{const s=[],r=a.getAttribute("position");for(let i=0;i<r.count;i++){const d=r.getY(i)/10,m=r.getX(i)/10,u=r.getZ(i)/10,p=Math.atan2(m,u),v=.55+.45*Math.sin(p*3+.7)*Math.sin(p*5+2.1),h=d<0?1*Math.pow(Math.max(0,-d-.45)/.55,1.4):0,l=.05+.4*v*(1-.6*Math.abs(d))+(d>0?.35*Math.pow(d,1.5):0)+h;s.push(l*.97,l*.99,l*1.02)}a.setAttribute("color",new Ye(s,3)),e.add(new R(a,new N({vertexColors:!0,side:K})))}const c=(s,r,i,d,m,u)=>{const p=new R(new G(s,r),new N({color:i,side:$e}));p.position.set(d,m,u),p.lookAt(0,.5,0),e.add(p)};c(3.4,3,new O(5.6,5.8,6),-5.2,4.2,3.4),c(.5,.5,j(40),-4.9,6.9,4.3),c(1.2,4,j(2.4),6,1.6,-3.5);const o=j(.012);return c(4.5,2.2,o,0,.6,-7),c(2,3.5,o,-6.5,.8,-2.5),c(3,3.2,j(.05),0,1.4,6),e}let ie=!1,qe,le=!1;function Ke(){const t=new Ze(y),e=A.environment;A.environment=t.fromScene(He(qe),.02).texture,e?.dispose(),t.dispose(),ie=!0,le=!1}const B=new te;A.add(B);const P=new be(16776180,5);P.position.set(-1.9,2.9,1.3);P.castShadow=!0;P.shadow.mapSize.set(J?1024:2048,J?1024:2048);P.shadow.radius=1.6;P.shadow.blurSamples=12;P.shadow.bias=-3e-4;P.shadow.normalBias=.002;const V=P.shadow.camera;V.left=V.bottom=-1.4;V.right=V.top=1.4;V.near=.5;V.far=8;B.add(P);P.target.position.set(0,.3,0);B.add(P.target);const Je=new xe,S=new ye(f.fov,1,.01,100),Y=new x(0,.44,0);{const t=1/(f.bitFraction*2*Math.tan(f.fov*Math.PI/360)),e=new Oe(t,68*Math.PI/180,22*Math.PI/180);S.position.setFromSpherical(e).add(Y)}function ce(t,e,a){let c=0;for(let h=0;h<t.length;h++)c+=t[h];c/=t.length;const o=t.map(h=>Math.min(1,Math.max(0,h-c+.5))),s=14,r=new Float32Array(e*a),i=new Float32Array(e*a);for(let h=0;h<a;h++){let l=0;for(let n=-s;n<=s;n++)l+=o[h*e+(n+e)%e];for(let n=0;n<e;n++)r[h*e+n]=l/(2*s+1),l+=o[h*e+(n+s+1)%e]-o[h*e+(n-s+e)%e]}for(let h=0;h<e;h++){let l=0;for(let n=-s;n<=s;n++)l+=r[(n+a)%a*e+h];for(let n=0;n<a;n++)i[n*e+h]=l/(2*s+1),l+=r[(n+s+1)%a*e+h]-r[(n-s+a)%a*e+h]}let d=1,m=0;for(let h=0;h<i.length;h++)i[h]<d&&(d=i[h]),i[h]>m&&(m=i[h]);const u=new Uint8Array(e*a*4),p=7;for(let h=0;h<a;h++)for(let l=0;l<e;l++){const n=h*e+l,w=o[h*e+(l+1)%e]-o[h*e+(l-1+e)%e],b=o[(h+1)%a*e+l]-o[(h-1+a)%a*e+l],M=-w*p,C=-b*p,z=Math.sqrt(M*M+C*C+1);u[n*4]=M/z*127.5+127.5,u[n*4+1]=C/z*127.5+127.5,u[n*4+2]=o[n]*255,u[n*4+3]=(i[n]-d)/(m-d||1)*255}const v=new Be(u,e,a,Fe);return v.wrapS=v.wrapT=Ne,v.minFilter=Ee,v.magFilter=Le,v.generateMipmaps=!0,v.anisotropy=y.capabilities.getMaxAnisotropy(),v.needsUpdate=!0,v}function We(t){let e=11;const a=()=>(e=e*16807%2147483647)/2147483647,c=new Float32Array(t*t),o=(r,i)=>{const d=new Float32Array(r*r);for(let u=0;u<d.length;u++)d[u]=a();const m=u=>u*u*(3-2*u);for(let u=0;u<t;u++)for(let p=0;p<t;p++){const v=p/t*r,h=u/t*r,l=Math.floor(v),n=Math.floor(h),w=m(v-l),b=m(h-n),M=(I,F)=>d[F%r*r+I%r],C=M(l,n)+(M(l+1,n)-M(l,n))*w,z=M(l,n+1)+(M(l+1,n+1)-M(l,n+1))*w;c[u*t+p]+=(C+(z-C)*b-.5)*i}};o(8,.1),o(32,.08),o(128,.1);for(let r=0;r<c.length;r++)c[r]+=(a()-.5)*.22+.5;for(let r=0;r<t;r++)e=5;const s=new Float32Array(t);for(let r=0;r<t;r++)s[r]=(a()-.5)*.05;for(let r=0;r<t;r++)for(let i=0;i<t;i++)c[r*t+i]+=s[i];return ce(c,t,t)}let Z=We(512);new Me().load(Qe,t=>{const e=t.width,a=t.height,c=document.createElement("canvas");c.width=e,c.height=a;const o=c.getContext("2d");o.drawImage(t,0,0);const s=o.getImageData(0,0,e,a).data,r=new Float32Array(e*a);for(let d=0;d<r.length;d++)r[d]=(s[d*4]*.299+s[d*4+1]*.587+s[d*4+2]*.114)/255;const i=ce(r,e,a);Z.dispose(),Z=i,k.detailMap.value=i},void 0,()=>{});function et(){const e=document.createElement("canvas");e.width=e.height=1024;const a=e.getContext("2d");a.fillStyle="#000",a.fillRect(0,0,1024,1024);let c=1234567;const o=()=>(c=c*16807%2147483647)/2147483647;a.lineCap="round";for(let r=0;r<170;r++){const i=o()<.8,d=i?Math.PI/2+(o()-.5)*.35:o()*Math.PI,m=(i?60+o()*260:12+o()*70)*(o()<.15?1.8:1),u=o()*1024,p=o()*1024,v=Math.cos(d)*m,h=Math.sin(d)*m,l=a.createLinearGradient(u,p,u+v,p+h),n=.25+o()*.55;l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.2+o()*.2,`rgba(255,255,255,${n})`),l.addColorStop(.7+o()*.2,`rgba(255,255,255,${n*.6})`),l.addColorStop(1,"rgba(255,255,255,0)"),a.strokeStyle=l,a.lineWidth=o()<.85?.7+o()*.6:1.4+o()*.8,a.beginPath(),a.moveTo(u,p),a.lineTo(u+v,p+h),a.stroke();for(const[w,b]of[[-1024,0],[1024,0],[0,-1024],[0,1024]])a.beginPath(),a.moveTo(u+w,p+b),a.lineTo(u+v+w,p+h+b),a.stroke()}const s=new X(e);return s.wrapS=s.wrapT=Ue,s.anisotropy=8,s}const $=new Se({color:f.steel.color,metalness:1,roughness:f.steel.roughness,envMapIntensity:f.steel.envMapIntensity}),k={detailMap:{value:Z},rib:{value:new ae(1,0,0,0)},scratchMap:{value:et()},scratches:{value:f.detail.scratches},detailScale:{value:f.detail.scale},detailNormal:{value:f.detail.normal},roughVar:{value:f.detail.roughVar},albedoVar:{value:f.detail.albedoVar},wearWidth:{value:f.detail.wearWidth},wearAmount:{value:f.detail.wearAmount},aniso:{value:f.detail.aniso},hexColor:{value:new O(f.hex.color)},hexRough:{value:f.hex.roughness},hexZone:{value:new D(f.hex.from,f.hex.blend)},axisView:{value:new x(0,1,0)},envRot:{value:new q},objToView:{value:new q}};$.onBeforeCompile=t=>{Object.assign(t.uniforms,k),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
      attribute vec3 edgeDist;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
 vObjNormal = objectNormal;`).replace("#include <begin_vertex>",`#include <begin_vertex>
 vObjPos = position; vEdgeDist = edgeDist;`);const e=Pe.envmap_physical_pars_fragment.replace("vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );","vec3 worldNormal = envRot * inverseTransformDirection( normal, viewMatrix );").replace("reflectVec = inverseTransformDirection( reflectVec, viewMatrix );","reflectVec = envRot * inverseTransformDirection( reflectVec, viewMatrix );");t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
      uniform sampler2D detailMap, scratchMap; uniform vec4 rib; uniform float scratches, detailScale, detailNormal, roughVar, albedoVar, wearWidth, wearAmount, aniso;
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
      float pocketAO = 0.0;
      // the logo's pockets: every surface below the face and inside the tip's outline is a pocket wall or
      // floor (the solid inside is never seen); the room hardly reaches in there, so they read near black
      {
        float below = rib.z - vObjPos.y;
        float side = rib.x * (1.0 + below * rib.y); // the tip's half-side at this height
        float inner = 1.0 - smoothstep(side - 0.004, side - 0.0025, max(abs(vObjPos.x), abs(vObjPos.z)));
        float deep = below < 0.172 ? 1.0 : step(dot(vObjNormal.xz, vObjPos.xz), 0.0) * step(below, 0.26); // under the logo section: the pockets' cone floors face the axis, the bullet's shoulder faces out
        // and inside the bullet: where it rounds off the square's corners the turned surface is inside the square too
        float round = 1.0 - smoothstep(-0.005, -0.003, rAx - (0.1106 + min(below, 0.172) * 0.0437));
        float pocket = rib.w * inner * round * deep * smoothstep(0.0015, 0.005, below);
        pocketAO = pocket * (0.85 + 0.15 * smoothstep(0.004, 0.03, below));
      }
      // use marks: fine scratches, triplanar like the grain (the flats get them along the axis)
      float scr = texture2D(scratchMap, vObjPos.zy * 1.6 + vec2(0.31, 0.0)).r * tw.x + texture2D(scratchMap, vObjPos.xz * 1.6 + vec2(0.6, 0.2)).r * tw.y + texture2D(scratchMap, vObjPos.xy * 1.6 + vec2(0.05, 0.5)).r * tw.z;
      scr *= scratches;
      // wear: the sharp edges, worn smoother and brighter, patchily
      float edgeD = min(vEdgeDist.x, min(vEdgeDist.y, vEdgeDist.z));
      float wear = (1.0 - smoothstep(0.0, wearWidth, edgeD)) * smoothstep(0.25, 0.8, det.a + 0.25) * wearAmount;
      // two finishes: the satin hex shank, the polished neck and tip
      float onHex = 1.0 - smoothstep(hexZone.x - hexZone.y, hexZone.x + hexZone.y, vObjPos.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, hexColor, onHex);
      diffuseColor.rgb *= (1.0 + (det.a - 0.5) * albedoVar + (mottle - 0.5) * albedoVar * 0.8 + (det.b - 0.5) * albedoVar * 0.5) * (1.0 + 0.08 * wear) * (1.0 - 0.72 * cavity) * (1.0 + 0.55 * scr) * (1.0 - 0.7 * pocketAO);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
      // in the pockets the room is shut out: darkening the albedo alone leaves the Fresnel/F90 sheen
      reflectedLight.indirectSpecular *= 1.0 - 0.97 * pocketAO;
      reflectedLight.directSpecular *= 1.0 - 0.95 * pocketAO;`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
      roughnessFactor = clamp(mix(roughnessFactor, hexRough, onHex) + (det.b - 0.5) * roughVar + (mottle - 0.5) * 0.03 - 0.04 * wear + 0.45 * cavity + 0.22 * scr + 0.3 * pocketAO, 0.08, 1.0);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal = normalize(normal + objToView * pert * detailNormal * (1.0 - 0.6 * wear));
      // a faint lengthwise grind: bend the normal toward the axis-stretched highlight direction
      {
        vec3 V = normalize(vViewPosition);
        vec3 aT = cross(axisView, V);
        vec3 aN = normalize(cross(normalize(aT), axisView));
        normal = normalize(mix(normal, aN, aniso * (1.0 - roughnessFactor) * (1.0 - abs(dot(normalize(vObjNormal), vec3(0.0, 1.0, 0.0))))));
      }`)};function tt(t){const e=t.getAttribute("position");let a=0;for(let o=0;o<e.count;o++)a=Math.max(a,e.getY(o));let c=0;for(let o=0;o<e.count;o++)e.getY(o)>a-1e-4&&(c=Math.max(c,Math.abs(e.getX(o)),Math.abs(e.getZ(o))));c+=.06/25,k.rib.value.set(c,(4.5/3.78-1)/(4.3/25),a,1)}function he(t){const e=[],a=new x,c=new x,o=new x;for(let s=0;s<t.count/3;s++)a.fromBufferAttribute(t,s*3),c.fromBufferAttribute(t,s*3+1),o.fromBufferAttribute(t,s*3+2),e.push(new x().subVectors(o,c).cross(new x().subVectors(a,c)).normalize());return e}const E=(t,e)=>`${Math.round(t.getX(e)*1e4)},${Math.round(t.getY(e)*1e4)},${Math.round(t.getZ(e)*1e4)}`;function at(t,e){const a=t.getAttribute("position"),c=a.count,o=he(a),s=new Map;for(let m=0;m<c;m++){const u=E(a,m),p=s.get(u);p?p.push(Math.floor(m/3)):s.set(u,[Math.floor(m/3)])}const r=Math.cos(e*Math.PI/180),i=new Float32Array(c*3),d=new x;for(let m=0;m<c;m++){const u=o[Math.floor(m/3)];d.set(0,0,0);for(const p of s.get(E(a,m)))o[p].dot(u)>=r&&d.add(o[p]);d.normalize(),i[m*3]=d.x,i[m*3+1]=d.y,i[m*3+2]=d.z}t.setAttribute("normal",new re(i,3))}function ot(t,e){const a=t.getAttribute("position"),c=a.count,o=he(a),s=new Map,r=(l,n)=>{const w=E(a,l),b=E(a,n);return w<b?`${w}|${b}`:`${b}|${w}`};for(let l=0;l<c/3;l++)for(let n=0;n<3;n++){const w=r(l*3+n,l*3+(n+1)%3),b=s.get(w);b?b.push(l):s.set(w,[l])}const i=Math.cos(e*Math.PI/180),d=new Float32Array(c*3).fill(10),m=new x,u=new x,p=new x,v=new x,h=new x;for(let l=0;l<c/3;l++)for(let n=0;n<3;n++){const w=l*3+n,b=l*3+(n+1)%3,M=l*3+(n+2)%3,C=s.get(r(w,b));let z=!1;for(const F of C)F!==l&&o[F].dot(o[l])<i&&(z=!0);if(!z)continue;m.fromBufferAttribute(a,w),u.fromBufferAttribute(a,b),p.fromBufferAttribute(a,M),v.subVectors(u,m),h.subVectors(p,m);const I=v.clone().cross(h).length()/(v.length()||1);d[w*3+n]=0,d[b*3+n]=0,d[M*3+n]=I}t.setAttribute("edgeDist",new re(d,3))}function rt(){const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d"),a=e.createRadialGradient(64,64,0,64,64,64);return a.addColorStop(0,"rgba(0,0,0,0.7)"),a.addColorStop(.45,"rgba(0,0,0,0.25)"),a.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=a,e.fillRect(0,0,128,128),new X(t)}const L=new R(new G(8,8),new Ae({color:2303790,opacity:.55,depthWrite:!1}));L.rotation.x=-Math.PI/2;L.receiveShadow=!0;A.add(L);const U=new R(new G(.62,.62),new N({map:rt(),transparent:!0,depthWrite:!1}));U.rotation.x=-Math.PI/2;U.position.y=5e-4;A.add(U);const de=new te;A.add(de);new Ce().load("/assets/models/bit.stl",t=>{t.rotateX(-Math.PI/2),t.computeBoundingBox();const e=t.boundingBox,a=new x;e.getSize(a);const c=1/a.y;t.translate(-(e.min.x+e.max.x)/2,-e.min.y,-(e.min.z+e.max.z)/2),t.scale(c,c,c),at(t,12),ot(t,18),tt(t);const o=new R(t,$);o.castShadow=!0,k.objToView.value=o.normalMatrix,de.add(o),g.target.copy(Y),g.update()});const g=new ze(S,ne);g.target.copy(Y);g.enablePan=!1;g.enableDamping=!0;g.dampingFactor=.06;g.rotateSpeed=.7;g.minDistance=1.3;g.maxDistance=4.5;g.minPolarAngle=.12;g.maxPolarAngle=Math.PI/2-.04;g.autoRotate=!0;g.autoRotateSpeed=.6;let Q=-1e9;g.addEventListener("start",()=>{g.autoRotate=!1,Q=performance.now()});g.addEventListener("end",()=>Q=performance.now());const nt={uniforms:{tDiffuse:{value:null},tBloom:{value:null},resolution:{value:new D(1,1)},time:{value:0},shake:{value:new D},barrel:{value:f.lens.barrel},ca:{value:f.lens.ca},vignette:{value:f.lens.vignette},sharpen:{value:f.lens.sharpen},sharpenClamp:{value:f.lens.sharpenClamp},noise:{value:new ae(f.noise.glow,f.noise.base,f.noise.chroma,f.noise.fixed)},noiseHz:{value:f.noise.hz}},vertexShader:`
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
  `};class st extends Ie{constructor(e,a,c){super(new D(2,2),e,a,c);this.needsSwap=!1;const o=this.materialHighPassFilter;if(o.fragmentShader=`
      uniform sampler2D tDiffuse; uniform float luminosityThreshold; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tDiffuse, vUv);
        float l = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(l - luminosityThreshold, 0.0) / max(l, 1e-4);
        gl_FragColor = vec4(t.rgb * k, 1.0);
      }`,o.needsUpdate=!0,se)for(const s of[this.renderTargetBright,...this.renderTargetsHorizontal,...this.renderTargetsVertical])s.texture.type=oe}get texture(){return this.renderTargetsHorizontal[0].texture}setSize(e,a){super.setSize(Math.round(e*.6),Math.round(a*.6))}render(e,a,c){const o=this;e.getClearColor(o._oldClearColor),o.oldClearAlpha=e.getClearAlpha();const s=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),o.highPassUniforms.tDiffuse.value=c.texture,o.highPassUniforms.luminosityThreshold.value=this.threshold,o.fsQuad.material=o.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),o.fsQuad.render(e);let r=this.renderTargetBright;for(let i=0;i<this.nMips;i++)o.fsQuad.material=this.separableBlurMaterials[i],this.separableBlurMaterials[i].uniforms.colorTexture.value=r.texture,this.separableBlurMaterials[i].uniforms.direction.value=new D(1,0),e.setRenderTarget(this.renderTargetsHorizontal[i]),e.clear(),o.fsQuad.render(e),this.separableBlurMaterials[i].uniforms.colorTexture.value=this.renderTargetsHorizontal[i].texture,this.separableBlurMaterials[i].uniforms.direction.value=new D(0,1),e.setRenderTarget(this.renderTargetsVertical[i]),e.clear(),o.fsQuad.render(e),r=this.renderTargetsVertical[i];o.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),o.fsQuad.render(e),e.setClearColor(o._oldClearColor,o.oldClearAlpha),e.autoClear=s}}const ue=new ke(1,1,{type:se?oe:Te,encoding:W});ue.samples=4;const T=new De(y,ue);T.addPass(new Re(A,S));const H=new st(f.bloom.strength,f.bloom.radius,f.bloom.threshold);T.addPass(H);const _=new Ve(nt);_.uniforms.tBloom.value=H.texture;T.addPass(_);function me(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,f.maxDpr);y.setPixelRatio(a),y.setSize(t,e,!1),T.setPixelRatio(a),T.setSize(t,e),_.uniforms.resolution.value.set(t*a,e*a),S.aspect=t/e,S.fov=t<e?f.fov+10:f.fov,S.updateProjectionMatrix()}const it=new _e;function fe(t){(!ie||le)&&Ke(),!g.autoRotate&&t-Q>4e3&&(g.autoRotate=!0),g.update();const e=g.getAzimuthalAngle();B.rotation.y=e,k.envRot.value.setFromMatrix4(it.makeRotationY(-e)),S.updateMatrixWorld(),S.matrixWorldInverse.copy(S.matrixWorld).invert(),k.axisView.value.set(0,1,0).transformDirection(S.matrixWorldInverse);const a=t/1e3;_.uniforms.time.value=a,_.uniforms.shake.value.set(9e-4*Math.sin(a*1.7)+5e-4*Math.sin(a*4.3+1),7e-4*Math.sin(a*1.1+2)+4e-4*Math.sin(a*5.1)),T.render(),requestAnimationFrame(fe)}window.addEventListener("resize",me);me();requestAnimationFrame(fe);window.__bit={scene:A,renderer:y,composer:T,bloom:H,lens:_,steel:$,steelUniforms:k,lamp:Je,rig:B,floor:L,contact:U,camera:S,controls:g,LOOK:f,THREE:je};
