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
   * @param {string} options.title - Title of the shader effect
   * @param {string} options.description - Description of the shader effect
   */
  constructor(options) {
    this.gl = options.gl;
    this.vertexShaderPath = options.vertexShaderPath;
    this.fragmentShaderPath = options.fragmentShaderPath;
    this.title = options.title;
    this.description = options.description;
    
    // State
    this.program = null;
    this.isHovered = false;
    this.isExpanded = false;
    this.scale = 1.0;
    this.targetScale = 1.0;
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
    
    // Buffers
    this.positionBuffer = null;
    this.texCoordBuffer = null;
    this.indexBuffer = null;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the shader window
   */
  async init() {
    try {
      // Load shaders
      const { vertexShader, fragmentShader } = await ShaderLoader.loadShaderPair(
        this.vertexShaderPath,
        this.fragmentShaderPath
      );
      
      // Create shader program
      this.program = ShaderLoader.createProgram(this.gl, vertexShader, fragmentShader);
      
      // Create buffers
      this.createBuffers();
      
      // Get attribute and uniform locations
      this.getAttributeAndUniformLocations();
      
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
    
    // Create a plane geometry
    const positions = [
      // Front face
      -1.0, -1.0,  0.0,
       1.0, -1.0,  0.0,
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
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
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Texture coordinate buffer
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    
    // Index buffer
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }
  
  /**
   * Get attribute and uniform locations
   */
  getAttributeAndUniformLocations() {
    const gl = this.gl;
    
    this.attributes = {
      position: gl.getAttribLocation(this.program, 'aPosition'),
      texCoord: gl.getAttribLocation(this.program, 'aTexCoord'),
    };
    
    this.uniforms = {
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
    // Smooth scale transition for hover effect
    const scaleDelta = this.targetScale - this.scale;
    if (Math.abs(scaleDelta) > 0.001) {
      this.scale += scaleDelta * 5 * deltaTime;
    } else {
      this.scale = this.targetScale;
    }
    
    // Update rotation based on hover state
    if (this.isHovered && !this.isExpanded) {
      this.rotation.y += deltaTime * 0.2;
    }
  }
  
  /**
   * Render the shader window
   * @param {Object} viewMatrix - The view matrix
   * @param {Object} projectionMatrix - The projection matrix
   * @param {number} time - Current time in seconds
   */
  render(viewMatrix, projectionMatrix, time) {
    const gl = this.gl;
    
    // Use shader program
    gl.useProgram(this.program);
    
    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(this.attributes.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attributes.position);
    
    // Bind texture coordinate buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(this.attributes.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.attributes.texCoord);
    
    // Bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    // Calculate model view matrix
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, viewMatrix, [this.position.x, this.position.y, this.position.z]);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, this.rotation.x);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, this.rotation.y);
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, this.rotation.z);
    mat4.scale(modelViewMatrix, modelViewMatrix, [this.scale, this.scale, this.scale]);
    
    // Set uniforms
    gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelViewMatrix);
    gl.uniform1f(this.uniforms.time, time);
    gl.uniform2f(this.uniforms.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.uniforms.intensity, this.isHovered ? 1.0 : 0.5);
    
    // Draw elements
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  
  /**
   * Set hover state
   * @param {boolean} isHovered - Whether the window is hovered
   */
  setHover(isHovered) {
    this.isHovered = isHovered;
    this.targetScale = isHovered ? 1.2 : 1.0;
  }
  
  /**
   * Set expanded state
   * @param {boolean} isExpanded - Whether the window is expanded
   */
  setExpanded(isExpanded) {
    this.isExpanded = isExpanded;
    this.targetScale = isExpanded ? 2.0 : (this.isHovered ? 1.2 : 1.0);
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
        
        // Check if hit point is within window bounds
        const dx = hitPoint.x - this.position.x;
        const dy = hitPoint.y - this.position.y;
        
        return Math.abs(dx) <= this.scale && Math.abs(dy) <= this.scale;
      }
    }
    
    return false;
  }
}

export default ShaderWindow; 