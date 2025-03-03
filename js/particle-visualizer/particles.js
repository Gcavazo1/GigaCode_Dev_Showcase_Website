import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

class ParticleSystem {
  constructor() {
    this.name = 'ParticleSystem';
    this.time = 0;
    this.reactivityMultiplier = 0.5;
    this.currentShape = 'torusKnot';
    
    // Shader uniforms setup - with reduced size value
    this.uniforms = {
      time: { value: 0 },
      offsetSize: { value: 2 },
      size: { value: 1.5 },
      frequency: { value: 2.0 },
      amplitude: { value: 0.8 },
      offsetGain: { value: 0.5 },
      maxDistance: { value: 1.8 },
      startColor: { value: new THREE.Color(0xff00ff) }, // Magenta
      endColor: { value: new THREE.Color(0x00ffff) },   // Cyan
    };
    
    // Reference shader implementations
    this.vertexShader = `
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
    
    this.fragmentShader = `
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
    
    // Create material immediately so it's ready
    this.createMaterial();
    // Create default geometry
    this.createShapedGeometry('torusKnot');
  }

  async load() {
    try {
      // Skip file loading and use our hardcoded shaders directly
      console.log('[ParticleSystem] Using reference shader implementation');
      this.createMaterial();
      
      // Create torusKnot geometry as default
      this.createShapedGeometry('torusKnot');
      
      return true;
    } catch (error) {
      console.error('[ParticleSystem] Error loading shaders:', error);
      return false;
    }
  }

