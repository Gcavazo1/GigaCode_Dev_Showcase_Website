import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Try a more relative path approach
const vertexShaderPath = '/GigaCode_Dev_Showcase_Website/js/particle-visualizer/shaders/particle-vertex.glsl';
const fragmentShaderPath = '/GigaCode_Dev_Showcase_Website/js/particle-visualizer/shaders/particle-fragment.glsl';

class ParticleSystem {
  constructor() {
    this.particleCount = 15000;
    this.particleSize = 2.0;
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
    try {
      // Skip file loading and use our hardcoded shaders directly
      console.log('[ParticleSystem] Using reference shader implementation');
      this.createMaterialWithReferenceShaders();
      return true;
    } catch (error) {
      console.error('[ParticleSystem] Error loading shaders:', error);
      return false;
    }
  }

  createMaterialWithReferenceShaders() {
    // Use the exact vertex shader from the reference
    vertexShader = `
    varying float vDistance;

    uniform float time;
    uniform float offsetSize;
    uniform float size;
    uniform float offsetGain;
    uniform float amplitude;
    uniform float frequency;
    uniform float maxDistance;
    
    // Add our attributes
    attribute float aScale;
    attribute vec3 aRandomness;

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
      // Add randomness to position
      newpos += aRandomness * 0.1;
      
      vec3 target = position + (normal*.1) + curl(newpos.x * frequency, newpos.y * frequency, newpos.z * frequency) * amplitude;
      
      float d = length(newpos - target) / maxDistance;
      newpos = mix(position, target, pow(d, 4.));
      newpos.z += sin(time) * (.1 * offsetGain);
      
      vec4 mvPosition = modelViewMatrix * vec4(newpos, 1.);
      gl_PointSize = (size + (pow(d,3.) * offsetSize)) * (1./-mvPosition.z) * aScale; // Apply scale attribute
      gl_Position = projectionMatrix * mvPosition;
      
      vDistance = d;
    }
    `;

    // Use the exact fragment shader from the reference
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

      vec3 color = mix(startColor,endColor,vDistance);
      gl_FragColor=vec4(color,circ.r * vDistance);
    }
    `;

    this.createMaterial(vertexShader, fragmentShader);
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
    
    // Always increment time
    this.uniforms.time.value += 0.1;
    
    // Set reference base values to ensure they exist
    this.uniforms.size.value = Math.max(this.uniforms.size.value, 2.0);
    this.uniforms.frequency.value = 2.0;
    this.uniforms.amplitude.value = 0.8;
    this.uniforms.offsetGain.value = 0.5;
    this.uniforms.maxDistance.value = 1.8;
    this.uniforms.offsetSize.value = 2.0;
    
    // Much more dramatic audio reactivity
    if (audioData) {
      console.log("Audio data:", audioData.low, audioData.mid, audioData.high);
      
      // More dramatic effects with higher multipliers
      this.uniforms.frequency.value = 2.0 + (audioData.low * 8.0 * this.reactivityMultiplier);
      this.uniforms.amplitude.value = 0.8 + (audioData.high * 6.0 * this.reactivityMultiplier);
      this.uniforms.offsetGain.value = 0.5 + (audioData.mid * 8.0 * this.reactivityMultiplier);
    }
    
    // Pulse size dramatically on beats
    if (beatDetected) {
      console.log("BEAT DETECTED - applying size boost");
      this.uniforms.size.value += 8.0 * this.reactivityMultiplier;
    } else {
      // Gradually return to base size
      this.uniforms.size.value = Math.max(2.0, 
        this.uniforms.size.value * 0.9);
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