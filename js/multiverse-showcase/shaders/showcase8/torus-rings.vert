// Torus Rings vertex shader
attribute vec4 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vUv;
varying float vTime;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
  vUv = aTexCoord;
  vTime = uTime;
} 