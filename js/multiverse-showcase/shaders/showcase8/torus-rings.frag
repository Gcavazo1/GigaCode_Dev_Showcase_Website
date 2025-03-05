// Torus Rings fragment shader
precision mediump float;

varying vec2 vUv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define MAX_STEPS 64
#define MAX_DIST 100.0
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
    p1.xz *= rot2D(vTime * 0.5);
    p1.xy *= rot2D(vTime * 0.3);
    
    // Simulated mouse influence
    float mouseInfluence = (sin(vTime * 0.3) * 0.5 + 0.5) * 2.0;
    
    float d = MAX_DIST;
    for(int i = 0; i < 5; i++) {
        float fi = float(i);
        p1.xz *= rot2D(vTime * 0.2 + fi * 0.5);
        p1.y += sin(vTime * 0.5 + fi) * 0.2;
        float torus = sdTorus(p1, vec2(2.0 + mouseInfluence, 0.3));
        d = smin(d, torus, 0.5);
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

vec3 getRayDir(vec2 uv, vec3 camPos, vec3 lookAt) {
    vec3 forward = normalize(lookAt - camPos);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);
    return normalize(forward + right * uv.x + up * uv.y);
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x/uResolution.y;
    
    vec3 camPos = vec3(0.0, 0.0, -6.0);
    vec3 rayDir = getRayDir(uv, camPos, vec3(0.0));
    
    float d = 0.0;
    vec3 p;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        p = camPos + rayDir * d;
        float dS = map(p);
        d += dS;
        if(d > MAX_DIST || abs(dS) < SURF_DIST) break;
    }
    
    vec3 col = vec3(0.02, 0.02, 0.05);
    
    if(d < MAX_DIST) {
        vec3 n = getNormal(p);
        vec3 lightPos = vec3(2.0, 4.0, -3.0);
        vec3 l = normalize(lightPos - p);
        
        float diff = max(dot(n, l), 0.0);
        float spec = pow(max(dot(reflect(-l, n), -rayDir), 0.0), 32.0);
        
        vec3 objCol = vec3(0.7, 0.2, 0.8) + sin(p.y * 2.0 + vTime) * 0.2;
        col = objCol * diff + spec * vec3(1.0);
        
        float fog = 1.0 - smoothstep(0.0, MAX_DIST, d);
        col = mix(vec3(0.02, 0.02, 0.05), col, fog);
    }
    
    // Add subtle glow
    float glow = 0.0;
    for(int i = 0; i < 3; i++) {
        float fi = float(i);
        float dist = length(uv) - (1.5 + sin(vTime * 0.5 + fi) * 0.2);
        glow += 0.01 / (0.01 + abs(dist));
    }
    col += vec3(0.6, 0.2, 0.8) * glow * 0.2;
    
    // Apply gamma correction
    col = pow(col, vec3(0.4545));
    
    // Apply intensity
    col *= uIntensity;
    
    gl_FragColor = vec4(col, 1.0);
} 