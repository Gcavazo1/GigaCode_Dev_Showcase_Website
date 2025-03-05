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
            
            #define PI 3.14159265359
            #define TAU 6.28318530718
            
            // Rotation matrix
            mat2 rotate(float angle) {
                float s = sin(angle), c = cos(angle);
                return mat2(c, -s, s, c);
            }
            
            // Prismatic color based on position
            vec3 prismatic(float t) {
                return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
            }
            
            void main() {
                vec2 uv = v_uv * 2.0 - 1.0;
                uv.x *= uResolution.x/uResolution.y;
                
                float time = vTime * 0.5;
                
                // Kaleidoscopic repetition
                float angle = atan(uv.y, uv.x);
                float segments = 8.0 + 4.0 * sin(time * 0.2);
                float segmentAngle = TAU / segments;
                angle = mod(angle, segmentAngle) - segmentAngle * 0.5;
                
                // Rotate space
                uv *= 1.0 + 0.4 * sin(time * 0.3);
                uv *= rotate(time * 0.3);
                
                // Generate prismatic colors
                float colorPos = length(uv) + time * 0.3;
                colorPos += 0.2 * sin(angle * 12.0 + time * 1.5);
                vec3 color = prismatic(colorPos);
                
                // Add glow
                float glow = 0.03 / (0.01 + abs(length(uv) - 0.5));
                color += glow * prismatic(time * 0.1);
                
                // Add shimmer
                float shimmer = fract(sin(dot(uv, vec2(12.9898, 78.233)) + time * 2.0) * 43758.5453);
                color += shimmer * 0.1;
                
                // Enhance contrast
                color = pow(color, vec3(0.8)) * 1.2;
                
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