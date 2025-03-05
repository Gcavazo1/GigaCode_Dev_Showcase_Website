// Liquid Metal fragment shader - Realistic liquid metal simulation
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Noise functions
float hash(float n) { return fract(sin(n) * 43758.5453123); }

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u*u*(3.0-2.0*u);
  
  float res = mix(
    mix(hash(dot(ip, vec2(1.0, 157.0))), hash(dot(ip + vec2(1.0, 0.0), vec2(1.0, 157.0))), u.x),
    mix(hash(dot(ip + vec2(0.0, 1.0), vec2(1.0, 157.0))), hash(dot(ip + vec2(1.0, 1.0), vec2(1.0, 157.0))), u.x),
    u.y);
  return res;
}

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
  // Adjust coordinates
  vec2 uv = vTexCoord;
  float ratio = uResolution.x / uResolution.y;
  uv.x *= ratio;
  
  // Time variables
  float time = vTime * 0.2;
  
  // Create liquid surface displacement
  float displacement = 0.0;
  
  // Layer 1: Slow large waves
  vec2 p1 = uv * 2.0;
  p1.y += time * 0.05;
  p1.x += sin(time * 0.1) * 0.5;
  displacement += fbm(p1) * 0.3;
  
  // Layer 2: Medium ripples
  vec2 p2 = uv * 5.0;
  p2.x += time * 0.06;
  p2.y += sin(time * 0.12) * 0.5;
  displacement += fbm(p2) * 0.2;
  
  // Layer 3: Small detailed ripples
  vec2 p3 = uv * 10.0;
  p3.x += time * 0.1;
  p3.y -= time * 0.05;
  displacement += fbm(p3) * 0.1;
  
  // Calculate normals for reflection
  vec2 eps = vec2(0.01, 0.0);
  float nx = fbm(vec2(uv.x + eps.x, uv.y)) - fbm(vec2(uv.x - eps.x, uv.y));
  float ny = fbm(vec2(uv.x, uv.y + eps.x)) - fbm(vec2(uv.x, uv.y - eps.x));
  vec3 normal = normalize(vec3(nx, ny, 0.5));
  
  // Reflection and environment mapping
  vec2 reflectionUV = uv + normal.xy * 0.2;
  float reflection = fbm(reflectionUV * 3.0 + time * 0.1) * 0.8 + 0.2;
  
  // Metallic color with reflection
  vec3 baseColor = vec3(0.7, 0.8, 0.9); // Silvery blue
  vec3 reflectionColor = vec3(1.0, 0.8, 0.6); // Gold-ish reflection
  
  // Combine base color and reflection
  vec3 color = mix(baseColor, reflectionColor, reflection);
  
  // Add surface displacement effect to color
  color *= 0.8 + displacement * 0.5;
  
  // Add highlights
  float highlight = pow(max(0.0, normal.z), 4.0);
  color += vec3(highlight) * 0.5;
  
  // Add ripple patterns
  float ripples = sin((uv.x + uv.y) * 40.0 + displacement * 20.0 + time * 2.0) * 0.5 + 0.5;
  color += vec3(ripples * 0.05);
  
  // Apply intensity
  color *= uIntensity;
  
  gl_FragColor = vec4(color, 1.0);
} 