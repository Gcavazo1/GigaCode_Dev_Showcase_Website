// Raymarching Scene fragment shader
precision mediump float;

varying vec2 v_uv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001
#define PI 3.14159265359

// SDF Primitives
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Domain repetition
vec3 opRep(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}

// Rotation
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

// Scene description
float map(vec3 p) {
    // Simulated mouse influence
    vec2 mouseOffset = vec2(
        sin(vTime * 0.4) * 0.5,
        cos(vTime * 0.3) * 0.5
    );
    
    // Rotate scene based on time and simulated mouse
    p.xz *= rot(vTime * 0.3 + mouseOffset.x);
    p.yz *= rot(vTime * 0.2 + mouseOffset.y);
    
    // Ground plane with wave effect
    float ground = p.y + 1.5 + 0.1 * sin(p.x * 3.0 + vTime) * cos(p.z * 3.0 + vTime);
    
    // Central sphere
    float sphere = sdSphere(p, 1.0);
    
    // Torus around sphere
    float torus = sdTorus(p, vec2(1.5, 0.3));
    
    // Small repeating boxes
    vec3 q = opRep(p, vec3(4.0, 4.0, 4.0));
    float boxes = sdBox(q, vec3(0.2));
    
    // Combine objects
    float d = min(min(sphere, torus), boxes);
    d = min(d, ground);
    
    return d;
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
float raymarch(vec3 ro, vec3 rd) {
    float d0 = 0.0;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * d0;
        float ds = map(p);
        d0 += ds;
        if(ds < SURF_DIST || d0 > MAX_DIST) break;
    }
    
    return d0;
}

// Soft shadows
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for(int i = 0; i < 16; i++) {
        if(t < maxt) {
            float h = map(ro + rd * t);
            if(h < SURF_DIST) return 0.0;
            res = min(res, k * h / t);
            t += h;
        }
    }
    return res;
}

// Ambient occlusion
float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for(int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = map(p + h * n);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

// Reflections
vec3 calcReflection(vec3 ro, vec3 rd, vec3 n, float d, vec3 col) {
    // Reflection ray
    vec3 reflRo = ro + rd * d + n * 0.01;
    vec3 reflRd = reflect(rd, n);
    
    // March reflection ray
    float reflDist = raymarch(reflRo, reflRd);
    
    // If we hit something
    if(reflDist < MAX_DIST) {
        vec3 reflPos = reflRo + reflRd * reflDist;
        vec3 reflNorm = getNormal(reflPos);
        
        // Simple lighting for reflection
        vec3 reflLight = normalize(vec3(1.0, 2.0, 3.0));
        float reflDif = max(0.0, dot(reflNorm, reflLight));
        float reflSha = softShadow(reflPos, reflLight, 0.02, 5.0, 16.0);
        float reflAo = calcAO(reflPos, reflNorm);
        
        // Reflection color
        vec3 reflCol = vec3(0.2, 0.3, 0.4);
        reflCol = reflCol * reflDif * reflSha * reflAo;
        
        // Blend with original color
        return mix(col, reflCol, 0.5);
    }
    
    // Reflection missed, blend with sky gradient
    vec3 skyCol = mix(vec3(0.2, 0.4, 0.8), vec3(0.1, 0.1, 0.3), reflRd.y * 0.5 + 0.5);
    return mix(col, skyCol, 0.3);
}

void main() {
    // Adjust for aspect ratio
    vec2 uv = v_uv - 0.5;
    uv.x *= uResolution.x / uResolution.y;
    
    // Simulated mouse influence on camera
    vec2 mouseOffset = vec2(
        sin(vTime * 0.3) * 0.25,
        cos(vTime * 0.4) * 0.25
    );
    
    // Camera setup
    vec3 ro = vec3(0.0, 0.0, -4.0);
    ro.xz *= rot(mouseOffset.x * PI);
    ro.yz *= rot(mouseOffset.y * PI);
    
    vec3 rd = normalize(vec3(uv, 1.0));
    rd.xz *= rot(mouseOffset.x * PI);
    rd.yz *= rot(mouseOffset.y * PI);
    
    // Background gradient
    vec3 col = mix(vec3(0.1, 0.1, 0.3), vec3(0.3, 0.4, 0.7), uv.y + 0.5);
    
    // Raymarch
    float d = raymarch(ro, rd);
    
    // If we hit something
    if(d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        
        // Material color based on position
        vec3 matCol = vec3(0.6, 0.2, 0.3) + 0.2 * sin(p * 0.5 + vTime * 0.2);
        
        // Lighting
        vec3 light = normalize(vec3(1.0, 2.0, 3.0));
        float dif = max(0.0, dot(n, light));
        float sha = softShadow(p, light, 0.02, 5.0, 16.0);
        float ao = calcAO(p, n);
        
        // Combine lighting
        col = matCol * dif * sha * ao;
        
        // Add reflections
        col = calcReflection(ro, rd, n, d, col);
        
        // Fresnel effect
        float fresnel = pow(1.0 - max(0.0, dot(-rd, n)), 5.0);
        col = mix(col, vec3(1.0), fresnel * 0.3);
    }
    
    // Gamma correction
    col = pow(col, vec3(0.4545));
    
    // Vignette
    float vignette = 1.0 - length(v_uv - 0.5) * 0.5;
    col *= vignette;
    
    // Apply intensity
    col *= uIntensity;
    
    gl_FragColor = vec4(col, 1.0);
} 