// 3D Model Viewer for Cyberpunk Portfolio

class ModelViewer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(this.containerId);
        
        if (!this.container) {
            throw new Error(`Container with ID "${this.containerId}" not found`);
        }

        // Check for WebGL support
        if (!this.isWebGLSupported()) {
            throw new Error('WebGL not supported');
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.lights = [];
        this.autoRotate = true;
        this.wireframe = false;
        this.mixer = null;
        
        // Initialize components
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Get the container element
        this.container = document.getElementById(this.containerId);
        
        // Check if container exists before proceeding
        if (!this.container) {
            console.warn(`Container with ID "${this.containerId}" not found. 3D model viewer initialization aborted.`);
            return;
        }
        
        // Get dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
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
    
    loadModel(progressCallback) {
        const loader = new THREE.GLTFLoader();
        
        try {
            loader.load(
                'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
                (gltf) => {
                    if (this.model) {
                        this.scene.remove(this.model);
                    }
                    
                    this.model = gltf.scene;
                    this.model.scale.set(2, 2, 2); // Make it bigger
                    this.scene.add(this.model);
                    
                    // Center model
                    const box = new THREE.Box3().setFromObject(this.model);
                    const center = box.getCenter(new THREE.Vector3());
                    this.model.position.x = -center.x;
                    this.model.position.y = -center.y;
                    this.model.position.z = -center.z;
                    
                    // Apply materials
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.material.metalness = 0.8;
                            child.material.roughness = 0.2;
                            child.material.emissive = new THREE.Color(0x00ffff);
                            child.material.emissiveIntensity = 0.5;
                        }
                    });
                    
                    if (progressCallback) progressCallback(1);
                    console.log("Model loaded successfully");
                },
                (xhr) => {
                    if (progressCallback) {
                        progressCallback(xhr.loaded / xhr.total);
                    }
                },
                (error) => {
                    console.error("Error loading model:", error);
                    this.createFallbackModel();
                    if (progressCallback) progressCallback(1);
                }
            );
        } catch (error) {
            console.error('Error in model loading process:', error);
            this.createFallbackModel();
            if (progressCallback) progressCallback(1);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const modelContainer = document.getElementById('model-showcase');
    
    // Only initialize if the container exists
    if (modelContainer) {
        window.modelViewer = new ModelViewer('model-showcase');
        
        // Make the initialization function available globally
        window.initializeModelViewer = (containerId, progressCallback) => {
            if (!window.modelViewer) {
                window.modelViewer = new ModelViewer(containerId, progressCallback);
            }
            return window.modelViewer;
        };
    } else {
        console.warn('Model showcase container not found. 3D model viewer not initialized.');
    }
});

// Ensure the 3D model is properly isolated in its own container
function initializeModelViewer(containerId, progressCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create scene, camera, renderer only for this container
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true // Allow transparency to blend with the page background
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding || THREE.LinearEncoding; // Fallback for older Three.js versions
    
    // Clear any existing canvas
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
        container.removeChild(existingCanvas);
    }
    
    container.appendChild(renderer.domElement);
    
    // Add ambient and directional light for better model visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add cyberpunk-themed lighting
    const neonLight1 = new THREE.PointLight(0xff00ff, 1, 100); // Magenta
    neonLight1.position.set(2, 2, 2);
    scene.add(neonLight1);
    
    const neonLight2 = new THREE.PointLight(0x00ffff, 1, 100); // Cyan
    neonLight2.position.set(-2, -2, 2);
    scene.add(neonLight2);
    
    // Create a placeholder cube while loading
    const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
    const placeholderMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2,
        wireframe: true
    });
    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    scene.add(placeholder);
    
    // Animate placeholder
    function animatePlaceholder() {
        placeholder.rotation.x += 0.01;
        placeholder.rotation.y += 0.01;
    }
    
    // Load the model
    const loader = new THREE.GLTFLoader();
    let model = null;
    let controls = null;
    
    loader.load(
        'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf', 
        (gltf) => {
            // Model loaded successfully
            model = gltf.scene;
            
            // Center the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            
            // Add a subtle rotation animation
            model.rotation.y = Math.PI / 4;
            
            // Remove placeholder
            scene.remove(placeholder);
            
            // Add model to scene
            scene.add(model);
            
            // Add controls for user interaction
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 3;
            controls.maxDistance = 10;
            
            // Set up model control buttons
            setupModelControls(model, controls, camera);
            
            // Final progress update
            if (progressCallback) progressCallback(1.0);
        },
        // Show loading progress
        (xhr) => {
            if (progressCallback) {
                progressCallback(xhr.loaded / xhr.total);
            }
        },
        // Handle errors
        (error) => {
            console.error('Error loading 3D model:', error);
            if (progressCallback) progressCallback(1.0); // Complete the progress bar even on error
            
            // Make placeholder more visible as fallback
            placeholder.material.wireframe = false;
            placeholder.material.emissiveIntensity = 0.5;
            placeholder.scale.set(2, 2, 2);
        }
    );
    
    // Set up model control buttons
    function setupModelControls(model, controls, camera) {
        const rotateLeftBtn = document.getElementById('rotate-left');
        const resetViewBtn = document.getElementById('reset-view');
        const rotateRightBtn = document.getElementById('rotate-right');
        
        if (rotateLeftBtn) {
            rotateLeftBtn.addEventListener('click', () => {
                if (model) model.rotation.y -= Math.PI / 4;
            });
        }
        
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                if (model) {
                    model.rotation.set(0, Math.PI / 4, 0);
                }
                if (controls) {
                    controls.reset();
                }
                camera.position.set(0, 0, 5);
            });
        }
        
        if (rotateRightBtn) {
            rotateRightBtn.addEventListener('click', () => {
                if (model) model.rotation.y += Math.PI / 4;
            });
        }
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Export the function to be called from main.js
window.initializeModelViewer = initializeModelViewer;

function showModelPlaceholder() {
    const container = document.querySelector('.model-viewer');
    if (container) {
        container.innerHTML = `
            <div class="model-placeholder">
                <div class="placeholder-icon"><i class="fas fa-cube"></i></div>
                <div class="placeholder-text">3D Model Viewer Unavailable</div>
                <div class="placeholder-subtext">Your browser may not support WebGL</div>
            </div>
        `;
    }
}

// Add this check before trying to create a GLTFLoader
function initializeModelViewer() {
    // Check if THREE.GLTFLoader exists
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader !== 'function') {
        console.error('THREE.GLTFLoader not available. Falling back to placeholder.');
        showModelPlaceholder();
        return;
    }
    
    // Rest of the initialization code...
    const loader = new THREE.GLTFLoader();
    // ...
} 