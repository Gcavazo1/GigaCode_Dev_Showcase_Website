uniform float uTime;
uniform float uSize;
uniform float uBassFrequency;
uniform float uMidFrequency;
uniform float uHighFrequency;
uniform float uBeat;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uMaxDistance;

attribute float aScale;
attribute vec3 aRandomness;

varying vec3 vPosition;
varying float vDistance;
varying float vScale;
varying vec3 vColor;

// Turbulence noise function for organic movement
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float noise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
    dot(x12.zw, x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Curl noise function for fluid movement
vec3 curl(vec3 p) {
  float noise1, noise2, noise3;
  float eps = 0.01;
  
  // Use amplitude from audio to intensify movement
  float amp = uAmplitude;
  
  // Add time-based movement amplified by beat
  float timeScale = uTime * 0.3 * (1.0 + uBeat * 0.5);
  
  // Different frequencies for each dimension
  noise1 = noise(vec2(p.y * 0.1 + timeScale, p.z * 0.1 + timeScale * 0.8)) * amp;
  noise2 = noise(vec2(p.z * 0.1 + timeScale * 1.2, p.x * 0.1 + timeScale * 0.7)) * amp;
  noise3 = noise(vec2(p.x * 0.1 + timeScale * 0.9, p.y * 0.1 + timeScale * 1.1)) * amp;
  
  // Add audio reactivity to the curl pattern
  noise1 *= 1.0 + uBassFrequency * 1.2;
  noise2 *= 1.0 + uMidFrequency * 1.0;
  noise3 *= 1.0 + uHighFrequency * 0.8;
  
  return vec3(noise1, noise2, noise3);
}

void main() {
  // Original position with randomness for variation
  vec3 pos = position + aRandomness * 0.3;
  
  // Apply curl noise movement
  vec3 curlForce = curl(pos * uFrequency);
  
  // Apply beat pulse effect
  float beatEffect = uBeat * aScale * 0.5;
  
  // Apply audio-reactive displacement
  pos += curlForce * (1.0 + beatEffect);
  
  // Calculate distance for color interpolation
  float distance = length(pos - position) / uMaxDistance;
  vDistance = clamp(distance, 0.0, 1.0);
  
  // Calculate colors based on position and audio
  vColor = vec3(
    0.5 + uHighFrequency * 0.7, 
    0.2 + uMidFrequency * 0.5, 
    0.8 + uBassFrequency * 0.8
  );
  
  // Apply model transformation
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  
  // Calculate size based on audio
  float size = uSize;
  size *= 0.2 + uMidFrequency * 1.5; // Mid frequencies affect size
  size *= aScale * (0.5 + uBassFrequency); // Bass affects size variation
  size *= 1.0 + uBeat * 0.5; // Beat makes particles bigger
  
  // Set point size with perspective
  gl_PointSize = size * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
  
  // Pass variables to fragment shader
  vPosition = position;
  vScale = aScale;
}