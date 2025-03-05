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
            
            // Function to create a grid pattern
            float grid(vec2 uv, float size) {
                vec2 grid = fract(uv * size);
                vec2 smoothGrid = smoothstep(0.02, 0.05, grid) * smoothstep(0.95, 0.98, grid);
                return max(smoothGrid.x, smoothGrid.y);
            }
            
            // Function to create a wave effect
            float wave(vec2 uv, float freq, float amp, float speed) {
                return sin(uv.x * freq + vTime * speed) * amp;
            }
            
            // Function to create a pulse effect
            float pulse(float val, float freq) {
                return 0.5 + 0.5 * sin(val * freq + vTime * 3.0);
            }
            
            // Function to create a glow effect
            vec3 glow(vec3 color, float intensity, float size, vec2 uv, vec2 pos) {
                float dist = length(uv - pos);
                return color * intensity / (dist * size + 0.01);
            }
            
            void main() {
                // Adjust for aspect ratio
                vec2 uv = v_uv;
                float aspect = uResolution.x / uResolution.y;
                uv.x *= aspect;
                
                // Base grid
                float gridSize = 10.0;
                float baseGrid = grid(uv, gridSize);
                
                // Cyberpunk waves
                float waveEffect = 0.0;
                for (int i = 0; i < 3; i++) {
                    float i_f = float(i);
                    float speed = 2.0 + i_f * 0.5;
                    float freq = 5.0 + i_f * 2.0;
                    float amp = 0.1 + i_f * 0.05;
                    
                    // Vertical waves
                    waveEffect += wave(uv + vec2(0.0, i_f * 0.1), freq, amp, speed);
                    
                    // Horizontal waves
                    waveEffect += wave(vec2(uv.y, uv.x) + vec2(i_f * 0.4, 0.0), freq * 0.9, amp, speed * 0.8);
                }
                
                // Apply wave distortion to UV coordinates
                vec2 distortedUV = uv;
                distortedUV.y += waveEffect * 0.1;
                distortedUV.x += waveEffect * 0.05;
                
                // Create distorted grid
                float distortedGrid = grid(distortedUV, gridSize * 0.8);
                
                // Combine grids
                float finalGrid = max(baseGrid, distortedGrid * 0.4);
                
                // Pulsing effect
                float pulse1 = pulse(uv.x + uv.y, 0.5);
                float pulse2 = pulse(uv.x - uv.y, 0.3);
                float pulseFactor = mix(pulse1, pulse2, 0.5);
                
                // Define cyberpunk colors
                vec3 neonPink = vec3(1.0, 0.0, 0.8);
                vec3 neonBlue = vec3(0.0, 0.8, 1.0);
                vec3 neonPurple = vec3(0.6, 0.0, 1.0);
                vec3 neonYellow = vec3(1.0, 0.9, 0.0);
                vec3 darkBlue = vec3(0.0, 0.05, 0.2);
                
                // Background color with subtle wave effect
                vec3 bgColor = darkBlue + waveEffect * 0.05;
                
                // Grid color based on position and time
                vec3 gridColor = mix(
                    mix(neonPink, neonBlue, sin(uv.x * 2.0 + vTime) * 0.5 + 0.5),
                    mix(neonPurple, neonYellow, sin(uv.y * 3.0 - vTime * 0.7) * 0.5 + 0.5),
                    sin(vTime * 0.2) * 0.5 + 0.5
                );
                
                // Apply pulsing to grid color
                gridColor *= 0.4 + pulseFactor * 0.5;
                
                // Combine background and grid
                vec3 color = mix(bgColor, gridColor, finalGrid);
                
                // Add glow effects at certain points
                vec2 glowPoint1 = vec2(sin(vTime * 1.2) * 0.5 + 0.5, cos(vTime * 0.3) * 0.3 + 0.5) * aspect;
                vec2 glowPoint2 = vec2(cos(vTime * 0.8) * 0.4 + 0.6, sin(vTime * 0.6) * 0.4 + 0.5) * aspect;
                
                color += glow(neonPink, 0.05, 10.0, uv, glowPoint1);
                color += glow(neonBlue, 0.05, 12.0, uv, glowPoint2);
                
                // Add horizontal scan lines
                float scanLine = sin(uv.y * 100.0) * 0.03 + 0.97;
                color *= scanLine;
                
                gl_FragColor = vec4(color, 1.0);
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