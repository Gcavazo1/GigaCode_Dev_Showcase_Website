// Torus Rings fragment shader - Simplified version
precision mediump float;

varying vec2 v_uv;  // Changed from vUv to v_uv
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define MAX_STEPS 32  // Reduced for better compatibility
#define MAX_DIST 50.0
#define SURF_DIST 0.001

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

float map(vec3 p) {
    vec3 p1 = p;
    p1.xz *= rot2D(vTime * 0.3);
    p1.xy *= rot2D(vTime * 0.2);
    
    // Simpler version with fewer iterations
    float d = 100.0;
    for(int i = 0; i < 3; i++) {  // Reduced from 5 to 3
        float fi = float(i);
        p1.xz *= rot2D(vTime * 0.1 + fi * 0.3);
        p1.y += sin(vTime * 0.3 + fi) * 0.1;
        float torus = sdTorus(p1, vec2(1.5, 0.3));
        d = min(d, torus);  // Using min instead of smin for simplicity
    }
    return d * 0.5;
}

vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

void main() {
    vec2 uv = (v_uv - 0.5) * 2.0;  // Changed from vUv to v_uv
    uv.x *= uResolution.x/uResolution.y;
    
    // Simplified camera setup
    vec3 camPos = vec3(0.0, 0.0, -5.0);
    vec3 rayDir = normalize(vec3(uv, 1.0));
    
    float d = 0.0;
    vec3 p;
    
    // Simplified raymarching
    for(int i = 0; i < MAX_STEPS; i++) {
        p = camPos + rayDir * d;
        float dS = map(p);
        d += dS;
        if(d > MAX_DIST || dS < SURF_DIST) break;
    }
    
    vec3 col = vec3(0.02, 0.02, 0.05);
    
    if(d < MAX_DIST) {
        vec3 n = getNormal(p);
        vec3 lightPos = vec3(2.0, 4.0, -3.0);
        vec3 l = normalize(lightPos - p);
        
        float diff = max(dot(n, l), 0.0);
        float spec = pow(max(dot(reflect(-l, n), -rayDir), 0.0), 16.0);
        
        vec3 objCol = vec3(0.7, 0.2, 0.8) + sin(p.y * 2.0 + vTime) * 0.2;
        col = objCol * diff + spec * vec3(1.0);
    }
    
    // Simpler glow
    float glow = 0.05 / (0.05 + length(uv) * 2.0);
    col += vec3(0.6, 0.2, 0.8) * glow;
    
    // Apply intensity
    col *= uIntensity;
    
    gl_FragColor = vec4(col, 1.0);
} 