// Neon Grid fragment shader - Raymarched cubes
precision mediump float;

varying vec2 v_uv;
varying float vTime;
uniform vec2 uResolution;
uniform float uIntensity;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001
#define PI 3.1415926535

// Your raymarching code here...
// (The rest of your shader code) 