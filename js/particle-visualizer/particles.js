import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

class ParticleSystem {
  constructor(gui) {
    this.name = 'ParticleSystem';
    this.time = 0;
    this.reactivityMultiplier = 0.1
    this.currentShape = 'torusKnot';
    
    // Add counter for randomization
    this.randomizeCounter = 0;
    this.maxRandomizations = 3; // Maximum number of randomizations before reset
    
    // Store the GUI instance
    this.gui = gui || {
      addFolder: () => ({
        add: () => ({ 
          onChange: () => {},
          name: (n) => { return { onChange: () => {} }; }
        }),
        destroy: () => {}
      }),
      add: () => ({ 
        onChange: () => {},
        name: (n) => { return { onChange: () => {} }; }
      })
    };
    
    // Initialize properties for GUI
    this.guiProperties = {
      randomizeSegments: () => this.randomizeCurrentShape()
    };
    
    // Create a holder for all shapes
    this.holder = new THREE.Object3D();
    this.holder.name = 'particle-holder';
    
    // Shader uniforms setup
    this.uniforms = {
      time: { value: 0 },
      offsetSize: { value: 1.2 },
      size: { value: 1.2 },
      frequency: { value: 2 },
      amplitude: { value: 0.1 },
      offsetGain: { value: 0.5 },
      maxDistance: { value: 2 },
      startColor: { value: new THREE.Color(0x00ffff) }, // Cyan
      endColor: { value: new THREE.Color(0xff00ff) },   // Magenta
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
        i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
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
  }

  async load() {
    try {
      // Skip file loading and use our hardcoded shaders directly
      console.log('[ParticleSystem] Using reference shader implementation');
      this.createMaterial();
      
      // We'll initialize with a shape later
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

  randomizeCurrentShape() {
    // Increment counter
    this.randomizeCounter++;
    
    // Check if we need to do a full reset
    if (this.randomizeCounter > this.maxRandomizations) {
      console.log("Maximum randomizations reached, performing full reset");
      this.randomizeCounter = 1; // Reset counter (1 because we're doing a randomization now)
      
      // Do a more thorough cleanup
      this.fullCleanup();
    }
    
    // Store current shape
    const currentShape = this.currentShape;
    
    // Clear existing point mesh
    if (this.pointsMesh) {
      this.holder.remove(this.pointsMesh);
      this.pointsMesh = null;
    }
    
    // Dispose of existing geometry
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    
    // Call the appropriate shape creation method based on current shape
    switch (currentShape) {
      case 'cube':
        this.createCube();
        break;
      case 'plane':
        this.createPlane();
        break;
      case 'ring':
        this.createRing();
        break;
      case 'cylinder':
        this.createCylinder();
        break;
      case 'torusKnot':
        this.createTorusKnot();
        break;
      case 'sphere':
        this.createSphere();
        break;
    }
  }

  createCube() {
    // Log current randomization count when creating shape
    if (this.randomizeCounter > 0) {
      console.log(`Cube randomization #${this.randomizeCounter} of ${this.maxRandomizations}`);
    }
    
    // Clean up any existing pointsMesh first
    if (this.pointsMesh) {
      this.holder.remove(this.pointsMesh);
      this.pointsMesh = null;
    }
    
    // Clean up any existing geometry
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    // Now create the new geometry
    let widthSeg = Math.floor(THREE.MathUtils.randInt(15,30));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(30, 80));
    let depthSeg = Math.floor(THREE.MathUtils.randInt(15, 30));
    
    this.geometry = new THREE.BoxGeometry(
      34,
      34,
      34,
      widthSeg,
      heightSeg,
      depthSeg
    );
    
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.holder.add(this.pointsMesh);
    
    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    
    this.guiProperties.segments = {
      width: widthSeg,
      height: heightSeg,
      depth: depthSeg,
    };
    
    this.segmentsFolder.add(this.guiProperties.segments, "width",25, 80);
    this.segmentsFolder.add(this.guiProperties.segments, "height",15, 25);
    this.segmentsFolder.add(this.guiProperties.segments, "depth",25, 80);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");
    
    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.BoxGeometry(
        34,
        34,
        34,
        this.guiProperties.segments.width,
        this.guiProperties.segments.height,
        this.guiProperties.segments.depth
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.holder.add(this.pointsMesh);
    });
    
    this.currentShape = 'cube';
    this.uniforms.offsetSize.value = 40;
  }

  createCylinder() {
    let radialSeg = Math.floor(THREE.MathUtils.randInt(64, 192));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(64, 192));
    
    this.geometry = new THREE.CylinderGeometry(
      16,
      16,
      56,
      radialSeg,
      heightSeg,
      true
    );
    
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.rotation.set(Math.PI / 2, 0, 0);
    this.holder.add(this.pointsMesh);
    
    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    
    this.guiProperties.segments = {
      height: heightSeg,
      radial: radialSeg,
    };
    
    this.segmentsFolder.add(this.guiProperties.segments, "height", 92, 192);
    this.segmentsFolder.add(this.guiProperties.segments, "radial", 32, 320);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");
    
    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.CylinderGeometry(
        16,
        16,
        56,
        this.guiProperties.segments.radial,
        this.guiProperties.segments.height,
        true
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.pointsMesh.rotation.set(Math.PI / 2, 0, 0);
      this.holder.add(this.pointsMesh);
    });
    
