class ButtonShader {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        this.startTime = Date.now();
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.init();
    }
    
    async init() {
        // Initialize shaders
        const vertexShaderSource = `
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            uniform float uTime;
            
            varying vec2 v_uv;
            varying float vTime;
            
            void main() {
                gl_Position = aPosition;
                v_uv = aTexCoord;
                vTime = uTime;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec2 v_uv;
            varying float vTime;
            uniform vec2 uResolution;
            
            #define MAX_STEPS 100
            #define MAX_DIST 100.0
            #define SURF_DIST 0.001
            #define PI 3.1415926535
            
            // SDF for a cube
            float sdBox(vec3 p, vec3 b) {
                vec3 q = abs(p) - b;
                return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
            }
            
            // Rotation matrix
            mat2 rot2D(float angle) {
                float s = sin(angle);
                float c = cos(angle);
                return mat2(c, -s, s, c);
            }
            
            // Random function
            float hash21(vec2 p) {
                p = fract(p * vec2(123.34, 456.21));
                p += dot(p, p + 45.32);
                return fract(p.x * p.y);
            }
            
            // Noise function
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float a = hash21(i);
                float b = hash21(i + vec2(1.0, 0.0));
                float c = hash21(i + vec2(0.0, 1.0));
                float d = hash21(i + vec2(1.0, 1.0));
                
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            // Scene SDF
            float map(vec3 p) {
                float mouseInfluence = (sin(vTime * 0.5) * 0.5 + 0.5) * 2.0;
                
                p.xz *= rot2D(vTime * 0.3);
                p.xy *= rot2D(vTime * 0.2);
                
                vec3 modP = mod(p + 2.0, 4.0) - 2.0;
                
                float scale = 0.5 + 0.3 * noise(p.xz * 0.5 + vTime * 0.2);
                scale *= (1.0 + 0.2 * mouseInfluence);
                
                float dist = sdBox(modP, vec3(scale));
                dist += 0.05 * sin(p.x + vTime) * sin(p.z + vTime);
                
                return dist;
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
            float rayMarch(vec3 ro, vec3 rd) {
                float d = 0.0;
                
                for(int i = 0; i < MAX_STEPS; i++) {
                    vec3 p = ro + rd * d;
                    float dS = map(p);
                    d += dS;
                    if(d > MAX_DIST || dS < SURF_DIST) break;
                }
                
                return d;
            }
            
            void main() {
                vec2 uv = v_uv * 2.0 - 1.0;
                uv.x *= uResolution.x/uResolution.y;
                
                vec2 m = vec2(sin(vTime * 0.4), cos(vTime * 0.3)) * 0.3;
                float mouseIntensity = clamp(length(m) * 2.0, 0.0, 1.0);
                
                vec3 ro = vec3(0.0, 0.0, -5.0 + sin(vTime * 0.2) * 2.0);
                vec3 rd = normalize(vec3(uv, 1.0));
                
                rd.xz *= rot2D(m.x * PI * 0.5);
                rd.yz *= rot2D(m.y * PI * 0.5);
                
                float d = rayMarch(ro, rd);
                
                vec3 col = vec3(0.0);
                
                if(d < MAX_DIST) {
                    vec3 p = ro + rd * d;
                    vec3 n = getNormal(p);
                    
                    vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
                    float diff = max(dot(n, lightDir), 0.0);
                    
                    vec3 baseColor = vec3(0.0, 0.9, 0.9);
                    vec3 rimColor = vec3(0.6, 0.0, 1.0);
                    
                    float edge = 1.0 - max(dot(n, -rd), 0.0);
                    edge = pow(edge, 3.0);
                    
                    col = baseColor * diff;
                    col += rimColor * edge * 1.5;
                    
                    float pulse = 0.5 + 0.5 * sin(vTime * 2.0 + noise(p.xz * 0.5) * 5.0);
                    col += rimColor * pulse * 0.3;
                    
                    col *= 1.0 - smoothstep(5.0, 15.0, d);
                }
                
                float vignette = 1.0 - smoothstep(0.3, 1.5, length(v_uv - 0.5));
                col *= vignette;
                
                col += vec3(0.6, 0.0, 1.0) * mouseIntensity * 0.2;
                
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        // Create and compile shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Could not initialize button shader');
            return;
        }

        // Set up geometry
        this.setupGeometry();
        
        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'uTime'),
            resolution: this.gl.getUniformLocation(this.program, 'uResolution')
        };

        // Start animation
        this.animate();
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(`Shader compile error: ${this.gl.getShaderInfoLog(shader)}`);
            return null;
        }

        return shader;
    }

    setupGeometry() {
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'aPosition');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    animate() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        if (width === 0 || height === 0) {
            console.warn('Button canvas has zero dimension:', width, height);
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);

        this.gl.useProgram(this.program);

        const time = (Date.now() - this.startTime) * 0.001;
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.resolution, width, height);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.animate());
    }
}

export default ButtonShader; 