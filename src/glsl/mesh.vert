precision highp float;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;

uniform float size;
uniform float ang;

attribute vec3 position;
attribute vec3 info;
attribute vec3 color;

varying vec3 vColor;

void main(){
  vColor = color;

  vec3 p = position;
  
  float rotationAngle = ang * info.x * 0.15;
  
  // Define a default threshold value
  float threshold = 0.01;

  // Apply effect only if the angle exceeds the threshold.
  // Note: this intentionally scales each point by cos(rotationAngle) rather than
  // rotating it. The original used rotate(p, angle, vec3(0,0,0)) — a degenerate
  // zero-length axis. normalize(vec3(0)) is undefined in GLSL: Chromium returns
  // (0,0,0), which collapses the rotation matrix to cos(angle)*identity (the
  // intended radial "wave" wrap), while Safari/Metal returns NaN, which made the
  // outer points vanish (image cropped to a circle and shrunk to a point).
  // Expressing it explicitly makes the effect identical across all browsers.
  if (abs(rotationAngle) > threshold) {
    p = p * cos(rotationAngle);
  }

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size;
}
