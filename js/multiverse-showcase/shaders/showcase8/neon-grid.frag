
// Smooth noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float n = i.x + i.y * 57.0;
  float a = hash(n);
  float b = hash(n + 1.0);
  float c = hash(n + 57.0);
  float d = hash(n + 58.0);
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 2D rotation matrix
mat2 rotate2D(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
  // Centered coordinates
  vec2 uv = vTexCoord * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  
  // Time variables
  float time = vTime * 0.3;
  
  // Store original uv for later
  vec2 originalUV = uv;
  
  // Create spiral effect
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float tunnelSpeed = time * 0.5;
  
  // Create wormhole distortion
  float distortion = sin(angle * 3.0 + tunnelSpeed) * 0.1;
  radius += distortion;
  
  // Create tunnel layers
  float tunnel = 0.0;
  float tunnelLayers = 5.0;
  
  for(float i = 0.0; i < tunnelLayers; i++) {
    // Create ring pattern that moves toward viewer
    float ringRadius = fract(radius * (3.0 - i * 0.2) - tunnelSpeed) * 2.0; 
    ringRadius = abs(ringRadius - 1.0);
    
    // Add glow to rings
    float ringGlow = pow(1.0 - ringRadius, 5.0);
    tunnel += ringGlow * (0.5 - i * 0.05);
  }
  
  // Create stars in background
  vec2 rotatedUV = originalUV * rotate2D(time * 0.1);
  float stars = pow(noise(rotatedUV * 50.0), 20.0) * 2.0;
  stars *= smoothstep(0.0, 0.3, radius); // Stars only in outer area
  
  // Create cosmic swirl
  float swirl = noise(vec2(angle * 2.0 + time, radius * 3.0)) * 0.5 + 0.5;
  
  // Create color variations
  float colorShift = sin(angle * 2.0 + time) * 0.5 + 0.5;
  
  // Define color palette
  vec3 color1 = vec3(0.1, 0.0, 0.3); // Deep purple
  vec3 color2 = vec3(0.8, 0.2, 0.8); // Magenta
  vec3 color3 = vec3(0.0, 0.6, 1.0); // Cyan
  
  // Combine colors based on tunnel and swirl
  vec3 color = mix(color1, color2, swirl);
  color = mix(color, color3, colorShift);
  
  // Add tunnel
  color += tunnel * vec3(0.8, 0.4, 1.0);
  
  // Add stars
  color += stars * vec3(1.0, 0.95, 0.8);
  
  // Add glow at center
  float centerGlow = 0.05 / (radius + 0.05);
  color += centerGlow * vec3(0.8, 0.5, 1.0);
  
  // Add subtle pulsing
  float pulse = sin(time) * 0.5 + 0.5;
  color *= 0.8 + pulse * 0.2;
  
  // Add vignette
  float vignette = 1.0 - smoothstep(0.0, 1.8, radius);
  color *= vignette;
  
  // Enhance contrast
  color = pow(color, vec3(0.8));
  
  // Apply intensity
  color *= uIntensity;
  
  gl_FragColor = vec4(color, 1.0);
} 