// Raymarched Grid fragment shader
precision mediump float;

varying vec2 v_uv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001
#define PI 3.14159265359

// SDF functions
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

// Domain operations
vec3 opRep(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
}

vec3 opTwist(vec3 p, float k) {
    float c = cos(k * p.y);
    float s = sin(k * p.y);
    mat2 m = mat2(c, -s, s, c);
    return vec3(m * p.xz, p.y);
}

// Noise functions
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = p.x + p.y * 57.0 + p.z * 113.0;
    float res = mix(mix(mix(hash(n), hash(n + 1.0), f.x),
                      mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                  mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                      mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    return res;
}

float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    
    for(int i = 0; i < 5; i++) {
        sum += amp * noise(freq * p);
        amp *= 0.5;
        freq *= 2.0;
    }
    
    return sum;
}

// Scene description
float getDist(vec3 p) {
    // Simulated mouse influence
    vec2 simulatedMouse = vec2(
        sin(vTime * 0.3) * 0.25 + 0.5,
        cos(vTime * 0.4) * 0.25 + 0.5
    );
    float mouseInfluence = length(simulatedMouse - 0.5) * 2.0;
    
    // Division effect
    vec3 cellSize = vec3(1.5 + mouseInfluence);
    vec3 cell = opRep(p, cellSize);
    
    // Apply twist based on time
    cell = opTwist(cell, sin(vTime * 0.2) * 0.5);
    
    // Combine different shapes
    float sphere = sdSphere(cell, 0.3 + 0.1 * sin(vTime + fbm(p * 0.1)));
    float box = sdBox(cell, vec3(0.2 + 0.1 * cos(vTime * 0.5)));
    
    // Create paths between cells
    float path = sdCapsule(p, 
                          vec3(cellSize.x * floor(p.x/cellSize.x), 0.0, 0.0),
                          vec3(cellSize.x * floor(p.x/cellSize.x), 0.0, cellSize.z * floor(p.z/cellSize.z)),
                          0.05);
    
    path = min(path, sdCapsule(p, 
                              vec3(0.0, 0.0, cellSize.z * floor(p.z/cellSize.z)),
                              vec3(cellSize.x * floor(p.x/cellSize.x), 0.0, cellSize.z * floor(p.z/cellSize.z)),
                              0.05));
    
    // Combine shapes with smooth min
    float k = 0.2 + 0.1 * sin(vTime);
    float d = min(sphere, box);
    
    // Add noise displacement
    d += 0.05 * fbm(p * 2.0 + vTime * 0.1);
    
    return min(d, path);
}

// Raymarching
float rayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = getDist(p);
        dO += dS;
        if(dO > MAX_DIST || dS < SURF_DIST) break;
    }
    
    return dO;
}

// Normal calculation
vec3 getNormal(vec3 p) {
    float d = getDist(p);
    vec2 e = vec2(0.001, 0.0);
    
    vec3 n = d - vec3(
        getDist(p - e.xyy),
        getDist(p - e.yxy),
        getDist(p - e.yyx)
    );
    
    return normalize(n);
}

// Lighting calculation
vec3 getLight(vec3 p, vec3 rd) {
    vec3 n = getNormal(p);
    
    // Base colors
    vec3 baseColor1 = vec3(0.2, 0.4, 0.8); // Blue
    vec3 baseColor2 = vec3(0.8, 0.2, 0.5); // Pink
    vec3 baseColor3 = vec3(0.1, 0.8, 0.6); // Teal
    
    // Color based on position and time
    vec3 col = mix(
        mix(baseColor1, baseColor2, sin(p.x + vTime * 0.3) * 0.5 + 0.5),
        baseColor3,
        sin(length(p) * 0.5 + vTime * 0.2) * 0.5 + 0.5
    );
    
    // Light direction
    vec3 lightPos = vec3(5.0 * sin(vTime * 0.5), 5.0, 5.0 * cos(vTime * 0.5));
    vec3 l = normalize(lightPos - p);
    
    // Diffuse
    float diff = max(dot(n, l), 0.0);
    diff = pow(diff, 2.0) * 0.8 + 0.2; // Soften diffuse
    
    // Specular
    vec3 h = normalize(l - rd);
    float spec = pow(max(dot(n, h), 0.0), 16.0);
    
    // Fresnel
    float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    
    // Combine lighting
    col = col * diff + vec3(1.0) * spec + baseColor2 * fresnel;
    
    // Fog based on distance
    float fogAmount = 1.0 - exp(-length(p) * 0.15);
    vec3 fogColor = vec3(0.05, 0.05, 0.1); // Dark blue fog
    col = mix(col, fogColor, fogAmount);
    
    return col;
}

void main() {
    // Adjust UV for aspect ratio
    vec2 uv = v_uv - 0.5;
    uv.x *= uResolution.x / uResolution.y;
    
    // Simulated mouse influence
    vec2 simulatedMouse = vec2(
        sin(vTime * 0.3) * 0.25 + 0.5,
        cos(vTime * 0.4) * 0.25 + 0.5
    );
    vec2 mouseUV = simulatedMouse - 0.5;
    mouseUV.x *= uResolution.x / uResolution.y;
    float mouseDist = length(uv - mouseUV);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDist);
    
    // Ray setup
    vec3 ro = vec3(0.0, 2.0 + sin(vTime * 0.5), -5.0); // Ray origin (camera position)
    vec3 rd = normalize(vec3(uv, 1.0 + 0.5 * mouseInfluence)); // Ray direction
    
    // Apply camera rotation
    float camAngle = vTime * 0.2;
    mat2 camRotation = mat2(cos(camAngle), -sin(camAngle), sin(camAngle), cos(camAngle));
    rd.xz = camRotation * rd.xz;
    ro.xz = camRotation * ro.xz;
    
    // Raymarching
    float d = rayMarch(ro, rd);
    vec3 col = vec3(0.05, 0.05, 0.1); // Background color
    
    // Render if hit
    if(d < MAX_DIST) {
        vec3 p = ro + rd * d;
        col = getLight(p, rd);
    }
    
    // Apply vignette
    float vignette = 1.0 - length(v_uv - 0.5) * 0.8;
    col *= vignette;
    
    // Apply gamma correction
    col = pow(col, vec3(0.4545));
    
    // Apply intensity
    col *= uIntensity;
    
    gl_FragColor = vec4(col, 1.0);
} 