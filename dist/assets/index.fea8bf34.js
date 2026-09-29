import"./modulepreload-polyfill.b7f2da20.js";import{W as R,S as H,O,j as m,V as q,g as D,M as G,e as N,i as j,L as K}from"./vendor.114acf59.js";import{a as T,b as U,L as X,c as Y}from"./logo-path.248ebb5a.js";const k=200,L=1.3;function J(){const t=document.createElement("canvas");t.width=t.height=1024;const o=t.getContext("2d");o.fillStyle="#000",o.fillRect(0,0,1024,1024);const r=1024/Y;o.scale(r,r),o.translate(-T,-T),o.lineWidth=U,o.strokeStyle="#fff",o.stroke(new Path2D(X));const n=new j(t);return n.minFilter=n.magFilter=K,n.generateMipmaps=!1,n}const v=document.getElementById("label"),z=new R({canvas:v,antialias:!1}),A=new H,Q=new O(-1,1,1,-1,0,1),w={resolution:{value:new m},center:{value:new m},halfSize:{value:new m},cells:{value:new m(k,Math.round(k/L))},mask:{value:J()},logoHalf:{value:1},light:{value:new q},ss:{value:1},turn:{value:new m}},Z=new D({uniforms:w,vertexShader:`
    void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
  `,fragmentShader:`
    uniform vec2 resolution;
    uniform vec2 center;
    uniform vec2 halfSize;
    uniform vec2 cells;
    uniform sampler2D mask;
    uniform float logoHalf;
    uniform vec3 light;
    uniform float ss;
    uniform vec2 turn; // rotation about the vertical axis (flip), then a small tilt about the horizontal

    // colours in linear light
    const vec3 WARP = vec3(0.0032, 0.0032, 0.0036);
    const vec3 WEFT_BLACK = vec3(0.0042, 0.0042, 0.0046);
    const vec3 WEFT_WHITE = vec3(0.80, 0.79, 0.75);

    float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    // is the thread cell part of the logo? (the mask is read at the cell centre: a stepped edge)
    float inLogo(vec2 cell) {
      vec2 p = ((cell + 0.5) / cells * 2.0 - 1.0) * halfSize;
      vec2 uv = p / (2.0 * logoHalf) + 0.5;
      float m = texture2D(mask, clamp(uv, 0.0, 1.0)).r;
      float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
      return step(0.5, m) * inside;
    }

    // face: 5-end satin, step 2 \u2014 the ground shows warp on 4 of 5 cells, the logo weft on 4 of 5
    float warpUpFace(vec2 cell) {
      float satinPoint = 1.0 - step(0.5, mod(cell.x + 2.0 * cell.y, 5.0));
      return inLogo(cell) > 0.5 ? satinPoint : 1.0 - satinPoint;
    }

    // one yarn seen from above: T along it, A across, d \u2208 [-1, 1] across the yarn, alongG the
    // position along it in cells (continuous, for the twist), dips where it goes under at either end
    vec3 yarn(vec3 T, vec3 A, float d, float alongG, float idx, vec3 base, float dipPrev, float dipNext, vec2 g, vec3 L, vec3 V, float back) {
      float along = fract(alongG);
      base *= 0.88 + 0.24 * h1(idx * 1.37);
      // pressed yarn: a flattened oval, not a round rod
      float z = pow(max(1.0 - d * d, 0.0), 0.35);
      float e0 = mix(1.0, smoothstep(0.0, 0.45, along), dipPrev);
      float e1 = mix(1.0, smoothstep(0.0, 0.45, 1.0 - along), dipNext);
      float lift = e0 * e1;
      float slope = dipPrev * (1.0 - smoothstep(0.0, 0.45, along)) - dipNext * (1.0 - smoothstep(0.0, 0.45, 1.0 - along));

      vec2 q = g / cells;
      vec2 wav = vec2(vnoise(q * 4.4 + 3.0), vnoise(q * 4.4 + 11.0)) - 0.5;
      vec3 N = normalize(A * d * 0.7 + T * slope * 0.8 + vec3(wav * 0.25, 0.0) + vec3(0.0, 0.0, 0.6 + 0.4 * z * lift));

      // plied yarn: diagonal twist lines, continuous along the whole float
      float ply = 0.84 + 0.16 * sin((alongG * 2.6 + d * 0.5 + h1(idx) * 7.0) * 6.2831853);
      float fuzz = 0.92 + 0.16 * h2(floor(gl_FragCoord.xy)) + back * 0.14 * (h2(floor(gl_FragCoord.xy * 0.5)) - 0.5);

      vec3 H = normalize(L + V);
      float diff = max(dot(N, L), 0.0);
      float spec = pow(max(dot(N, H), 0.0), 55.0) * 0.8 + pow(max(dot(N, H), 0.0), 9.0) * 0.07;
      // Kajiya\u2013Kay sheen along the fibres
      float tl = dot(T, L);
      float tv = dot(T, V);
      float kk = max(sqrt(max(1.0 - tl * tl, 0.0)) * sqrt(max(1.0 - tv * tv, 0.0)) - tl * tv, 0.0);
      spec += pow(kk, 40.0) * 0.18;
      spec *= smoothstep(0.0, 0.2, L.z);
      float ao = mix(0.45, 1.0, z) * mix(0.3, 1.0, lift);
      float gloss = (base.r > 0.1 ? 0.5 : 0.28) * (1.0 - back * 0.45);
      return base * (0.03 + 1.0 * diff) * ao * ply * fuzz + vec3(spec * gloss) * ao * ply;
    }

    vec3 face(vec2 g, vec3 L, vec3 V) {
      vec2 cell = floor(g);
      vec2 f = fract(g);
      float wu = warpUpFace(cell);
      float logo = inLogo(cell);
      if (wu > 0.5) {
        float wdt = 0.93 + 0.06 * h1(cell.x * 2.71);
        float d = (f.x - 0.5) / (0.5 * wdt);
        if (abs(d) > 1.0) return WEFT_BLACK * 0.3;
        return yarn(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), d, g.y, cell.x, WARP,
          1.0 - warpUpFace(cell - vec2(0.0, 1.0)), 1.0 - warpUpFace(cell + vec2(0.0, 1.0)), g, L, V, 0.0);
      }
      float wdt = 0.93 + 0.06 * h1((cell.y + 1000.0) * 2.71);
      float d = (f.y - 0.5) / (0.5 * wdt);
      if (abs(d) > 1.0) return WARP * 0.3;
      return yarn(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), d, g.x, cell.y + 1000.0, logo > 0.5 ? WEFT_WHITE : WEFT_BLACK,
        warpUpFace(cell - vec2(1.0, 0.0)), warpUpFace(cell + vec2(1.0, 0.0)), g, L, V, 0.0);
    }

    // --- the back of a two-weft damask ----------------------------------------------------------
    // Picks alternate: even rows the black ground weft, odd rows the white figure weft. Each weft
    // floats loose on the back wherever the face does not need it (white behind the ground, black
    // behind the mark), tied down by the warp every eighth end; where the face needs it, it is
    // bound in tightly and the back shows it only as specks between warp. The float ends drift a
    // cell or two from the mark's edge row by row, long floats sag over their neighbours, and in
    // wide fields they are sheared, leaving frayed ends.
    float backShift(float row) { return floor((h1(row * 3.1 + 5.0) - 0.5) * 3.4); }
    float floatsBack(float x, float row) {
      float white = mod(row, 2.0);
      float logo = inLogo(vec2(x + backShift(row), row));
      return white > 0.5 ? 1.0 - logo : logo;
    }
    float tieBack(float x, float row) { return 1.0 - step(0.5, mod(x + 3.0 * row, 8.0)); }
    // position within the shear period of a row: the first 0.8 cell of each period is cut away
    float shearAt(float gx, float row) {
      float period = 24.0 + 16.0 * h1(row * 1.7);
      return fract(gx / period + h1(row * 9.3)) * period;
    }
    float sag(float row, float gx) {
      return 0.3 * sin(gx * 0.33 + h1(row) * 6.2831853) * (0.55 + 0.45 * sin(gx * 0.09 + row * 1.3));
    }
    vec3 pickColour(float row) { return mod(row, 2.0) > 0.5 ? WEFT_WHITE : WEFT_BLACK; }

    // where point g lies across a loose float of that pick (|d| <= 1 on it; -9 when there is none)
    float floatD(vec2 g, float row) {
      float x = floor(g.x);
      if (floatsBack(x, row) < 0.5 || tieBack(x, row) > 0.5 || shearAt(g.x, row) < 0.8) return -9.0;
      return (g.y - (row + 0.5 + sag(row, g.x))) / (0.58 + 0.04 * h1(row * 4.1));
    }
    vec3 floatYarn(vec2 g, float row, float d, vec3 L, vec3 V) {
      float x = floor(g.x);
      float dp = clamp(tieBack(x - 1.0, row) + 1.0 - floatsBack(x - 1.0, row), 0.0, 1.0);
      float dn = clamp(tieBack(x + 1.0, row) + 1.0 - floatsBack(x + 1.0, row), 0.0, 1.0);
      // sheared ends: the last fibres of a cut float fray out
      float sh = shearAt(g.x, row);
      float fray = smoothstep(1.6, 0.8, sh);
      if (fray > 0.0 && h2(floor(gl_FragCoord.xy * 0.8) + row) < fray * 0.7) return WARP * 0.4;
      return yarn(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), d, g.x, row + 1000.0, pickColour(row), dp, dn, g, L, V, 1.0) * 1.05;
    }

    vec3 back(vec2 g, vec3 L, vec3 V) {
      vec2 cell = floor(g);
      vec2 f = fract(g);
      float row = cell.y;

      // own float first, then a sagging float from the row above or below lying over this one
      float d0 = floatD(g, row);
      if (abs(d0) <= 1.0) return floatYarn(g, row, d0, L, V);
      float du = floatD(g, row + 1.0);
      if (abs(du) <= 1.0) return floatYarn(g, row + 1.0, du, L, V);
      float dd = floatD(g, row - 1.0);
      if (abs(dd) <= 1.0) return floatYarn(g, row - 1.0, dd, L, V);

      if (floatsBack(cell.x, row) > 0.5) {
        // under a float's gap, a tie, or a shear: the warp, low and dark
        float wdt = 0.9;
        float d = (f.x - 0.5) / (0.5 * wdt);
        if (abs(d) > 1.0 || shearAt(g.x, row) < 0.8) return WARP * 0.25;
        return yarn(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), d, g.y, cell.x, WARP, 1.0, 1.0, g, L, V, 1.0) * 0.8;
      }
      // a bound pick: plain weave with the warp, the pick showing as specks
      float warpShows = 1.0 - step(0.5, mod(cell.x + row, 2.0));
      if (warpShows > 0.5) {
        float d = (f.x - 0.5) / 0.45;
        if (abs(d) > 1.0) return WARP * 0.25;
        return yarn(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), d, g.y, cell.x, WARP, 1.0, 1.0, g, L, V, 1.0) * 0.75;
      }
      float d = (f.y - 0.5) / 0.44;
      if (abs(d) > 1.0) return WARP * 0.25;
      return yarn(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), d, g.x, row + 1000.0, pickColour(row), 1.0, 1.0, g, L, V, 1.0) * 0.7;
    }

    vec3 cloth(vec2 g, vec3 L, vec3 V, float isBack) {
      return isBack > 0.5 ? back(g, L, V) : face(g, L, V);
    }

    vec3 background(vec2 frag, float shadowW) {
      vec3 Lb = normalize(light - vec3(frag, 0.0));
      vec3 col = vec3(0.012) * (0.85 + 0.3 * vnoise(frag * 0.35)) * (0.35 + 0.9 * max(Lb.z, 0.0));
      vec2 hs = vec2(halfSize.x * shadowW, halfSize.y);
      vec2 sh = abs(frag - center - vec2(0.012, -0.02) * halfSize.y) - hs;
      float sd = length(max(sh, 0.0)) + min(max(sh.x, sh.y), 0.0);
      col *= 1.0 - 0.75 * exp(-max(sd, 0.0) / (0.035 * halfSize.y));
      return col;
    }

    vec3 shade(vec2 frag) {
      // the label is a plane through the centre, turned; a pinhole camera in front of the screen
      float cy = cos(turn.x); float sy = sin(turn.x);
      float cx = cos(turn.y); float sx = sin(turn.y);
      vec3 ex = vec3(cy, 0.0, -sy);
      vec3 ey = vec3(sy * sx, cx, cy * sx);
      vec3 n = vec3(sy * cx, -sx, cy * cx);
      vec3 C = vec3(center, 0.0);
      vec3 E = vec3(center, 5.0 * halfSize.x);
      vec3 dir = vec3(frag, 0.0) - E;
      float dn = dot(dir, n);
      if (abs(dn) < 1e-4) return background(frag, abs(cy));
      vec3 X = E + dir * (dot(C - E, n) / dn);
      vec2 lp = vec2(dot(X - C, ex), dot(X - C, ey));
      float back = step(0.0, dot(n, -dir)) < 0.5 ? 1.0 : 0.0; // facing away: the back is towards us
      vec3 Lw = light - X;
      vec3 Vw = E - X;
      vec3 L = normalize(vec3(dot(Lw, ex), dot(Lw, ey), dot(Lw, n)));
      vec3 V = normalize(vec3(dot(Vw, ex), dot(Vw, ey), dot(Vw, n)));
      if (back > 0.5) {
        // seen from behind: the same threads (so the mark reads mirrored), lit on the other side \u2014
        // reflecting z turns the back surface into one the shading below can treat as a face
        L.z = -L.z;
        V.z = -V.z;
      }
      vec2 q = lp / halfSize;
      vec2 gg = (q * 0.5 + 0.5) * cells;
      float row = floor(gg.y);
      float jl = 0.15 + 0.6 * h1(row * 7.13 + 1.0);
      float jr = 0.15 + 0.6 * h1(row * 3.37 + 9.0);
      if (gg.y < 0.0 || gg.y > cells.y || gg.x < jl || gg.x > cells.x - jr) return background(frag, abs(cy));
      vec3 col = cloth(gg, L, V, back);
      // selvedges roll over at top and bottom; the cut ends are heat-sealed, a touch darker
      col *= mix(0.45, 1.0, smoothstep(0.0, 1.2, min(gg.y, cells.y - gg.y)));
      col *= mix(0.55, 1.0, smoothstep(0.0, 0.6, min(gg.x - jl, cells.x - jr - gg.x)));
      return col;
    }

    void main() {
      vec3 col = vec3(0.0);
      if (ss > 1.5) {
        col += shade(gl_FragCoord.xy + vec2(-0.25, -0.25));
        col += shade(gl_FragCoord.xy + vec2(0.25, -0.25));
        col += shade(gl_FragCoord.xy + vec2(-0.25, 0.25));
        col += shade(gl_FragCoord.xy + vec2(0.25, 0.25));
        col *= 0.25;
      } else {
        col = shade(gl_FragCoord.xy);
      }
      col = col / (1.0 + col * 0.35);
      gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
    }
  `}),F=new G(new N(2,2),Z);F.frustumCulled=!1;A.add(F);let f=1,a={cx:0,cy:0,hw:1,hh:1},i=1,s={x:0,y:0};function C(){const e=window.innerWidth,t=window.innerHeight;f=Math.min(window.devicePixelRatio||1,2),z.setPixelRatio(f),z.setSize(e,t,!1),w.resolution.value.set(e*f,t*f);const o=Math.min(.5*t,(e<=768?.86*e:.5*e)/L);a={cx:e*f/2,cy:t*f/2,hw:o*L*f/2,hh:o*f/2},P()}function P(){w.center.value.set(a.cx+s.x,a.cy+s.y),w.halfSize.value.set(a.hw*i,a.hh*i),w.logoHalf.value=a.hh*.66*i;const e=2*a.hw*i/k;w.ss.value=e<7?2:1}function S(e,t,o){const r=Math.min(6,Math.max(1,i*e)),n=r/i,u=a.cx+s.x,p=a.cy+s.y;s.x=t+(u-t)*n-a.cx,s.y=o+(p-o)*n-a.cy,i=r,i===1&&(s={x:0,y:0}),P()}const h={x:0,y:0},g={x:0,y:0};let W=-1e9,_=-1e9,b=0;const M=e=>[e.clientX*f,(window.innerHeight-e.clientY)*f],d=new Map;let x=null;const l={a:0,t:0,aTo:0,tTo:0};let c=null;v.addEventListener("pointerdown",e=>{const[t,o]=M(e);d.set(e.pointerId,{x:t,y:o}),v.setPointerCapture(e.pointerId),c=d.size===1?{x:t,y:o,a:l.a,t:l.t,moved:0}:null});v.addEventListener("pointermove",e=>{const[t,o]=M(e);if(d.has(e.pointerId)&&d.set(e.pointerId,{x:t,y:o}),d.size===2){const[r,n]=[...d.values()],u=Math.hypot(r.x-n.x,r.y-n.y),p=(r.x+n.x)/2,y=(r.y+n.y)/2;x&&(s.x+=p-x.mx,s.y+=y-x.my,S(u/x.d,p,y)),x={d:u,mx:p,my:y};return}if(c&&d.has(e.pointerId)){const r=a.hw*2;c.moved=Math.max(c.moved,Math.hypot(t-c.x,o-c.y)),l.a=l.aTo=c.a+(t-c.x)/r*Math.PI,l.t=l.tTo=Math.max(-.5,Math.min(.5,c.t+(o-c.y)/r*1.2));return}e.pointerType==="mouse"&&(h.x=t,h.y=o,W=performance.now())});const I=e=>{d.delete(e.pointerId),d.size<2&&(x=null),c&&d.size===0&&(c.moved<6*f?l.aTo=Math.round(l.a/Math.PI)*Math.PI+Math.PI:l.aTo=Math.round(l.a/Math.PI)*Math.PI,l.tTo=0,c=null)};v.addEventListener("pointerup",I);v.addEventListener("pointercancel",I);v.addEventListener("wheel",e=>{e.preventDefault();const[t,o]=M(e);S(Math.exp(-e.deltaY*.0015),t,o)},{passive:!1});v.addEventListener("dblclick",()=>{i=1,s={x:0,y:0},P()});function $(e){if(e.beta==null||e.gamma==null)return;const t=Math.max(-1,Math.min(1,e.gamma/35)),o=Math.max(-1,Math.min(1,(e.beta-40)/35));h.x=a.cx+s.x+t*a.hw*i*1.4,h.y=a.cy+s.y-o*a.hh*i*1.4,_=performance.now()}window.addEventListener("deviceorientation",$);const E=window.DeviceOrientationEvent;typeof E?.requestPermission=="function"&&v.addEventListener("pointerup",()=>{E.requestPermission().catch(()=>{})},{once:!0});let V=performance.now();function B(e){const t=Math.min(.05,(e-V)/1e3);V=e;const o=a.cx+s.x,r=a.cy+s.y;e-W>4e3&&e-_>1e3&&(b+=t*.45,h.x=o+Math.cos(b)*a.hw*i*1.1,h.y=r+Math.sin(b*.8)*a.hh*i*1.1);const n=1-Math.exp(-t*7);if(g.x+=(h.x-g.x)*n,g.y+=(h.y-g.y)*n,w.light.value.set(g.x,g.y,a.hh*i*1.6),!c){const u=1-Math.exp(-t*6);l.a+=(l.aTo-l.a)*u,l.t+=(l.tTo-l.t)*u}w.turn.value.set(l.a,l.t),z.render(A,Q),requestAnimationFrame(B)}window.addEventListener("resize",C);C();g.x=h.x=a.cx+a.hw;g.y=h.y=a.cy+a.hh;requestAnimationFrame(B);
