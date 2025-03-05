// Cosmic Wormhole vertex shader
attribute vec4 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vTexCoord;
varying float vTime;

void main() {
  // Pass position through the matrix transformation
  gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
  
  // Pass texture coordinates and time to fragment shader
  vTexCoord = aTexCoord;
  vTime = uTime;
} 