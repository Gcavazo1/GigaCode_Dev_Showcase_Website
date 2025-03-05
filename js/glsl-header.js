class GLSLHeader {
    constructor() {
        this.canvas = document.getElementById('header-shader-canvas');
        this.gl = this.canvas.getContext('webgl');
        this.startTime = Date.now();
        
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.init();
    }
    
    async init() {
        // Initialize shaders
        const vertexShader = await this.loadShader('vertex');
        const fragmentShader = await this.loadShader('fragment');
        
        // Create shader program
        this.program = this.createProgram(vertexShader, fragmentShader);
        
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
    }
    
    async loadShader(type) {
        // Update path to match your shader file structure
        const response = await fetch(`js/multiverse-showcase/shaders/showcase11/fractal.${type === 'vertex' ? 'vert' : 'frag'}`);
        const source = await response.text();
        
        const shader = this.gl.createShader(type === 'vertex' ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER);
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
    new GLSLHeader();
}); 