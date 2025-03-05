import ShaderWindow from './shader-window.js';

/**
 * Carousel class
 * Manages the 3D carousel of shader windows
 */
class Carousel {
    /**
     * Create a new carousel
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.container - Container element
     * @param {Array} options.shaderConfigs - Shader configurations
     */
    constructor(options) {
        this.container = options.container;
        this.shaderConfigs = options.shaderConfigs || [];
        
        // Initialize properties
        this.canvas = null;
        this.gl = null;
        this.windows = [];
        this.rotationAngle = 0;
        this.targetRotationAngle = 0;
        this.radius = 5.0;
        this.expandedWindowIndex = -1;
        this.isInitialized = false;
        
        // Initialize matrices
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        
        // Time tracking
        this.currentTime = 0;
        this.lastFrameTime = 0;
        
        // Track loading state
        this.isLoading = true;
        this.loadingStartTime = performance.now();
        
        // Initialize
        this.init().then(() => {
            // Start animation loop only after initialization is complete
            if (this.isInitialized) {
                this.animate();
            }
        });

        // Add navigation arrows
        const nav = document.createElement('div');
        nav.className = 'multiverse-nav';
        nav.innerHTML = `
            <button class="nav-arrow prev"></button>
            <button class="nav-arrow next"></button>
        `;
        this.container.appendChild(nav);

        // Add click handlers for arrows
        const prevButton = nav.querySelector('.prev');
        const nextButton = nav.querySelector('.next');
        
        prevButton.addEventListener('click', () => {
            this.targetRotationAngle += Math.PI / 4;
        });
        
        nextButton.addEventListener('click', () => {
            this.targetRotationAngle -= Math.PI / 4;
        });

        // Add Random Showcase button with shader background
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'multiverse-controls';
        
        // Add canvas for shader background
        const buttonBgCanvas = document.createElement('canvas');
        buttonBgCanvas.className = 'button-bg-canvas';
        controlsContainer.appendChild(buttonBgCanvas);
        
        // Add button
        controlsContainer.innerHTML += `
            <button class="showcase-button random-showcase">
                <span class="button-text">Random Showcase</span>
                <div class="button-glow"></div>
            </button>
        `;
        
        this.container.appendChild(controlsContainer);
        
        // Initialize button background shader
        this.initButtonShader(buttonBgCanvas);
        
        // Add click handler
        const randomButton = controlsContainer.querySelector('.random-showcase');
        randomButton.addEventListener('click', () => this.showRandomWindow());
    }
    
