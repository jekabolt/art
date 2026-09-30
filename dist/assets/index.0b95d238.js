import"./modulepreload-polyfill.b7f2da20.js";import{p as L,q as Me,r as ee,s as Se,t as ze,u as Ae,v as te,w as ae,x as oe,y as Ce,z as Ne,I as ke,A as Pe,E as re,J as R,K as y,Q as K,T as De,U as F,X as Y,Y as Te,Z as U,_ as se,$ as _e,a0 as Re,a1 as Fe,a2 as ne,a3 as Oe,a4 as je,a5 as Be,a6 as Ve,a7 as Le,a8 as Ee,a9 as Ue,aa as ie,ab as le,ac as Ie,ad as ce,ae as he,af as Ze,ag as de,ah as Xe,ai as Ye,aj as Ge,ak as $e,al as J,am as He,an as Qe}from"./vendor.0d80995e.js";const qe="/assets/bit/steel-grain.jpg",v={bitFraction:.38,fov:60,backdrop:new L(5.4,4.565,3.347),lamp:new L(8.4,8,7.4),bloom:{threshold:6.2,strength:.12,radius:.55},steel:{color:13159633,roughness:.1,envMapIntensity:1},hex:{color:5988197,roughness:.3,from:.593,blend:.008},detail:{scale:1,normal:.012,roughVar:.05,albedoVar:.03,wearWidth:.01,wearAmount:.22,aniso:.35,scratches:.65},lens:{barrel:.05,ca:6e-4,vignette:.07,sharpen:.22,sharpenClamp:.018},noise:{glow:0,base:.011,chroma:0,fixed:.15,hz:30},maxDpr:2},ue=document.getElementById("bit"),M=new Me({canvas:ue,antialias:!1,powerPreference:"high-performance"});M.outputEncoding=ee;M.toneMapping=Se;M.physicallyCorrectLights=!0;M.shadowMap.enabled=!0;M.shadowMap.type=ze;Ae.init();const me=M.capabilities.isWebGL2&&(M.extensions.has("EXT_color_buffer_float")||M.extensions.has("EXT_color_buffer_half_float")),W=window.innerWidth<700,N=new te;N.background=v.backdrop;const V=t=>new L(t,t,t);function Ke(t){const e=new te,a=new Ge(10,48,24);if(t){const h=t.width,s=Math.round(h/2),n=Math.round(h/t.width*t.height),u=Math.round((s-n)/2),m=document.createElement("canvas");m.width=h,m.height=s;const i=m.getContext("2d");i.drawImage(t,0,0,t.width,1,0,0,h,u+1),i.drawImage(t,0,t.height-1,t.width,1,0,u+n-1,h,s-u-n+1),i.drawImage(t,0,u,h,n);const f=new se(m);f.encoding=$e;const p=new F(a,new U({map:f,color:V(.6),side:J}));p.rotation.y=Math.PI/2,e.add(p)}else{const h=[],s=a.getAttribute("position");for(let n=0;n<s.count;n++){const u=s.getY(n)/10,m=s.getX(n)/10,i=s.getZ(n)/10,f=Math.atan2(m,i),p=.55+.45*Math.sin(f*3+.7)*Math.sin(f*5+2.1),l=u<0?1*Math.pow(Math.max(0,-u-.45)/.55,1.4):0,c=.05+.4*p*(1-.6*Math.abs(u))+(u>0?.35*Math.pow(u,1.5):0)+l;h.push(c*.97,c*.99,c*1.02)}a.setAttribute("color",new He(h,3)),e.add(new F(a,new U({vertexColors:!0,side:J})))}const d=(h,s,n,u,m,i)=>{const f=new F(new Y(h,s),new U({color:n,side:Qe}));f.position.set(u,m,i),f.lookAt(0,.5,0),e.add(f)};d(3.4,3,new L(5.6,5.8,6),-5.2,4.2,3.4),d(.5,.5,V(40),-4.9,6.9,4.3),d(1.2,4,V(2.4),6,1.6,-3.5);const o=V(.012);return d(4.5,2.2,o,0,.6,-7),d(2,3.5,o,-6.5,.8,-2.5),d(3,3.2,V(.05),0,1.4,6),e}let fe=!1,Je,pe=!1;function We(){const t=new Ye(M),e=N.environment;N.environment=t.fromScene(Ke(Je),.02).texture,e?.dispose(),t.dispose(),fe=!0,pe=!1}const B=new ae;N.add(B);const z=new oe(16776180,5);z.position.set(-1.9,2.9,1.3);z.castShadow=!0;z.shadow.mapSize.set(W?1024:2048,W?1024:2048);z.shadow.radius=1.6;z.shadow.blurSamples=12;z.shadow.bias=-3e-4;z.shadow.normalBias=.002;const O=z.shadow.camera;O.left=O.bottom=-1.4;O.right=O.top=1.4;O.near=.5;O.far=8;B.add(z);z.target.position.set(0,.3,0);B.add(z.target);const k=new oe(16777215,0);k.position.copy(z.position);k.castShadow=!0;k.shadow.mapSize.set(1024,1024);k.shadow.radius=6;k.shadow.blurSamples=16;k.shadow.bias=-5e-4;Object.assign(k.shadow.camera,{left:-1.4,bottom:-1.4,right:1.4,top:1.4,near:.5,far:8});B.add(k);k.target=z.target;const et=new Ce,C=new Ne(v.fov,1,.01,100),G=new y(0,.44,0);{const t=1/(v.bitFraction*2*Math.tan(v.fov*Math.PI/360)),e=new Ue(t,68*Math.PI/180,22*Math.PI/180);C.position.setFromSpherical(e).add(G)}function ve(t,e,a){let d=0;for(let l=0;l<t.length;l++)d+=t[l];d/=t.length;const o=t.map(l=>Math.min(1,Math.max(0,l-d+.5))),h=14,s=new Float32Array(e*a),n=new Float32Array(e*a);for(let l=0;l<a;l++){let c=0;for(let r=-h;r<=h;r++)c+=o[l*e+(r+e)%e];for(let r=0;r<e;r++)s[l*e+r]=c/(2*h+1),c+=o[l*e+(r+h+1)%e]-o[l*e+(r-h+e)%e]}for(let l=0;l<e;l++){let c=0;for(let r=-h;r<=h;r++)c+=s[(r+a)%a*e+l];for(let r=0;r<a;r++)n[r*e+l]=c/(2*h+1),c+=s[(r+h+1)%a*e+l]-s[(r-h+a)%a*e+l]}let u=1,m=0;for(let l=0;l<n.length;l++)n[l]<u&&(u=n[l]),n[l]>m&&(m=n[l]);const i=new Uint8Array(e*a*4),f=7;for(let l=0;l<a;l++)for(let c=0;c<e;c++){const r=l*e+c,g=o[l*e+(c+1)%e]-o[l*e+(c-1+e)%e],w=o[(l+1)%a*e+c]-o[(l-1+a)%a*e+c],b=-g*f,A=-w*f,S=Math.sqrt(b*b+A*A+1);i[r*4]=b/S*127.5+127.5,i[r*4+1]=A/S*127.5+127.5,i[r*4+2]=o[r]*255,i[r*4+3]=(n[r]-u)/(m-u||1)*255}const p=new ie(i,e,a,le);return p.wrapS=p.wrapT=Ie,p.minFilter=ce,p.magFilter=he,p.generateMipmaps=!0,p.anisotropy=M.capabilities.getMaxAnisotropy(),p.needsUpdate=!0,p}function tt(t){let e=11;const a=()=>(e=e*16807%2147483647)/2147483647,d=new Float32Array(t*t),o=(s,n)=>{const u=new Float32Array(s*s);for(let i=0;i<u.length;i++)u[i]=a();const m=i=>i*i*(3-2*i);for(let i=0;i<t;i++)for(let f=0;f<t;f++){const p=f/t*s,l=i/t*s,c=Math.floor(p),r=Math.floor(l),g=m(p-c),w=m(l-r),b=(_,P)=>u[P%s*s+_%s],A=b(c,r)+(b(c+1,r)-b(c,r))*g,S=b(c,r+1)+(b(c+1,r+1)-b(c,r+1))*g;d[i*t+f]+=(A+(S-A)*w-.5)*n}};o(8,.1),o(32,.08),o(128,.1);for(let s=0;s<d.length;s++)d[s]+=(a()-.5)*.22+.5;for(let s=0;s<t;s++)e=5;const h=new Float32Array(t);for(let s=0;s<t;s++)h[s]=(a()-.5)*.05;for(let s=0;s<t;s++)for(let n=0;n<t;n++)d[s*t+n]+=h[n];return ve(d,t,t)}let X=tt(512);new ke().load(qe,t=>{const e=t.width,a=t.height,d=document.createElement("canvas");d.width=e,d.height=a;const o=d.getContext("2d");o.drawImage(t,0,0);const h=o.getImageData(0,0,e,a).data,s=new Float32Array(e*a);for(let u=0;u<s.length;u++)s[u]=(h[u*4]*.299+h[u*4+1]*.587+h[u*4+2]*.114)/255;const n=ve(s,e,a);X.dispose(),X=n,D.detailMap.value=n},void 0,()=>{});function at(){const e=document.createElement("canvas");e.width=e.height=1024;const a=e.getContext("2d");a.fillStyle="#000",a.fillRect(0,0,1024,1024);let d=1234567;const o=()=>(d=d*16807%2147483647)/2147483647;a.lineCap="round",a.globalCompositeOperation="lighter";for(let i=0;i<150;i++){const f=i>=140,p=f?"0,255,0":"255,0,0",l=o()<.75,c=l?Math.PI/2+(o()-.5)*.35:o()*Math.PI,r=(l?14+o()*60:6+o()*28)*(o()<.12?1.8:1),g=o()*1024,w=o()*1024,b=Math.cos(c)*r,A=Math.sin(c)*r,S=a.createLinearGradient(g,w,g+b,w+A),_=.25+o()*.55;S.addColorStop(0,`rgba(${p},0)`),S.addColorStop(.2+o()*.2,`rgba(${p},${_})`),S.addColorStop(.7+o()*.2,`rgba(${p},${_*.6})`),S.addColorStop(1,`rgba(${p},0)`),a.strokeStyle=S,a.lineWidth=f?1.2+o()*.8:o()<.85?.6+o()*.5:1.1+o()*.6,a.beginPath(),a.moveTo(g,w),a.lineTo(g+b,w+A),a.stroke();for(const[P,q]of[[-1024,0],[1024,0],[0,-1024],[0,1024]])a.beginPath(),a.moveTo(g+P,w+q),a.lineTo(g+b+P,w+A+q),a.stroke()}const h=a.getImageData(0,0,1024,1024).data;let s=new Float32Array(1024*1024);for(let i=0;i<1024*1024;i++)s[i]=-(h[i*4]*.6+h[i*4+1])/255;for(let i=0;i<1;i++){const f=new Float32Array(1048576);for(let p=0;p<1024;p++)for(let l=0;l<1024;l++){let c=0;for(let r=-1;r<=1;r++)for(let g=-1;g<=1;g++)c+=s[(p+r+1024)%1024*1024+(l+g+1024)%1024];f[p*1024+l]=c/9}s=f}const n=new Uint8Array(1024*1024*4),u=2.5;for(let i=0;i<1024;i++)for(let f=0;f<1024;f++){const p=i*1024+f,l=-(s[i*1024+(f+1)%1024]-s[i*1024+(f-1+1024)%1024])*u,c=-(s[(i+1)%1024*1024+f]-s[(i-1+1024)%1024*1024+f])*u,r=Math.sqrt(l*l+c*c+1);n[p*4]=l/r*127.5+127.5,n[p*4+1]=c/r*127.5+127.5,n[p*4+2]=h[p*4],n[p*4+3]=h[p*4+1]}const m=new ie(n,1024,1024,le);return m.wrapS=m.wrapT=Ze,m.minFilter=ce,m.magFilter=he,m.generateMipmaps=!0,m.anisotropy=8,m.needsUpdate=!0,m}const $=new Pe({color:v.steel.color,metalness:1,roughness:v.steel.roughness,envMapIntensity:v.steel.envMapIntensity}),D={detailMap:{value:X},rib:{value:new re(1,0,0,0)},scratchMap:{value:at()},scratches:{value:v.detail.scratches},detailScale:{value:v.detail.scale},detailNormal:{value:v.detail.normal},roughVar:{value:v.detail.roughVar},albedoVar:{value:v.detail.albedoVar},wearWidth:{value:v.detail.wearWidth},wearAmount:{value:v.detail.wearAmount},aniso:{value:v.detail.aniso},hexColor:{value:new L(v.hex.color)},hexRough:{value:v.hex.roughness},hexZone:{value:new R(v.hex.from,v.hex.blend)},axisView:{value:new y(0,1,0)},envRot:{value:new K},objToView:{value:new K}};$.onBeforeCompile=t=>{Object.assign(t.uniforms,D),t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
      attribute vec3 edgeDist;
      varying vec3 vEdgeDist; varying vec3 vObjPos; varying vec3 vObjNormal;`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
 vObjNormal = objectNormal;`).replace("#include <begin_vertex>",`#include <begin_vertex>
 vObjPos = position; vEdgeDist = edgeDist;`);const e=De.envmap_physical_pars_fragment.replace("vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );","vec3 worldNormal = envRot * inverseTransformDirection( normal, viewMatrix );").replace("reflectVec = inverseTransformDirection( reflectVec, viewMatrix );","reflectVec = envRot * inverseTransformDirection( reflectVec, viewMatrix );");t.fragmentShader=t.fragmentShader.replace("#include <common>",`#include <common>
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
        deep *= 1.0 - smoothstep(0.1, 0.25, rAx * 25.0 - (zmm - 19.2) * 2.29); // the floors lie on it: a little past it still counts
        float pocket = rib.w * inner * deep * smoothstep(0.0015, 0.005, below);
        float floorF = smoothstep(0.35, 0.8, normalize(vObjNormal).y); // floors face up, out of the light's reach
        pocketAO = pocket * max(0.3 + 0.66 * smoothstep(0.0, 0.045, below), 0.95 * floorF);
      }
      // use marks: fine scratches, triplanar like the grain (the flats get them along the axis)
      vec4 sX = texture2D(scratchMap, vObjPos.zy * 1.6 + vec2(0.31, 0.0));
      vec4 sY = texture2D(scratchMap, vObjPos.xz * 1.6 + vec2(0.6, 0.2));
      vec4 sZ = texture2D(scratchMap, vObjPos.xy * 1.6 + vec2(0.05, 0.5));
      vec2 sm = sX.ba * tw.x + sY.ba * tw.y + sZ.ba * tw.z;
      float scr = sm.x * scratches;
      float gouge = sm.y * scratches;
      vec2 gX = sX.xy * 2.0 - 1.0, gY = sY.xy * 2.0 - 1.0, gZ = sZ.xy * 2.0 - 1.0;
      vec3 scrPert = (tw.x * vec3(0.0, gX.y, gX.x) + tw.y * vec3(gY.x, 0.0, gY.y) + tw.z * vec3(gZ.x, gZ.y, 0.0)) * scratches;
      // wear: the sharp edges, worn smoother and brighter, patchily
      float edgeD = min(vEdgeDist.x, min(vEdgeDist.y, vEdgeDist.z));
      float wear = (1.0 - smoothstep(0.0, wearWidth, edgeD)) * smoothstep(0.25, 0.8, det.a + 0.25) * wearAmount;
      // two finishes: the satin hex shank, the polished neck and tip
      float onHex = 1.0 - smoothstep(hexZone.x - hexZone.y, hexZone.x + hexZone.y, vObjPos.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, hexColor, onHex);
      diffuseColor.rgb *= (1.0 + (det.a - 0.5) * albedoVar + (mottle - 0.5) * albedoVar * 0.8 + (det.b - 0.5) * albedoVar * 0.5) * (1.0 + 0.08 * wear) * (1.0 - 0.72 * cavity) * (1.0 + 0.15 * scr) * (1.0 - 0.3 * gouge) * (1.0 - 0.7 * pocketAO);`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
      // in the pockets the room is shut out: darkening the albedo alone leaves the Fresnel/F90 sheen
      reflectedLight.indirectSpecular *= (1.0 - 0.95 * pocketAO) * (1.0 - 0.5 * cavity);
      reflectedLight.directSpecular *= (1.0 - min(1.0, 1.5 * pocketAO)) * (1.0 - 0.9 * cavity); // the engraving's cut walls don't flash either // the sun only on the walls' top edge: nothing glints deep in the pockets`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
      roughnessFactor = clamp(mix(roughnessFactor, hexRough, onHex) + (det.b - 0.5) * roughVar + (mottle - 0.5) * 0.03 - 0.04 * wear + 0.45 * cavity + 0.22 * scr + 0.35 * gouge + 0.3 * pocketAO, 0.08, 1.0);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      normal = normalize(normal + objToView * (pert * detailNormal * (1.0 - 0.6 * wear) + scrPert * 0.35));
      // a faint lengthwise grind: bend the normal toward the axis-stretched highlight direction
      {
        vec3 V = normalize(vViewPosition);
        vec3 aT = cross(axisView, V);
        vec3 aN = normalize(cross(normalize(aT), axisView));
        normal = normalize(mix(normal, aN, aniso * (1.0 - roughnessFactor) * (1.0 - abs(dot(normalize(vObjNormal), vec3(0.0, 1.0, 0.0))))));
      }`)};function ot(t){const e=t.getAttribute("position");let a=0;for(let o=0;o<e.count;o++)a=Math.max(a,e.getY(o));let d=0;for(let o=0;o<e.count;o++)e.getY(o)>a-1e-4&&(d=Math.max(d,Math.abs(e.getX(o)),Math.abs(e.getZ(o))));d+=.06/25,D.rib.value.set(d,(4.5/3.78-1)/(4.3/25),a,1)}function ge(t){const e=[],a=new y,d=new y,o=new y;for(let h=0;h<t.count/3;h++)a.fromBufferAttribute(t,h*3),d.fromBufferAttribute(t,h*3+1),o.fromBufferAttribute(t,h*3+2),e.push(new y().subVectors(o,d).cross(new y().subVectors(a,d)).normalize());return e}const I=(t,e)=>`${Math.round(t.getX(e)*1e4)},${Math.round(t.getY(e)*1e4)},${Math.round(t.getZ(e)*1e4)}`;function rt(t,e){const a=t.getAttribute("position"),d=a.count,o=ge(a),h=new Map;for(let m=0;m<d;m++){const i=I(a,m),f=h.get(i);f?f.push(Math.floor(m/3)):h.set(i,[Math.floor(m/3)])}const s=Math.cos(e*Math.PI/180),n=new Float32Array(d*3),u=new y;for(let m=0;m<d;m++){const i=o[Math.floor(m/3)];u.set(0,0,0);for(const f of h.get(I(a,m)))o[f].dot(i)>=s&&u.add(o[f]);u.normalize(),n[m*3]=u.x,n[m*3+1]=u.y,n[m*3+2]=u.z}t.setAttribute("normal",new de(n,3))}function st(t,e){const a=t.getAttribute("position"),d=a.count,o=ge(a),h=new Map,s=(c,r)=>{const g=I(a,c),w=I(a,r);return g<w?`${g}|${w}`:`${w}|${g}`};for(let c=0;c<d/3;c++)for(let r=0;r<3;r++){const g=s(c*3+r,c*3+(r+1)%3),w=h.get(g);w?w.push(c):h.set(g,[c])}const n=Math.cos(e*Math.PI/180),u=new Float32Array(d*3).fill(10),m=new y,i=new y,f=new y,p=new y,l=new y;for(let c=0;c<d/3;c++)for(let r=0;r<3;r++){const g=c*3+r,w=c*3+(r+1)%3,b=c*3+(r+2)%3,A=h.get(s(g,w));let S=!1;for(const P of A)P!==c&&o[P].dot(o[c])<n&&(S=!0);if(!S)continue;m.fromBufferAttribute(a,g),i.fromBufferAttribute(a,w),f.fromBufferAttribute(a,b),p.subVectors(i,m),l.subVectors(f,m);const _=p.clone().cross(l).length()/(p.length()||1);u[g*3+r]=0,u[w*3+r]=0,u[b*3+r]=_}t.setAttribute("edgeDist",new de(u,3))}function nt(){const t=document.createElement("canvas");t.width=t.height=128;const e=t.getContext("2d"),a=e.createRadialGradient(64,64,0,64,64,64);return a.addColorStop(0,"rgba(0,0,0,0.7)"),a.addColorStop(.45,"rgba(0,0,0,0.25)"),a.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=a,e.fillRect(0,0,128,128),new se(t)}const E=new F(new Y(8,8),new Te({color:2303790,opacity:.55,depthWrite:!1}));E.rotation.x=-Math.PI/2;E.receiveShadow=!0;E.material.onBeforeCompile=t=>{t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
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
      gl_FragColor = vec4(color, a);`)};N.add(E);const Z=new F(new Y(.62,.62),new U({map:nt(),transparent:!0,depthWrite:!1}));Z.rotation.x=-Math.PI/2;Z.position.y=5e-4;N.add(Z);const we=new ae;N.add(we);new _e().load("/assets/models/bit.stl",t=>{t.rotateX(-Math.PI/2),t.computeBoundingBox();const e=t.boundingBox,a=new y;e.getSize(a);const d=1/a.y;t.translate(-(e.min.x+e.max.x)/2,-e.min.y,-(e.min.z+e.max.z)/2),t.scale(d,d,d),rt(t,12),st(t,18),ot(t);const o=new F(t,$);o.castShadow=!0,D.objToView.value=o.normalMatrix,we.add(o),x.target.copy(G),x.update()});const x=new Re(C,ue);x.target.copy(G);x.enablePan=!1;x.enableDamping=!0;x.dampingFactor=.06;x.rotateSpeed=.7;x.minDistance=1.3;x.maxDistance=4.5;x.minPolarAngle=.12;x.maxPolarAngle=Math.PI/2-.04;x.autoRotate=!0;x.autoRotateSpeed=.6;let H=-1e9;x.addEventListener("start",()=>{x.autoRotate=!1,H=performance.now()});x.addEventListener("end",()=>H=performance.now());const it={uniforms:{tDiffuse:{value:null},tBloom:{value:null},resolution:{value:new R(1,1)},time:{value:0},shake:{value:new R},barrel:{value:v.lens.barrel},ca:{value:v.lens.ca},vignette:{value:v.lens.vignette},sharpen:{value:v.lens.sharpen},sharpenClamp:{value:v.lens.sharpenClamp},noise:{value:new re(v.noise.glow,v.noise.base,v.noise.chroma,v.noise.fixed)},noiseHz:{value:v.noise.hz}},vertexShader:`
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
  `};class lt extends Xe{constructor(e,a,d){super(new R(2,2),e,a,d);this.needsSwap=!1;const o=this.materialHighPassFilter;if(o.fragmentShader=`
      uniform sampler2D tDiffuse; uniform float luminosityThreshold; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tDiffuse, vUv);
        float l = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
        float k = max(l - luminosityThreshold, 0.0) / max(l, 1e-4);
        gl_FragColor = vec4(t.rgb * k, 1.0);
      }`,o.needsUpdate=!0,me)for(const h of[this.renderTargetBright,...this.renderTargetsHorizontal,...this.renderTargetsVertical])h.texture.type=ne}get texture(){return this.renderTargetsHorizontal[0].texture}setSize(e,a){super.setSize(Math.round(e*.6),Math.round(a*.6))}render(e,a,d){const o=this;e.getClearColor(o._oldClearColor),o.oldClearAlpha=e.getClearAlpha();const h=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),o.highPassUniforms.tDiffuse.value=d.texture,o.highPassUniforms.luminosityThreshold.value=this.threshold,o.fsQuad.material=o.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),o.fsQuad.render(e);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)o.fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=new R(1,0),e.setRenderTarget(this.renderTargetsHorizontal[n]),e.clear(),o.fsQuad.render(e),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=new R(0,1),e.setRenderTarget(this.renderTargetsVertical[n]),e.clear(),o.fsQuad.render(e),s=this.renderTargetsVertical[n];o.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),o.fsQuad.render(e),e.setClearColor(o._oldClearColor,o.oldClearAlpha),e.autoClear=h}}const xe=new Fe(1,1,{type:me?ne:Oe,encoding:ee});xe.samples=4;const T=new je(M,xe);T.addPass(new Be(N,C));const Q=new lt(v.bloom.strength,v.bloom.radius,v.bloom.threshold);T.addPass(Q);const j=new Ve(it);j.uniforms.tBloom.value=Q.texture;T.addPass(j);function be(){const t=window.innerWidth,e=window.innerHeight,a=Math.min(window.devicePixelRatio||1,v.maxDpr);M.setPixelRatio(a),M.setSize(t,e,!1),T.setPixelRatio(a),T.setSize(t,e),j.uniforms.resolution.value.set(t*a,e*a),C.aspect=t/e,C.fov=t<e?v.fov+10:v.fov,C.updateProjectionMatrix()}const ct=new Le;function ye(t){(!fe||pe)&&We(),!x.autoRotate&&t-H>4e3&&(x.autoRotate=!0),x.update();const e=x.getAzimuthalAngle();B.rotation.y=e,D.envRot.value.setFromMatrix4(ct.makeRotationY(-e)),C.updateMatrixWorld(),C.matrixWorldInverse.copy(C.matrixWorld).invert(),D.axisView.value.set(0,1,0).transformDirection(C.matrixWorldInverse);const a=t/1e3;j.uniforms.time.value=a,j.uniforms.shake.value.set(9e-4*Math.sin(a*1.7)+5e-4*Math.sin(a*4.3+1),7e-4*Math.sin(a*1.1+2)+4e-4*Math.sin(a*5.1)),T.render(),requestAnimationFrame(ye)}window.addEventListener("resize",be);be();requestAnimationFrame(ye);window.__bit={scene:N,renderer:M,composer:T,bloom:Q,lens:j,steel:$,steelUniforms:D,lamp:et,rig:B,floor:E,contact:Z,camera:C,controls:x,LOOK:v,THREE:Ee};
