// Live2D Virtual Assistant for Cyberpunk Portfolio

class Live2DAssistant {
    constructor() {
        this.canvas = document.getElementById('live2d-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.model = null;
        this.app = null;
        this.modelPath = 'live2d/models/Haru.model3.json'; // Path relative to your website root
        this.fallbackImage = 'images/assistant-fallback.png';
        this.isLoaded = false;
        this.isError = false;
        
        // Initialize
        this.init();
        
        // Add resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    init() {
        try {
            console.log('Initializing Live2D...');
            
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            // Set canvas size
            this.canvas.width = 400;
            this.canvas.height = 600;
            
            // Check if required libraries are loaded
            if (typeof PIXI === 'undefined') {
                console.warn('PIXI library not loaded, using fallback');
                this.useFallback();
                return;
            }
            
            // Wait a moment to ensure all libraries are fully loaded
            setTimeout(() => {
                // Check again if Live2D is available
                if (typeof PIXI.live2d === 'undefined' || typeof PIXI.live2d.Live2DModel === 'undefined') {
                    console.warn('Live2D libraries not loaded, using fallback');
                    this.useFallback();
                    return;
                }
                
                // Setup Live2D
                this.setupLive2D();
            }, 500);
            
        } catch (error) {
            console.error('Error initializing Live2D:', error);
            this.useFallback();
        }
    }
    
    setupLive2D() {
        try {
            console.log('Setting up Live2D with detailed logging...');
            
            // Create PIXI Application with specific settings
            this.app = new PIXI.Application({
                view: this.canvas,
                autoStart: true,
                backgroundAlpha: 0,
                width: this.canvas.width,
                height: this.canvas.height,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });
            
            // Load model
            const isGitHubPages = window.location.hostname.includes('github.io');
            const baseUrl = isGitHubPages ? '/GigaCode_Dev_Showcase_Website' : '';
            const modelUrl = `${baseUrl}/${this.modelPath}`;
            
            console.log('Loading Live2D model from:', modelUrl);
            console.log('PIXI version:', PIXI.VERSION);
            
            // Initialize Live2D settings if available
            if (PIXI.live2d) {
                // For newer versions of pixi-live2d-display
                PIXI.live2d.config.motionFadingDuration = 500;
                PIXI.live2d.config.motionFadingInDuration = 1000;
                console.log('Live2D config updated');
            } else if (PIXI.live2d && PIXI.live2d.settings) {
                // For older versions
                PIXI.live2d.settings.motionFadingDuration = 500;
                PIXI.live2d.settings.motionFadingInDuration = 1000;
                console.log('Live2D settings updated');
            }
            
            // Add a loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="spinner"></div>
                <p>Loading Virtual Assistant...</p>
            `;
            this.canvas.parentNode.appendChild(loadingIndicator);
            
            // Function to remove loading indicator
            const removeLoader = () => {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
            };
            
            // Load the model with proper error handling
            if (PIXI.live2d && PIXI.live2d.Live2DModel) {
                PIXI.live2d.Live2DModel.from(modelUrl)
                    .then(model => {
                        console.log('Model loaded and ready to display');
                        this.model = model;
                        
                        // Add model to stage
                        this.app.stage.addChild(model);
                        
                        // Center the model
                        model.x = this.canvas.width / 2;
                        model.y = this.canvas.height / 2;
                        
                        // Scale the model
                        const scale = Math.min(
                            this.canvas.width / model.width,
                            this.canvas.height / model.height
                        ) * 0.8;
                        model.scale.set(scale);
                        
                        // Setup interaction
                        model.on('hit', this.handleModelTap.bind(this));
                        
                        this.isLoaded = true;
                        console.log('Live2D model loaded successfully and added to stage');
                        
                        // Remove loading indicator
                        removeLoader();
                        
                        // Start animation loop
                        this.animate();
                    })
                    .catch(error => {
                        console.error('Error loading Live2D model:', error);
                        console.error('Error stack:', error.stack);
                        removeLoader();
                        this.useFallback();
                    });
            } else {
                console.error('PIXI.live2d.Live2DModel is not available');
                removeLoader();
                this.useFallback();
            }
            
        } catch (error) {
            console.error('Error setting up Live2D model:', error);
            console.error('Error stack:', error.stack);
            this.useFallback();
        }
    }
    
    animate() {
        if (!this.isLoaded || this.isError) return;
        
        // Add idle animation
        if (this.model) {
            // Random blinking
            if (Math.random() < 0.01) {
                this.model.motion('idle', 0);
            }
        }
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    handleModelTap(hitAreas) {
        console.log('Model tapped:', hitAreas);
        
        // Play different animations based on hit area
        if (hitAreas.includes('head')) {
            this.model.motion('tap_head');
        } else if (hitAreas.includes('body')) {
            this.model.motion('tap_body');
        } else {
            this.model.motion('tap');
        }
        
        // Update assistant text
        const responses = [
            "How can I help you today?",
            "Need assistance with something?",
            "I'm here to help with your project!",
            "What would you like to know?",
            "Exploring the portfolio? Let me guide you!"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const assistantText = document.querySelector('.assistant-text');
        
        if (assistantText) {
            assistantText.textContent = '';
            this.typeText(assistantText, randomResponse);
        }
    }
    
    typeText(element, text, speed = 50) {
        let i = 0;
        element.classList.add('typing');
        
        const typing = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
                element.classList.remove('typing');
            }
        }, speed);
    }
    
    useFallback() {
        this.isError = true;
        
        if (!this.ctx) {
            console.error('Canvas context not available for fallback');
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create fallback element
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'fallback-assistant';
        fallbackDiv.innerHTML = `
            <div class="fallback-content">
                <div class="fallback-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h3>Virtual Assistant</h3>
                <p>I'm here to help you navigate this portfolio.</p>
                <div class="fallback-buttons">
                    <button class="cyber-button small">About Me</button>
                    <button class="cyber-button small">Projects</button>
                    <button class="cyber-button small">Contact</button>
                </div>
            </div>
        `;
        
        // Position the fallback element
        fallbackDiv.style.position = 'absolute';
        fallbackDiv.style.top = '0';
        fallbackDiv.style.left = '0';
        fallbackDiv.style.width = '100%';
        fallbackDiv.style.height = '100%';
        
        // Add to DOM
        this.canvas.parentNode.appendChild(fallbackDiv);
        this.canvas.style.display = 'none';
        
        // Add event listeners to buttons
        const buttons = fallbackDiv.querySelectorAll('.cyber-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const text = button.textContent.trim();
                const responseDiv = document.querySelector('.assistant-text');
                
                if (responseDiv) {
                    if (text === 'About Me') {
                        responseDiv.textContent = "I'm a virtual assistant designed to help you navigate this portfolio. The developer behind this site specializes in mobile apps, Roblox games, and interactive web experiences.";
                    } else if (text === 'Projects') {
                        responseDiv.textContent = "This portfolio showcases mobile apps, Roblox games, 3D models, and interactive web experiences. Check out the different sections to learn more!";
                    } else if (text === 'Contact') {
                        responseDiv.textContent = "You can contact the developer through the social links in the navigation bar or by filling out the join team form.";
                    }
                }
            });
        });
        
        console.log('Fallback UI displayed');
    }
    
    handleResize() {
        if (!this.canvas) return;
        
        // Get parent container dimensions
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Set canvas dimensions
        this.canvas.width = containerWidth;
        this.canvas.height = Math.min(600, containerWidth * 1.5);
        
        // Update PIXI application size
        if (this.app) {
            this.app.renderer.resize(this.canvas.width, this.canvas.height);
        }
        
        // Reposition and rescale model if loaded
        if (this.model && this.isLoaded) {
            // Center the model
            this.model.x = this.canvas.width / 2;
            this.model.y = this.canvas.height / 2;
            
            // Scale the model
            const scale = Math.min(
                this.canvas.width / this.model.width,
                this.canvas.height / this.model.height
            ) * 0.8;
            this.model.scale.set(scale);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Live2DAssistant();
}); 