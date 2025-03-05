// Neon Grid shader - Isometric grid with glow
precision mediump float;

varying vec2 v_uv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

// Rotation matrix
mat2 rot2d(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

// Signed distance function for a box
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Simple hash function
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx+33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

// Simple noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    vec2 a = hash22(i);
    vec2 b = hash22(i + vec2(1.0, 0.0));
    vec2 c = hash22(i + vec2(0.0, 1.0));
    vec2 d = hash22(i + vec2(1.0, 1.0));
    
    return mix(
        mix(dot(a, f), dot(b, f - vec2(1.0, 0.0)), f.x),
        mix(dot(c, f - vec2(0.0, 1.0)), dot(d, f - vec2(1.0, 1.0)), f.x),
        f.y
    );
}

void main() {
    vec2 uv = v_uv;
    
    // Correct aspect ratio
    uv = uv * 2.0 - 1.0;
    uv.x *= uResolution.x/uResolution.y;
    
    // Simulated mouse position based on time
    vec2 mouse = vec2(
        sin(vTime * 0.3) * 0.5,
        cos(vTime * 0.4) * 0.5
    );
    
    // Isometric transform
    uv *= rot2d(radians(45.0));
    uv.y *= 0.866025;
    
    // Scale based on simulated mouse distance
    float mouseDist = length(uv - mouse);
    float scale = 8.0 + sin(mouseDist * 3.0 + vTime) * 2.0;
    
    vec2 id = floor(uv * scale);
    vec2 gv = fract(uv * scale) - 0.5;
    
    // Morphing animation
    float t = vTime * 0.5;
    float morph = sin(t + noise(id + t) * 5.0) * 0.5 + 0.5;
    
    float d = sdBox(gv, vec2(0.3 + morph * 0.2));
    
    // Color palette
    vec3 col1 = vec3(0.2, 0.5, 0.8); // Blue
    vec3 col2 = vec3(0.8, 0.2, 0.5); // Pink
    vec3 col3 = vec3(0.3, 0.8, 0.3); // Green
    
    vec3 color = mix(col1, col2, morph);
    color = mix(color, col3, smoothstep(0.0, 0.05, d));
    
    // Add glow
    color += 0.1 / (0.1 + abs(d));
    
    // Fade edges
    color *= 1.0 - length(uv) * 0.2;
    
    // Apply intensity
    color *= uIntensity;
    
    gl_FragColor = vec4(color, 1.0);
} 