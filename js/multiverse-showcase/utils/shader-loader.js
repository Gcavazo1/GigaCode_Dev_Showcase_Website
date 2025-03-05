/**
 * Shader Loader Utility
 * Handles asynchronous loading of GLSL shader files
 */
class ShaderLoader {
  /**
   * Load a shader file from the given path
   * @param {string} path - Path to the shader file
   * @returns {Promise<string>} - Promise resolving to shader source code
   */
  static async loadShader(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${path}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Shader loading error:', error);
      throw error;
    }
  }

  /**
   * Load a pair of vertex and fragment shaders
   * @param {string} vertPath - Path to vertex shader
   * @param {string} fragPath - Path to fragment shader
   * @returns {Promise<{vertexShader: string, fragmentShader: string}>} - Promise resolving to shader sources
   */
  static async loadShaderPair(vertPath, fragPath) {
    try {
      const [vertexShader, fragmentShader] = await Promise.all([
        this.loadShader(vertPath),
        this.loadShader(fragPath)
      ]);
      return { vertexShader, fragmentShader };
    } catch (error) {
      console.error('Shader pair loading error:', error);
      throw error;
    }
  }

  /**
   * Compile a WebGL shader
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
   * @param {string} source - Shader source code
   * @returns {WebGLShader} - Compiled shader
   */
  static compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }

    return shader;
  }

  /**
   * Create a shader program from vertex and fragment shaders
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {string} vertexSource - Vertex shader source
   * @param {string} fragmentSource - Fragment shader source
   * @returns {WebGLProgram} - Compiled and linked shader program
   */
  static createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Shader program linking failed: ${info}`);
    }

    return program;
  }
}

export default ShaderLoader; 