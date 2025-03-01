// Three.js Audio Visualizer for Cyberpunk Portfolio
class ThreeAudioVisualizer {
    constructor(audioAnalyser, dataArray) {
        this.analyser = audioAnalyser;
        this.dataArray = dataArray;
        this.canvas = document.getElementById('audio-canvas');
        
        // Initialize Three.js components
        this.initThree();
        
        // Start animation loop
        this.animate();
    }
    
    initThree() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            this.canvas.offsetWidth / this.canvas.offsetHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 30;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.canvas.offsetWidth, this.canvas.offsetHeight);
        this.renderer.setClearColor(0x000000, 0);
        
        // Add resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Create visualization elements
        this.createVisualization();
        
        // Add lighting
        this.addLighting();
    }
    
    createVisualization() {
        // Create a group to hold all visualization elements
        this.visualizerGroup = new THREE.Group();
        this.scene.add(this.visualizerGroup);
        
        // Create circular audio reactive elements
        this.createCircularVisualizer();
        
        // Create particle system
        this.createParticleSystem();
        
        // Create grid
        this.createGrid();
    }
    
    createCircularVisualizer() {
        // Create a circular array of bars that react to audio
        const segments = 128; // Number of bars
        const radius = 15;
        
        this.audioBars = [];
        
        for (let i = 0; i < segments; i++) {
            // Calculate position on circle
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            // Create geometry and material
            const geometry = new THREE.BoxGeometry(0.2, 1, 0.2);
            
            // Use different colors based on position
            let hue = (i / segments) * 360;
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(`hsl(${hue}, 100%, 60%)`),
                emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
                shininess: 100,
                specular: new THREE.Color(0xffffff)
            });
            
            // Create mesh
            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(x, y, 0);
            bar.rotation.z = angle;
            
            // Store original position for animation
            bar.userData.originalPosition = { x, y };
            bar.userData.index = i;
            
            this.audioBars.push(bar);
            this.visualizerGroup.add(bar);
        }
    }
    
    createParticleSystem() {
        // Create particles that react to audio
        const particleCount = 2000;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in sphere
            const radius = 20 + Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i * 3 + 2] = radius * Math.cos(phi);
            
            particleSizes[i] = Math.random() * 2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        // Create shader material
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00ffff) },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                void main() {
                    vColor = vec3(0.0, 1.0, 1.0); // Cyan color
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(color * vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 255, 255, 1)');
        gradient.addColorStop(0.4, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createGrid() {
        // Create a grid for the floor
        const gridSize = 40;
        const gridDivisions = 20;
        const gridColor = 0x00ffff;
        
        const grid = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        grid.position.y = -10;
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        
        this.scene.add(grid);
    }
    
    addLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x222222);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Add point lights
        const pointLight1 = new THREE.PointLight(0x00ffff, 2, 50);
        pointLight1.position.set(0, 15, 0);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff00ff, 2, 50);
        pointLight2.position.set(15, 0, 0);
        this.scene.add(pointLight2);
    }
    
    onResize() {
        // Update camera and renderer on window resize
        this.camera.aspect = this.canvas.offsetWidth / this.canvas.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.offsetWidth, this.canvas.offsetHeight);
    }
    
    updateVisualization() {
        if (!this.analyser || !this.dataArray) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Update circular visualizer
        if (this.audioBars) {
            const segments = this.audioBars.length;
            const step = Math.floor(this.dataArray.length / segments);
            
            for (let i = 0; i < segments; i++) {
                const bar = this.audioBars[i];
                const dataIndex = i * step;
                
                if (dataIndex < this.dataArray.length) {
                    const value = this.dataArray[dataIndex];
                    const scale = 1 + (value / 128) * 3; // Scale based on audio data
                    
                    // Scale the bar
                    bar.scale.y = scale;
                    
                    // Move the bar outward based on audio intensity
                    const { x, y } = bar.userData.originalPosition;
                    const intensity = value / 255;
                    const outwardFactor = 1 + intensity * 0.3;
                    
                    bar.position.x = x * outwardFactor;
                    bar.position.y = y * outwardFactor;
                    
                    // Update color based on intensity
                    const hue = (bar.userData.index / segments) * 360;
                    const saturation = 100;
                    const lightness = 50 + intensity * 30;
                    
                    bar.material.emissive.setHSL(hue / 360, saturation / 100, lightness / 200);
                }
            }
        }
        
        // Update particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const sizes = this.particles.geometry.attributes.size.array;
            const particleCount = sizes.length;
            
            // Get average frequency for overall intensity
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            const averageFrequency = sum / this.dataArray.length;
            const intensity = averageFrequency / 255;
            
            // Update particle positions and sizes
            for (let i = 0; i < particleCount; i++) {
                // Pulsate size based on audio
                sizes[i] = (Math.random() * 2) + (intensity * 3);
                
                // Slightly move particles for dynamic effect
                positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.02;
                positions[i * 3 + 1] += Math.cos(Date.now() * 0.001 + i) * 0.02;
                positions[i * 3 + 2] += Math.sin(Date.now() * 0.002 + i) * 0.02;
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.size.needsUpdate = true;
        }
        
        // Rotate the entire visualizer group
        this.visualizerGroup.rotation.y += 0.002;
        this.visualizerGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.2;
    }
    
    animate() {
        // Update visualization
        this.updateVisualization();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue animation loop
        requestAnimationFrame(() => this.animate());
    }
} 