// Cyberpunk 3D Model Showcase
// Standalone function-based approach for multiple containers

// Check if WebGL is supported
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        console.warn('WebGL support check failed:', e);
        return false;
    }
}

// Initialize a 3D model viewer in a specific container
function initializeModelViewer(containerId, modelUrl, progressCallback) {
    // Set defaults for parameters
    modelUrl = modelUrl || 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf';
    
    // Get container element
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return null;
    }
    
    // Check WebGL support
    if (!isWebGLSupported()) {
        console.error('WebGL not supported by your browser');
        showModelPlaceholder(container);
        return null;
    }
    
    // Create loading text if it doesn't exist
    let loadingText = container.querySelector('.loading-text');
    if (!loadingText) {
        loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Loading 3D Model 0%';
        container.appendChild(loadingText);
    }
    
    // Create controls if they don't exist
    let controls = container.querySelector('.model-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.className = 'model-controls';
        controls.innerHTML = `
            <button id="${containerId}-rotate-left" class="neon-button">⟲</button>
            <button id="${containerId}-reset-view" class="neon-button">Reset</button>
            <button id="${containerId}-rotate-right" class="neon-button">⟳</button>
        `;
        container.appendChild(controls);
    }
    
    // Set up Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(
        75, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    camera.position.z = 5;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding || THREE.LinearEncoding; // Fallback for compatibility
    
    // Clear any existing canvas
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
        container.removeChild(existingCanvas);
    }
    
    container.appendChild(renderer.domElement);
    
    // Set up lights
    const lights = [];
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);
    
    // Directional light (cyan)
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
    directionalLight.position.set(0, 1, 2);
    scene.add(directionalLight);
    lights.push(directionalLight);
    
    // Point light (magenta)
    const purpleLight = new THREE.PointLight(0xff00ff, 1, 10);
    purpleLight.position.set(-2, 1, 3);
    scene.add(purpleLight);
    lights.push(purpleLight);
    
    // Point light (yellow)
    const yellowLight = new THREE.PointLight(0xf9f900, 1, 10);
    yellowLight.position.set(2, -1, 3);
    scene.add(yellowLight);
    lights.push(yellowLight);
    
    // Set up orbit controls
    const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    
    // Load 3D model
    let model = null;
    const loader = new THREE.GLTFLoader();
    
    // Custom progress callback
    const updateProgress = (progress) => {
        if (loadingText) {
            const percent = Math.floor(progress * 100);
            loadingText.textContent = `Loading 3D Model ${percent}%`;
            
            // Hide loading text when complete
            if (progress >= 1) {
                setTimeout(() => {
                    loadingText.style.opacity = '0';
                    setTimeout(() => {
                        if (loadingText.parentNode) {
                            loadingText.parentNode.removeChild(loadingText);
                        }
                    }, 500);
                }, 1000);
            }
        }
        
        // Call external progress callback if provided
        if (progressCallback) {
            progressCallback(progress);
        }
    };
    
    try {
        loader.load(
            modelUrl,
            (gltf) => {
                // Remove placeholder if it exists
                if (model) {
                    scene.remove(model);
                }
                
                // Add loaded model
                model = gltf.scene;
                model.scale.set(2, 2, 2); // Scale up for better visibility
                scene.add(model);
                
                // Center model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.x = -center.x;
                model.position.y = -center.y;
                model.position.z = -center.z;
                
                // Apply cyberpunk materials
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.metalness = 0.8;
                        child.material.roughness = 0.2;
                        child.material.emissive = new THREE.Color(0x00ffff);
                        child.material.emissiveIntensity = 0.5;
                    }
                });
                
                // Set up animation mixer if animations exist
                let mixer = null;
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                }
                
                // Update progress to completed
                updateProgress(1.0);
                console.log(`Model loaded in container ${containerId}`);
                
                // Set up control buttons
                setupModelControls(containerId, model, orbitControls, camera);
            },
            // Progress callback
            (xhr) => {
                updateProgress(xhr.loaded / xhr.total);
            },
            // Error callback
            (error) => {
                console.error(`Error loading model for ${containerId}:`, error);
                createFallbackModel(scene);
                updateProgress(1.0);
            }
        );
    } catch (error) {
        console.error(`Error in model loading process for ${containerId}:`, error);
        createFallbackModel(scene);
        updateProgress(1.0);
    }
    
    // Create fallback model if loading fails
    function createFallbackModel(scene) {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x003333,
            wireframe: true
        });
        model = new THREE.Mesh(geometry, material);
        scene.add(model);
    }
    
    // Set up post-processing with bloom effect
    const composer = setupPostProcessing(renderer, scene, camera);
    
    // Set up animation loop
    let autoRotate = true;
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Auto-rotate model
        if (autoRotate && model) {
            model.rotation.y += 0.005;
        }
        
        // Update controls
        orbitControls.update();
        
        // Animate lights
        const time = Date.now() * 0.001;
        lights.forEach((light, index) => {
            if (light.type === 'PointLight') {
                const radius = 3;
                light.position.x = Math.sin(time * 0.5 + index) * radius;
                light.position.z = Math.cos(time * 0.5 + index) * radius;
            }
        });
        
        // Render with post-processing
        composer.render();
    }
    
    // Start animation loop
    animate();
    
    // Handle window resize
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        composer.setSize(container.clientWidth, container.clientHeight);
    }
    
    window.addEventListener('resize', onWindowResize);
    
    // Set up model controls
    function setupModelControls(containerId, model, controls, camera) {
        const rotateLeftBtn = document.getElementById(`${containerId}-rotate-left`);
        const resetViewBtn = document.getElementById(`${containerId}-reset-view`);
        const rotateRightBtn = document.getElementById(`${containerId}-rotate-right`);
        
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
    
    // Set up post-processing
    function setupPostProcessing(renderer, scene, camera) {
        const composer = new THREE.EffectComposer(renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // Add bloom pass for glow effect
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(container.clientWidth, container.clientHeight),
            1.0,   // strength
            0.8,   // radius
            0.2    // threshold
        );
        composer.addPass(bloomPass);
        
        return composer;
    }
    
    // Return controller object for external control
    return {
        scene,
        camera,
        renderer,
        model,
        controls: orbitControls,
        toggleAutoRotate: () => {
            autoRotate = !autoRotate;
            return autoRotate;
        },
        dispose: () => {
            // Clean up resources
            window.removeEventListener('resize', onWindowResize);
            renderer.dispose();
            if (model) {
                scene.remove(model);
                model.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) object.material.dispose();
                });
            }
        }
    };
}

// Show placeholder if model can't be loaded
function showModelPlaceholder(container) {
    container.innerHTML = `
        <div class="model-placeholder">
            <div class="placeholder-icon"><i class="fas fa-cube"></i></div>
            <div class="placeholder-text">3D Model Viewer Unavailable</div>
            <div class="placeholder-subtext">Your browser may not support WebGL</div>
        </div>
    `;
}

// Initialize 3D model viewers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get all model containers by class
    const containers = document.querySelectorAll('.model-container');
    
    // If no containers with class are found, try the specific ID
    if (containers.length === 0) {
        const modelContainer = document.getElementById('model-container');
        if (modelContainer) {
            initializeModelViewer('model-container');
        } else {
            console.warn('No model containers found on page');
        }
    } else {
        // Initialize each container
        containers.forEach(container => {
            if (container.id) {
                initializeModelViewer(container.id);
            } else {
                console.warn('Model container missing ID attribute');
            }
        });
    }
});

// Make the function available globally
window.initializeModelViewer = initializeModelViewer; 