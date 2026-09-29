uniform sampler2D t;

varying vec2 vUv;

void main(void) {
  vec2 uv = vec2(vUv.x, 0.5);
  vec4 dest = texture2D(t, uv);
  gl_FragColor = dest;
}
