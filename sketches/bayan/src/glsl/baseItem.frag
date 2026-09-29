uniform sampler2D t;
uniform vec2 mask;

varying vec2 vUv;

void main(void) {
  vec4 dest = texture2D(t, vUv);
  if(vUv.y < mask.x || vUv.y > mask.y) {
    dest.a = 0.0;
  }
  gl_FragColor = dest;
}
