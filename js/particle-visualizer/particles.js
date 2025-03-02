import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Try a more relative path approach
const vertexShaderPath = '/GigaCode_Dev_Showcase_Website/js/particle-visualizer/shaders/particle-vertex.glsl';
const fragmentShaderPath = '/GigaCode_Dev_Showcase_Website/js/particle-visualizer/shaders/particle-fragment.glsl';

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
    this.reactivityMultiplier = 1.0; // Default reactivity level
    
    // Shader uniforms
    this.uniforms = {
      uTime: { value: 0 },
      uSize: { value: this.particleSize },
      uColor: { value: new THREE.Color(0x08f7fe) },
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
      startColor: { value: new THREE.Color(0x0a2463) },
      endColor: { value: new THREE.Color(0x00ff99) },
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
          uniform float uBeat;
          
          attribute float aScale;
          
          varying vec3 vPosition;
          varying float vScale;
          
          void main() {
            vec3 pos = position;
            
            // Add audio-reactive movement
            float bassEffect = uBassFrequency * 0.5;
            float beatEffect = uBeat * 0.3;
            
            // More dynamic movement with audio reactivity
            pos.x += sin(uTime * 0.2 + pos.z * 0.5) * (0.2 + bassEffect);
            pos.y += cos(uTime * 0.2 + pos.x * 0.5) * (0.2 + uMidFrequency * 0.5);
            pos.z += sin(uTime * 0.2 + pos.y * 0.5) * (0.2 + uHighFrequency * 0.5);
            
            // Add pulse effect on beats
            pos *= 1.0 + beatEffect * aScale;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size based on audio - more dramatic effect
            float size = uSize * (0.2 + uMidFrequency * 1.5 + uBeat) * aScale;
            gl_PointSize = size * (1.0 / -mvPosition.z);
            
            vPosition = position;
            vScale = aScale;
          }
        `;
        
        fragmentShader = `
          uniform vec3 uColor;
          uniform float uBassFrequency;
          uniform float uMidFrequency;
          uniform float uHighFrequency;
          
          varying vec3 vPosition;
          varying float vScale;
          
          void main() {
            // Create soft circle
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center) * 2.0;
            float circle = 1.0 - smoothstep(0.0, 1.0, dist);
            
            // More dramatic color changes with audio
            vec3 color = uColor;
            color.r += uHighFrequency * 0.8;
            color.g += uMidFrequency * 0.5;
            color.b += uBassFrequency * 0.8;
            
            // Add vScale influence for more variety
            float alpha = circle * (0.5 + vScale * 0.5) * (0.7 + uMidFrequency * 0.3);
            
            gl_FragColor = vec4(color, alpha);
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

  createShapedGeometry(shape = 'sphere') {
    if (this.geometry) {
      this.geometry.dispose(); // Clean up old geometry
    }
    
    // Create geometry based on shape
    switch(shape) {
      case 'cube':
        // Use BoxGeometry with segments for better particle distribution
        const boxSize = 8;
        this.geometry = new THREE.BoxGeometry(
          boxSize, boxSize, boxSize,
          15, 15, 15 // Width, height, depth segments
        );
        break;
        
      case 'plane':
        // Use PlaneGeometry with many segments
        const planeSize = 15;
        this.geometry = new THREE.PlaneGeometry(
          planeSize, planeSize,
          30, 30 // Width and height segments
        );
        break;
        
      case 'ring':
        // Use TorusGeometry (ring shape)
        this.geometry = new THREE.TorusGeometry(
          8, // radius
          0.5, // tube radius
          16, // radial segments
          100 // tubular segments
        );
        break;
        
      case 'sphere':
      default:
        // Use SphereGeometry with many segments
        this.geometry = new THREE.SphereGeometry(
          5, // radius
          32, // width segments
          32 // height segments
        );
        break;
        
      case 'star':
        // Create a 3D star shape
        const starGeometry = new THREE.BufferGeometry();
        const vertices = [];
        
        // Parameters for the star
        const innerRadius = 2.5;
        const outerRadius = 7;
        const numPoints = 10;
        const heightVariation = 3;
        
        // Create the star points
        for (let i = 0; i < numPoints * 2; i++) {
          const angle = (Math.PI * 2 * i) / (numPoints * 2);
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          
          // x and z form the star shape in the horizontal plane
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          // Add some randomness to y to create 3D effect
          const y = (Math.random() - 0.5) * heightVariation;
          
          vertices.push(x, y, z);
        }
        
        // Add some particles in the center to fill it out
        for (let i = 0; i < 500; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * innerRadius;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (Math.random() - 0.5) * heightVariation * 0.5;
          
          vertices.push(x, y, z);
        }
        
        // Create position attribute from vertices
        const positionAttribute = new THREE.Float32BufferAttribute(vertices, 3);
        starGeometry.setAttribute('position', positionAttribute);
        
        this.geometry = starGeometry;
        break;
    }
    
    // Add randomness attribute for animation
    const positionAttribute = this.geometry.getAttribute('position');
    const particleCount = positionAttribute.count;
    
    // Create arrays for additional attributes
    this.scales = new Float32Array(particleCount);
    this.randomness = new Float32Array(particleCount * 3);
    
    // Generate randomness and scale values
    for (let i = 0; i < particleCount; i++) {
      // Create randomness for animation variation
      this.randomness[i * 3] = (Math.random() * 2 - 1) * 0.3;
      this.randomness[i * 3 + 1] = (Math.random() * 2 - 1) * 0.3;
      this.randomness[i * 3 + 2] = (Math.random() * 2 - 1) * 0.3;
      
      // Create scale variation (size)
      this.scales[i] = 0.5 + Math.random() * 0.5;
    }
    
    // Add attributes to geometry
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(this.randomness, 3));
    
    return this.geometry;
  }

  createGeometry() {
    this.createShapedGeometry('sphere'); // Default shape
  }

  create() {
    if (!this.geometry) {
      this.createGeometry();
    }
    
    if (this.points) {
      // If points already exist, just update the geometry
      this.points.geometry.dispose();
      this.points.geometry = this.geometry;
      return this.points;
    } else {
      // Create new points
      this.points = new THREE.Points(this.geometry, this.material);
      return this.points;
    }
  }

  update(time, audioData, beatDetected) {
    if (!this.material) return;
    
    // Update time uniform - make it responsive to low frequencies like in reference
    const timeIncrement = audioData ? 
      THREE.MathUtils.mapLinear(audioData.low, 0.4, 1, 0.01, 0.05) : 0.02;
    this.uniforms.uTime.value += THREE.MathUtils.clamp(timeIncrement, 0.01, 0.05);
    
    // Update audio data uniforms with enhanced mapping
    if (audioData) {
      // Map frequencies to visual parameters more deliberately
      this.uniforms.uBassFrequency.value = audioData.low * this.reactivityMultiplier;
      this.uniforms.uMidFrequency.value = audioData.mid * this.reactivityMultiplier;
      this.uniforms.uHighFrequency.value = audioData.high * this.reactivityMultiplier;
      
      // Use high frequencies for amplitude like in reference
      this.uniforms.uAmplitude.value = 0.8 + THREE.MathUtils.mapLinear(
        audioData.high * this.reactivityMultiplier, 
        0, 0.6, 
        -0.1, 0.3
      );
      
      // Use mid frequencies for offset gain like in reference
      this.uniforms.uOffsetGain.value = audioData.mid * 0.6 * this.reactivityMultiplier;
    }
    
    // Handle beat detection with enhanced effect
    if (beatDetected) {
      this.uniforms.uBeat.value = 1.8 * this.reactivityMultiplier;
    } else {
      this.uniforms.uBeat.value *= 0.85; // Quicker decay for sharper beats
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