// Neon Grid fragment shader - Raymarched cubes
precision mediump float;

varying vec2 v_uv;
varying float vTime;
uniform vec2 uResolution;
uniform float uIntensity;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001
#define PI 3.1415926535

// SDF for a cube
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Rotation matrix
mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// Random function
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Scene SDF
float map(vec3 p) {
    // Simulated mouse influence using time
    float mouseInfluence = (sin(vTime * 0.5) * 0.5 + 0.5) * 2.0;
    
    // Rotating the space
    p.xz *= rot2D(vTime * 0.3);
    p.xy *= rot2D(vTime * 0.2);
    
    // Create a grid of cubes
    vec3 modP = mod(p + 2.0, 4.0) - 2.0;
    
    // Vary cube size using noise
    float scale = 0.5 + 0.3 * noise(p.xz * 0.5 + vTime * 0.2);
    scale *= (1.0 + 0.2 * mouseInfluence);
    
    // Combine multiple cubes
    float dist = sdBox(modP, vec3(scale));
    
    // Add some more variation based on time
    dist += 0.05 * sin(p.x + vTime) * sin(p.z + vTime);
    
    return dist;
}

// Normal calculation
vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

// Raymarching
float rayMarch(vec3 ro, vec3 rd) {
    float d = 0.0;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * d;
        float dS = map(p);
        d += dS;
        if(d > MAX_DIST || dS < SURF_DIST) break;
    }
    
    return d;
}

void main() {
    // Screen coordinates with aspect ratio correction
    vec2 uv = v_uv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Simulated mouse movement
    vec2 m = vec2(sin(vTime * 0.4), cos(vTime * 0.3)) * 0.3;
    float mouseIntensity = clamp(length(m) * 2.0, 0.0, 1.0);
    
    // Ray setup
    vec3 ro = vec3(0.0, 0.0, -5.0 + sin(vTime * 0.2) * 2.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    // Add slight rotation based on simulated mouse position
    rd.xz *= rot2D(m.x * PI * 0.5);
    rd.yz *= rot2D(m.y * PI * 0.5);
    
    // Raymarching
    float d = rayMarch(ro, rd);
    
    // Color
    vec3 col = vec3(0.0);
    
    if(d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        
        // Basic lighting
        vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
        float diff = max(dot(n, lightDir), 0.0);
        
        // Base ultraviolet color
        vec3 baseColor = vec3(0.0, 0.9, 0.9);
        
        // Add some electric highlights
        vec3 rimColor = vec3(0.6, 0.0, 1.0);
        
        // Edge glow
        float edge = 1.0 - max(dot(n, -rd), 0.0);
        edge = pow(edge, 3.0);
        
        // Final color
        col = baseColor * diff;
        col += rimColor * edge * 1.5;
        
        // Add some time-based pulsing and noise variation
        float pulse = 0.5 + 0.5 * sin(vTime * 2.0 + noise(p.xz * 0.5) * 5.0);
        col += rimColor * pulse * 0.3;
        
        // Distance fog
        col *= 1.0 - smoothstep(5.0, 15.0, d);
    }
    
    // Apply vignette
    float vignette = 1.0 - smoothstep(0.3, 1.5, length(v_uv - 0.5));
    col *= vignette;
    
    // Apply simulated mouse-based intensity to the glow
    col += vec3(0.6, 0.0, 1.0) * mouseIntensity * 0.2;
    
    // Apply intensity uniform
    col *= uIntensity;
    
    gl_FragColor = vec4(col, 1.0);
} 