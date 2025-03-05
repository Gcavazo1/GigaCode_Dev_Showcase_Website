class GLSLHeader {
    constructor() {
        console.log('Initializing GLSLHeader');
        this.canvas = document.getElementById('header-shader-canvas');
        
        if (!this.canvas) {
            console.error('Could not find header-shader-canvas');
            return;
        }
        
        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.startTime = Date.now();
        console.log('WebGL context created successfully');
        
        // Initialize immediately
        this.init();
    }
    
    async init() {
        console.log('Starting initialization');
        
        // Use the fractal shader from the multiverse showcase
        const vertexShaderSource = `
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform float uTime;
            
            varying vec2 vTexCoord;
            varying float vTime;
            
            void main() {
                gl_Position = aPosition;
                vTexCoord = aTexCoord;
                vTime = uTime;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec2 vTexCoord;
            varying float vTime;
            
            uniform vec2 uResolution;
            uniform float uIntensity;
            
            vec2 cmul(vec2 a, vec2 b) {
                return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy/uResolution.xy;
                uv = uv * 2.0 - 1.0;
                uv.x *= uResolution.x/uResolution.y;
                
                float zoom = 2.5 - sin(vTime * 0.1) * 0.5;
                uv /= zoom;
                
                float time = vTime * 0.2;
                vec2 c = vec2(0.7885 * cos(time), 0.7885 * sin(time));
                
                vec2 z = uv;
                float iterations = 0.0;
                const float maxIterations = 100.0;
                
                for (float i = 0.0; i < 100.0; i++) {
                    z = cmul(z, z) + c;
                    if (length(z) > 2.0) {
                        break;
                    }
                    iterations = i;
                }
                
                float normalized = iterations / maxIterations;
                float smooth_value = normalized + 1.0 - log(log(length(z))) / log(2.0);
                smooth_value = pow(smooth_value, 0.5);
                
                vec3 color1 = vec3(0.0, 0.0, 0.3);
                vec3 color2 = vec3(0.5, 0.0, 0.5);
                vec3 color3 = vec3(1.0, 0.4, 0.0);
                vec3 color4 = vec3(1.0, 0.8, 0.0);
                
                vec3 color;
                float t = fract(smooth_value * 3.0 + vTime * 0.2);
                
                if (t < 0.33) {
                    color = mix(color1, color2, t * 3.0);
                } else if (t < 0.66) {
                    color = mix(color2, color3, (t - 0.33) * 3.0);
                } else {
                    color = mix(color3, color4, (t - 0.66) * 3.0);
                }
                
                if (iterations >= maxIterations - 1.0) {
                    color = vec3(0.0);
                }
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Create shaders
        const vertexShader = this.createShaderFromSource(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.createShaderFromSource(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            console.error('Failed to create shaders');
            return;
        }
        
        // Create program
        this.program = this.createProgram(vertexShader, fragmentShader);
        if (!this.program) {
            console.error('Failed to create shader program');
            return;
        }
        
        console.log('Shader program created successfully');
        
        // Set up geometry
        this.setupGeometry();
        
        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'uTime'),
            resolution: this.gl.getUniformLocation(this.program, 'uResolution')
        };
        
        // Set up resize handler
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Start animation
        this.animate();
        console.log('Initialization complete');
    }
    
    createShaderFromSource(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(`Shader compile error: ${this.gl.getShaderInfoLog(shader)}`);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(`Program link error: ${this.gl.getProgramInfoLog(program)}`);
            return null;
        }
        
        return program;
    }
    
    setupGeometry() {
        // Create a full-screen quad
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
    
    resize() {
        const { width, height } = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    animate() {
        const time = (Date.now() - this.startTime) * 0.001;
        
        this.gl.useProgram(this.program);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating GLSLHeader');
    new GLSLHeader();
}); 