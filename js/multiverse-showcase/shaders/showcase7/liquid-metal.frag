// Plasma Wave shader - Colorful flowing plasma effect
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Adjustable parameters
#define SPEED 0.5
#define DENSITY 1.5
#define COLOR_INTENSITY 1.2

// Noise function
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  // Normalized coordinates
  vec2 uv = vTexCoord;
  uv = uv * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  
  // Time variable
  float time = vTime * SPEED;
  
  // Create plasma effect by layering sine waves
  float plasma = 0.0;
  
  // Layer 1: Circular waves
  float d1 = length(uv);
  plasma += sin(d1 * 10.0 - time * 1.5) * 0.5;
  
  // Layer 2: Diagonal waves
  float d2 = length(uv + vec2(sin(time * 0.2), cos(time * 0.3)) * 0.5);
  plasma += sin(d2 * 8.0 + time) * 0.5;
  
  // Layer 3: Horizontal wave
  plasma += sin(uv.x * 6.0 + sin(time * 0.3 + uv.y * 3.0) * 0.5) * 0.5;
  
  // Layer 4: Vertical wave
  plasma += sin(uv.y * 5.0 + sin(time * 0.4 + uv.x * 2.5) * 0.6) * 0.5;
  
  // Normalize to 0-1 range
  plasma = plasma * 0.25 + 0.5;
  
  // Color mapping using different phase shifts for RGB
  vec3 color;
  color.r = sin(plasma * 6.28 + 0.0) * 0.5 + 0.5;
  color.g = sin(plasma * 6.28 + 2.09) * 0.5 + 0.5;
  color.b = sin(plasma * 6.28 + 4.19) * 0.5 + 0.5;
  
  // Add glow
  float glow = 0.6 - length(uv) * 0.5;
  glow = max(0.0, glow);
  
  // Add movement to glow
  glow *= 1.0 + 0.2 * sin(time * 0.5);
  
  // Enhance colors
  color = mix(color, vec3(1.0, 0.4, 0.1), glow * 0.5);
  color = mix(color, vec3(0.2, 0.5, 1.0), (1.0 - glow) * 0.5);
  
  // Add shimmer effect
  float shimmer = hash(uv + time) * 0.03;
  color += vec3(shimmer);
  
  // Add vignette
  float vignette = 1.0 - length(uv * 0.5) * 0.8;
  vignette = smoothstep(0.0, 1.0, vignette);
  color *= vignette;
  
  // Enhance contrast
  color = pow(color, vec3(0.8)) * COLOR_INTENSITY;
  
  // Apply intensity
  color *= uIntensity;
  
  gl_FragColor = vec4(color, 1.0);
} 