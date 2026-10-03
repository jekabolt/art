uniform sampler2D t;
uniform bool useMask;
uniform vec3 c;
uniform vec2 bp;
uniform vec2 ma;
uniform vec2 mb;
uniform vec2 mc;
uniform float line;
uniform float time;
// tap glint: a ring of light (centre, radius and half-width in world units, strength 0..1)
uniform vec2 glintAt;
uniform float glintR;
uniform float glintW;
uniform float glintK;

varying vec2 vUv;
varying vec2 vWorld;

void main(void) {
  vec3 p = vec3(vUv, 0.0);

  vec3 v1 = vec3(ma, 0.0);
  vec3 v2 = vec3(mb, 0.0);
  vec3 v3 = vec3(mc, 0.0);

  vec3 pA = cross(v2 - v1, p - v1);
  vec3 pB = cross(v3 - v2, p - v2);
  vec3 pC = cross(v1 - v3, p - v3);

  float dotA = dot(pA, pB);
  float dotB = dot(pA, pC);

  vec4 dest = texture2D(t, vUv);
  dest.rgb = c;

  float lineScale = -1.0;
  // if((dotA > 0.0 && dotB > 0.0) || useMask) {
  //   dest.rgb *= 0.5;
  // }

  vec2 v = (vUv.xy + vec2(time * 0.5, 0.1)) * lineScale;
  v = mix(vUv, v, distance(bp, vUv) * -0.19);
  float f = sin(v.x + v.y);
  dest.a *= smoothstep(abs(f), line, distance(bp, vUv) * 1.0);

  if (glintK > 0.0) {
    // a bright crest with a dark trough just inside it: the light reads on white relief too
    float d = (distance(vWorld, glintAt) - glintR) / glintW;
    float crest = exp(-d * d);
    float trough = exp(-(d + 2.2) * (d + 2.2));
    dest.rgb = clamp(dest.rgb + (crest - trough * 0.6) * glintK, 0.0, 1.0);
  }

  gl_FragColor = dest;

  // if((dotA > 0.0 && dotB > 0.0) || useMask) {
  //   vec4 dest = texture2D(t, vUv);
  //   dest.rgb = c;
  //   // dest.rgb = mix(c, 1.0 - c, dest.a);
  //   // dest.a = 1.0;

  //   float lineScale = 10.0;
  //   vec2 v = vUv.xy * lineScale;
  //   float f = sin(v.x + v.y);
  //   // dest.a *= 1.0 - step(abs(f), line);

  //   gl_FragColor = dest;
  // } else {
  //   gl_FragColor = texture2D(t, vUv);
  //   gl_FragColor.rgb = vec3(0.0, 0.0, 0.0);
  //   // discard;
  // }
}
