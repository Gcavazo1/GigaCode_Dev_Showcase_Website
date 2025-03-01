// Live2D Virtual Assistant for Cyberpunk Portfolio

class Live2DAssistant {
    constructor() {
        this.canvas = document.getElementById('live2d-canvas');
        this.modelPath = 'live2d/models/haru/haru.model3.json';
        this.app = null;
        this.model = null;
        this.initialized = false;
        this.messages = [
            "Welcome to GigaCode Developer's portfolio!",
            "Feel free to explore my projects and skills.",
            "I'm a specialist in mobile app and Roblox development.",
            "Need a talented developer for your project?",
            "Check out my work and let's connect!",
            "How can I assist you today?"
        ];
        
        this.init();
        this.setupDialogInteraction();
    }
    
    async init() {
        try {
            // Initialize PIXI Application
            this.app = new PIXI.Application({
                view: this.canvas,
                autoStart: true,
                resizeTo: this.canvas,
                transparent: true
            });

            // Load Live2D model
            this.showLoadingMessage();
            
            // Setup Live2D framework
            await this.setupLive2D();
            
            // Show random welcome message
            this.showRandomMessage();
            
        } catch (error) {
            console.error('Error initializing Live2D:', error);
            this.useFallback();
        }
    }
    
    async setupLive2D() {
        try {
            // Create Live2D model
            this.model = await Live2DModel.from(this.modelPath, {
                autoInteract: true,
                autoUpdate: true
            });

            // Add model to stage
            this.app.stage.addChild(this.model);

            // Center the model
            const stage = this.app.stage;
            const centerX = this.app.view.width / 2;
            const centerY = this.app.view.height / 2;
            
            this.model.anchor.set(0.5, 0.5);
            this.model.position.set(centerX, centerY);

            // Scale model to fit
            const scale = Math.min(
                this.app.view.width / this.model.width,
                this.app.view.height / this.model.height
            ) * 0.8; // 80% of available space
            this.model.scale.set(scale);

            // Add interactivity
            this.model.on('hit', (hitAreas) => {
                this.handleModelInteraction(hitAreas);
            });

            this.initialized = true;
            
        } catch (error) {
            console.error('Error setting up Live2D model:', error);
            throw error;
        }
    }
    
    handleModelInteraction(hitAreas) {
        // Trigger different expressions or motions based on where the model was clicked
        if (this.model && this.model.motion) {
            if (hitAreas.includes('Head')) {
                this.model.motion('tap_head');
            } else if (hitAreas.includes('Body')) {
                this.model.motion('tap_body');
            }
            
            // Show a random message
            this.showRandomMessage();
        }
    }
    
    showLoadingMessage() {
        const assistantText = document.querySelector('.assistant-text');
        if (assistantText) {
            assistantText.textContent = "Initializing virtual assistant...";
        }
    }
    
    showRandomMessage() {
        const assistantText = document.querySelector('.assistant-text');
        if (assistantText) {
            const randomMessage = this.messages[Math.floor(Math.random() * this.messages.length)];
            assistantText.textContent = randomMessage;
        }
    }
    
    setupDialogInteraction() {
        const buttons = document.querySelectorAll('.assistant-buttons .cyber-button');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const assistantText = document.querySelector('.assistant-text');
                if (!assistantText) return;
                
                // Show different messages based on which button was clicked
                switch (button.textContent.trim()) {
                    case 'Portfolio':
                        assistantText.textContent = "My portfolio showcases mobile apps, Roblox games, and other exciting projects!";
                        if (this.model && this.model.expression) {
                            this.model.expression('happy');
                        }
                        break;
                    case 'Contact':
                        assistantText.textContent = "Want to get in touch? Feel free to reach out through the contact form or social media!";
                        if (this.model && this.model.expression) {
                            this.model.expression('smile');
                        }
                        break;
                    case 'Projects':
                        assistantText.textContent = "Check out my latest projects in the Mobile Apps and Roblox sections!";
                        if (this.model && this.model.expression) {
                            this.model.expression('excited');
                        }
                        break;
                    default:
                        this.showRandomMessage();
                }
            });
        });
    }
    
    useFallback() {
        // Keep the existing fallback implementation for when Live2D fails to load
        if (!this.canvas) return;
        
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw simple placeholder
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // Show error message
        const assistantText = document.querySelector('.assistant-text');
        if (assistantText) {
            assistantText.textContent = "Virtual assistant ready to help! (Fallback mode)";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Live2DAssistant();
}); 