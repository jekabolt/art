import"./modulepreload-polyfill.b7f2da20.js";import{E as b}from"./embed.d17cc095.js";import{i as P,L as T,W as q,S as A,O as X,j as i,g as _,M as C,e as F}from"./vendor.008209b9.js";import{c as x,a as k,b as G,L as W}from"./logo-path.248ebb5a.js";const c={markXs:.62,markLg:.32,reach:.38,samples:40},m=1024,f=document.createElement("canvas");f.width=f.height=m;{const e=f.getContext("2d");e.scale(m/x,m/x),e.translate(-k,-k),e.lineWidth=G,e.strokeStyle="#fff",e.stroke(new Path2D(W))}const u=new P(f);u.minFilter=T;u.generateMipmaps=!1;const l=document.getElementById("flare"),v=new q({canvas:l,antialias:!1}),E=new A,Y=new X(-1,1,1,-1,0,1),a={resolution:{value:new i},centre:{value:new i},side:{value:1},light:{value:new i},tapDir:{value:new i(1,0)},flash:{value:0},time:{value:0},mask:{value:u}},z=new _({uniforms:a,defines:{STEPS:c.samples},vertexShader:"void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:`
    uniform vec2 resolution, centre, light, tapDir;
    uniform float side, flash, time;
    uniform sampler2D mask;

    float stroke(vec2 p) {
      vec2 uv = (p - centre) / side + 0.5;
      if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
      return texture2D(mask, uv).a;
    }
    // the light as it leaves the stencil: a bright soft source, blocked by the strokes
    float lit(vec2 p) {
      vec2 d = (p - light) / side;
      float src = exp(-dot(d, d) * 5.5) * 1.4 + exp(-dot(d, d) * 60.0) * 2.0;
      return src * (1.0 - stroke(p));
    }
    float hexagon(vec2 p, float r) {
      p = abs(p);
      return max(dot(p, vec2(0.866, 0.5)), p.y) - r;
    }

    void main() {
      vec2 p = gl_FragCoord.xy;
      float f = flash < 3.0 ? exp(-flash * 2.2) * smoothstep(0.0, 0.04, flash) : 0.0;

      // rays: gather along the line to the light; the decay is the length of the rays, longer in
      // a flash. Each channel walks a slightly different length, so the ends split into colour.
      float decay = 0.93 + 0.045 * f;
      vec2 step = (light - p) / float(STEPS) * 0.9;
      vec3 rays = vec3(0.0);
      float w = 1.0;
      // each pixel starts its walk at a random fraction of a step: no stair-steps in the rays
      float jitter = fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453);
      for (int i = 0; i < STEPS; i++) {
        vec2 q = p + step * (float(i) + jitter);
        float l = lit(q);
        rays += l * w * vec3(1.0, 0.0, 0.0);
        rays.g += lit(q + step * 0.06) * w;
        rays.b += lit(q + step * 0.12) * w;
        w *= decay;
      }
      rays *= 0.06 * (1.0 + 2.2 * f);

      float s = stroke(p);
      vec3 warm = vec3(1.0, 0.93, 0.82);
      vec3 col = rays * warm * (1.0 - 0.6 * s) + lit(p) * warm * 0.55;

      // flash: a flat streak through the source, and ghosts along the line through the tap
      vec2 dl = p - light;
      col += vec3(0.75, 0.85, 1.0) * f * exp(-abs(dl.y) / (side * 0.008)) * exp(-abs(dl.x) / (side * 1.4));
      for (int k = 0; k < 6; k++) {
        float fk = float(k);
        float t = -0.7 + fk * 0.55;
        vec2 gc = light + tapDir * side * t * 1.6;
        float r = side * (0.05 + 0.04 * mod(fk * 1.7, 2.3));
        float d = mod(fk, 2.0) < 0.5 ? hexagon(p - gc, r) : length(p - gc) - r;
        float ring = smoothstep(side * 0.012, 0.0, abs(d)) * 0.7 + smoothstep(0.0, -r, d) * 0.35;
        vec3 tint = 0.5 + 0.5 * cos(6.2831 * (fk * 0.17 + vec3(0.0, 0.33, 0.67)));
        float gf = flash < 3.0 ? exp(-flash * 1.4) * smoothstep(0.0, 0.08, flash) : 0.0;
        col += tint * ring * gf * 1.1;
      }

      col = 1.0 - exp(-col * 1.3); // soft shoulder
      col = mix(col, vec3(0.02), s * 0.85); // the stencil stays dark and sharp
      gl_FragColor = vec4(col, 1.0);
    }
  `});E.add(new C(new F(2,2),z));let n=1;function L(){const e=window.innerWidth,t=window.innerHeight;n=Math.min(window.devicePixelRatio||1,1.5),v.setPixelRatio(n),v.setSize(e,t,!1),a.resolution.value.set(e*n,t*n),a.centre.value.set(e*n/2,t*n/2),a.side.value=Math.min(e*(e<=768?c.markXs:c.markLg),t*.6)*n}window.addEventListener("resize",L);L();const d=new i,p=new i;let h=!1,r=null,S=-99;const M=(e,t)=>{const s=a.side.value/n,o=(e-window.innerWidth/2)/s,g=(window.innerHeight/2-t)/s,w=Math.hypot(o,g),y=w>c.reach?c.reach/w:1;d.set(o*y,g*y)};l.addEventListener("pointerdown",e=>{h=!0,r={x:e.clientX,y:e.clientY,t:performance.now()},M(e.clientX,e.clientY)});l.addEventListener("pointermove",e=>{(h||e.pointerType==="mouse")&&M(e.clientX,e.clientY)});const O=e=>{if(h=!1,r&&e.type==="pointerup"&&Math.hypot(e.clientX-r.x,e.clientY-r.y)<12&&performance.now()-r.t<350){S=performance.now();const t=a.centre.value,s=a.light.value,o=new i(e.clientX*n-s.x,(window.innerHeight-e.clientY)*n-s.y);o.lengthSq()<1&&o.set(t.x-s.x+1,t.y-s.y),a.tapDir.value.copy(o.normalize())}r=null};l.addEventListener("pointerup",O);l.addEventListener("pointercancel",O);l.addEventListener("pointerleave",e=>{e.pointerType==="mouse"&&d.set(0,0)});b||window.addEventListener("touchmove",e=>e.preventDefault(),{passive:!1});const H=performance.now();function D(e){const t=(e-H)/1e3;!h&&!matchMedia("(pointer: fine)").matches&&d.multiplyScalar(.97),p.lerp(d,.08);const s=a.side.value,o=a.centre.value;a.light.value.set(o.x+(p.x+Math.sin(t*.31)*.03)*s,o.y+(p.y+.06+Math.sin(t*.23+1)*.03)*s),a.time.value=t,a.flash.value=(e-S)/1e3,v.render(E,Y),requestAnimationFrame(D)}requestAnimationFrame(D);
