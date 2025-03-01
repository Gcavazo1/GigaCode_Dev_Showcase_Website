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
            
            // Check if Live2D is available
            if (typeof PIXI === 'undefined' || typeof PIXI.Live2DModel === 'undefined') {
                console.warn('Live2D libraries not loaded, using fallback');
                this.useFallback();
                return;
            }
            
            // Setup Live2D
            this.setupLive2D();
            
        } catch (error) {
            console.error('Error initializing Live2D:', error);
            this.useFallback();
        }
    }
    
    setupLive2D() {
        try {
            // Create PIXI Application
            this.app = new PIXI.Application({
                view: this.canvas,
                autoStart: true,
                backgroundAlpha: 0,
                width: this.canvas.width,
                height: this.canvas.height
            });
            
            // Load model
            const isGitHubPages = window.location.hostname.includes('github.io');
            const baseUrl = isGitHubPages ? '/GigaCode_Dev_Showcase_Website' : '';
            const modelUrl = `${baseUrl}/${this.modelPath}`;
            
            console.log('Loading Live2D model from:', modelUrl);
            
            // Set up model settings
            PIXI.live2d.settings.motionFadingDuration = 500;
            PIXI.live2d.settings.motionFadingInDuration = 1000;
            
            // Load the model with custom handling for renamed folders
            PIXI.live2d.Live2DModel.from(modelUrl, {
                onError: (e) => {
                    console.error('Error loading model:', e);
                    this.useFallback();
                },
                onLoad: (model) => {
                    console.log('Model loaded successfully');
                }
            }).then(model => {
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
                console.log('Live2D model loaded successfully');
                
                // Start animation loop
                this.animate();
                
            }).catch(error => {
                console.error('Error loading Live2D model:', error);
                this.useFallback();
            });
            
        } catch (error) {
            console.error('Error setting up Live2D model:', error);
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
            <div>
                <i class="fas fa-robot" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>Virtual Assistant</p>
                <p style="font-size: 14px; opacity: 0.7;">Interactive model unavailable</p>
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
        
        console.log('Fallback UI displayed');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Live2DAssistant();
}); 