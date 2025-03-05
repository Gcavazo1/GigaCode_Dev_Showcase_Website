// Simple Neon Grid shader
precision mediump float;

varying vec2 v_uv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Simple grid function
float grid(vec2 uv, float size) {
    vec2 g = abs(fract(uv * size) - 0.5);
    return 1.0 - smoothstep(0.0, 0.05, min(g.x, g.y));
}

void main() {
    // Adjust UV for aspect ratio
    vec2 uv = v_uv;
    uv.x *= uResolution.x / uResolution.y;
    
    // Create perspective effect
    vec2 p = uv * 2.0 - 1.0;
    float dist = length(p);
    
    // Rotate and scale based on time
    float angle = vTime * 0.2;
    float c = cos(angle);
    float s = sin(angle);
    vec2 rotatedUV = vec2(
        uv.x * c - uv.y * s,
        uv.x * s + uv.y * c
    );
    
    // Create multiple grid layers
    float g1 = grid(rotatedUV, 10.0);
    float g2 = grid(rotatedUV, 20.0) * 0.5;
    float g3 = grid(rotatedUV * vec2(1.0, 2.0), 15.0) * 0.5;
    
    // Add movement
    float t = vTime * 0.5;
    rotatedUV.y += t;
    float g4 = grid(rotatedUV, 5.0) * 0.8;
    
    // Combine grids
    float gridValue = g1 + g2 + g3 + g4;
    
    // Create color gradient
    vec3 col1 = vec3(0.1, 0.4, 0.8); // Blue
    vec3 col2 = vec3(0.8, 0.2, 0.8); // Purple
    vec3 col3 = vec3(0.0, 0.8, 0.8); // Cyan
    
    vec3 color = mix(col1, col2, sin(vTime * 0.2) * 0.5 + 0.5);
    color = mix(color, col3, sin(dist * 5.0 + vTime) * 0.5 + 0.5);
    
    // Apply grid
    color = mix(vec3(0.05, 0.05, 0.1), color, gridValue);
    
    // Add glow
    color += gridValue * 0.5 * color;
    
    // Add vignette
    float vignette = 1.0 - dist * 0.5;
    color *= vignette;
    
    // Apply intensity
    color *= uIntensity;
    
    gl_FragColor = vec4(color, 1.0);
} 