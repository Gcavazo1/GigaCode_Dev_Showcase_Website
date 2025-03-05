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
        
        // Create new windows
        const windowPromises = [];
        
        for (let i = 0; i < this.shaderConfigs.length; i++) {
            const config = this.shaderConfigs[i];
            
            try {
                const window = new ShaderWindow({
                    gl: this.gl,
                    vertexShaderPath: config.vertexShaderPath,
                    fragmentShaderPath: config.fragmentShaderPath,
                    title: config.title,
                    description: config.description
                });
                
                // Position window in a circle
                const angle = (i / this.shaderConfigs.length) * Math.PI * 2;
                window.position = {
                    x: Math.cos(angle) * this.radius,
                    y: 0,
                    z: Math.sin(angle) * this.radius
                };
                
                this.windows.push(window);
                
                // Add a promise to track when this window is ready
                const windowPromise = new Promise(resolve => {
                    const checkReady = () => {
                        if (window.isReady) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
                
                windowPromises.push(windowPromise);
            } catch (error) {
                console.error(`Error creating window ${i}:`, error);
            }
        }
        
        // Wait for all windows to be ready (but with a timeout)
        const timeout = new Promise(resolve => setTimeout(resolve, 10000)); // 10-second timeout
        await Promise.race([Promise.all(windowPromises), timeout]);
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
            // Don't animate if not initialized
            setTimeout(() => this.animate(), 100);
            return;
        }

        // Calculate delta time
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Update rotation
        const rotationSpeed = 0.002;
        this.rotationAngle += (this.targetRotationAngle - this.rotationAngle) * rotationSpeed * deltaTime;
        
        // Render scene
        this.render(timestamp);
        
        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
    }
    
    /**
     * Render the carousel
     * @param {number} timestamp - Current timestamp
     */
    render(timestamp) {
        const gl = this.gl;
        
        // If still loading, update the loading screen
        if (this.isLoading) {
            // Just clear the background
            gl.clearColor(0.05, 0.05, 0.1, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            return;
        }
        
        // Clear the canvas
        gl.clearColor(0.05, 0.05, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Calculate time for shaders
        const time = (timestamp - this.loadingStartTime) / 1000.0;
        
        // Update view matrix
        mat4.identity(this.viewMatrix);
        mat4.lookAt(this.viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotationAngle);
        
        // Render all windows
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