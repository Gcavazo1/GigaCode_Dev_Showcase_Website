/**
 * Shader Loader Utility
 * Handles asynchronous loading of GLSL shader files
 */
class ShaderLoader {
  /**
   * Load and compile a shader
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {string} source - Shader source code
   * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
   * @returns {WebGLShader} Compiled shader
   */
  static compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const errorLog = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Could not compile shader: ${errorLog}`);
    }
    
    return shader;
  }
  
  /**
   * Create a shader program from vertex and fragment shaders
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {WebGLShader} vertexShader - Vertex shader
   * @param {WebGLShader} fragmentShader - Fragment shader
   * @returns {WebGLProgram} Shader program
   */
  static createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const errorLog = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Could not link program: ${errorLog}`);
    }
    
    return program;
  }
  
  /**
   * Load a shader file
   * @param {string} path - Path to shader file
   * @returns {Promise<string>} Shader source code
   */
  static async loadShader(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${path} (${response.status})`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error loading shader (${path}):`, error);
      // Return a simple fallback shader to avoid breaking everything
      if (path.includes('.vert')) {
        return `
          attribute vec4 aPosition;
          attribute vec2 aTexCoord;
          varying vec2 vTexCoord;
          void main() {
            gl_Position = aPosition;
            vTexCoord = aTexCoord;
          }
        `;
      } else {
        return `
          precision mediump float;
          varying vec2 vTexCoord;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // Magenta for error
          }
        `;
      }
    }
  }
  
  /**
   * Load a pair of vertex and fragment shaders
   * @param {string} vertexShaderPath - Path to vertex shader
   * @param {string} fragmentShaderPath - Path to fragment shader
   * @returns {Promise<{vertexShader: string, fragmentShader: string}>} Shader sources
   */
  static async loadShaderPair(vertexShaderPath, fragmentShaderPath) {
    const [vertexSource, fragmentSource] = await Promise.all([
      this.loadShader(vertexShaderPath),
      this.loadShader(fragmentShaderPath)
    ]);
    
    return {
      vertexShader: vertexSource,
      fragmentShader: fragmentSource
    };
  }
}

export default ShaderLoader; 