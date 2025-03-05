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
    this.isHovered = isHovered;
    this.targetWidth = isHovered ? 2.4 : 2.0;
    this.targetHeight = isHovered ? 2.4 : 2.0;
    // Update buffers with new dimensions
    this.updateGeometry();
  }
  
  /**
   * Set expanded state
   * @param {boolean} isExpanded - Whether the window is expanded
   */
  setExpanded(isExpanded) {
    this.isExpanded = isExpanded;
    this.targetWidth = isExpanded ? 4.0 : (this.isHovered ? 2.4 : 2.0);
    this.targetHeight = isExpanded ? 3.0 : (this.isHovered ? 2.4 : 2.0);
    // Update buffers with new dimensions
    this.updateGeometry();
    
    // This might be overriding your CSS
    const element = document.getElementById(this.id);
    if (element) {
      element.style.width = isExpanded ? '800px' : '400px';
      element.style.height = isExpanded ? '600px' : '400px';
      // ...
    }
  }
  
  /**
   * Check if a ray intersects with this window
   * @param {Object} rayOrigin - Ray origin point
   * @param {Object} rayDirection - Ray direction vector
   * @returns {boolean} - Whether the ray intersects with this window
   */
  intersectsRay(rayOrigin, rayDirection) {
    // Simple plane intersection test
    const planeNormal = { x: 0, y: 0, z: 1 };
    const planePoint = this.position;
    
    const denom = rayDirection.x * planeNormal.x + 
                  rayDirection.y * planeNormal.y + 
                  rayDirection.z * planeNormal.z;
    
    if (Math.abs(denom) > 0.0001) {
      const t = ((planePoint.x - rayOrigin.x) * planeNormal.x +
                (planePoint.y - rayOrigin.y) * planeNormal.y +
                (planePoint.z - rayOrigin.z) * planeNormal.z) / denom;
      
      if (t >= 0) {
        const hitPoint = {
          x: rayOrigin.x + rayDirection.x * t,
          y: rayOrigin.y + rayDirection.y * t,
          z: rayOrigin.z + rayDirection.z * t
        };
        
        // Check if hit point is within window bounds using width and height
        const dx = hitPoint.x - this.position.x;
        const dy = hitPoint.y - this.position.y;
        
        return Math.abs(dx) <= this.width/2 && Math.abs(dy) <= this.height/2;
      }
    }
    
    return false;
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
}

export default ShaderWindow; 