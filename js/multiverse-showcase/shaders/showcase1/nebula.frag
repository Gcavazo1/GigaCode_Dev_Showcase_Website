// Nebula fragment shader - Cosmic nebula effect
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Noise functions
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  
  float res = mix(
    mix(hash(dot(ip, vec2(1.0, 157.0))), 
        hash(dot(ip + vec2(1.0, 0.0), vec2(1.0, 157.0))), u.x),
    mix(hash(dot(ip + vec2(0.0, 1.0), vec2(1.0, 157.0))), 
        hash(dot(ip + vec2(1.0, 1.0), vec2(1.0, 157.0))), u.x), 
    u.y);
  return res * res;
}

// Fractal Brownian Motion
float fbm(vec2 p) {
  float f = 0.0;
  float w = 0.5;
  for (int i = 0; i < 5; i++) {
    f += w * noise(p);
    p *= 2.0;
    w *= 0.5;
  }
  return f;
}

void main() {
  // Center the coordinates
  vec2 uv = vTexCoord * 2.0 - 1.0;
  
  // Adjust aspect ratio
  uv.x *= uResolution.x / uResolution.y;
  
  // Create nebula effect
  float speed = 0.1;
  float scale = 3.0;
  
  // Create multiple layers of noise
  float f = 0.0;
  vec2 shift = vec2(vTime * speed, vTime * speed * 0.5);
  
  // Layer 1
  vec2 p = uv * scale;
  f += fbm(p + shift) * 0.6;
  
  // Layer 2
  p = uv * scale * 2.0;
  f += fbm(p + shift * 1.5) * 0.3;
  
  // Layer 3
  p = uv * scale * 4.0;
  f += fbm(p + shift * 2.0) * 0.1;
  
  // Create color gradient
  vec3 color1 = vec3(0.1, 0.0, 0.3); // Dark purple
  vec3 color2 = vec3(0.8, 0.2, 0.7); // Pink
  vec3 color3 = vec3(0.1, 0.4, 0.8); // Blue
  
  // Mix colors based on noise value
  vec3 color = mix(color1, color2, f);
  color = mix(color, color3, f * f);
  
  // Add stars
  float stars = pow(noise(uv * 100.0), 20.0) * uIntensity;
  color += vec3(stars);
  
  // Add glow based on distance from center
  float dist = length(uv);
  float glow = 1.0 - smoothstep(0.0, 0.8, dist);
  color += color2 * glow * 0.3 * uIntensity;
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 