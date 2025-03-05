// Ripple fragment shader - Liquid ripple effect
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
  
  // Create ripple effect
  float time = vTime * 0.5;
  float dist = length(uv);
  
  // Multiple ripples with different frequencies and phases
  float ripple1 = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
  float ripple2 = sin(dist * 20.0 - time * 3.0) * 0.5 + 0.5;
  float ripple3 = sin(dist * 30.0 - time * 4.0) * 0.5 + 0.5;
  
  // Combine ripples
  float ripples = ripple1 * 0.6 + ripple2 * 0.3 + ripple3 * 0.1;
  
  // Create color gradient
  vec3 color1 = vec3(0.0, 0.3, 0.6); // Deep blue
  vec3 color2 = vec3(0.0, 0.6, 0.8); // Light blue
  vec3 color3 = vec3(0.0, 0.8, 0.7); // Teal
  
  // Mix colors based on ripple value
  vec3 color = mix(color1, color2, ripples);
  color = mix(color, color3, ripple2);
  
  // Add highlights
  float highlight = pow(ripple1, 8.0) * uIntensity;
  color += vec3(highlight);
  
  // Add vignette effect
  float vignette = 1.0 - smoothstep(0.5, 1.0, dist);
  color *= vignette;
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 