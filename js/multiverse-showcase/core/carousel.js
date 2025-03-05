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
            
            // Add event listeners
            window.addEventListener('resize', this.resizeCanvas.bind(this));
            this.canvas.addEventListener('click', this.onClick.bind(this));
            
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
        const radius = 5.0; // Reduced radius for tighter spacing
        const verticalOffset = 0.5; // Reduced vertical offset
        
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
        gl.clearColor(0.05, 0.05, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Calculate time for shaders
        const time = (timestamp - this.loadingStartTime) / 1000.0;
        
        // Update view matrix with adjusted camera position
        mat4.identity(this.viewMatrix);
        mat4.lookAt(this.viewMatrix, [0, 0, 15], [0, 0, 0], [0, 1, 0]); // Moved camera back
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotationAngle);
        
        // Render all windows
        console.log('Rendering carousel with', this.windows.length, 'windows');
        console.log('Camera position:', [0, 0, 15]);
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
        
        // Create ray from camera
        const rayOrigin = { x: 0, y: 0, z: 10 };
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
        let hoveredIndex = -1;
        
        for (let i = 0; i < this.windows.length; i++) {
            const window = this.windows[i];
            
            if (window.intersectsRay(rayOrigin, rayDirection)) {
                hoveredIndex = i;
                break;
            }
        }
        
        // Update hover states
        for (let i = 0; i < this.windows.length; i++) {
            this.windows[i].setHover(i === hoveredIndex);
        }
        
        // Rotate carousel based on mouse position
        if (hoveredIndex === -1) {
            this.targetRotationAngle = normalizedX * 0.5;
        }
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
        
        // Create ray from camera
        const rayOrigin = { x: 0, y: 0, z: 10 };
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
        
        for (let i = 0; i < this.windows.length; i++) {
            const window = this.windows[i];
            
            if (window.intersectsRay(rayOrigin, rayDirection)) {
                clickedIndex = i;
                break;
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
}

export default Carousel; 