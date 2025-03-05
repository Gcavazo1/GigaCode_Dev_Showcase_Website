// Crystal Dimension shader - Abstract geometric crystal world
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define PI 3.14159265359
#define TAU 6.28318530718

// Rotation matrix
mat2 rotate(float angle) {
  float s = sin(angle), c = cos(angle);
  return mat2(c, -s, s, c);
}

// Distance to a triangle
float sdTriangle(vec2 p, float size) {
  float k = sqrt(3.0);
  p.x = abs(p.x) - size;
  p.y = p.y + size / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * size, 0.0);
  return -length(p) * sign(p.y);
}

// Distance to hexagon
float sdHexagon(vec2 p, float size) {
  vec2 q = abs(p);
  float d = dot(q, normalize(vec2(1.0, 1.73)));
  d = max(d, q.x);
  return d - size;
}

// Prismatic color based on position
vec3 prismatic(float t) {
  return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  // Setup coordinates
  vec2 uv = vTexCoord * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  
  // Time-based variables
  float time = vTime * 0.5;
  
  // Kaleidoscopic repetition
  float angle = atan(uv.y, uv.x);
  float segments = 8.0 + 4.0 * sin(time * 0.2);
  float segmentAngle = TAU / segments;
  angle = mod(angle, segmentAngle) - segmentAngle * 0.5;
  
  // Rotate space
  uv *= 1.0 + 0.4 * sin(time * 0.3);
  uv *= rotate(time * 0.3);
  
  // Initialize distance
  float dist = 1000.0;
  
  // Create multiple crystal layers
  for (float i = 0.0; i < 5.0; i++) {
    float t = time * (0.4 + 0.2 * i) + i * PI / 3.0;
    
    // Create deformed space for this layer
    vec2 p = uv + 0.4 * vec2(sin(t + i), cos(t * 0.9 + i * 0.5));
    p *= rotate(t * 0.2 + i * 0.2);
    p *= 1.0 + 0.5 * sin(t * 0.3);
    
    // Add diamond patterns
    vec2 gv = fract(p * (1.5 + 0.8 * i + 0.2 * sin(t)) + 0.5) - 0.5;
    float d1 = abs(gv.x) + abs(gv.y) - (0.5 + 0.2 * sin(t + length(p) * 6.0));
    
    // Add triangular patterns
    vec2 gv2 = fract(p * 2.5 * rotate(PI / 3.0 + t * 0.2) + 0.5) - 0.5;
    float d2 = sdTriangle(gv2, 0.2 + 0.15 * sin(t + length(p) * 4.0));
    
    // Add hexagonal patterns
    vec2 gv3 = fract(p * 2.0 * rotate(t * 0.3) + 0.5) - 0.5;
    float d3 = sdHexagon(gv3, 0.3 + 0.15 * cos(t * 0.7 + length(p) * 3.0));
    
    // Combine patterns
    float layerDist = min(min(d1, d2), d3);
    dist = min(dist, layerDist - 0.05 * i);
  }
  
  // Create smooth field and edge detection
  float field = smoothstep(0.01, 0.03, dist);
  float edge = (1.0 - smoothstep(0.00, 0.04, abs(dist))) * 1.5;
  
  // Generate prismatic colors based on position and time
  float colorPos = length(uv) + time * 0.3;
  colorPos += 0.2 * sin(angle * 12.0 + time * 1.5);
  vec3 color = prismatic(colorPos);
  
  // Modulate field color
  color = mix(color, prismatic(colorPos + 0.33), field);
  
  // Add highlighting and edge effects
  color += vec3(0.9, 0.8, 1.0) * edge;
  
  // Add light beams
  float beams = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    float t = time * (0.3 + 0.2 * i) + i * PI / 3.0;
    beams += pow(0.5 + 0.5 * sin(uv.x * 8.0 + t) * sin(uv.y * 8.0 - t), 3.0) * 0.3;
  }
  color += beams * vec3(1.0, 0.8, 1.0);
  
  // Add subtle glow
  float glow = 0.03 / (0.01 + abs(dist));
  color += glow * prismatic(time * 0.1);
  
  // Add subtle shimmer
  float shimmer = fract(sin(dot(uv, vec2(12.9898, 78.233)) + time * 2.0) * 43758.5453);
  color += shimmer * 0.1;
  
  // Enhance contrast
  color = pow(color, vec3(0.8)) * 1.2;
  
  // Apply intensity
  color *= uIntensity;
  
  gl_FragColor = vec4(color, 1.0);
} 