import ShaderLoader from '../utils/shader-loader.js';

/**
 * ShaderWindow class
 * Manages an individual window/tile in the 3D carousel
 */
class ShaderWindow {
  /**
   * Create a new shader window
   * @param {Object} options - Configuration options
   * @param {WebGLRenderingContext} options.gl - WebGL context
   * @param {string} options.vertexShaderPath - Path to vertex shader
   * @param {string} options.fragmentShaderPath - Path to fragment shader
   * @param {string} options.title - Window title
   * @param {string} options.description - Window description
   */
  constructor(options) {
    this.gl = options.gl;
    this.vertexShaderPath = options.vertexShaderPath;
    this.fragmentShaderPath = options.fragmentShaderPath;
    this.title = options.title || 'Shader Effect';
    this.description = options.description || 'A GLSL shader effect';
    
    // Initialize properties
    this.program = null;
    this.buffers = {};
    this.uniforms = {
      attributes: {},
      uniforms: {}
    };
    this.position = { x: 0, y: 0, z: 0 }; // Initialize position
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = 1.0;  // Keep scale for compatibility
    this.isExpanded = false;
    this.isReady = false;
    this.startTime = performance.now();
    
    // Add width and height properties
    this.width = 2.4;  // Width in WebGL units
    this.height = 3.6; // Height in WebGL units
    
    // Animation properties
    this.targetRotation = { x: 0, y: 0, z: 0 };
    this.initialRotation = { x: 0, y: 0, z: 0 };
    this.animationProgress = 0;
    this.isAnimating = false;
    this.animationDuration = 2500; // ms
    this.animationStartTime = 0;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the shader window
   */
  async init() {
    try {
      // Load and compile shaders
      const { vertexShader, fragmentShader } = await ShaderLoader.loadAndCompileShaderPair(
        this.gl,
        this.vertexShaderPath,
        this.fragmentShaderPath
      );
      
      // Create shader program
      this.program = ShaderLoader.createProgram(this.gl, vertexShader, fragmentShader);
      
      // Create buffers
      this.createBuffers();
      
      // Get attribute and uniform locations
      this.getAttributeAndUniformLocations();
      
      // Mark as ready
      this.isReady = true;
      
      console.log(`Shader window initialized: ${this.title}`);
    } catch (error) {
      console.error('Failed to initialize shader window:', error);
    }
  }
  
  /**
   * Create vertex buffers for the window
   */
  createBuffers() {
    const gl = this.gl;
    
    // Use width and height to create rectangle
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    const positions = [
      // Front face - rectangle with specified dimensions
      -halfWidth, -halfHeight, 0.0,
       halfWidth, -halfHeight, 0.0,
       halfWidth,  halfHeight, 0.0,
      -halfWidth,  halfHeight, 0.0,
    ];
    
    const texCoords = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    
    const indices = [
        0, 1, 2,
        0, 2, 3,
    ];
    
    // Position buffer
    this.buffers.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Texture coordinate buffer
    this.buffers.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    
    // Index buffer
    this.buffers.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }
  
  /**
   * Get attribute and uniform locations
   */
  getAttributeAndUniformLocations() {
    const gl = this.gl;
    
    this.uniforms.attributes = {
      position: gl.getAttribLocation(this.program, 'aPosition'),
      texCoord: gl.getAttribLocation(this.program, 'aTexCoord'),
    };
    
    this.uniforms.uniforms = {
      projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
      time: gl.getUniformLocation(this.program, 'uTime'),
      resolution: gl.getUniformLocation(this.program, 'uResolution'),
      intensity: gl.getUniformLocation(this.program, 'uIntensity'),
    };
  }
  
  /**
   * Update the shader window state
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Animate width and height
    const ease = 0.1;
    
    if (this.targetWidth !== undefined && this.targetHeight !== undefined) {
      this.width += (this.targetWidth - this.width) * ease;
      this.height += (this.targetHeight - this.height) * ease;
      
      // Update geometry if dimensions changed significantly
      if (Math.abs(this.width - this.targetWidth) > 0.01 || 
          Math.abs(this.height - this.targetHeight) > 0.01) {
        this.updateGeometry();
      }
    }
    
    // Handle flip animation
    if (this.isAnimating) {
      const currentTime = performance.now();
      const elapsed = currentTime - this.animationStartTime;
      this.animationProgress = Math.min(elapsed / this.animationDuration, 1.0);
      
      // Use easing function for smoother animation
      const easeProgress = this.easeInOutCubic(this.animationProgress);
      
      if (this.isExpanded) {
        // Animating to expanded state
        // Flip 360 degrees on Y axis
        this.rotation.y = this.initialRotation.y + easeProgress * Math.PI * 2;
        
        // Zoom out then in effect
        const zoomFactor = 1.0 + Math.sin(easeProgress * Math.PI) * 0.5;
        this.scale = zoomFactor;
        
        // Move forward slightly
        this.position.z = this.initialPosition.z + easeProgress * 2.0;
      } else {
        // Animating back to normal state
        // Flip 360 degrees on Y axis in reverse
        this.rotation.y = this.initialRotation.y + (1 - easeProgress) * Math.PI * 2;
        
        // Zoom in then out effect
        const zoomFactor = 1.0 + Math.sin((1 - easeProgress) * Math.PI) * 0.5;
        this.scale = zoomFactor;
        
        // Move back to original position
        this.position.z = this.initialPosition.z + (1 - easeProgress) * 2.0;
      }
      
      // Animation complete
      if (this.animationProgress >= 1.0) {
        this.isAnimating = false;
        this.rotation.y = this.initialRotation.y; // Reset to initial rotation
        this.scale = this.isExpanded ? 2.0 : 1.0; // Set final scale
        this.position.z = this.initialPosition.z; // Reset position
      }
    }
  }
  
  /**
   * Render the shader window
   * @param {Object} viewMatrix - The view matrix
   * @param {Object} projectionMatrix - The projection matrix
   * @param {number} time - Current time in seconds
   */
  render(viewMatrix, projectionMatrix, time) {
    // Skip rendering if not ready
    if (!this.isReady || !this.program) {
      return;
    }
    
    const gl = this.gl;
    
    // Use shader program
    gl.useProgram(this.program);
    
    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
    gl.vertexAttribPointer(this.uniforms.attributes.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.uniforms.attributes.position);
    
    // Bind texture coordinate buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texCoordBuffer);
    gl.vertexAttribPointer(this.uniforms.attributes.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.uniforms.attributes.texCoord);
    
    // Bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
    
    // Calculate model view matrix
    const modelViewMatrix = mat4.create();
    
    // Make sure position is defined before using it
    if (viewMatrix && this.position) {
      mat4.translate(modelViewMatrix, viewMatrix, [this.position.x, this.position.y, this.position.z]);
      mat4.rotateX(modelViewMatrix, modelViewMatrix, this.rotation.x);
      mat4.rotateY(modelViewMatrix, modelViewMatrix, this.rotation.y);
      mat4.rotateZ(modelViewMatrix, modelViewMatrix, this.rotation.z);
      
      // Apply scale - now using this.scale which is animated
      mat4.scale(modelViewMatrix, modelViewMatrix, [this.scale, this.scale, this.scale]);
    } else {
      // Use identity matrix if position or viewMatrix is undefined
      mat4.identity(modelViewMatrix);
    }
    
    // Set uniforms
    gl.uniformMatrix4fv(this.uniforms.uniforms.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(this.uniforms.uniforms.modelViewMatrix, false, modelViewMatrix);
    gl.uniform1f(this.uniforms.uniforms.time, time);
    gl.uniform2f(this.uniforms.uniforms.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.uniforms.uniforms.intensity, this.isHovered ? 1.0 : 0.5);
    
    // Draw elements
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  
  /**
   * Set hover state
   * @param {boolean} isHovered - Whether the window is hovered
   */
  setHover(isHovered) {
    // Keep track of hover state but don't change appearance
    this.isHovered = isHovered;
    // Don't change size on hover
    // this.targetWidth = isHovered && !this.isExpanded ? 2.4 : 2.0;
    // this.targetHeight = isHovered && !this.isExpanded ? 2.4 : 2.0;
  }
  
  /**
   * Set expanded state
   * @param {boolean} isExpanded - Whether the window is expanded
   */
  setExpanded(isExpanded) {
    // Don't do anything if state hasn't changed
    if (this.isExpanded === isExpanded) return;
    
    this.isExpanded = isExpanded;
    
    // Set target dimensions - always return to 2.4 when not expanded
    this.targetWidth = isExpanded ? 4.0 : 2.4;  // Always return to 2.4 width
    this.targetHeight = isExpanded ? 3.0 : 3.6; // Always return to 3.6 height
    
    // Start animation
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animationProgress = 0;
    
    // Store initial state
    this.initialRotation = { ...this.rotation };
    this.initialPosition = { ...this.position };
    
    // Update geometry
    this.updateGeometry();
  }
  
  /**
   * Check if a ray intersects with this window
   * @param {Object} rayOrigin - Ray origin point
   * @param {Object} rayDirection - Ray direction vector
   * @returns {boolean} - Whether the ray intersects with this window
   */
  intersectsRay(rayOrigin, rayDirection) {
    // Get the window's normal vector considering its rotation
    const normal = {
        x: Math.sin(this.rotation.y),
        y: Math.sin(this.rotation.x),
        z: Math.cos(this.rotation.y)
    };
    
    // Normalize the normal vector
    const normalLength = Math.sqrt(
        normal.x * normal.x + 
        normal.y * normal.y + 
        normal.z * normal.z
    );
    normal.x /= normalLength;
    normal.y /= normalLength;
    normal.z /= normalLength;
    
    // Calculate intersection with window plane
    const denom = (
        rayDirection.x * normal.x +
        rayDirection.y * normal.y +
        rayDirection.z * normal.z
    );
    
    // Check if ray is parallel to plane
    if (Math.abs(denom) < 0.001) return false;
    
    // Calculate distance to intersection
    const t = (
        (this.position.x - rayOrigin.x) * normal.x +
        (this.position.y - rayOrigin.y) * normal.y +
        (this.position.z - rayOrigin.z) * normal.z
    ) / denom;
    
    // Check if intersection is behind the ray
    if (t < 0) return false;
    
    // Calculate intersection point
    const hitPoint = {
        x: rayOrigin.x + rayDirection.x * t,
        y: rayOrigin.y + rayDirection.y * t,
        z: rayOrigin.z + rayDirection.z * t
    };
    
    // Transform hit point to window's local space
    const localX = (
        (hitPoint.x - this.position.x) * Math.cos(-this.rotation.y) -
        (hitPoint.z - this.position.z) * Math.sin(-this.rotation.y)
    );
    const localY = hitPoint.y - this.position.y;
    
    // Add a small margin to make selection easier (10% larger hit box)
    const margin = 1.1;
    const halfWidth = (this.width * this.scale * margin) / 2;
    const halfHeight = (this.height * this.scale * margin) / 2;
    
    // Check if hit point is within window bounds
    return (
        Math.abs(localX) <= halfWidth &&
        Math.abs(localY) <= halfHeight
    );
  }
  
  // Add a method to update geometry with new dimensions
  updateGeometry() {
    const gl = this.gl;
    
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    const positions = [
      -halfWidth, -halfHeight, 0.0,
       halfWidth, -halfHeight, 0.0,
       halfWidth,  halfHeight, 0.0,
      -halfWidth,  halfHeight, 0.0,
    ];
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  }
  
  // Add easing function
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

export default ShaderWindow; 