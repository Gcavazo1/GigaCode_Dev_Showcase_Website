// Fractal fragment shader - Mandelbrot/Julia set effect
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Complex number multiplication
vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

// Complex number square
vec2 csquare(vec2 z) {
  return vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
}

void main() {
  // Center the coordinates
  vec2 uv = vTexCoord * 2.0 - 1.0;
  
  // Adjust aspect ratio
  uv.x *= uResolution.x / uResolution.y;
  
  // Scale and position
  float zoom = 2.5 - sin(vTime * 0.1) * 0.5;
  uv /= zoom;
  
  // Create animated Julia set
  float time = vTime * 0.2;
  vec2 c = vec2(0.7885 * cos(time), 0.7885 * sin(time));
  
  // Initialize z
  vec2 z = uv;
  
  // Iterate to create fractal
  float iterations = 0.0;
  float maxIterations = 100.0;
  
  for (float i = 0.0; i < 100.0; i++) {
    // z = z^2 + c
    z = csquare(z) + c;
    
    // Check if point escapes
    if (length(z) > 2.0) {
      break;
    }
    
    iterations = i;
  }
  
  // Normalize iterations
  float normalized = iterations / maxIterations;
  
  // Create smooth coloring
  float smooth_value = normalized + 1.0 - log(log(length(z))) / log(2.0);
  smooth_value = pow(smooth_value, 0.5);
  
  // Create color palette
  vec3 color1 = vec3(0.0, 0.0, 0.3); // Dark blue
  vec3 color2 = vec3(0.5, 0.0, 0.5); // Purple
  vec3 color3 = vec3(1.0, 0.4, 0.0); // Orange
  vec3 color4 = vec3(1.0, 0.8, 0.0); // Yellow
  
  // Mix colors based on iteration count
  vec3 color;
  float t = fract(smooth_value * 3.0 + vTime * 0.2);
  
  if (t < 0.33) {
    color = mix(color1, color2, t * 3.0);
  } else if (t < 0.66) {
    color = mix(color2, color3, (t - 0.33) * 3.0);
  } else {
    color = mix(color3, color4, (t - 0.66) * 3.0);
  }
  
  // Add glow for points that don't escape
  if (iterations >= maxIterations - 1.0) {
    color = vec3(0.0);
  }
  
  // Add intensity
  color *= uIntensity;
  
  // Output final color
  gl_FragColor = vec4(color, 1.0);
} 