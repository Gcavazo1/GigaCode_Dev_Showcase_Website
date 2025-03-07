// Rotation matrix for 3D transformations
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
        0.0,                                0.0,                                0.0,                                1.0
    );
}

// Rotate a vector around an axis by an angle
vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
}

// Blob shape using sine waves for organic deformation
float blobShape(vec3 p, float time) {
    float scale1 = 3.0 + 2.0 * sin(time / 8.0);
    float scale2 = 5.0 + 3.0 * cos(time / 12.0);
    
    float wave1 = sin(p.x * scale1) * sin(p.y * scale1) * sin(p.z * scale1) * 0.25;
    float wave2 = sin(p.x * scale2 + time) * sin(p.y * scale2 + time) * sin(p.z * scale2) * 0.15;
    
    return length(p) - (0.6 + wave1 + wave2);
}

// Lava effect using custom waveforms
float waveCrazy(vec3 p, float time) {
    float wave = sin(p.x * 3.0 + time) * cos(p.y * 2.5 + time * 0.7) * sin(p.z * 2.0 + time * 0.5);
    float wave2 = cos(p.x * 4.0 + time * 0.6) * sin(p.y * 3.5) * sin(p.z * 3.0 + time * 0.8);
    return (wave + wave2) * 0.25;
}

// Main scene distance function
float scene(vec3 p, float time) {
    vec3 p1 = rotate(p, vec3(0.1, 1.0, 0.3), time / 8.0);
    
    float blob1 = blobShape(p1, time);
    float blob2 = blobShape(p1 * 1.2, time * 1.2) * 0.8;
    
    float scale = 4.0 + 2.0 * sin(time / 10.0);
    float baseShape = length(p1) - 1.0;
    float waves = waveCrazy(p1 * scale, time) / scale;
    
    return mix(baseShape, waves, 0.5 + 0.5 * sin(time / 5.0));
}

// Get normal for lighting calculations
vec3 getNormal(vec3 p, float time) {
    vec2 e = vec2(0.001, 0.0);
    
    return normalize(vec3(
        scene(p + e.xyy, time) - scene(p - e.xyy, time),
        scene(p + e.yxy, time) - scene(p - e.yxy, time),
        scene(p + e.yyx, time) - scene(p - e.yyx, time)
    ));
}

// Color function for lava lamp effect
vec3 getColor(vec3 p, float time) {
    float dist = length(p);
    float colorVar = 0.5 + 0.5 * sin(time / 4.0);
    
    vec3 col1 = vec3(0.9, 0.1, 0.0);  
    vec3 col2 = vec3(0.9, 0.5, 0.0);  
    vec3 col3 = vec3(1.0, 0.8, 0.0);  
    
    vec3 finalColor = mix(col1, col2, sin(dist * 5.0 + time) * 0.5 + 0.5);
    finalColor = mix(finalColor, col3, sin(dist * 3.0 - time * 0.5) * 0.5 + 0.5);
    
    finalColor += 0.1 * sin(p.x * 10.0 + time) * sin(p.y * 10.0) * sin(p.z * 10.0);
    
    return finalColor;
}

// Main shader function
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    vec3 rayOrigin = vec3(0.0, 0.0, 3.0);
    vec3 rayDir = normalize(vec3(uv, -1.0));
    
    rayOrigin = rotate(rayOrigin, vec3(0.0, 1.0, 0.0), iTime / 20.0);
    rayDir = rotate(rayDir, vec3(0.0, 1.0, 0.0), iTime / 20.0);
    
    vec3 color = vec3(0.0, 0.0, 0.05);
    
    float maxDist = 10.0;
    float dist = 0.0;
    float brightness = 0.0;
    
    for (int i = 0; i < 100; i++) {
        vec3 p = rayOrigin + dist * rayDir;
        float d = scene(p, iTime);
        
        if (d < 0.1) {
            brightness += 0.05 * (0.1 - d);
        }
        
        if (d < 0.001) {
            vec3 normal = getNormal(p, iTime);
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            
            float diff = max(dot(normal, lightDir), 0.0) * 0.5 + 0.5;
            
            vec3 baseColor = getColor(p, iTime);
            color = baseColor * diff;
            
            float spec = pow(max(dot(reflect(-lightDir, normal), -rayDir), 0.0), 32.0);
            color += vec3(1.0) * spec * 0.5;
            
            break;
        }
        
        dist += max(d * 0.5, 0.01);  
        
        if (dist > maxDist) {
            break;
        }
    }
    
    vec3 glowColor = mix(vec3(1.0, 0.3, 0.0), vec3(0.9, 0.1, 0.3), 0.5 + 0.5 * sin(iTime / 5.0));
    color += glowColor * brightness;
    
    float vignette = 1.0 - length(uv) * 0.5;
    color *= vignette;
    
    fragColor = vec4(color, 1.0);
}
