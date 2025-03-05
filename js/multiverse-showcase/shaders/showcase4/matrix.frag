// Enhanced Matrix Digital Rain
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Hash function
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

// Random function
float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Character function - simulates a random character
float character(vec2 p, float n) {
  // More varied character patterns
  p = floor(p * vec2(12.0, 16.0));
  float c = hash(p.x + p.y * 64.0 + n * 137.0);
  c = step(0.5 + sin(n) * 0.2, c); // Vary character density
  return c;
}

void main() {
  // Scale and adjust coordinates
  vec2 uv = vTexCoord;
  
  // Improved character grid
  float charSize = 0.02 - sin(vTime * 0.2) * 0.005; // Pulsing size
  vec2 charPos = mod(uv, charSize) / charSize;
  vec2 charId = floor(uv / charSize);
  
  // Enhanced falling effect
  float speed = 0.8;
  float columnSpeed = hash(charId.x) * 0.8 + 0.4; // More varied speeds
  float time = vTime * speed * columnSpeed;
  
  // Multiple layers of characters
  float y = mod(charId.y - time * 2.0 + hash(charId.x) * 100.0, 50.0);
  
  // Brighter head glow
  float headGlow = exp(-y * 0.2) * 2.0;
  
  // Multiple character layers
  float char1 = character(charPos, time + charId.y);
  float char2 = character(charPos, time * 1.3 + charId.y);
  float finalChar = mix(char1, char2, 0.5);
  
  // Enhanced trail effect
  float trail = exp(-y * 0.15);
  
  // Combine effects with improved colors
  float brightness = finalChar * trail * (0.7 + headGlow);
  vec3 color = vec3(0.0, 1.0, 0.3) * brightness; // Brighter green
  
  // Add subtle color variations
  color += vec3(0.0, 0.8, 0.2) * headGlow * 0.5;
  
  // Add bloom effect
  float bloom = exp(-y * 0.1) * 0.5;
  color += vec3(0.0, 0.6, 0.2) * bloom;
  
  // Add screen glow
  color += vec3(0.0, 0.05, 0.02);
  
  // Apply intensity with gamma correction
  color = pow(color * uIntensity, vec3(0.8));
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 