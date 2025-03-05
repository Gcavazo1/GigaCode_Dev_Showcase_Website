// Enhanced Neon Grid
precision mediump float;

varying vec2 vTexCoord;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

float line(vec2 p, vec2 a, vec2 b, float width) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d = length(pa - ba * h);
    
    // Enhanced line glow
    float glow = (1.0 - smoothstep(0.0, width * 2.0, d)) * 0.5;
    float line = 1.0 - smoothstep(0.0, width, d);
    return line + glow;
}

float grid(vec2 p, float width) {
    float g = 0.0;
    
    // Main grid lines
    for (float i = 0.0; i <= 20.0; i++) {
        float y = i / 20.0;
        g += line(p, vec2(-2.0, y), vec2(2.0, y), width);
    }
    
    for (float i = -20.0; i <= 20.0; i++) {
        float x = i / 10.0;
        g += line(p, vec2(x, 0.0), vec2(x, 1.0), width);
    }
    
    // Add diagonal accent lines
    float diagonalWidth = width * 1.5;
    g += line(p, vec2(-2.0, 0.0), vec2(2.0, 1.0), diagonalWidth) * 0.5;
    g += line(p, vec2(-2.0, 1.0), vec2(2.0, 0.0), diagonalWidth) * 0.5;
    
    return g;
}

void main() {
    vec2 uv = vTexCoord;
    uv.x *= uResolution.x / uResolution.y;
    uv.y = 1.0 - uv.y;
    
    // Enhanced perspective transform
    vec2 p = uv;
    float perspective = 0.1 / (p.y - 1.2);
    p.y = perspective;
    p.x *= perspective * 1.5;
    
    // Dynamic movement
    float time = vTime * 0.2;
    p.y += mod(time, 1.0);
    p.x += sin(time * 0.5) * 0.1;
    
    // Enhanced grid
    float gridWidth = 0.015 * p.y * (1.0 + sin(time) * 0.2);
    float g = grid(p, gridWidth);
    
    // Enhanced sun
    vec2 sunPos = vec2(0.0, 0.45 + sin(time * 0.5) * 0.02);
    float sunRadius = 0.2 + sin(time) * 0.02;
    float sun = 1.0 - smoothstep(sunRadius - 0.1, sunRadius, length(uv - sunPos));
    
    // Enhanced horizon
    float horizon = smoothstep(0.45 - 0.01, 0.45 + 0.01, uv.y);
    
    // Enhanced color palette
    vec3 gridColor = mix(
        vec3(0.0, 0.8, 0.9), // Cyan
        vec3(0.9, 0.2, 0.8), // Pink
        sin(time) * 0.5 + 0.5
    ) * 1.4;
    
    vec3 groundColor = vec3(0.8, 0.0, 0.8) * 0.7;
    vec3 skyColor = vec3(0.0, 0.0, 0.2);
    vec3 sunColor = mix(
        vec3(1.0, 0.3, 0.6), // Pink
        vec3(1.0, 0.8, 0.2), // Yellow
        sin(time * 0.3) * 0.5 + 0.5
    );
    
    // Enhanced color composition
    vec3 color = mix(skyColor, groundColor, horizon);
    color += g * gridColor * (1.0 - horizon) * 2.0;
    color += sun * sunColor * 1.5;
    
    // Enhanced horizon glow
    float horizonGlow = smoothstep(0.4, 0.5, uv.y) * smoothstep(0.6, 0.5, uv.y);
    color += horizonGlow * sunColor * 0.8;
    
    // Enhanced scanlines
    float scanline = sin(uv.y * 200.0 + time * 10.0) * 0.5 + 0.5;
    color *= 0.8 + scanline * 0.2;
    
    // Enhanced vignette
    vec2 vignetteUV = vTexCoord * 2.0 - 1.0;
    float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.4;
    color *= vignette;
    
    // Color pulsing
    float pulse = sin(time) * 0.5 + 0.5;
    color *= 0.7 + pulse * 0.3;
    
    // Final intensity and gamma correction
    color = pow(color * uIntensity, vec3(0.8));
    
    gl_FragColor = vec4(color, 1.0);
} 