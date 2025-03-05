// Button background vertex shader
attribute vec4 aPosition;
attribute vec2 aTexCoord;
uniform float uTime;

varying vec2 v_uv;
varying float vTime;

void main() {
    gl_Position = aPosition;
    v_uv = aTexCoord;
    vTime = uTime;
} 