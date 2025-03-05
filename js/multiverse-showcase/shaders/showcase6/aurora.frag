// Aurora fragment shader - Aurora borealis effect
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Noise function
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
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
  vec2 uv = vTexCoord;
  
  // Adjust aspect ratio
  float aspect = uResolution.x / uResolution.y;
  
  // Create aurora effect
  float time = vTime * 0.2;
  
  // Create base shape
  float y = uv.y;
  
  // Create horizontal distortion
  float x = uv.x * aspect;
  float distortion = fbm(vec2(x * 2.0, time * 0.5)) * 0.3;
  
  // Create vertical waves
  float waves = fbm(vec2(x * 3.0 + time, time * 0.2)) * 0.1;
  
  // Combine distortion and waves
  float aurora = smoothstep(0.4 + distortion + waves, 0.6 + distortion + waves, y);
  
  // Create color variation
  float colorVar = fbm(vec2(x * 0.5 - time * 0.2, y * 2.0));
  
  // Create color palette
  vec3 color1 = vec3(0.0, 0.4, 0.2); // Green
  vec3 color2 = vec3(0.0, 0.6, 0.7); // Cyan
  vec3 color3 = vec3(0.4, 0.0, 0.6); // Purple
  
  // Mix colors based on position and noise
  vec3 color = mix(color1, color2, colorVar);
  color = mix(color, color3, fbm(vec2(x * 0.3 + time * 0.1, y)));
  
  // Apply aurora shape
  color *= aurora;
  
  // Add stars in the background
  float stars = pow(noise(uv * 100.0), 20.0) * 0.5;
  color += vec3(stars) * (1.0 - aurora);
  
  // Add glow
  float glow = aurora * 0.5 * (1.0 - y);
  color += color2 * glow;
  
  // Add intensity
  color *= uIntensity;
  
  // Add subtle background
  color += vec3(0.0, 0.0, 0.05);
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 