    this.currentShape = 'cylinder';
    this.uniforms.offsetSize.value = 30;
  }

  createSphere() {
    let widthSeg = Math.floor(THREE.MathUtils.randInt(80,140));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(40,60));
    
    this.geometry = new THREE.SphereGeometry(
      30,
      widthSeg,
      heightSeg
    );
    
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.holder.add(this.pointsMesh);
    
    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    
    this.guiProperties.segments = {
      width: widthSeg,
      height: heightSeg
    };
    
    this.segmentsFolder.add(this.guiProperties.segments, "width", 20, 100);
    this.segmentsFolder.add(this.guiProperties.segments, "height", 100,300);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");
    
    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.SphereGeometry(
        30,
        this.guiProperties.segments.width,
        this.guiProperties.segments.height
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.holder.add(this.pointsMesh);
    });
    
    this.currentShape = 'sphere';
    this.uniforms.offsetSize.value = 40;
  }

  createPlane() {
    let widthSeg = Math.floor(THREE.MathUtils.randInt(45, 100));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(75, 180));
    
    this.geometry = new THREE.PlaneGeometry(
      80,
      80,
      widthSeg,
      heightSeg
    );
    
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.holder.add(this.pointsMesh);
    
    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    
    this.guiProperties.segments = {
      width: widthSeg,
      height: heightSeg
    };
    
    this.segmentsFolder.add(this.guiProperties.segments, "width", 20, 60);
    this.segmentsFolder.add(this.guiProperties.segments, "height", 120, 150);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");
    
    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.PlaneGeometry(
        80,
        80,
        this.guiProperties.segments.width,
        this.guiProperties.segments.height
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.holder.add(this.pointsMesh);
    });
    
    this.currentShape = 'plane';
    this.uniforms.offsetSize.value = 30;
  }

  createRing() {
    let tubeSeg = Math.floor(THREE.MathUtils.randInt(40, 60));
    let radialSeg = Math.floor(THREE.MathUtils.randInt(120, 160));
    
    this.geometry = new THREE.TorusGeometry(
      17,
      7,
      tubeSeg,
      radialSeg
    );
    
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.holder.add(this.pointsMesh);
    
    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    
    this.guiProperties.segments = {
      tube: tubeSeg,
      radial: radialSeg
    };
    
    this.segmentsFolder.add(this.guiProperties.segments, "tube",75,120);
    this.segmentsFolder.add(this.guiProperties.segments, "radial", 40, 60);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");
    
    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.TorusGeometry(
        20,
        8,
        this.guiProperties.segments.tube,
        this.guiProperties.segments.radial
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.holder.add(this.pointsMesh);
    });
    
    this.currentShape = 'ring';
    this.uniforms.offsetSize.value = 50;
  }

  createTorusKnot() {
    let tubeSeg = Math.floor(THREE.MathUtils.randInt(150,250));
    let radialSeg = Math.floor(THREE.MathUtils.randInt(100, 150));
    let p = Math.floor(THREE.MathUtils.randInt(2, 3));
    let q = Math.floor(THREE.MathUtils.randInt(3, 2));
    
    this.geometry = new THREE.TorusKnotGeometry(
      17,
      5,
      tubeSeg,
      radialSeg,
      p,
      q
    );
    
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.holder.add(this.pointsMesh);
    
    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    
    this.guiProperties.segments = {
      tube: tubeSeg,
      radial: radialSeg,
      p: p,
      q: q
    };
    
    this.segmentsFolder.add(this.guiProperties.segments, "tube", 20, 150);
    this.segmentsFolder.add(this.guiProperties.segments, "radial", 50, 250);
    this.segmentsFolder.add(this.guiProperties.segments, "p", 1, 2, 5);
    this.segmentsFolder.add(this.guiProperties.segments, "q", 3, 7, 2);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");
    
    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.TorusKnotGeometry(
        20,
        8,
        this.guiProperties.segments.tube,
        this.guiProperties.segments.radial,
        this.guiProperties.segments.p,
        this.guiProperties.segments.q
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.holder.add(this.pointsMesh);
    });
    
    this.currentShape = 'torusKnot';
    this.uniforms.offsetSize.value = 40;
  }

  create(shapeType = 'torusKnot') {
    // Reset randomization counter when changing shapes
    this.randomizeCounter = 0;
    
    // More thorough cleanup before creating a new shape
    
    // First, remove the existing pointsMesh from the holder
    if (this.pointsMesh) {
      this.holder.remove(this.pointsMesh);
      this.pointsMesh = null; // Clear the reference
    }
    
    // Also dispose of any existing geometry to prevent memory leaks
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null; // Clear the reference
    }
    
    // Create new shape based on type
    switch (shapeType) {
      case 'cube':
        this.createCube();
        break;
      case 'plane':
        this.createPlane();
        break;
      case 'ring':
        this.createRing();
        break;
      case 'cylinder':
        this.createCylinder();
        break;
      case 'torusKnot':
        this.createTorusKnot();
        break;
      case 'sphere':
      default:
        this.createSphere();
        break;
    }
    
    // Return the holder containing the points
    return this.holder;
  }

  update(time, audioData, beatDetected) {
    if (!this.material) return;
    
    // Simple time increment
    this.time += 0.1;
    this.uniforms.time.value = this.time;
    
    // Apply audio data to uniforms with consistent reactivity
    if (audioData) {
      // Standardized reactivity
      this.uniforms.amplitude.value = 0.8 + (audioData.high * this.reactivityMultiplier);
      this.uniforms.offsetGain.value = audioData.mid * this.reactivityMultiplier;
      this.uniforms.frequency.value = 2.0 + (audioData.low * this.reactivityMultiplier);
    } else {
      // Default values when no audio
      this.uniforms.amplitude.value = 0.8;
      this.uniforms.offsetGain.value = 0.2;
      this.uniforms.frequency.value = 0.8;
    }
    
    // Consistent beat detection for all shapes
    if (beatDetected) {
      this.uniforms.size.value = 5 * this.reactivityMultiplier;
      this.uniforms.maxDistance.value = 1.5;
    } else {
      // Return to normal size
      this.uniforms.size.value = Math.max(1.5, this.uniforms.size.value * 0.95);
      this.uniforms.maxDistance.value = Math.max(1.0, this.uniforms.maxDistance.value * 0.95);
    }
  }
  
  // Method to dispose of resources
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    if (this.material) {
      this.material.dispose();
    }
    
    if (this.pointsMesh) {
      this.holder.remove(this.pointsMesh);
    }
    
    this.segmentsFolder?.destroy();
  }
  
  // Simplified resize method
  resize(width, height) {
    // Nothing specific needed
  }

  // Add a more thorough cleanup method
  fullCleanup() {
    console.log("Performing full cleanup");
    
    // Remove all children from holder while keeping the holder reference intact
    while(this.holder.children.length > 0) {
      const child = this.holder.children[0];
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
      this.holder.remove(child);
    }
    
    // Reset pointsMesh reference
    this.pointsMesh = null;
    
    // Reset geometry
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    
    // Create fresh material
    this.createMaterial();
    
    // After cleanup, make sure to recreate the shape
    console.log("Recreating current shape after cleanup");
    
    // Store the current shape before cleanup
    const currentShape = this.currentShape;
    
    // Recreate the current shape with fresh parameters
    switch (currentShape) {
      case 'cube':
        this.createCube();
        break;
      case 'plane':
        this.createPlane();
        break;
      case 'ring':
        this.createRing();
        break;
      case 'cylinder':
        this.createCylinder();
        break;
      case 'torusKnot':
        this.createTorusKnot();
        break;
      case 'sphere':
      default:
        this.createSphere();
        break;
    }
  }
}

export default ParticleSystem;