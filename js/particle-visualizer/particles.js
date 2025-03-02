import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Define shader paths for loading
const vertexShaderPath = './shaders/particle-vertex.glsl';
const fragmentShaderPath = './shaders/particle-fragment.glsl';

class ParticleSystem {
  constructor() {
    this.particleCount = 15000;
    this.particleSize = 30.0;
    this.positions = null;
    this.scales = null;
    this.randomness = null;
    this.geometry = null;
    this.material = null;
    this.points = null;
    
    // Shader uniforms
    this.uniforms = {
      uTime: { value: 0 },
      uSize: { value: this.particleSize },
      uColor: { value: new THREE.Color(0x00ffff) },
      uFrequencyData: { value: new Float32Array(128).fill(0) },
      uBassFrequency: { value: 0.0 },
      uMidFrequency: { value: 0.0 },
      uHighFrequency: { value: 0.0 },
      uBeat: { value: 0.0 },
      uBeatDecay: { value: 0.0 },
      uAmplitude: { value: 1.0 },
      uFrequency: { value: 2.0 },
      uMaxDistance: { value: 1.8 },
      uOffsetSize: { value: 2.0 },
      uOffsetGain: { value: 0.0 },
      startColor: { value: new THREE.Color(0xff00ff) },
      endColor: { value: new THREE.Color(0x00ffff) }
    };
  }

  async load() {
    // Load shader code from files
    try {
      console.log('[Particles] Attempting to load shaders from:', vertexShaderPath, fragmentShaderPath);
      
      let vertexShader, fragmentShader;
      
      try {
        [vertexShader, fragmentShader] = await Promise.all([
          fetch(vertexShaderPath).then(r => {
            if (!r.ok) throw new Error(`Failed to load vertex shader: ${r.status}`);
            return r.text();
          }),
          fetch(fragmentShaderPath).then(r => {
            if (!r.ok) throw new Error(`Failed to load fragment shader: ${r.status}`);
            return r.text();
          })
        ]);
      } catch (fetchError) {
        console.error('Error fetching shader files:', fetchError);
        console.log('[Particles] Using fallback inline shaders');
        
        // Fallback to inline shaders
        vertexShader = `
          uniform float uTime;
          uniform float uSize;
          uniform float uBassFrequency;
          uniform float uMidFrequency;
          uniform float uHighFrequency;
          
          attribute float aScale;
          
          varying vec3 vPosition;
          varying float vScale;
          
          void main() {
            vec3 pos = position;
            
            // Add simple movement
            pos.x += sin(uTime * 0.2 + pos.z * 0.5) * 0.2;
            pos.y += cos(uTime * 0.2 + pos.x * 0.5) * 0.2;
            pos.z += sin(uTime * 0.2 + pos.y * 0.5) * 0.2;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size based on audio
            float size = uSize * (0.5 + uMidFrequency * 0.8) * aScale;
            gl_PointSize = size * (1.0 / -mvPosition.z);
            
            vPosition = position;
            vScale = aScale;
          }
        `;
        
        fragmentShader = `
          uniform vec3 uColor;
          uniform float uBassFrequency;
          
          varying vec3 vPosition;
          varying float vScale;
          
          void main() {
            // Create soft circle
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center) * 2.0;
            float circle = 1.0 - smoothstep(0.0, 1.0, dist);
            
            // Base color
            vec3 color = uColor;
            color.b += uBassFrequency * 0.8;
            
            gl_FragColor = vec4(color, circle * 0.8);
          }
        `;
      }
      
      this.createMaterial(vertexShader, fragmentShader);
      console.log('[Particles] Shader loading status: Success');
      return true;
    } catch (error) {
      console.error('Error in shader processing:', error);
      return false;
    }
  }

  createMaterial(vertexShader, fragmentShader) {
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  createGeometry() {
    this.geometry = new THREE.BufferGeometry();
    
    // Positions - random in a sphere
    this.positions = new Float32Array(this.particleCount * 3);
    this.scales = new Float32Array(this.particleCount);
    this.randomness = new Float32Array(this.particleCount * 3);
    
    console.log('[Particles] Creating geometry with', this.particleCount, 'particles');
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Position - random in a sphere
      const radius = Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      this.positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = radius * Math.cos(phi);
      
      // Randomness for animation variation
      this.randomness[i3] = Math.random() * 2 - 1;
      this.randomness[i3 + 1] = Math.random() * 2 - 1;
      this.randomness[i3 + 2] = Math.random() * 2 - 1;
      
      // Scale (size variation)
      this.scales[i] = Math.random();
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(this.randomness, 3));
  }

  create() {
    this.createGeometry();
    this.points = new THREE.Points(this.geometry, this.material);
    return this.points;
  }

  update(time, audioData, beatDetected) {
    if (!this.material) return;
    
    // Update time uniform
    this.uniforms.uTime.value = time;
    
    // Update audio data uniforms
    if (audioData) {
      this.uniforms.uBassFrequency.value = audioData.low;
      this.uniforms.uMidFrequency.value = audioData.mid;
      this.uniforms.uHighFrequency.value = audioData.high;
      
      // Update amplitude based on audio
      this.uniforms.uAmplitude.value = 0.8 + audioData.mid * 0.5;
      
      // Update offset gain based on mid frequencies
      this.uniforms.uOffsetGain.value = audioData.mid * 0.6;
    }
    
    // Handle beat detection
    if (beatDetected) {
      this.uniforms.uBeat.value = 1.0;
    } else {
      // Gradually decrease beat value
      this.uniforms.uBeat.value *= 0.95;
    }
  }

  resize(width, height) {
    // Handle resize if needed
    if (this.points) {
      // You could update any size-dependent properties here
    }
  }
}

export default ParticleSystem; 