// Neon Grid fragment shader - Retro cyberpunk landscape
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Line function
float line(vec2 p, vec2 a, vec2 b, float width) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float d = length(pa - ba * h);
  return smoothstep(width, 0.0, d);
}

// Grid function
float grid(vec2 p, float width) {
  float g = 0.0;
  // Horizontal lines
  for (float i = 0.0; i <= 20.0; i++) {
    float y = i / 20.0;
    g += line(p, vec2(-2.0, y), vec2(2.0, y), width);
  }
  // Vertical lines
  for (float i = -20.0; i <= 20.0; i++) {
    float x = i / 10.0;
    g += line(p, vec2(x, 0.0), vec2(x, 1.0), width);
  }
  return g;
}

void main() {
  // Setup coordinate system
  vec2 uv = vTexCoord;
  uv.x *= uResolution.x / uResolution.y;
  uv.y = 1.0 - uv.y; // Flip y for better perspective
  
  // Create perspective transform
  vec2 p = uv;
  p.y = 0.1 / (p.y - 1.2); // Perspective projection
  p.x *= p.y * 1.5; // Adjust for perspective
  
  // Add scrolling movement
  float scrollSpeed = 0.2;
  p.y += mod(vTime * scrollSpeed, 1.0);
  
  // Create grid with perspective-adjusted width
  float gridWidth = 0.015 * p.y; // Lines get thinner with distance
  float g = grid(p, gridWidth);
  
  // Create sun/horizon glow
  vec2 sunPos = vec2(0.0, 0.45); // Sun position
  float sunRadius = 0.2;
  float sun = 1.0 - smoothstep(sunRadius - 0.1, sunRadius, length(uv - sunPos));
  
  // Create horizon line
  float horizon = smoothstep(0.45 - 0.01, 0.45 + 0.01, uv.y);
  
  // Create color palette - synthwave/outrun colors
  vec3 gridColor = vec3(0.0, 0.8, 0.9) * 1.2; // Cyan
  vec3 groundColor = vec3(0.8, 0.0, 0.8) * 0.6; // Purple
  vec3 skyColor = vec3(0.0, 0.0, 0.2); // Dark blue
  vec3 sunColor = vec3(1.0, 0.3, 0.6); // Pinkish
  
  // Combine colors
  vec3 color = mix(skyColor, groundColor, horizon);
  
  // Add grid
  color += g * gridColor * (1.0 - horizon) * 1.5;
  
  // Add sun
  color += sun * sunColor;
  
  // Add glow to horizon
  float horizonGlow = smoothstep(0.4, 0.5, uv.y) * smoothstep(0.6, 0.5, uv.y);
  color += horizonGlow * sunColor * 0.5;
  
  // Add scanlines
  float scanline = sin(uv.y * 100.0 + vTime * 5.0) * 0.5 + 0.5;
  color *= 0.9 + scanline * 0.1;
  
  // Add vignette
  vec2 vignetteUV = vTexCoord * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.3;
  color *= vignette;
  
  // Add time-based color pulsing
  float pulse = sin(vTime) * 0.5 + 0.5;
  color *= 0.8 + pulse * 0.2;
  
  // Apply intensity
  color *= uIntensity;
  
  gl_FragColor = vec4(color, 1.0);
} 