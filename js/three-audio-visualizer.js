// Three.js Audio Visualizer with Shader-based Blob Effect
class ThreeAudioVisualizer {
    constructor(audioAnalyser, dataArray) {
        this.analyser = audioAnalyser;
        this.dataArray = dataArray;
        this.canvas = document.getElementById('audio-canvas');
        
        // Check for WebGL support more thoroughly
        if (!this.isWebGLSupported()) {
            console.warn('WebGL not supported, falling back to canvas visualization');
            return null; // Return null to indicate initialization failed
        }
        
        // Initialize Three.js components with better error handling
        try {
            this.initThree();
            this.animate();
            console.log('Three.js visualization started successfully');
            return this; // Return the instance if successful
        } catch (error) {
            console.error('Error initializing Three.js visualizer:', error);
            return null; // Return null to indicate initialization failed
        }
    }
    
    isWebGLSupported() {
        try {
            // Try to create a WebGL context with explicit attributes
            const canvas = document.createElement('canvas');
            const contextAttributes = {
                alpha: true,
                antialias: true,
                depth: true,
                failIfMajorPerformanceCaveat: false,
                powerPreference: 'default',
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: true
            };
            
            // Try WebGL2 first, then fall back to WebGL1
            let gl = canvas.getContext('webgl2', contextAttributes) || 
                     canvas.getContext('webgl', contextAttributes) || 
                     canvas.getContext('experimental-webgl', contextAttributes);
                     
            if (!gl) {
                console.warn('WebGL context creation failed');
                return false;
            }
            
            // Check for necessary extensions and capabilities
            const extensions = gl.getSupportedExtensions();
            console.log('WebGL supported extensions:', extensions);
            
            return true;
        } catch (e) {
            console.warn('WebGL support check failed:', e);
            return false;
        }
    }
    
