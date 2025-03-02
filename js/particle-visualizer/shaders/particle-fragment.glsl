uniform vec3 uColor;
uniform vec3 startColor;
uniform vec3 endColor;
uniform float uBassFrequency;
uniform float uMidFrequency;
uniform float uHighFrequency;

varying vec3 vPosition;
varying float vDistance;
varying float vScale;

void main() {
    // Calculate distance from point center
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center) * 2.0;
    
    // Create soft circle with feathered edge
    float circle = 1.0 - smoothstep(0.0, 1.0, dist);
    
    // Interpolate between start and end colors based on distance
    vec3 baseColor = mix(startColor, endColor, vDistance);
    
    // Apply audio reactivity to color
    vec3 color = baseColor;
    color.r += uHighFrequency * 0.5 * vScale; // High frequencies affect red
    color.g += uMidFrequency * 0.3;           // Mid frequencies affect green
    color.b += uBassFrequency * 0.8;          // Bass frequencies affect blue
    
    // Final color with alpha
    float alpha = circle * 0.8 * (0.5 + uMidFrequency * 0.5);
    gl_FragColor = vec4(color, alpha);
}