    /**
     * Initialize carousel
     */
    async init() {
        try {
            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'multiverse-canvas';
            this.container.appendChild(this.canvas);
            
            // Get WebGL context
            this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            if (!this.gl) {
                throw new Error('WebGL not supported');
            }
            
            // Enable depth testing
            this.gl.enable(this.gl.DEPTH_TEST);
            
            // Set canvas size
            this.resizeCanvas();
            
            // Create shader windows
            await this.createWindows();
            
            // Set up camera
            mat4.perspective(this.projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0);
            mat4.lookAt(this.viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading indicator
            this.hideLoading();
        } catch (error) {
            console.error('Carousel initialization error:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * Create shader windows
     */
    async createWindows() {
        // Clear existing windows
        this.windows = [];
        
        const totalWindows = this.shaderConfigs.length;
        const radius = 8; // Increased radius to account for larger windows
        const verticalOffset = 0.6; // Keep the same vertical offset
        
        for (let i = 0; i < totalWindows; i++) {
            const config = this.shaderConfigs[i];
            const window = new ShaderWindow({
                gl: this.gl,
                vertexShaderPath: config.vertexShaderPath,
                fragmentShaderPath: config.fragmentShaderPath,
                title: config.title,
                description: config.description
            });
            
            // Calculate position on the circle
            const angle = (i / totalWindows) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = Math.cos(angle * 2) * verticalOffset;
            
            window.position = { x, y, z };
            
            // Adjust rotation to face slightly upward
            window.rotation = {
                x: -0.1, // Slight upward tilt
                y: -angle + Math.PI / 2,
                z: 0
            };
            
            this.windows.push(window);
        }
    }
    
    /**
     * Handle window resize
     */
    resizeCanvas() {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = height * devicePixelRatio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Update projection matrix
        mat4.perspective(this.projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0);
    }
    
    /**
     * Animation loop
     * @param {number} timestamp - Current timestamp
     */
    animate(timestamp = 0) {
        if (!this.isInitialized) {
            requestAnimationFrame(this.animate.bind(this));
            return;
        }

        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Smoother rotation with easing
        const ease = 0.08;
        const rotationDelta = this.targetRotationAngle - this.rotationAngle;
        this.rotationAngle += rotationDelta * ease;

        // Add subtle floating motion
        const floatAmplitude = 0.2; // Reduced amplitude
        const floatSpeed = 0.001;
        const floatOffset = Math.sin(timestamp * floatSpeed) * floatAmplitude;

        // Update window positions
        this.windows.forEach((window, i) => {
            const angle = (i / this.windows.length) * Math.PI * 2 + this.rotationAngle;
            window.position.y += (floatOffset - window.position.y) * 0.05;
        });

        // Update windows
        this.windows.forEach(window => {
            window.update(deltaTime);
        });

        this.render(timestamp);
        requestAnimationFrame(this.animate.bind(this));
    }
    
    /**
     * Render the carousel
     * @param {number} timestamp - Current timestamp
     */
    render(timestamp) {
        const gl = this.gl;
        
        // Clear the canvas
        gl.clearColor(0.00, 0.00, 0.00, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Calculate time for shaders
        const time = (timestamp - this.loadingStartTime) / 1000.0;
        
        // Update view matrix with adjusted camera position
        mat4.identity(this.viewMatrix);
        mat4.lookAt(this.viewMatrix, [0, 0, 18], [0, 0, 0], [0, 1, 0]); // Moved camera further back
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotationAngle);
        
        // Render all windows
        console.log('Rendering carousel with', this.windows.length, 'windows');
        console.log('Camera position:', [0, 0, 18]);
        console.log('Rotation angle:', this.rotationAngle);

        // First window position
        if (this.windows.length > 0) {
            console.log('First window position:', this.windows[0].position);
        }

        for (const window of this.windows) {
            window.render(this.viewMatrix, this.projectionMatrix, time);
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        // Remove loading indicator
        const loading = this.container.querySelector('.multiverse-loading');
        if (loading) {
            loading.classList.add('fade-out');
        setTimeout(() => {
                loading.remove();
            }, 500);
        }
        
        this.isLoading = false;
    }
    
    /**
     * Handle mouse move event
     * @param {MouseEvent} event - Mouse event
     */
    onMouseMove(event) {
        if (this.expandedWindowIndex !== -1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Normalize coordinates
        const normalizedX = (x / rect.width) * 2 - 1;
        const normalizedY = -((y / rect.height) * 2 - 1);
        
        // Find the front-most windows (those closest to the viewer)
        const frontAngle = this.rotationAngle;
        const angleThreshold = Math.PI * 0.25; // 45 degrees visibility cone
        
        let hoveredIndex = -1;
        let minAngleDiff = angleThreshold;
        
        this.windows.forEach((window, i) => {
            // Calculate window's angle relative to front
            const windowAngle = (i / this.windows.length) * Math.PI * 2 + this.rotationAngle;
            const angleDiff = Math.abs(((windowAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
            
            // Only consider windows within the front visibility cone
            if (angleDiff < angleThreshold) {
                // Simple rectangular hit test in screen space
                const windowPos = this.getScreenPosition(window);
                const halfWidth = window.width * 0.5;
                const halfHeight = window.height * 0.5;
                
                if (normalizedX >= windowPos.x - halfWidth && 
                    normalizedX <= windowPos.x + halfWidth && 
                    normalizedY >= windowPos.y - halfHeight && 
                    normalizedY <= windowPos.y + halfHeight) {
                    
                    // Take the window closest to front
                    if (angleDiff < minAngleDiff) {
                        minAngleDiff = angleDiff;
                        hoveredIndex = i;
                    }
                }
            }
        });
        
        // Update hover states
        this.windows.forEach((window, i) => {
            window.setHover(i === hoveredIndex);
        });
    }
    
    // Helper to get window's screen position
    getScreenPosition(window) {
        const angle = this.rotationAngle;
        const x = window.position.x * Math.cos(angle) - window.position.z * Math.sin(angle);
        const y = window.position.y;
        return { x, y };
    }
    
    /**
     * Handle click event
     * @param {MouseEvent} event - Mouse event
     */
    onClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Normalize coordinates
        const normalizedX = (x / rect.width) * 2 - 1;
        const normalizedY = -((y / rect.height) * 2 - 1);
        
        // Create ray from camera (in view space)
        const rayOrigin = { x: 0, y: 0, z: 18 };
        const rayDirection = { x: normalizedX, y: normalizedY, z: -1 };
        
        // Normalize ray direction
        const length = Math.sqrt(
            rayDirection.x * rayDirection.x +
            rayDirection.y * rayDirection.y +
            rayDirection.z * rayDirection.z
        );
        
        rayDirection.x /= length;
        rayDirection.y /= length;
        rayDirection.z /= length;
        
        // Check intersections
        let clickedIndex = -1;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.windows.length; i++) {
            const window = this.windows[i];
            
            // Create a copy of the window position
            const windowPos = { ...window.position };
            
            // Transform window position from world space to view space
            // This accounts for the carousel rotation
            const rotatedX = windowPos.x * Math.cos(this.rotationAngle) - windowPos.z * Math.sin(this.rotationAngle);
            const rotatedZ = windowPos.x * Math.sin(this.rotationAngle) + windowPos.z * Math.cos(this.rotationAngle);
            
            windowPos.x = rotatedX;
            windowPos.z = rotatedZ;
            
            // Simple plane intersection test
            const planeNormal = { 
                x: Math.sin(this.rotationAngle - window.rotation.y), 
                y: 0, 
                z: Math.cos(this.rotationAngle - window.rotation.y) 
            };
            
            const denom = rayDirection.x * planeNormal.x + 
                          rayDirection.y * planeNormal.y + 
                          rayDirection.z * planeNormal.z;
            
            if (Math.abs(denom) > 0.0001) {
                const t = ((windowPos.x - rayOrigin.x) * planeNormal.x +
                          (windowPos.y - rayOrigin.y) * planeNormal.y +
                          (windowPos.z - rayOrigin.z) * planeNormal.z) / denom;
                
                if (t >= 0 && t < closestDistance) {
                    const hitPoint = {
                        x: rayOrigin.x + rayDirection.x * t,
                        y: rayOrigin.y + rayDirection.y * t,
                        z: rayOrigin.z + rayDirection.z * t
                    };
                    
                    // Calculate local coordinates on the window plane
                    const localX = (hitPoint.x - windowPos.x) * Math.cos(-window.rotation.y) - 
                                  (hitPoint.z - windowPos.z) * Math.sin(-window.rotation.y);
                    const localY = hitPoint.y - windowPos.y;
                    
                    // Check if hit point is within window bounds
                    if (Math.abs(localX) <= window.width/2 * window.scale && 
                        Math.abs(localY) <= window.height/2 * window.scale) {
                        clickedIndex = i;
                        closestDistance = t;
                    }
                }
            }
        }
        
        // Handle click
        if (clickedIndex !== -1) {
            if (this.expandedWindowIndex === clickedIndex) {
                // Collapse window
                this.windows[clickedIndex].setExpanded(false);
                this.expandedWindowIndex = -1;
            } else if (this.expandedWindowIndex === -1) {
                // Expand window
                this.windows[clickedIndex].setExpanded(true);
                this.expandedWindowIndex = clickedIndex;
                
                // Rotate carousel to center the window
                const angle = (clickedIndex / this.windows.length) * Math.PI * 2;
                this.targetRotationAngle = -angle + Math.PI / 2;
            } else {
                // Collapse current expanded window and expand clicked window
                this.windows[this.expandedWindowIndex].setExpanded(false);
                this.windows[clickedIndex].setExpanded(true);
                this.expandedWindowIndex = clickedIndex;
                
                // Rotate carousel to center the window
                const angle = (clickedIndex / this.windows.length) * Math.PI * 2;
                this.targetRotationAngle = -angle + Math.PI / 2;
            }
        } else if (this.expandedWindowIndex !== -1) {
            // Collapse window when clicking outside
            this.windows[this.expandedWindowIndex].setExpanded(false);
            this.expandedWindowIndex = -1;
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Remove loading indicator
        const loading = this.container.querySelector('.multiverse-loading');
        if (loading) {
            loading.remove();
        }
        
        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'multiverse-error';
        errorElement.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">
                <h3>WebGL Error</h3>
                <p>${message}</p>
                <p>Try using a browser with better WebGL support.</p>
            </div>
        `;
        this.container.appendChild(errorElement);
    }

    /**
     * Initialize the drag-to-rotate bar
     */
    initDragBar() { 
        // Do nothing - drag functionality disabled
    }

    /**
     * Update drag handle position based on carousel rotation
     * @param {boolean} isDragging - Whether the update is during a drag operation
     */
    updateDragHandlePosition() {
        // Do nothing - drag functionality disabled
    }

    // Add new method for random window selection
    showRandomWindow() {
        // If a window is already expanded, collapse it
        if (this.expandedWindowIndex !== -1) {
            this.windows[this.expandedWindowIndex].setExpanded(false);
        }

        // Select a random window
        const randomIndex = Math.floor(Math.random() * this.windows.length);
        
        // Expand the selected window
        this.windows[randomIndex].setExpanded(true);
        this.expandedWindowIndex = randomIndex;
        
        // Rotate carousel to center the window
        const angle = (randomIndex / this.windows.length) * Math.PI * 2;
        this.targetRotationAngle = -angle + Math.PI / 2;
    }

    // Add method to initialize button shader
    initButtonShader(canvas) {
        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported for button shader');
            return;
        }

        // Create shader program
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
                vec2 uv = v_uv;
                float aspect = uResolution.x/uResolution.y;
                uv.x *= aspect;
                
                float gridSize = 10.0;
                float baseGrid = grid(uv, gridSize);
                
                float waveEffect = 0.0;
                for (int i = 0; i < 3; i++) {
                    float i_f = float(i);
                    float speed = 2.0 + i_f * 0.5;
                    float freq = 5.0 + i_f * 2.0;
                    float amp = 0.1 + i_f * 0.05;
                    waveEffect += wave(uv + vec2(0.0, i_f * 0.1), freq, amp, speed);
                    waveEffect += wave(vec2(uv.y, uv.x) + vec2(i_f * 0.4, 0.0), freq * 0.9, amp, speed * 0.8);
                }
                
                vec2 distortedUV = uv;
                distortedUV.y += waveEffect * 0.1;
                distortedUV.x += waveEffect * 0.05;
                
                float distortedGrid = grid(distortedUV, gridSize * 0.8);
                float finalGrid = max(baseGrid, distortedGrid * 0.4);
                
                float pulse1 = pulse(uv.x + uv.y, 0.5);
                float pulse2 = pulse(uv.x - uv.y, 0.3);
                float pulseFactor = mix(pulse1, pulse2, 0.5);
                
                vec3 neonPink = vec3(1.0, 0.0, 0.8);
                vec3 neonBlue = vec3(0.0, 0.8, 1.0);
                vec3 neonPurple = vec3(0.6, 0.0, 1.0);
                vec3 darkBlue = vec3(0.0, 0.05, 0.2);
                
                vec3 bgColor = darkBlue + waveEffect * 0.05;
                
                vec3 gridColor = mix(
                    mix(neonPink, neonBlue, sin(uv.x * 2.0 + vTime) * 0.5 + 0.5),
                    neonPurple,
                    sin(vTime * 0.2) * 0.5 + 0.5
                );
                
                gridColor *= 0.4 + pulseFactor * 0.5;
                
                vec3 color = mix(bgColor, gridColor, finalGrid);
                
                vec2 glowPoint1 = vec2(sin(vTime * 1.2) * 0.5 + 0.5, cos(vTime * 0.3) * 0.3 + 0.5) * aspect;
                vec2 glowPoint2 = vec2(cos(vTime * 0.8) * 0.4 + 0.6, sin(vTime * 0.6) * 0.4 + 0.5) * aspect;
                
                color += glow(neonPink, 0.05, 10.0, uv, glowPoint1);
                color += glow(neonBlue, 0.05, 12.0, uv, glowPoint2);
                
                float scanLine = sin(uv.y * 100.0) * 0.03 + 0.97;
                color *= scanLine;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Create and compile shaders
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);

        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Could not initialize button shader');
            return;
        }

        // Set up geometry
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Get attribute locations
        const positionLocation = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Get uniform locations
        const timeLocation = gl.getUniformLocation(program, 'uTime');
        const resolutionLocation = gl.getUniformLocation(program, 'uResolution');

        // Set up animation
        const startTime = performance.now();
        const animate = () => {
            // Set canvas size
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);

            // Use shader program
            gl.useProgram(program);

            // Update uniforms
            const time = (performance.now() - startTime) * 0.001;
            gl.uniform1f(timeLocation, time);
            gl.uniform2f(resolutionLocation, width, height);

            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            requestAnimationFrame(animate);
        };

        animate();
    }
}

export default Carousel; 