    initThree() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 20);
        
        // Renderer setup with more robust error handling
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: this.canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'default',
                preserveDrawingBuffer: false,
                precision: 'highp',
                logarithmicDepthBuffer: false
            });
            
            this.renderer.setSize(width, height);
            this.renderer.setClearColor(0x0a0a14, 1);
        } catch (error) {
            console.error('Error creating WebGL renderer:', error);
            throw new Error('Failed to create WebGL renderer');
        }
        
        // Create uniforms for shaders
        this.uniforms = {
            u_time: { value: 0.0 },
            u_frequency: { value: 0.0 },
            u_amplitude: { value: 0.0 },
            u_red: { value: 0.0 },
            u_green: { value: 1.0 },
            u_blue: { value: 1.0 }
        };
        
        // Create shader material
        const material = new THREE.ShaderMaterial({
            wireframe: true,
            uniforms: this.uniforms,
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader()
        });
        
        // Create geometry and mesh
        const geometry = new THREE.IcosahedronGeometry(8, 30);
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        
        // Set up post-processing for glow effect
        this.setupPostProcessing();
        
        // Set up resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Set up clock for animation
        this.clock = new THREE.Clock();
    }
    
    setupPostProcessing() {
        // Create render passes
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        
        // Create bloom pass
        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(this.canvas.offsetWidth, this.canvas.offsetHeight),
            0.5,  // strength
            0.8,  // radius
            0.4   // threshold
        );
        
        // Create composer
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
        
        // Add final pass
        const outputPass = new THREE.ShaderPass(THREE.OutputShader);
        outputPass.renderToScreen = true;
        this.composer.addPass(outputPass);
    }
    
    onResize() {
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update uniforms
        this.uniforms.u_time.value = this.clock.getElapsedTime();
        
        // Update frequency data
        if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate average frequency and amplitude
            let sum = 0;
            let peak = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
                peak = Math.max(peak, this.dataArray[i]);
            }
            const avgFrequency = sum / this.dataArray.length;
            
            // Update uniforms with audio data
            this.uniforms.u_frequency.value = avgFrequency / 255;
            this.uniforms.u_amplitude.value = peak / 255;
            
            // Update color based on frequency ranges
            // Bass affects red, mids affect green, highs affect blue
            const bassRange = this.getFrequencyRangeValue(this.dataArray, 0, 10) / 255;
            const midsRange = this.getFrequencyRangeValue(this.dataArray, 10, 100) / 255;
            const highsRange = this.getFrequencyRangeValue(this.dataArray, 100, 255) / 255;
            
            this.uniforms.u_red.value = bassRange * 0.5 + 0.5;
            this.uniforms.u_green.value = midsRange * 0.5 + 0.5;
            this.uniforms.u_blue.value = highsRange * 0.5 + 0.5;
            
            // Update bloom intensity based on overall amplitude
            if (this.bloomPass) {
                this.bloomPass.strength = 0.5 + avgFrequency / 255;
            }
        }
        
        // Add subtle rotation
        if (this.mesh) {
            this.mesh.rotation.y += 0.002;
            this.mesh.rotation.x += 0.001;
        }
        
        // Render with post-processing
        this.composer.render();
    }
    
    getFrequencyRangeValue(dataArray, startIndex, endIndex) {
        let sum = 0;
        let count = 0;
        
        for (let i = startIndex; i < endIndex && i < dataArray.length; i++) {
            sum += dataArray[i];
            count++;
        }
        
        return count > 0 ? sum / count : 0;
    }
    
    getVertexShader() {
        return `
            uniform float u_time;
            uniform float u_frequency;
            uniform float u_amplitude;
            
            // Perlin noise functions
            vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 mod289(vec4 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 permute(vec4 x) {
                return mod289(((x*34.0)+10.0)*x);
            }
            
            vec4 taylorInvSqrt(vec4 r) {
                return 1.79284291400159 - 0.85373472095314 * r;
            }
            
            vec3 fade(vec3 t) {
                return t*t*t*(t*(t*6.0-15.0)+10.0);
            }
            
            float pnoise(vec3 P, vec3 rep) {
                vec3 Pi0 = mod(floor(P), rep);
                vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
                Pi0 = mod289(Pi0);
                Pi1 = mod289(Pi1);
                vec3 Pf0 = fract(P);
                vec3 Pf1 = Pf0 - vec3(1.0);
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                vec4 iy = vec4(Pi0.yy, Pi1.yy);
                vec4 iz0 = Pi0.zzzz;
                vec4 iz1 = Pi1.zzzz;
                
                vec4 ixy = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0);
                vec4 ixy1 = permute(ixy + iz1);
                
                vec4 gx0 = ixy0 * (1.0 / 7.0);
                vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                gx0 = fract(gx0);
                vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                
                vec4 gx1 = ixy1 * (1.0 / 7.0);
                vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                gx1 = fract(gx1);
                vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                
                vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
                
                vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                g000 *= norm0.x;
                g010 *= norm0.y;
                g100 *= norm0.z;
                g110 *= norm0.w;
                vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                g001 *= norm1.x;
                g011 *= norm1.y;
                g101 *= norm1.z;
                g111 *= norm1.w;
                
                float n000 = dot(g000, Pf0);
                float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                float n111 = dot(g111, Pf1);
                
                vec3 fade_xyz = fade(Pf0);
                vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
                return 2.2 * n_xyz;
            }
            
            void main() {
                // Generate noise based on position and time
                float noise = 3.0 * pnoise(position + u_time * 0.5, vec3(10.0));
                
                // Calculate displacement based on noise and audio frequency
                float displacement = (u_frequency * 2.0 + u_amplitude * 3.0) * (noise / 10.0);
                
                // Apply displacement along normal direction
                vec3 newPosition = position + normal * displacement;
                
                // Calculate final position
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
    }
    
    getFragmentShader() {
        return `
            uniform float u_red;
            uniform float u_green;
            uniform float u_blue;
            uniform float u_frequency;
            uniform float u_amplitude;
            
            void main() {
                // Create color that reacts to audio frequency
                vec3 color = vec3(u_red, u_green, u_blue);
                
                // Add intensity based on frequency
                float intensity = 0.7 + u_frequency * 0.3 + u_amplitude * 0.2;
                
                gl_FragColor = vec4(color * intensity, 1.0);
            }
        `;
    }
} 