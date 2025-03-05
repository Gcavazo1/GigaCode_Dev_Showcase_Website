// Matrix fragment shader - Digital rain effect
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
float character(vec2 p, float time) {
  p = floor(p * vec2(10.0, 16.0));
  float n = p.x + p.y * 10.0;
  float a = hash(n);
  float b = hash(n + 1.0);
  return mix(a, b, fract(time));
}

void main() {
  // Scale and adjust coordinates
  vec2 uv = vTexCoord;
  
  // Create grid for characters
  float charSize = 0.02;
  vec2 charPos = mod(uv, charSize) / charSize;
  vec2 charId = floor(uv / charSize);
  
  // Create falling effect
  float speed = 0.5;
  float columnSpeed = hash(charId.x) * 0.5 + 0.5; // Different speeds for each column
  float time = vTime * speed * columnSpeed;
  
  // Offset each column
  float yOffset = hash(charId.x) * 100.0;
  float y = mod(charId.y + time + yOffset, 50.0);
  
  // Character brightness based on y position
  float brightness = max(0.0, 1.0 - y * 0.06);
  
  // Generate random character
  float char = character(charPos, time * 10.0 + charId.y);
  
  // Determine if this position should show a character
  float threshold = 0.3 + 0.3 * sin(charId.x * 0.2 + vTime * 0.5);
  float showChar = step(threshold, hash(charId.y + charId.x * 100.0 + floor(time * 10.0)));
  
  // Create head glow effect
  float headGlow = max(0.0, 1.0 - abs(y - 0.5) * 5.0);
  
  // Create trail effect
  float trail = max(0.0, 1.0 - y * 0.15);
  
  // Combine effects
  float finalChar = char * showChar * brightness * trail;
  
  // Add head glow
  finalChar += headGlow * 0.8;
  
  // Create color
  vec3 color = vec3(0.0, finalChar * 0.8, finalChar * 0.3); // Green-blue tint
  
  // Add intensity
  color *= uIntensity;
  
  // Add subtle background
  color += vec3(0.0, 0.02, 0.01);
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 