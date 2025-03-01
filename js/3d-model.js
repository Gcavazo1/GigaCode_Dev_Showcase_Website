// 3D Model Viewer for Cyberpunk Portfolio

class ModelViewer {
    constructor() {
        this.container = document.getElementById('model-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.lights = [];
        this.autoRotate = true;
        this.wireframe = false;
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a12);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);
        
        // Add lights
        this.addLights();
        
        // Load model
        this.loadModel();
        
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Add post-processing
        this.setupPostProcessing();
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light (cyan)
        const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
        directionalLight.position.set(0, 1, 2);
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Point light (magenta)
        const purpleLight = new THREE.PointLight(0xff00ff, 1, 10);
        purpleLight.position.set(-2, 1, 3);
        this.scene.add(purpleLight);
        this.lights.push(purpleLight);
        
        // Point light (yellow)
        const yellowLight = new THREE.PointLight(0xf9f900, 1, 10);
        yellowLight.position.set(2, -1, 3);
        this.scene.add(yellowLight);
        this.lights.push(yellowLight);
    }
    
    loadModel() {
        const loader = new THREE.GLTFLoader();
        
        try {
            // Load the SlothSword model
            loader.load(
                'models/gltf/SlothSword.gltf',  // Path to your GLTF model
                (gltf) => {
                    // Remove any existing model
                    if (this.model) {
                        this.scene.remove(this.model);
                    }
                    
                    // Add loaded model
                    this.model = gltf.scene;
                    
                    // Scale and position the model appropriately
                    this.model.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
                    this.scene.add(this.model);
                    
                    // Center model
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    this.model.position.x = -center.x;
                    this.model.position.y = -center.y;
                    this.model.position.z = -center.z;
                    
                    // Apply materials to all meshes for consistent appearance
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            // Store original material for wireframe toggle
                            child.originalMaterial = child.material;
                            
                            // Enhance materials for cyberpunk look
                            child.material.metalness = 0.8;
                            child.material.roughness = 0.2;
                            child.material.emissive = new THREE.Color(0x00ffff);
                            child.material.emissiveIntensity = 0.5;
                            
                            // Add glow effect for neon parts if they exist
                            if (child.name.includes('neon') || child.name.includes('glow')) {
                                child.material.emissiveIntensity = 2.0;
                            }
                        }
                    });
                    
                    // Add animation if available
                    if (gltf.animations && gltf.animations.length) {
                        this.mixer = new THREE.AnimationMixer(this.model);
                        this.activeAction = this.mixer.clipAction(gltf.animations[0]);
                        this.activeAction.play();
                    }
                    
                    console.log('Model loaded successfully');
                },
                // Show loading progress
                (xhr) => {
                    const loadingPercent = Math.floor((xhr.loaded / xhr.total) * 100);
                    console.log(`Loading model: ${loadingPercent}% loaded`);
                },
                // Handle errors
                (error) => {
                    console.error('Error loading 3D model:', error);
                    this.createFallbackModel();
                }
            );
        } catch (error) {
            console.error('Error in model loading process:', error);
            this.createFallbackModel();
        }
    }
    
    createFallbackModel() {
        // Create a placeholder if model fails to load
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x003333
        });
        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(0.016); // Update at approximately 60fps
        }
        
        // Auto-rotate model if enabled
        if (this.autoRotate && this.model) {
            this.model.rotation.y += 0.005;
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate lights
        this.lights.forEach((light, index) => {
            if (light.type === 'PointLight') {
                const time = Date.now() * 0.001;
                const radius = 3;
                light.position.x = Math.sin(time * 0.5 + index) * radius;
                light.position.z = Math.cos(time * 0.5 + index) * radius;
            }
        });
        
        // Render scene
        this.composer.render();
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    setupEventListeners() {
        const toggleRotationBtn = document.getElementById('toggle-rotation');
        if (toggleRotationBtn) {
            toggleRotationBtn.addEventListener('click', () => {
                this.autoRotate = !this.autoRotate;
                toggleRotationBtn.textContent = this.autoRotate ? 'Stop Rotation' : 'Start Rotation';
            });
        }
        
        const toggleWireframeBtn = document.getElementById('toggle-wireframe');
        if (toggleWireframeBtn) {
            toggleWireframeBtn.addEventListener('click', () => {
                this.wireframe = !this.wireframe;
                toggleWireframeBtn.textContent = this.wireframe ? 'Show Solid' : 'Show Wireframe';
                
                if (this.model) {
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.material.wireframe = this.wireframe;
                        }
                    });
                }
            });
        }
    }
    
    setupPostProcessing() {
        // Import necessary modules
        const { EffectComposer } = THREE.EffectComposer;
        const { RenderPass } = THREE.RenderPass;
        const { UnrealBloomPass } = THREE.UnrealBloomPass;
        
        // Create composer
        this.composer = new EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom pass for glow effect
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,   // strength
            0.4,   // radius
            0.85   // threshold
        );
        this.composer.addPass(bloomPass);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ModelViewer();
}); 