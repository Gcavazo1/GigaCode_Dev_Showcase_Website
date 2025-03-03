import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

class ParticleSystem {
  constructor() {
    this.name = 'ParticleSystem';
    this.time = 0;
    this.reactivityMultiplier = 1.0;
    
    // Shader uniforms setup - match reference exactly
    this.uniforms = {
      time: { value: 0 },
      offsetSize: { value: 2 },
      size: { value: 2 },
      frequency: { value: 2 },
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
    this.createShapedGeometry('sphere');
  }

  async load() {
    try {
      // Material is already created in constructor
      return true;
    } catch (error) {
      console.error('[ParticleSystem] Error loading:', error);
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

  createShapedGeometry(shape = 'sphere') {
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    // Create geometry based on shape
    switch(shape) {
      case 'cube':
        const widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20));
        const heightSeg = Math.floor(THREE.MathUtils.randInt(1, 40)); 
        const depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80));
        
        this.geometry = new THREE.BoxGeometry(
          1, 1, 1, widthSeg, heightSeg, depthSeg
        );
        break;
        
      case 'plane':
        this.geometry = new THREE.PlaneGeometry(
          10, 10, 30, 30
        );
        break;
        
      case 'ring':
        this.geometry = new THREE.TorusGeometry(
          5, 0.5, 16, 100
        );
        break;
        
      case 'cylinder':
        const radialSegments = 64;
        const heightSegments = 64;
        this.geometry = new THREE.CylinderGeometry(
          1, 1, 4, radialSegments, heightSegments, true
        );
        break;
        
      case 'sphere':
      default:
        this.geometry = new THREE.SphereGeometry(
          5, 32, 32
        );
        break;
    }
    
    // Compute normals - CRITICAL for the shader
    if (!this.geometry.getAttribute('normal')) {
      this.geometry.computeVertexNormals();
    }
    
    // Return the geometry
    return this.geometry;
  }

  create() {
    // Safety check - make sure we have geometry and material
    if (!this.geometry) {
      this.createShapedGeometry('sphere');
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
    
    // Simple time increment like reference
    this.time += 0.1;
    this.uniforms.time.value = this.time;
    
    // Apply audio data to key uniforms
    if (audioData) {
      // Update amplitude based on high frequencies (exactly like reference)
      this.uniforms.amplitude.value = 0.8 + THREE.MathUtils.mapLinear(
        audioData.high * this.reactivityMultiplier, 
        0, 0.6, 
        -0.1, 0.3
      );
      
      // Update offset gain based on mid frequencies
      this.uniforms.offsetGain.value = audioData.mid * 0.6 * this.reactivityMultiplier;
    } else {
      // Default values when no audio
      this.uniforms.amplitude.value = 0.8;
      this.uniforms.offsetGain.value = 0;
    }
    
    // Handle beat detection
    if (beatDetected) {
      // Pulse the size on beat
      this.uniforms.size.value = 4;
    } else {
      // Return to normal size
      this.uniforms.size.value = Math.max(2, this.uniforms.size.value * 0.95);
    }
  }
  
  // Add resize method to handle window resizing
  resize(width, height) {
    // Nothing specific to do for particle system on resize
  }
}

export default ParticleSystem; 