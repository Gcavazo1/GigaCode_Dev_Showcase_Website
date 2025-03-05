// Enhanced Liquid Metal
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
  return res*res; // Squared for sharper contrast
}

float fbm(vec2 p) {
  float f = 0.0;
  float w = 0.5;
  float time = vTime * 0.2;
  for (int i = 0; i < 6; i++) { // Increased octaves
    f += w * noise(p + time);
    p *= 2.1; // Slightly uneven frequency multiplier
    w *= 0.5;
  }
  return f;
}

void main() {
  vec2 uv = vTexCoord;
  float ratio = uResolution.x / uResolution.y;
  uv.x *= ratio;
  
  float time = vTime * 0.2;
  
  // Enhanced layered displacement
  float displacement = 0.0;
  
  // Dynamic wave patterns
  vec2 p1 = uv * 2.0 + vec2(sin(time * 0.5), cos(time * 0.3)) * 0.2;
  displacement += fbm(p1) * 0.4;
  
  vec2 p2 = uv * 4.0 + vec2(cos(time * 0.4), sin(time * 0.6)) * 0.3;
  displacement += fbm(p2) * 0.2;
  
  vec2 p3 = uv * 8.0 + displacement * 2.0;
  displacement += fbm(p3) * 0.1;
  
  // Enhanced normal calculation
  vec2 eps = vec2(0.01, 0.0);
  float nx = fbm(vec2(uv.x + eps.x, uv.y)) - fbm(vec2(uv.x - eps.x, uv.y));
  float ny = fbm(vec2(uv.x, uv.y + eps.x)) - fbm(vec2(uv.x, uv.y - eps.x));
  vec3 normal = normalize(vec3(nx, ny, 0.3));
  
  // Dynamic environment mapping
  vec2 reflectionUV = uv + normal.xy * (0.2 + sin(time) * 0.1);
  float reflection = fbm(reflectionUV * 3.0 + time * 0.1);
  
  // Enhanced metallic colors
  vec3 baseColor = mix(
    vec3(0.7, 0.8, 1.0), // Cool silver
    vec3(0.9, 0.8, 0.6), // Warm gold
    sin(displacement * 5.0 + time) * 0.5 + 0.5
  );
  
  vec3 reflectionColor = mix(
    vec3(1.0, 0.9, 0.6), // Gold
    vec3(0.6, 0.8, 1.0), // Blue
    reflection
  );
  
  // Combine with enhanced contrast
  vec3 color = mix(baseColor, reflectionColor, reflection * 0.8);
  color *= 0.8 + displacement * 0.7;
  
  // Enhanced specular highlights
  float specular = pow(max(0.0, normal.z), 8.0) * 2.0;
  color += vec3(specular);
  
  // Add iridescence
  float iridescence = sin(displacement * 10.0 + time) * 0.5 + 0.5;
  color += vec3(0.2, 0.1, 0.3) * iridescence * 0.2;
  
  // Apply intensity with enhanced contrast
  color = pow(color * uIntensity, vec3(0.9));
  
  gl_FragColor = vec4(color, 1.0);
} 