  createMaterial() {
    // Create shader material exactly like the reference
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true,
      uniforms: this.uniforms
    });

    console.log("[ParticleSystem] Material created successfully");
  }

  createShapedGeometry(shape = 'torusKnot') {
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    // Create geometry based on shape - with more dynamic segmentation like the reference
    switch (shape) {
      case 'cube':
        // More dynamic segment ranges like the reference
        const cubeWidthSeg = Math.floor(THREE.MathUtils.randInt(20, 60));  // Renamed for clarity
        const cubeHeightSeg = Math.floor(THREE.MathUtils.randInt(10, 100)); // Renamed for clarity
        const cubeDepthSeg = Math.floor(THREE.MathUtils.randInt(20, 120));  // Renamed for clarity
        
        this.geometry = new THREE.BoxGeometry(
          22, 22, 22, cubeWidthSeg, cubeHeightSeg, cubeDepthSeg
        );
    
        // Higher offset size like reference
        this.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(30, 50));
        this.currentShape = 'cube';
        break;
    
      case 'plane':
        // More dynamic segmentation
        const planeWidthSeg = Math.floor(THREE.MathUtils.randInt(80, 150)); // Renamed for clarity
        const planeHeightSeg = Math.floor(THREE.MathUtils.randInt(80, 150)); // Renamed for clarity
        
        this.geometry = new THREE.PlaneGeometry(
          50, 50, planeWidthSeg, planeHeightSeg
        );
    
        this.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(25, 50));
        this.currentShape = 'plane';
        break;
    
      case 'ring':
        // More detailed torus with random segments
        const torusSegments = Math.floor(THREE.MathUtils.randInt(180, 300));
        const torusTubularSeg = Math.floor(THREE.MathUtils.randInt(20, 50));
        
        this.geometry = new THREE.TorusGeometry(
          12, 2, torusTubularSeg, torusSegments
        );
    
        this.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(35, 55));
        this.currentShape = 'ring';
        break;
    
      case 'cylinder':
        // More detailed cylinder with random segments
        const cylinderRadialSeg = Math.floor(THREE.MathUtils.randInt(64, 128)); // Renamed for clarity
        const cylinderHeightSeg = Math.floor(THREE.MathUtils.randInt(64, 128)); // Renamed for clarity
    
        this.geometry = new THREE.CylinderGeometry(
          12, 12, 28, cylinderRadialSeg, cylinderHeightSeg, true
        );
    
        this.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(25, 50));
        this.currentShape = 'cylinder';
        break;
      
      case 'torusKnot':
        // Significantly more detailed torus knot for more particles
        const knotTubularSeg = Math.floor(THREE.MathUtils.randInt(200, 400)); // Doubled for more particles
        const knotRadialSeg = Math.floor(THREE.MathUtils.randInt(30, 120)); // Doubled for more particles
        
        // Dynamic p,q values with wider range for more interesting patterns
        const knotP = THREE.MathUtils.randInt(2, 6); // Extended range (was 2-3)
        const knotQ = THREE.MathUtils.randInt(3, 6); // Extended range (was 3-5)
        
        // Create a larger knot
        this.geometry = new THREE.TorusKnotGeometry(
          15, 6, knotTubularSeg, knotRadialSeg, knotP, knotQ
        );

        // Higher offset size for more dramatic effect
        this.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(25, 50));
        
        // Store the shape for special handling in update method
        this.currentShape = 'torusKnot';
        break;
    
      case 'sphere':
      default:
        // More detailed sphere
        const sphereWidthSeg = Math.floor(THREE.MathUtils.randInt(40, 80)); // Renamed for clarity
        const sphereHeightSeg = Math.floor(THREE.MathUtils.randInt(40, 80)); // Renamed for clarity
        
        this.geometry = new THREE.SphereGeometry(
          15, sphereWidthSeg, sphereHeightSeg
        );
    
        this.uniforms.offsetSize.value = Math.floor(THREE.MathUtils.randInt(35, 65));
        this.currentShape = 'sphere';
        break;
    }
    
    // Compute normals for shader
    if (!this.geometry.getAttribute('normal')) {
      this.geometry.computeVertexNormals();
    }
    
    console.log(`[Particles] Created ${shape} with offset size: ${this.uniforms.offsetSize.value}`);
    return this.geometry;
  }

  create() {
    // Safety check - make sure we have geometry and material
    if (!this.geometry) {
      this.createShapedGeometry('torusKnot');
    }
    
    if (!this.material) {
      this.createMaterial();
    }
    
    // Clean up previous points
    if (this.points) {
      this.points.geometry.dispose();
    }
    
    // Create new points with material and geometry
    this.points = new THREE.Points(this.geometry, this.material);
    
    // Ensure the points are visible
    this.points.visible = true;
    
    return this.points;
  }

  update(time, audioData, beatDetected) {
    if (!this.material) return;
    
    // Slightly faster time increment for more motion
    this.time += 0.15;
    this.uniforms.time.value = this.time;
    
    // Apply audio data to key uniforms with higher multipliers
    if (audioData) {
      // Base reactivity
      let amplitudeMod = this.reactivityMultiplier;
      let frequencyMod = this.reactivityMultiplier;
      let offsetMod = this.reactivityMultiplier;
      
      // Special handling for torusKnot - more dramatic reactivity
      if (this.currentShape === 'torusKnot') {
        amplitudeMod *= 1.5; // 50% more amplitude effect
        frequencyMod *= 1.35; // 35% more frequency effect
        offsetMod *= 1.4; // 40% more offset effect
      }
      
      // Even more dramatic amplitude reactivity
      this.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(
        audioData.high * amplitudeMod, 
        0, 0.6, 
        -0.1, 1.0
      );
      
      // More dramatic offset gain 
      this.uniforms.offsetGain.value = audioData.mid * 2.5 * offsetMod;
      
      // More aggressive frequency modulation
      this.uniforms.frequency.value = 2.0 + (audioData.low * 4.5 * frequencyMod);
    } else {
      // Default values when no audio
      this.uniforms.amplitude.value = 0.8;
      this.uniforms.offsetGain.value = 0;
      this.uniforms.frequency.value = 2.0;
    }
    
    // Handle beat detection
    if (beatDetected) {
      // Special handling for torusKnot - more dramatic beat effect
      if (this.currentShape === 'torusKnot') {
        // Extra dramatic size pulse on beat for torusKnot
        this.uniforms.size.value = 9 * this.reactivityMultiplier; // Higher than normal (7)
        this.uniforms.maxDistance.value = 3.0; // Higher than normal (2.5)
      } else {
        // Normal beat pulse for other shapes
        this.uniforms.size.value = 7 * this.reactivityMultiplier;
        this.uniforms.maxDistance.value = 2.5;
      }
    } else {
      // Faster return to normal size with smoother transition
      this.uniforms.size.value = Math.max(2, this.uniforms.size.value * 0.93);
      this.uniforms.maxDistance.value = Math.max(1.8, this.uniforms.maxDistance.value * 0.95);
    }
  }
  
  // Add resize method to handle window resizing
  resize(width, height) {
    // Nothing specific to do for particle system on resize
  }
}

export default ParticleSystem; 