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

// SDF Functions
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
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
    float res = mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                       mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                   mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                       mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    return res;
}

float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        f += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return f;
}

// Rotation matrix
mat3 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

mat3 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, s,
        0.0, -s, c
    );
}

// Slime SDF
float slimeSDF(vec3 p) {
    // Simulate mouse influence using time
    vec2 mouseOffset = vec2(sin(vTime * 0.5), cos(vTime * 0.4)) * 0.5;
    float mouseInfluence = 1.0 - min(1.0, length(mouseOffset) * 1.5);
    
    // Base shape - a sphere
    float sphere = sdSphere(p, 0.8 + 0.2 * mouseInfluence);
    
    // Apply noise deformation for slime effect
    float noiseScale = 4.0;
    float noiseTime = vTime * 0.2;
    
    // Animate the slime with noise
    vec3 q = p;
    q = rotateY(noiseTime * 0.3) * q;
    q = rotateX(noiseTime * 0.2) * q;
    
    float noise1 = fbm(q * noiseScale + vec3(0.0, 0.0, noiseTime));
    float noise2 = fbm(q * noiseScale * 1.5 + vec3(noiseTime * 0.7, 0.0, 0.0));
    
    // Combine noise for more interesting deformation
    float noiseDeform = mix(noise1, noise2, 0.5) * (0.3 + 0.2 * mouseInfluence);
    
    // Add viscosity effect
    vec3 mouseDirInWorld = vec3(mouseOffset.x, -mouseOffset.y, 0.25);
    float viscosityFactor = max(0.0, dot(normalize(p), normalize(mouseDirInWorld)));
    viscosityFactor = pow(viscosityFactor, 4.0) * mouseInfluence;
    
    // Final slime shape
    return sphere - noiseDeform - viscosityFactor * 0.94;
}

// Raymarching function
float raymarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = slimeSDF(p);
        dO += dS;
        if (dO > MAX_DIST || abs(dS) < SURF_DIST) break;
    }
    
    return dO;
}

// Calculate normal
vec3 getNormal(vec3 p) {
    float d = slimeSDF(p);
    vec2 e = vec2(0.001, 0.0);
    
    vec3 n = d - vec3(
        slimeSDF(p - e.xyy),
        slimeSDF(p - e.yxy),
        slimeSDF(p - e.yyx)
    );
    
    return normalize(n);
}

// Get color based on position and normal
vec3 getSlimeColor(vec3 p, vec3 n, vec3 rd) {
    // Base colors for slime
    vec3 greenColor = vec3(0.4, 0.8, 0.3);
    vec3 blueColor = vec3(0.5, 0.4, 0.5);
    vec3 purpleColor = vec3(0.3, 0.3, 0.8);
    
    // Mix colors based on position and noise
    float colorNoise = fbm(p * 2.0 + vTime * 0.1);
    vec3 baseColor = mix(greenColor, blueColor, colorNoise);
    baseColor = mix(baseColor, purpleColor, fbm(p * 3.0 - vTime * 0.15) * 0.5);
    
    // Add glossy highlights
    vec3 lightDir = normalize(vec3(1.0, 4.0, 1.0));
    float diff = max(dot(n, lightDir), 0.0);
    
    // Specular highlight (glossy effect)
    vec3 reflectDir = reflect(-lightDir, n);
    float spec = pow(max(dot(reflectDir, -rd), 0.0), 32.0);
    float fresnel = pow(.01 - max(0.0, dot(n, -rd)), 5.0);
    
    // Time-based influence on glossiness
    float timeInfluence = 1.0 + sin(vTime) * 0.5;
    spec *= timeInfluence;
    
    // Combine all lighting effects
    vec3 color = baseColor * (0.2 + diff * 0.8);
    color += vec3(2.0) * spec * 0.8;
    color += baseColor * fresnel * 0.5;
    
    return color * uIntensity;
}

void main() {
    // Adjust UV for aspect ratio
    vec2 uv = v_uv - 0.5;
    uv.x *= uResolution.x / uResolution.y;
    
    // Camera setup
    vec3 ro = vec3(0.0, 0.0, 3.750);
    vec3 rd = normalize(vec3(uv, -1.0));
    
    // Raymarching
    float d = raymarch(ro, rd);
    
    // Background color
    vec3 backgroundColor = vec3(0.00, 0.00, 0.00);
    
    // Final color
    vec3 col = backgroundColor;
    
    // If we hit the slime
    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = getNormal(p);
        
        // Get slime color with glossy effect
        col = getSlimeColor(p, n, rd);
        
        // Add depth fog
        float fogFactor = 1.0 - exp(-d * 0.15);
        col = mix(col, backgroundColor, fogFactor);
    }
    
    // Add subtle glow around the edges
    float glow = 2.0 / (1.0 + d * d * 0.1);
    col += vec3(0.0, 0.4, 0.6) * glow * 0.05 * uIntensity;
    
    // Output final color
    gl_FragColor = vec4(col, 1.0);
} 