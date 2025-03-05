// Base fragment shader with common uniforms and functions
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Common utility functions
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 rotate(vec2 uv, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * uv;
}

void main() {
  // Default color - will be overridden by specific shaders
  gl_FragColor = vec4(vTexCoord, 0.5 + 0.5 * sin(vTime), 1.0);
} 