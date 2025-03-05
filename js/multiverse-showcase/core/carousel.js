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
        
        // Initialize
        this.init();
        
        // Start animation loop only after initialization is complete
        if (this.isInitialized) {
            this.animate();
        }
    }
    
    /**
     * Initialize carousel
     */
    init() {
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
            
            // Set canvas size
            this.resizeCanvas();
            
            // Create shader windows
            this.createWindows();
            
            // Add event listeners
            window.addEventListener('resize', this.resizeCanvas.bind(this));
            this.canvas.addEventListener('click', this.onClick.bind(this));
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Carousel initialization error:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * Create shader windows
     */
    createWindows() {
        // Clear existing windows
        this.windows = [];
        
        // Create new windows
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
            } catch (error) {
                console.error(`Error creating window ${i}:`, error);
            }
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
    }
    
    /**
     * Animation loop
     * @param {number} timestamp - Current timestamp
     */
    animate(timestamp = 0) {
        // Calculate delta time
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;
        this.currentTime = timestamp / 1000;
        
        // Update rotation
        const rotationDelta = this.targetRotationAngle - this.rotationAngle;
        if (Math.abs(rotationDelta) > 0.001) {
            this.rotationAngle += rotationDelta * 3 * deltaTime;
        } else {
            this.rotationAngle = this.targetRotationAngle;
        }
        
        // Update view matrix
        mat4.identity(this.viewMatrix);
        mat4.lookAt(this.viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);
        mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotationAngle);
        
        // Update windows
        for (const window of this.windows) {
            window.update(deltaTime);
        }
        
        // Render
        this.render();
        
        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
    }
    
    /**
     * Render the carousel
     */
    render() {
        const gl = this.gl;
        
        // Clear canvas
        gl.clearColor(0.05, 0.05, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Sort windows by distance (for proper transparency)
        this.windows.sort((a, b) => {
            // Simple distance calculation for sorting
            const aPos = a.position;
            const bPos = b.position;
            
            // Calculate positions after rotation
            const aAngle = Math.atan2(aPos.x, aPos.z) - this.rotationAngle;
            const bAngle = Math.atan2(bPos.x, bPos.z) - this.rotationAngle;
            
            // Use z-component after rotation for depth sorting
            const aZ = Math.cos(aAngle) * Math.sqrt(aPos.x * aPos.x + aPos.z * aPos.z);
            const bZ = Math.cos(bAngle) * Math.sqrt(bPos.x * bPos.x + bPos.z * bPos.z);
            
            return bZ - aZ; // Sort back-to-front
        });
        
        // Render windows
        for (const window of this.windows) {
            window.render(this.viewMatrix, this.projectionMatrix, this.currentTime);
        }
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
}

export default Carousel; 