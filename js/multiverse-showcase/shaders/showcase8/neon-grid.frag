// Neon Grid shader - Retro synthwave style
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define PI 3.14159265359

// Line function with glow
float line(vec2 p, float width, float edge) {
    return smoothstep(width, edge, abs(p.y));
}

// Grid function
float grid(vec2 uv, float size) {
    vec2 grid = fract(uv * size) - 0.5;
    float horz = line(grid, 0.02, 0.05);
    float vert = line(vec2(grid.y, grid.x), 0.02, 0.05);
    return horz + vert;
}

void main() {
    // Setup coordinates
    vec2 uv = vTexCoord * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Create perspective transform
    float t = vTime * 0.5;
    vec2 projectedUV = uv;
    projectedUV.y = 0.1 / (projectedUV.y + 1.5);
    projectedUV.x *= projectedUV.y;
    
    // Add movement
    projectedUV.y += t;
    
    // Create multiple grid layers
    float gridLayer1 = grid(projectedUV, 10.0);
    float gridLayer2 = grid(projectedUV * 2.0, 20.0) * 0.5;
    float gridLayer3 = grid(projectedUV * 4.0, 40.0) * 0.25;
    
    // Combine grid layers
    float finalGrid = gridLayer1 + gridLayer2 + gridLayer3;
    
    // Create sun
    float sun = 1.0 - length(uv - vec2(0.0, 0.4)) * 1.5;
    sun = max(0.0, sun);
    sun = pow(sun, 3.0);
    
    // Create horizon line
    float horizon = smoothstep(0.1, 0.15, abs(uv.y + 0.1));
    
    // Create color gradient for sky
    vec3 skyColor = mix(
        vec3(0.8, 0.2, 0.8), // Purple
        vec3(0.0, 0.4, 0.8), // Blue
        uv.y + 0.5
    );
    
    // Create color gradient for ground
    vec3 groundColor = mix(
        vec3(0.8, 0.0, 0.8), // Dark purple
        vec3(0.2, 0.0, 0.4), // Darker purple
        -uv.y
    );
    
    // Combine colors
    vec3 color = mix(groundColor, skyColor, horizon);
    
    // Add grid with glow
    vec3 gridColor = vec3(0.0, 0.8, 0.9); // Cyan
    color += finalGrid * gridColor * 1.5;
    
    // Add sun with glow
    vec3 sunColor = mix(
        vec3(1.0, 0.2, 0.8), // Pink
        vec3(1.0, 0.8, 0.2), // Yellow
        sun
    );
    color += sun * sunColor;
    
    // Add sun rays
    float rays = sin(atan(uv.x, uv.y - 0.4) * 20.0 + t * 2.0) * 0.5 + 0.5;
    rays *= smoothstep(0.3, 2.0, length(uv - vec2(0.0, 0.4)));
    color += rays * sunColor * 0.3;
    
    // Add scanlines
    float scanline = sin(uv.y * 200.0 + t * 10.0) * 0.05 + 0.95;
    color *= scanline;
    
    // Add vignette
    float vignette = length(uv * 0.8);
    vignette = smoothstep(1.0, 0.2, vignette);
    color *= vignette;
    
    // Add subtle noise
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233)) + t) * 43758.5453);
    color += noise * 0.02;
    
    // Apply intensity
    color *= uIntensity;
    
    gl_FragColor = vec4(color, 1.0);
} 