import"./modulepreload-polyfill.b7f2da20.js";import{p as F,q as ge,r as ee,s as we,t as xe,u as be,v as te,w as ae,x as oe,y as ye,z as Me,I as Se,A as ze,E as re,J as _,K as b,Q as K,T as Ce,U as R,X,Y as ke,Z as E,_ as Y,$ as Ae,a0 as Pe,a1 as De,a2 as se,a3 as Te,a4 as _e,a5 as Re,a6 as Be,a7 as Oe,a8 as Ve,a9 as je,aa as Fe,ab as Ne,ac as Le,ad as Ee,ae as Ue,af as Ie,ag as ne,ah as Ge,ai as Ze,aj as Xe,ak as Ye,al as J,am as $e,an as He}from"./vendor.0d80995e.js";const Qe="/assets/bit/steel-grain.jpg",f={bitFraction:.38,fov:60,backdrop:new F(5.4,4.565,3.347),lamp:new F(8.4,8,7.4),bloom:{threshold:6.2,strength:.12,radius:.55},steel:{color:13159633,roughness:.1,envMapIntensity:1},hex:{color:5988197,roughness:.3,from:.593,blend:.008},detail:{scale:1,normal:.012,roughVar:.05,albedoVar:.03,wearWidth:.008,wearAmount:.1,aniso:.35,scratches:.6},lens:{barrel:.05,ca:6e-4,vignette:.07,sharpen:.22,sharpenClamp:.018},noise:{glow:0,base:.011,chroma:0,fixed:.15,hz:30},maxDpr:2},ie=document.getElementById("bit"),y=new ge({canvas:ie,antialias:!1,powerPreference:"high-performance"});y.outputEncoding=ee;y.toneMapping=we;y.physicallyCorrectLights=!0;y.shadowMap.enabled=!0;y.shadowMap.type=xe;be.init();const le=y.capabilities.isWebGL2&&(y.extensions.has("EXT_color_buffer_float")||y.extensions.has("EXT_color_buffer_half_float")),W=window.innerWidth<700,C=new te;C.background=f.backdrop;const j=t=>new F(t,t,t);function qe(t){const e=new te,a=new Xe(10,48,24);if(t){const n=t.width,r=Math.round(n/2),i=Math.round(n/t.width*t.height),h=Math.round((r-i)/2),m=document.createElement("canvas");m.width=n,m.height=r;const u=m.getContext("2d");u.drawImage(t,0,0,t.width,1,0,0,n,h+1),u.drawImage(t,0,t.height-1,t.width,1,0,h+i-1,n,r-h-i+1),u.drawImage(t,0,h,n,i);const p=new Y(m);p.encoding=Ye;const v=new R(a,new E({map:p,color:j(.6),side:J}));v.rotation.y=Math.PI/2,e.add(v)}else{const n=[],r=a.getAttribute("position");for(let i=0;i<r.count;i++){const h=r.getY(i)/10,m=r.getX(i)/10,u=r.getZ(i)/10,p=Math.atan2(m,u),v=.55+.45*Math.sin(p*3+.7)*Math.sin(p*5+2.1),d=h<0?1*Math.pow(Math.max(0,-h-.45)/.55,1.4):0,l=.05+.4*v*(1-.6*Math.abs(h))+(h>0?.35*Math.pow(h,1.5):0)+d;n.push(l*.97,l*.99,l*1.02)}a.setAttribute("color",new $e(n,3)),e.add(new R(a,new E({vertexColors:!0,side:J})))}const c=(n,r,i,h,m,u)=>{const p=new R(new X(n,r),new E({color:i,side:He}));p.position.set(h,m,u),p.lookAt(0,.5,0),e.add(p)};c(3.4,3,new F(5.6,5.8,6),-5.2,4.2,3.4),c(.5,.5,j(40),-4.9,6.9,4.3),c(1.2,4,j(2.4),6,1.6,-3.5);const o=j(.012);return c(4.5,2.2,o,0,.6,-7),c(2,3.5,o,-6.5,.8,-2.5),c(3,3.2,j(.05),0,1.4,6),e}let ce=!1,Ke,de=!1;function Je(){const t=new Ze(y),e=C.environment;C.environment=t.fromScene(qe(Ke),.02).texture,e?.dispose(),t.dispose(),ce=!0,de=!1}const V=new ae;C.add(V);const S=new oe(16776180,5);S.position.set(-1.9,2.9,1.3);S.castShadow=!0;S.shadow.mapSize.set(W?1024:2048,W?1024:2048);S.shadow.radius=1.6;S.shadow.blurSamples=12;S.shadow.bias=-3e-4;S.shadow.normalBias=.002;const B=S.shadow.camera;B.left=B.bottom=-1.4;B.right=B.top=1.4;B.near=.5;B.far=8;V.add(S);S.target.position.set(0,.3,0);V.add(S.target);const k=new oe(16777215,0);k.position.copy(S.position);k.castShadow=!0;k.shadow.mapSize.set(1024,1024);k.shadow.radius=6;k.shadow.blurSamples=16;k.shadow.bias=-5e-4;Object.assign(k.shadow.camera,{left:-1.4,bottom:-1.4,right:1.4,top:1.4,near:.5,far:8});V.add(k);k.target=S.target;const We=new ye,z=new Me(f.fov,1,.01,100),$=new b(0,.44,0);{const t=1/(f.bitFraction*2*Math.tan(f.fov*Math.PI/360)),e=new je(t,68*Math.PI/180,22*Math.PI/180);z.position.setFromSpherical(e).add($)}function he(t,e,a){let c=0;for(let d=0;d<t.length;d++)c+=t[d];c/=t.length;const o=t.map(d=>Math.min(1,Math.max(0,d-c+.5))),n=14,r=new Float32Array(e*a),i=new Float32Array(e*a);for(let d=0;d<a;d++){let l=0;for(let s=-n;s<=n;s++)l+=o[d*e+(s+e)%e];for(let s=0;s<e;s++)r[d*e+s]=l/(2*n+1),l+=o[d*e+(s+n+1)%e]-o[d*e+(s-n+e)%e]}for(let d=0;d<e;d++){let l=0;for(let s=-n;s<=n;s++)l+=r[(s+a)%a*e+d];for(let s=0;s<a;s++)i[s*e+d]=l/(2*n+1),l+=r[(s+n+1)%a*e+d]-r[(s-n+a)%a*e+d]}let h=1,m=0;for(let d=0;d<i.length;d++)i[d]<h&&(h=i[d]),i[d]>m&&(m=i[d]);const u=new Uint8Array(e*a*4),p=7;for(let d=0;d<a;d++)for(let l=0;l<e;l++){const s=d*e+l,w=o[d*e+(l+1)%e]-o[d*e+(l-1+e)%e],x=o[(d+1)%a*e+l]-o[(d-1+a)%a*e+l],M=-w*p,A=-x*p,P=Math.sqrt(M*M+A*A+1);u[s*4]=M/P*127.5+127.5,u[s*4+1]=A/P*127.5+127.5,u[s*4+2]=o[s]*255,u[s*4+3]=(i[s]-h)/(m-h||1)*255}const v=new Fe(u,e,a,Ne);return v.wrapS=v.wrapT=Le,v.minFilter=Ee,v.magFilter=Ue,v.generateMipmaps=!0,v.anisotropy=y.capabilities.getMaxAnisotropy(),v.needsUpdate=!0,v}function et(t){let e=11;const a=()=>(e=e*16807%2147483647)/2147483647,c=new Float32Array(t*t),o=(r,i)=>{const h=new Float32Array(r*r);for(let u=0;u<h.length;u++)h[u]=a();const m=u=>u*u*(3-2*u);for(let u=0;u<t;u++)for(let p=0;p<t;p++){const v=p/t*r,d=u/t*r,l=Math.floor(v),s=Math.floor(d),w=m(v-l),x=m(d-s),M=(G,L)=>h[L%r*r+G%r],A=M(l,s)+(M(l+1,s)-M(l,s))*w,P=M(l,s+1)+(M(l+1,s+1)-M(l,s+1))*w;c[u*t+p]+=(A+(P-A)*x-.5)*i}};o(8,.1),o(32,.08),o(128,.1);for(let r=0;r<c.length;r++)c[r]+=(a()-.5)*.22+.5;for(let r=0;r<t;r++)e=5;const n=new Float32Array(t);for(let r=0;r<t;r++)n[r]=(a()-.5)*.05;for(let r=0;r<t;r++)for(let i=0;i<t;i++)c[r*t+i]+=n[i];return he(c,t,t)}let Z=et(512);new Se().load(Qe,t=>{const e=t.width,a=t.height,c=document.createElement("canvas");c.width=e,c.height=a;const o=c.getContext("2d");o.drawImage(t,0,0);const n=o.getImageData(0,0,e,a).data,r=new Float32Array(e*a);for(let h=0;h<r.length;h++)r[h]=(n[h*4]*.299+n[h*4+1]*.587+n[h*4+2]*.114)/255;const i=he(r,e,a);Z.dispose(),Z=i,D.detailMap.value=i},void 0,()=>{});function tt(){const e=document.createElement("canvas");e.width=e.height=1024;const a=e.getContext("2d");a.fillStyle="#000",a.fillRect(0,0,1024,1024);let c=1234567;const o=()=>(c=c*16807%2147483647)/2147483647;a.lineCap="round";for(let r=0;r<170;r++){const i=o()<.8,h=i?Math.PI/2+(o()-.5)*.35:o()*Math.PI,m=(i?60+o()*260:12+o()*70)*(o()<.15?1.8:1),u=o()*1024,p=o()*1024,v=Math.cos(h)*m,d=Math.sin(h)*m,l=a.createLinearGradient(u,p,u+v,p+d),s=.25+o()*.55;l.addColorStop(0,"rgba(255,255,255,0)"),l.addColorStop(.2+o()*.2,`rgba(255,255,255,${s})`),l.addColorStop(.7+o()*.2,`rgba(255,255,255,${s*.6})`),l.addColorStop(1,"rgba(255,255,255,0)"),a.strokeStyle=l,a.lineWidth=o()<.85?.7+o()*.6:1.4+o()*.8,a.beginPath(),a.moveTo(u,p),a.lineTo(u+v,p+d),a.stroke();for(const[w,x]of[[-1024,0],[1024,0],[0,-1024],[0,1024]])a.beginPath(),a.moveTo(u+w,p+x),a.lineTo(u+v+w,p+d+x),a.stroke()}const n=new Y(e);return n.wrapS=n.wrapT=Ie,n.anisotropy=8,n}const H=new ze({color:f.steel.color,metalness:1,roughness:f.steel.roughness,envMapIntensity:f.steel.envMapIntensity}),D={detailMap:{value:Z},rib:{value:new re(1,0,0,0)},scratchMap:{value:tt()},scratches:{value:f.detail.scratches},detailScale:{value:f.detail.scale},detailNormal:{value:f.detail.normal},roughVar:{value:f.detail.roughVar},albedoVar:{value:f.detail.albedoVar},wearWidth:{value:f.detail.wearWidth},wearAmount:{value:f.detail.wearAmount},aniso:{value:f.detail.aniso},hexColor:{value:new F(f.hex.color)},hexRough:{value:f.hex.roughness},hexZone:{value:new _(f.hex.from,f.hex.blend)},axisView:{value:new b(0,1,0)},envRot:{value:new K},objToView:{value:new K}};H.onBeforeCompile=t=>{Object.assign(t.uniforms,D),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
      attribute vec3 edgeDist;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
 vObjNormal = objectNormal;`).replace("#include <begin_vertex>",`#include <begin_vertex>
 vObjPos = position; vEdgeDist = edgeDist;`);const e=Ce.envmap_physical_pars_fragment.replace("vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );","vec3 worldNormal = envRot * inverseTransformDirection( normal, viewMatrix );").replace("reflectVec = inverseTransformDirection( reflectVec, viewMatrix );","reflectVec = envRot * inverseTransformDirection( reflectVec, viewMatrix );");t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
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
        // the turned outer surface at this height (mm): the 2.5\xB0 cone over the logo section, the R3 shoulder under it
        float zmm = 25.0 * (1.0 - below);
        float rOut = (zmm >= 20.7 ? 2.765 + (25.0 - zmm) * 0.04366 : -0.05 + sqrt(max(0.0, 9.0 - (20.7 - zmm) * (20.7 - zmm)))) / 25.0;
        float deep = (1.0 - smoothstep(rOut - 0.005, rOut - 0.003, rAx)) * step(below, 0.27);
        // and inside the pockets' run-out cone (apex on the axis at z 19.2, r 3.44 at the logo section's base):
        // below the section the ground flanks run on inside the square too, but outside this cone
        deep *= 1.0 - smoothstep(-0.06, 0.0, rAx * 25.0 - (zmm - 19.2) * 2.29);
        float pocket = rib.w * inner * deep * smoothstep(0.0015, 0.005, below);
        pocketAO = pocket * (0.9 + 0.1 * smoothstep(0.004, 0.02, below));
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
      reflectedLight.directSpecular *= 1.0 - pocketAO; // no sun in there: nothing glints in the pockets`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
      roughnessFactor = clamp(mix(roughnessFactor, hexRough, onHex) + (det.b - 0.5) * roughVar + (mottle - 0.5) * 0.03 - 0.04 * wear + 0.45 * cavity + 0.22 * scr + 0.3 * pocketAO, 0.08, 1.0);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal = normalize(normal + objToView * pert * detailNormal * (1.0 - 0.6 * wear));
      // a faint lengthwise grind: bend the normal toward the axis-stretched highlight direction
      {
        vec3 V = normalize(vViewPosition);
        vec3 aT = cross(axisView, V);
        vec3 aN = normalize(cross(normalize(aT), axisView));
        normal = normalize(mix(normal, aN, aniso * (1.0 - roughnessFactor) * (1.0 - abs(dot(normalize(vObjNormal), vec3(0.0, 1.0, 0.0))))));
      }`)};function at(t){const e=t.getAttribute("position");let a=0;for(let o=0;o<e.count;o++)a=Math.max(a,e.getY(o));let c=0;for(let o=0;o<e.count;o++)e.getY(o)>a-1e-4&&(c=Math.max(c,Math.abs(e.getX(o)),Math.abs(e.getZ(o))));c+=.06/25,D.rib.value.set(c,(4.5/3.78-1)/(4.3/25),a,1)}function ue(t){const e=[],a=new b,c=new b,o=new b;for(let n=0;n<t.count/3;n++)a.fromBufferAttribute(t,n*3),c.fromBufferAttribute(t,n*3+1),o.fromBufferAttribute(t,n*3+2),e.push(new b().subVectors(o,c).cross(new b().subVectors(a,c)).normalize());return e}const U=(t,e)=>`${Math.round(t.getX(e)*1e4)},${Math.round(t.getY(e)*1e4)},${Math.round(t.getZ(e)*1e4)}`;function ot(t,e){const a=t.getAttribute("position"),c=a.count,o=ue(a),n=new Map;for(let m=0;m<c;m++){const u=U(a,m),p=n.get(u);p?p.push(Math.floor(m/3)):n.set(u,[Math.floor(m/3)])}const r=Math.cos(e*Math.PI/180),i=new Float32Array(c*3),h=new b;for(let m=0;m<c;m++){const u=o[Math.floor(m/3)];h.set(0,0,0);for(const p of n.get(U(a,m)))o[p].dot(u)>=r&&h.add(o[p]);h.normalize(),i[m*3]=h.x,i[m*3+1]=h.y,i[m*3+2]=h.z}t.setAttribute("normal",new ne(i,3))}function rt(t,e){const a=t.getAttribute("position"),c=a.count,o=ue(a),n=new Map,r=(l,s)=>{const w=U(a,l),x=U(a,s);return w<x?`${w}|${x}`:`${x}|${w}`};for(let l=0;l<c/3;l++)for(let s=0;s<3;s++){const w=r(l*3+s,l*3+(s+1)%3),x=n.get(w);x?x.push(l):n.set(w,[l])}const i=Math.cos(e*Math.PI/180),h=new Float32Array(c*3).fill(10),m=new b,u=new b,p=new b,v=new b,d=new b;for(let l=0;l<c/3;l++)for(let s=0;s<3;s++){const w=l*3+s,x=l*3+(s+1)%3,M=l*3+(s+2)%3,A=n.get(r(w,x));let P=!1;for(const L of A)L!==l&&o[L].dot(o[l])<i&&(P=!0);if(!P)continue;m.fromBufferAttribute(a,w),u.fromBufferAttribute(a,x),p.fromBufferAttribute(a,M),v.subVectors(u,m),d.subVectors(p,m);const G=v.clone().cross(d).length()/(v.length()||1);h[w*3+s]=0,h[x*3+s]=0,h[M*3+s]=G}t.setAttribute("edgeDist",new ne(h,3))}function st(){const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d"),a=e.createRadialGradient(64,64,0,64,64,64);return a.addColorStop(0,"rgba(0,0,0,0.7)"),a.addColorStop(.45,"rgba(0,0,0,0.25)"),a.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=a,e.fillRect(0,0,128,128),new Y(t)}const N=new R(new X(8,8),new ke({color:2303790,opacity:.55,depthWrite:!1}));N.rotation.x=-Math.PI/2;N.receiveShadow=!0;N.material.onBeforeCompile=t=>{t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vW;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vW = (modelMatrix * vec4(transformed, 1.0)).xyz;`),t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vW;`).replace("gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );",`float lit = 1.0;
      #if NUM_DIR_LIGHT_SHADOWS > 1
        DirectionalLightShadow s0 = directionalLightShadows[0];
        DirectionalLightShadow s1 = directionalLightShadows[1];
        float sharp = getShadow(directionalShadowMap[0], s0.shadowMapSize, s0.shadowBias, s0.shadowRadius, vDirectionalShadowCoord[0]);
        float soft = getShadow(directionalShadowMap[1], s1.shadowMapSize, s1.shadowBias, s1.shadowRadius, vDirectionalShadowCoord[1]);
        // how far from the bit's foot: crisp and dark at the contact, wider and lighter toward the tip's shadow
        float t = smoothstep(0.1, 1.5, length(vW.xz));
        lit = mix(sharp, soft, t);
        float a = opacity * (1.0 - lit) * mix(1.15, 0.85, t);
      #else
        float a = opacity * (1.0 - getShadowMask());
      #endif
      gl_FragColor = vec4(color, a);`)};C.add(N);const I=new R(new X(.62,.62),new E({map:st(),transparent:!0,depthWrite:!1}));I.rotation.x=-Math.PI/2;I.position.y=5e-4;C.add(I);const me=new ae;C.add(me);new Ae().load("/assets/models/bit.stl",t=>{t.rotateX(-Math.PI/2),t.computeBoundingBox();const e=t.boundingBox,a=new b;e.getSize(a);const c=1/a.y;t.translate(-(e.min.x+e.max.x)/2,-e.min.y,-(e.min.z+e.max.z)/2),t.scale(c,c,c),ot(t,12),rt(t,18),at(t);const o=new R(t,H);o.castShadow=!0,D.objToView.value=o.normalMatrix,me.add(o),g.target.copy($),g.update()});const g=new Pe(z,ie);g.target.copy($);g.enablePan=!1;g.enableDamping=!0;g.dampingFactor=.06;g.rotateSpeed=.7;g.minDistance=1.3;g.maxDistance=4.5;g.minPolarAngle=.12;g.maxPolarAngle=Math.PI/2-.04;g.autoRotate=!0;g.autoRotateSpeed=.6;let Q=-1e9;g.addEventListener("start",()=>{g.autoRotate=!1,Q=performance.now()});g.addEventListener("end",()=>Q=performance.now());const nt={uniforms:{tDiffuse:{value:null},tBloom:{value:null},resolution:{value:new _(1,1)},time:{value:0},shake:{value:new _},barrel:{value:f.lens.barrel},ca:{value:f.lens.ca},vignette:{value:f.lens.vignette},sharpen:{value:f.lens.sharpen},sharpenClamp:{value:f.lens.sharpenClamp},noise:{value:new re(f.noise.glow,f.noise.base,f.noise.chroma,f.noise.fixed)},noiseHz:{value:f.noise.hz}},vertexShader:`
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
  `};class it extends Ge{constructor(e,a,c){super(new _(2,2),e,a,c);this.needsSwap=!1;const o=this.materialHighPassFilter;if(o.fragmentShader=`
      uniform sampler2D tDiffuse; uniform float luminosityThreshold; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tDiffuse, vUv);
        float l = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(l - luminosityThreshold, 0.0) / max(l, 1e-4);
        gl_FragColor = vec4(t.rgb * k, 1.0);
      }`,o.needsUpdate=!0,le)for(const n of[this.renderTargetBright,...this.renderTargetsHorizontal,...this.renderTargetsVertical])n.texture.type=se}get texture(){return this.renderTargetsHorizontal[0].texture}setSize(e,a){super.setSize(Math.round(e*.6),Math.round(a*.6))}render(e,a,c){const o=this;e.getClearColor(o._oldClearColor),o.oldClearAlpha=e.getClearAlpha();const n=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),o.highPassUniforms.tDiffuse.value=c.texture,o.highPassUniforms.luminosityThreshold.value=this.threshold,o.fsQuad.material=o.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),o.fsQuad.render(e);let r=this.renderTargetBright;for(let i=0;i<this.nMips;i++)o.fsQuad.material=this.separableBlurMaterials[i],this.separableBlurMaterials[i].uniforms.colorTexture.value=r.texture,this.separableBlurMaterials[i].uniforms.direction.value=new _(1,0),e.setRenderTarget(this.renderTargetsHorizontal[i]),e.clear(),o.fsQuad.render(e),this.separableBlurMaterials[i].uniforms.colorTexture.value=this.renderTargetsHorizontal[i].texture,this.separableBlurMaterials[i].uniforms.direction.value=new _(0,1),e.setRenderTarget(this.renderTargetsVertical[i]),e.clear(),o.fsQuad.render(e),r=this.renderTargetsVertical[i];o.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),o.fsQuad.render(e),e.setClearColor(o._oldClearColor,o.oldClearAlpha),e.autoClear=n}}const fe=new De(1,1,{type:le?se:Te,encoding:ee});fe.samples=4;const T=new _e(y,fe);T.addPass(new Re(C,z));const q=new it(f.bloom.strength,f.bloom.radius,f.bloom.threshold);T.addPass(q);const O=new Be(nt);O.uniforms.tBloom.value=q.texture;T.addPass(O);function pe(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,f.maxDpr);y.setPixelRatio(a),y.setSize(t,e,!1),T.setPixelRatio(a),T.setSize(t,e),O.uniforms.resolution.value.set(t*a,e*a),z.aspect=t/e,z.fov=t<e?f.fov+10:f.fov,z.updateProjectionMatrix()}const lt=new Oe;function ve(t){(!ce||de)&&Je(),!g.autoRotate&&t-Q>4e3&&(g.autoRotate=!0),g.update();const e=g.getAzimuthalAngle();V.rotation.y=e,D.envRot.value.setFromMatrix4(lt.makeRotationY(-e)),z.updateMatrixWorld(),z.matrixWorldInverse.copy(z.matrixWorld).invert(),D.axisView.value.set(0,1,0).transformDirection(z.matrixWorldInverse);const a=t/1e3;O.uniforms.time.value=a,O.uniforms.shake.value.set(9e-4*Math.sin(a*1.7)+5e-4*Math.sin(a*4.3+1),7e-4*Math.sin(a*1.1+2)+4e-4*Math.sin(a*5.1)),T.render(),requestAnimationFrame(ve)}window.addEventListener("resize",pe);pe();requestAnimationFrame(ve);window.__bit={scene:C,renderer:y,composer:T,bloom:q,lens:O,steel:H,steelUniforms:D,lamp:We,rig:V,floor:N,contact:I,camera:z,controls:g,LOOK:f,THREE:Ve};
