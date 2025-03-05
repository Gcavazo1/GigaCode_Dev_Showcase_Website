// Kaleidoscopic Flow fragment shader
precision mediump float;

varying vec2 v_uv;
varying float vTime;

uniform vec2 uResolution;
uniform float uIntensity;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
        f += w * snoise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Adjust for aspect ratio
    vec2 uv = v_uv;
    float aspectRatio = uResolution.x / uResolution.y;
    uv.x *= aspectRatio;
    
    // Center coordinates
    vec2 center = vec2(aspectRatio * 0.5, 0.5);
    
    // Since we don't have mouse input, create artificial movement
    vec2 mousePos = vec2(
        center.x + sin(vTime * 0.5) * 0.3,
        center.y + cos(vTime * 0.4) * 0.3
    );
    float mouseDistance = length(mousePos - center);
    float mouseFactor = smoothstep(0.0, 0.5, mouseDistance);
    
    // Kaleidoscope effect
    vec2 p = uv - center;
    
    // Rotate based on time and simulated mouse
    float angle = vTime * 0.1 + mouseFactor * 0.5;
    p = rotate(p, angle);
    
    // Number of kaleidoscope segments
    float segments = 6.0 + mouseFactor * 4.0;
    
    // Calculate angle and radius
    float a = atan(p.y, p.x);
    float r = length(p);
    
    // Kaleidoscope folding
    a = mod(a, TWO_PI / segments) - (TWO_PI / segments) * 0.5;
    p = vec2(cos(a), sin(a)) * r;
    
    // Organic motion
    float t = vTime * 0.2;
    float displacement = fbm(p * (0.5 + mouseFactor * 0.5) + vec2(t * 0.3, t * 0.2));
    displacement += 0.5 * fbm(p * 2.0 + vec2(-t * 0.4, t * 0.1));
    
    // Apply displacement to coordinates
    p += displacement * 0.2 * (1.0 + mouseFactor);
    
    // Generate colors
    float colorNoise = fbm(p * 1.5 + t * 0.1);
    vec3 color1 = hsv2rgb(vec3(0.55 + colorNoise * 0.2, 0.7, 0.9)); // Purplish
    vec3 color2 = hsv2rgb(vec3(0.85 + colorNoise * 0.1, 0.8, 0.7)); // Pinkish
    vec3 color3 = hsv2rgb(vec3(0.15 + colorNoise * 0.1, 0.9, 0.8)); // Greenish
    
    // Background color
    vec3 bgColor = hsv2rgb(vec3(0.7, 0.3, 0.2)); // Dark purple
    
    // Mix colors based on noise and position
    float mixFactor = fbm(p * 3.0 + t * 0.5);
    vec3 finalColor = mix(color1, color2, smoothstep(0.3, 0.7, mixFactor));
    finalColor = mix(finalColor, color3, smoothstep(0.4, 0.6, sin(r * 5.0 + t)));
    
    // Add pulsing effect
    float pulse = 0.5 + 0.5 * sin(vTime * 0.5);
    finalColor *= 0.8 + 0.3 * pulse;
    
    // Blend with background based on radius and noise
    float edgeFactor = smoothstep(0.0, 1.5 + mouseFactor * 0.5, r);
    finalColor = mix(finalColor, bgColor, edgeFactor);
    
    // Add subtle vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(v_uv - 0.5) * 2.0);
    finalColor *= vignette * 1.2;
    
    // Apply intensity
    finalColor *= uIntensity;
    
    gl_FragColor = vec4(finalColor, 1.0);
} 