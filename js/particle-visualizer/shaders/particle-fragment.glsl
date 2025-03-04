uniform vec3 uColor;
uniform vec3 startColor;
uniform vec3 endColor;
uniform float uBassFrequency;
uniform float uMidFrequency;
uniform float uHighFrequency;
uniform float uBeat;

varying vec3 vPosition;
varying float vDistance;
varying float vScale;
varying vec3 vColor;

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
    color += vColor * 0.5; // Add position-based color
    
    // Pulse effect on beat
    color += vec3(uBeat * 0.3 * vScale);
    
    // Add glow effect
    float glow = smoothstep(0.4, 0.0, dist) * uBassFrequency * 0.5;
    color += glow * vec3(0.1, 0.3, 0.6);
    
    // Final color with audio-reactive alpha
    float alpha = circle * 0.8 * (0.5 + uMidFrequency * 0.5);
    
    // Pulse transparency with beat
    alpha *= 1.0 + uBeat * 0.3 * vScale;
    
    gl_FragColor = vec4(color, alpha);
}