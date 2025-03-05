// Portal fragment shader - Swirling vortex effect
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Center the coordinates
  vec2 uv = vTexCoord * 2.0 - 1.0;
  
  // Adjust aspect ratio
  uv.x *= uResolution.x / uResolution.y;
  
  // Calculate distance from center
  float dist = length(uv);
  
  // Calculate angle
  float angle = atan(uv.y, uv.x);
  
  // Create swirling effect
  float speed = 0.5;
  float spiralSpeed = 2.0;
  float spiralTightness = 10.0;
  
  // Distort the UV coordinates
  float distortion = sin(dist * spiralTightness - vTime * spiralSpeed) * 0.1;
  float angleOffset = vTime * speed;
  
  // Create spiral pattern
  float spiral = sin(angle * 5.0 + dist * spiralTightness - vTime * spiralSpeed) * 0.5 + 0.5;
  
  // Create pulsing effect
  float pulse = 0.5 + 0.5 * sin(vTime * 2.0);
  
  // Create color gradient
  vec3 color1 = vec3(0.1, 0.0, 0.2); // Dark purple
  vec3 color2 = vec3(0.8, 0.0, 0.8); // Magenta
  vec3 color3 = vec3(0.0, 0.5, 1.0); // Blue
  
  // Mix colors based on spiral pattern and distance
  vec3 color = mix(color1, color2, spiral);
  color = mix(color, color3, smoothstep(0.4, 0.9, dist));
  
  // Add glow at the center
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  color += color2 * glow * pulse * 2.0 * uIntensity;
  
  // Add edge glow
  float edge = smoothstep(0.8, 1.0, dist);
  color += color3 * edge * uIntensity;
  
  // Darken the outer edges
  color *= 1.0 - smoothstep(0.8, 1.5, dist);
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 