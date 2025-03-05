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
        try {
            // Load the neon grid shaders that are already working in the showcase
            const vertexShaderSource = await this.loadShader('js/multiverse-showcase/shaders/showcase12/neon-grid.vert');
            const fragmentShaderSource = await this.loadShader('js/multiverse-showcase/shaders/showcase12/neon-grid.frag');

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
                resolution: this.gl.getUniformLocation(this.program, 'uResolution'),
                intensity: this.gl.getUniformLocation(this.program, 'uIntensity'),
                modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
                projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix')
            };

            // Start animation
            this.animate();
        } catch (error) {
            console.error('Error initializing button shader:', error);
        }
    }

    async loadShader(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load shader from ${path}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Shader loading error:', error);
            throw error;
        }
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
        // Create position buffer (full screen quad)
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'aPosition');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Create texture coordinate buffer
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);

        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

        const texCoordLocation = this.gl.getAttribLocation(this.program, 'aTexCoord');
        this.gl.enableVertexAttribArray(texCoordLocation);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
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

        // Create identity matrices for model-view and projection
        const modelViewMatrix = mat4.create();
        const projectionMatrix = mat4.create();

        // Set uniforms
        const time = (Date.now() - this.startTime) * 0.001;
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.resolution, width, height);
        this.gl.uniform1f(this.uniforms.intensity, 1.0); // Full intensity
        this.gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(() => this.animate());
    }
}

export default ButtonShader; 