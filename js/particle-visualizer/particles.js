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
      time: { value: 0 },
      size: { value: this.particleSize },
      
      // Audio-related values that we'll still use for animations
      uFrequencyData: { value: new Float32Array(128).fill(0) },
      uBassFrequency: { value: 0.0 },
      uMidFrequency: { value: 0.0 },
      uHighFrequency: { value: 0.0 },
      uBeat: { value: 0.0 },
      
      // These match the reference shader
      amplitude: { value: 0.8 },
      frequency: { value: 2.0 },
      maxDistance: { value: 1.8 },
      offsetSize: { value: 2.0 },
      offsetGain: { value: 0.5 },
      
      // Colors
      startColor: { value: new THREE.Color(0xff00ff) }, // Magenta
      endColor: { value: new THREE.Color(0x00ffff) },   // Cyan
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
          varying float vDistance;

          uniform float time;
          uniform float offsetSize;
          uniform float size;
          uniform float offsetGain;
          uniform float amplitude;
          uniform float frequency;
          uniform float maxDistance;

          vec3 mod289(vec3 x){
            return x-floor(x*(1./289.))*289.;
          }

          vec2 mod289(vec2 x){
            return x-floor(x*(1./289.))*289.;
          }

          vec3 permute(vec3 x){
            return mod289(((x*34.)+1.)*x);
          }

          float noise(vec2 v) {
            const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);// 1.0 / 41.0
            // First corner
            vec2 i=floor(v+dot(v,C.yy));
            vec2 x0=v-i+dot(i,C.xx);
            
            // Other corners
            vec2 i1;
            //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
            //i1.y = 1.0 - i1.x;
            i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
            // x0 = x0 - 0.0 + 0.0 * C.xx ;
            // x1 = x0 - i1 + 1.0 * C.xx ;
            // x2 = x0 - 1.0 + 2.0 * C.xx ;
            vec4 x12=x0.xyxy+C.xxzz;
            x12.xy-=i1;
            
            // Permutations
            i=mod289(i);// Avoid truncation effects in permutation
            vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))
            +i.x+vec3(0.,i1.x,1.));
            
            vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
            m=m*m;
            m=m*m;
            
            // Gradients: 41 points uniformly over a line, mapped onto a diamond.
            // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
            
            vec3 x=2.*fract(p*C.www)-1.;
            vec3 h=abs(x)-.5;
            vec3 ox=floor(x+.5);
            vec3 a0=x-ox;
            
            // Normalise gradients implicitly by scaling m
            // Approximation of: m *= inversesqrt( a0*a0 + h*h );
            m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
            
            // Compute final noise value at P
            vec3 g;
            g.x=a0.x*x0.x+h.x*x0.y;
            g.yz=a0.yz*x12.xz+h.yz*x12.yw;
            return 130.*dot(m,g);
          }

          vec3 curl(float x,float y,float z) {
            
            float eps=1.,eps2=2.*eps;
            float n1,n2,a,b;
            
            x+=time*.05;
            y+=time*.05;
            z+=time*.05;
            
            vec3 curl=vec3(0.);
            
            n1=noise(vec2(x,y+eps));
            n2=noise(vec2(x,y-eps));
            a=(n1-n2)/eps2;
            
            n1=noise(vec2(x,z+eps));
            n2=noise(vec2(x,z-eps));
            b=(n1-n2)/eps2;
            
            curl.x=a-b;
            
            n1=noise(vec2(y,z+eps));
            n2=noise(vec2(y,z-eps));
            a=(n1-n2)/eps2;
            
            n1=noise(vec2(x+eps,z));
            n2=noise(vec2(x+eps,z));
            b=(n1-n2)/eps2;
            
            curl.y=a-b;
            
            n1=noise(vec2(x+eps,y));
            n2=noise(vec2(x-eps,y));
            a=(n1-n2)/eps2;
            
            n1=noise(vec2(y+eps,z));
            n2=noise(vec2(y-eps,z));
            b=(n1-n2)/eps2;
            
            curl.z=a-b;
            
            return curl;
          }

          void main() {
            vec3 newpos = position;
            vec3 target = position + (normal*.1) + curl(newpos.x * frequency, newpos.y * frequency, newpos.z * frequency) * amplitude;
            
            float d = length(newpos - target) / maxDistance;
            newpos = mix(position, target, pow(d, 4.));
            newpos.z += sin(time) * (.1 * offsetGain);
            
            vec4 mvPosition = modelViewMatrix * vec4(newpos, 1.);
            gl_PointSize = size + (pow(d,3.) * offsetSize) * (1./-mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            
            vDistance = d;
          }
        `;
        
        fragmentShader = `
          varying float vDistance;

          uniform vec3 startColor;
          uniform vec3 endColor;

          float circle(in vec2 _st,in float _radius){
            vec2 dist=_st-vec2(.5);
            return 1.-smoothstep(_radius-(_radius*.01),
            _radius+(_radius*.01),
            dot(dist,dist)*4.);
          }

          void main(){
            float alpha=1.;
            vec2 uv = vec2(gl_PointCoord.x,1.-gl_PointCoord.y);
            vec3 circ = vec3(circle(uv,1.));

            vec3 color=vec3(1.);
            color = mix(startColor,endColor,vDistance);
            gl_FragColor=vec4(color,circ.r * vDistance);
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
      blending: THREE.AdditiveBlending,
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
    
    // After creating each geometry in createShapedGeometry
    if (!this.geometry.getAttribute('normal')) {
      this.geometry.computeVertexNormals();
    }
    
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
    
    // Update time uniform
    const timeIncrement = audioData ? 
      THREE.MathUtils.mapLinear(audioData.low, 0.4, 1, 0.01, 0.05) : 0.02;
    this.uniforms.time.value += THREE.MathUtils.clamp(timeIncrement, 0.01, 0.05);
    
    // Update audio-reactive parameters
    if (audioData) {
      // Store frequencies for other uses
      this.uniforms.uBassFrequency.value = audioData.low * this.reactivityMultiplier;
      this.uniforms.uMidFrequency.value = audioData.mid * this.reactivityMultiplier;
      this.uniforms.uHighFrequency.value = audioData.high * this.reactivityMultiplier;
      
      // Update amplitude based on high frequencies
      this.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(
        audioData.high * this.reactivityMultiplier, 
        0, 0.6, 
        -0.1, 0.3
      );
      
      // Update offset gain based on mid frequencies
      this.uniforms.offsetGain.value = audioData.mid * 0.6 * this.reactivityMultiplier;
      
      // Update frequency based on low frequencies - makes particles move more with bass
      this.uniforms.frequency.value = 2.0 + audioData.low * this.reactivityMultiplier;
    }
    
    // Handle beat detection with enhanced effect
    if (beatDetected) {
      this.uniforms.uBeat.value = 1.8 * this.reactivityMultiplier;
      // Also increase size momentarily on beats
      this.uniforms.size.value += 5.0 * this.reactivityMultiplier;
    } else {
      this.uniforms.uBeat.value *= 0.85; // Quicker decay for sharper beats
      // Return size to base value
      this.uniforms.size.value = Math.max(this.particleSize, 
        this.uniforms.size.value * 0.95);
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