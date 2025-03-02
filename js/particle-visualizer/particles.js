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
          uniform float uAmplitude;
          uniform float uFrequency;
          uniform float uMaxDistance;
          
          attribute float aScale;
          attribute vec3 aRandomness;
          
          varying vec3 vPosition;
          varying float vScale;
          varying float vDistance;
          
          void main() {
            vec3 pos = position;
            
            // Add audio-reactive movement using curl noise-inspired patterns
            float bassEffect = uBassFrequency * 0.7;
            float beatEffect = uBeat * 0.4;
            
            // Apply randomness and audio-reactive displacement
            pos.x += sin(uTime * 0.2 + pos.z * 0.5) * (0.3 + bassEffect) + aRandomness.x * uAmplitude;
            pos.y += cos(uTime * 0.3 + pos.x * 0.5) * (0.3 + uMidFrequency * 0.6) + aRandomness.y * uAmplitude;
            pos.z += sin(uTime * 0.4 + pos.y * 0.5) * (0.3 + uHighFrequency * 0.6) + aRandomness.z * uAmplitude;
            
            // Add pulse effect on beats
            pos *= 1.0 + beatEffect * aScale;
            
            // Calculate distance for color gradient (like in the reference)
            float distance = length(pos - position) / uMaxDistance;
            vDistance = clamp(distance, 0.0, 1.0);
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size based on audio - more dramatic effect
            float size = uSize * (0.3 + uMidFrequency * 1.5 + uBeat * 0.5) * aScale;
            gl_PointSize = size * (1.0 / -mvPosition.z);
            
            vPosition = position;
            vScale = aScale;
          }
        `;
        
        fragmentShader = `
          uniform vec3 startColor;
          uniform vec3 endColor;
          uniform float uBassFrequency;
          uniform float uMidFrequency;
          uniform float uHighFrequency;
          
          varying vec3 vPosition;
          varying float vDistance;
          varying float vScale;
          
          float circle(in vec2 _st, in float _radius) {
            vec2 dist = _st - vec2(0.5);
            return 1.0 - smoothstep(_radius - (_radius * 0.01),
                                   _radius + (_radius * 0.01),
                                   dot(dist, dist) * 4.0);
          }
          
          void main() {
            // Create soft circle with feathered edge
            vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
            float circ = circle(uv, 1.0);
            
            // Clear color interpolation based on distance
            vec3 color = mix(startColor, endColor, vDistance);
            
            // Apply subtle audio reactivity
            color += vec3(
              uHighFrequency * 0.2,
              uMidFrequency * 0.2,
              uBassFrequency * 0.2
            );
            
            // Distance-based alpha with strong falloff at edges
            float alpha = circ * (vDistance * 0.6 + 0.4);
            
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
        // Use higher segment counts for cube
        const widthSegments = Math.floor(THREE.MathUtils.randInt(15, 25));
        const heightSegments = Math.floor(THREE.MathUtils.randInt(15, 35)); 
        const depthSegments = Math.floor(THREE.MathUtils.randInt(15, 35));
        
        this.geometry = new THREE.BoxGeometry(
          8, // width
          8, // height
          8, // depth
          widthSegments,
          heightSegments,
          depthSegments
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
        
      case 'cylinder':
        // Match the reference's high segment counts for cylinder
        const radialSegments = 92; // Higher count for smoother cylinder
        const cylinderHeightSegments = 180; // Renamed to avoid conflict
        this.geometry = new THREE.CylinderGeometry(
          5, // radius top
          5, // radius bottom
          10, // height
          radialSegments,
          cylinderHeightSegments, // Use renamed variable
          true // open-ended
        );
        // Important: rotate cylinder to match reference
        const cylinder = new THREE.Mesh(this.geometry);
        cylinder.rotation.set(Math.PI / 2, 0, 0);
        cylinder.updateMatrix();
        this.geometry.applyMatrix4(cylinder.matrix);
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