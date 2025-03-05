// Raymarched Tunnel fragment shader
precision mediump float;

varying vec2 v_uv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
           
    // Gradients: 7x7 points over a square, mapped onto an octahedron
    float n_ = 0.142857142857; // 1.0/7.0
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    
    for(int i = 0; i < 6; i++) {
        sum += amp * snoise(p * freq);
        amp *= 0.5;
        freq *= 2.0;
    }
    
    return sum;
}

// SDF for a tunnel segment
float sdTunnelSegment(vec3 p, float radius, float height, float thickness) {
    vec2 d = vec2(length(p.xy) - radius, abs(p.z) - height);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - thickness;
}

// Rotation matrices
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, c, -s),
        vec3(0.0, s, c)
    );
}

mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0.0, s),
        vec3(0.0, 1.0, 0.0),
        vec3(-s, 0.0, c)
    );
}

mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0.0),
        vec3(s, c, 0.0),
        vec3(0.0, 0.0, 1.0)
    );
}

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.3, 0.2, 0.2);
    
    return a + b * cos(TWO_PI * (c * t + d));
}

float scene(vec3 p) {
    // Create artificial mouse movement since we don't have mouse input
    float mouseX = sin(vTime * 0.3) * 0.5;
    float mouseY = cos(vTime * 0.4) * 0.5;
    
    // Deform the space based on noise
    float deformation = fbm(p * 0.1 + vec3(0.0, 0.0, vTime * 0.2)) * 1.5;
    p.xy += vec2(sin(p.z * 0.3 + vTime), cos(p.z * 0.2 - vTime)) * (1.0 + mouseX);
    
    // Rotate based on simulated mouse
    p = rotateX(mouseY * PI * 0.25) * p;
    p = rotateY(mouseX * PI * 0.25) * p;
    
    // Create multiple tunnel segments
    float d = 1000.0;
    
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float offset = fi * 4.0 - 10.0 + vTime * (1.0 + fi * 0.2);
        offset = mod(offset, 20.0) - 10.0;
        
        vec3 q = p;
        q.z -= offset;
        
        // Rotate each segment differently
        q = rotateZ(fi * 0.4 + vTime * 0.1) * q;
        q = rotateY(fi * 0.3 - vTime * 0.15) * q;
        
        // Vary the tunnel parameters
        float radius = 2.0 + sin(fi * 0.7 + vTime * 0.3) * 0.5;
        float height = 0.8 + cos(fi * 0.5 + vTime * 0.2) * 0.3;
        float thickness = 0.15 + 0.1 * sin(fi * 1.1 + vTime * 0.4);
        
        // Add deformation based on noise
        radius += deformation * 0.5;
        
        float segment = sdTunnelSegment(q, radius, height, thickness);
        d = min(d, segment);
    }
    
    return d;
}

vec3 getNormal(vec3 p) {
    const float eps = 0.001;
    vec2 h = vec2(eps, 0.0);
    return normalize(vec3(
        scene(p + h.xyy) - scene(p - h.xyy),
        scene(p + h.yxy) - scene(p - h.yxy),
        scene(p + h.yyx) - scene(p - h.yyx)
    ));
}

void main() {
    // Correct aspect ratio
    vec2 uv = v_uv;
    uv = uv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Simulated mouse influence
    float mouseIntensity = (sin(vTime * 0.5) * 0.5 + 0.5) * 2.0;
    
    // Ray setup
    vec3 ro = vec3(0.0, 0.0, -5.0 - mouseIntensity * 2.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    // Apply camera rotation based on time
    float camAngle = vTime * 0.1;
    ro = rotateY(camAngle) * ro;
    rd = rotateY(camAngle) * rd;
    
    // Raymarching
    float t = 0.0;
    float tmax = 20.0;
    float d = 0.0;
    
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        d = scene(p);
        
        if (d < 0.001 || t > tmax) break;
        t += d * 0.5;
    }
    
    // Coloring
    vec3 col = vec3(0.05, 0.05, 0.1); // Dark blue background
    
    if (t < tmax) {
        vec3 p = ro + rd * t;
        vec3 n = getNormal(p);
        
        // Base color from position and normal
        float noise = fbm(p * 0.2 + vec3(0.0, 0.0, vTime * 0.1));
        vec3 baseColor = palette(noise * 0.2 + length(p) * 0.05 + vTime * 0.1);
        
        // Lighting
        vec3 lightDir = normalize(vec3(1.0, 2.0, -3.0));
        float diff = max(dot(n, lightDir), 0.0);
        float amb = 0.5 + 0.5 * n.y;
        float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 16.0);
        
        // Fresnel effect
        float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
        
        // Final color composition
        col = baseColor * (diff * 0.7 + amb * 0.3) + spec * 0.5 + fresnel * vec3(0.3, 0.5, 0.7);
        
        // Distance fog
        float fogFactor = 1.0 - exp(-0.05 * t);
        col = mix(col, vec3(0.05, 0.05, 0.1), fogFactor);
    }
    
    // Apply vignette
    float vignette = 1.0 - length(v_uv - 0.5) * 1.0;
    vignette = smoothstep(0.0, 1.0, vignette);
    col *= vignette;
    
    // Apply intensity
    col *= uIntensity;
    
    gl_FragColor = vec4(col, 1.0);
} 