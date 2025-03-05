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
        
        // Let's use a simple test shader first
        const vertexShaderSource = `
            attribute vec4 aPosition;
            void main() {
                gl_Position = aPosition;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            uniform float uTime;
            uniform vec2 uResolution;
            
            void main() {
                vec2 uv = gl_FragCoord.xy/uResolution.xy;
                vec3 color = 0.5 + 0.5*cos(uTime+uv.xyx+vec3(0,2,4));
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