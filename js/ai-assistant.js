// Advanced AI Assistant with Voice Synthesis and Animation
import GigaChodeDB from './gigachode-responses.js';

class AIAssistant {
    constructor() {
        this.messages = document.querySelector('.ai-chat-messages');
        this.input = document.getElementById('ai-input');
        this.sendButton = document.getElementById('ai-send');
        this.quickButtons = document.querySelectorAll('.ai-quick-actions button');
        this.avatar = document.querySelector('.ai-avatar');
        this.mouth = document.querySelector('.ai-mouth');
        this.eyes = document.querySelectorAll('.ai-eye');
        this.scanLine = document.querySelector('.ai-scan-line');
        this.isAnimating = false;
        this.voiceSynthesis = window.speechSynthesis;
        this.voices = [];
        
        // Use the personality from the database
        this.db = GigaChodeDB;
        this.personality = this.db.personality;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up event listeners
        this.sendButton.addEventListener('click', () => this.handleUserInput());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
        
        // Set up quick action buttons
        this.quickButtons.forEach(button => {
            button.addEventListener('click', () => {
                const query = button.getAttribute('data-query');
                this.input.value = query;
                this.handleUserInput();
            });
        });
        
        // Load voices for speech synthesis
        if (this.voiceSynthesis) {
            this.voiceSynthesis.onvoiceschanged = () => {
                this.voices = this.voiceSynthesis.getVoices();
                console.log('Voices loaded:', this.voices.length);
            };
        }
        
        // Start idle animation
        this.startIdleAnimation();
        
        // Add glitch effects
        this.createGlitchEffect();
    }
    
    handleUserInput() {
        const userInput = this.input.value.trim();
        if (userInput === '') return;
        
        // Add user message
        this.addMessage(userInput, 'user');
        
        // Clear input
        this.input.value = '';
        
        // Show thinking animation
        this.showThinking();
        
        // Process the input and generate a response after a delay
        setTimeout(() => {
            const response = this.generateResponse(userInput);
            this.addMessage(response, 'ai');
            this.speakResponse(response);
        }, 1000);
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}-message`;
        
        // For AI messages, add typing animation
        if (sender === 'ai') {
            messageDiv.innerHTML = '';
            this.messages.appendChild(messageDiv);
            this.typeText(messageDiv, text);
            this.animateSpeaking(text.length * 50); // Animate for the duration of the message
        } else {
            messageDiv.textContent = text;
            this.messages.appendChild(messageDiv);
        }
        
        // Scroll to bottom
        this.messages.scrollTop = this.messages.scrollHeight;
    }
    
    typeText(element, text, speed = 30) {
        let i = 0;
        const typing = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
                this.stopSpeakingAnimation();
            }
        }, speed);
    }
    
    generateResponse(userInput) {
        // Convert to lowercase for easier matching
        const input = userInput.toLowerCase();
        
        // Route to specific response categories based on input
        if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
            return this.db.getRandomResponse('greetings');
        }
        
        if (input.includes('who are you') || input.includes('your name') || input.includes('about you')) {
            return this.db.getRandomResponse('aboutMe');
        }
        
        if (input.includes('portfolio') || input.includes('showcase') || input.includes('projects')) {
            return this.db.getRandomResponse('portfolio');
        }
        
        if (input.includes('mobile') || input.includes('apps') || input.includes('applications')) {
            return this.db.getRandomResponse('mobileApps');
        }
        
        if (input.includes('roblox') || input.includes('game') || input.includes('gaming')) {
            return this.db.getRandomResponse('roblox');
        }
        
        if (input.includes('web apps') || input.includes('web app') || input.includes('neon rush') || input.includes('axolotl')) {
            return this.db.getRandomResponse('webApps');
        }
        
        if (input.includes('3d') || input.includes('model') || input.includes('modeling')) {
            return this.db.getRandomResponse('models');
        }
        
        if (input.includes('music') || input.includes('audio') || input.includes('sound')) {
            return this.db.getRandomResponse('audio');
        }
        
        if (input.includes('holographic') || input.includes('interface') || input.includes('ui')) {
            return this.db.getRandomResponse('holographicUI');
        }
        
        if (input.includes('glsl') || input.includes('shader') || input.includes('multiverse')) {
            return this.db.getRandomResponse('multiverse');
        }
        
        if (input.includes('contact') || input.includes('hire') || input.includes('github')) {
            return this.db.getRandomResponse('contact');
        }
        
        // Handle services and hire-me inquiries
        if (input.includes('service') || input.includes('development') || input.includes('freelance') || 
            input.includes('website') || input.includes('web design') || input.includes('e-commerce') || 
            input.includes('pricing') || input.includes('cost')) {
            return this.db.getRandomResponse('services');
        }
        
        // Handle landing page examples
        if (input.includes('landing page') || input.includes('examples') || input.includes('mockup') || 
            input.includes('moonpups') || input.includes('cognicube') || input.includes('normas')) {
            return this.db.getRandomResponse('portfolioExamples');
        }
        
        if (input.includes('your purpose') || input.includes('why were you made') || input.includes('what do you do')) {
            return this.db.getRandomResponse('purpose');
        }
        
        if (input.includes('joke') || input.includes('funny') || input.includes('humor')) {
            return this.db.getRandomJoke();
        }
        
        if (input.includes('your name') || input.includes('gigachode') || input.includes('called')) {
            return this.db.getRandomResponse('name');
        }
        
        // Check for work, link tree, and personal website inquiries 
        if (input.includes('work') || input.includes('link tree') || input.includes('personal website') || 
            input.includes('personal link') || input.includes('portfolio site')) {
            return this.db.getRandomResponse('services');
        }
        
        // If no specific match, provide a general response from defaults
        return this.db.getRandomResponse('default');
    }
    
    speakResponse(text) {
        if (!this.voiceSynthesis) return;
        
        // Cancel any ongoing speech
        this.voiceSynthesis.cancel();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice (prefer a female voice)
        if (this.voices.length > 0) {
            const femaleVoice = this.voices.find(voice => voice.name.includes('Female') || voice.name.includes('female'));
            utterance.voice = femaleVoice || this.voices[0];
        }
        
        // Set properties
        utterance.pitch = 1.2;
        utterance.rate = 1.1;
        utterance.volume = 0.8;
        
        // Speak
        this.voiceSynthesis.speak(utterance);
    }
    
    showThinking() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'ai-message ai-thinking';
        thinkingDiv.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        this.messages.appendChild(thinkingDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        // Animate avatar to show thinking
        this.avatar.classList.add('thinking');
        
        // Remove thinking indicator after response
        setTimeout(() => {
            if (thinkingDiv.parentNode) {
                thinkingDiv.parentNode.removeChild(thinkingDiv);
            }
            this.avatar.classList.remove('thinking');
        }, 1000);
    }
    
    startIdleAnimation() {
        // Blink randomly
        setInterval(() => {
            if (!this.isAnimating) {
                this.blinkEyes();
            }
        }, 3000);
        
        // Scan line animation is handled by CSS
    }
    
    blinkEyes() {
        this.eyes.forEach(eye => {
            eye.classList.add('blink');
            setTimeout(() => {
                eye.classList.remove('blink');
            }, 200);
        });
    }
    
    animateSpeaking(duration) {
        this.isAnimating = true;
        this.avatar.classList.add('speaking');
        
        // Animate mouth
        const mouthAnimation = setInterval(() => {
            const height = Math.random() * 5 + 2;
            this.mouth.style.height = `${height}px`;
        }, 100);
        
        // Stop animation after duration
        setTimeout(() => {
            clearInterval(mouthAnimation);
            this.stopSpeakingAnimation();
        }, duration);
    }
    
    stopSpeakingAnimation() {
        this.mouth.style.height = '2px';
        this.avatar.classList.remove('speaking');
        this.isAnimating = false;
    }
    
    // Add a method to create random glitch effects
    createGlitchEffect() {
        // Randomly create glitch effects
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance of glitch
                this.triggerGlitch();
            }
        }, 5000);
    }
    
    // Method to trigger a glitch effect
    triggerGlitch() {
        const glitchElement = document.querySelector('.glitch-effect');
        if (!glitchElement) return;
        
        // Create random glitch elements
        const glitchCount = Math.floor(Math.random() * 5) + 3;
        let glitchHTML = '';
        
        for (let i = 0; i < glitchCount; i++) {
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const width = Math.random() * 50 + 10;
            const height = Math.random() * 10 + 2;
            const color = Math.random() < 0.5 ? '#00ffff' : '#ff00ff';
            
            glitchHTML += `<div style="
                position: absolute;
                top: ${top}%;
                left: ${left}%;
                width: ${width}px;
                height: ${height}px;
                background-color: ${color};
                opacity: 0.7;
                z-index: 4;
            "></div>`;
        }
        
        glitchElement.innerHTML = glitchHTML;
        
        // Show glitch effect
        glitchElement.style.opacity = '1';
        
        // Hide after a short time
        setTimeout(() => {
            glitchElement.style.opacity = '0';
            setTimeout(() => {
                glitchElement.innerHTML = '';
            }, 300);
        }, 150);
    }
    
    // Helper method to get random catchphrase - now using the database
    getRandomCatchphrase() {
        return this.db.getRandomCatchphrase();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
});

// FIXED: Create theme toggle button function with improved targeting and visibility
const createThemeToggle = () => {
    console.log("Attempting to create GigaChode theme toggle button");
    
    // Try to find the title area that contains "GIGACHODE AI V2.0"
    const titleArea = document.querySelector('.ai-chat-interface .interface-header, .ai-window-title');
    if (!titleArea) {
        console.log("Could not find title area");
        return false;
    }
    
    // Create toggle button with cyberpunk styling
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'gigachode-theme-toggle';
    toggleBtn.className = 'gigachode-toggle';
    toggleBtn.innerHTML = '⚙️'; // Using a gear icon instead of rotation
    toggleBtn.title = 'Toggle AI Personality';
    
    // Apply cyberpunk styling to match your UI
    Object.assign(toggleBtn.style, {
        background: 'none',
        border: 'none',
        color: '#00ffff',
        cursor: 'pointer',
        fontSize: '20px',
        padding: '5px',
        marginRight: '10px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: '100',
        transition: 'transform 0.3s ease'
    });
    
    // Add it before the dots menu if it exists
    const dotsMenu = titleArea.querySelector('.dots-menu, .menu-dots');
    if (dotsMenu) {
        dotsMenu.parentNode.insertBefore(toggleBtn, dotsMenu);
    } else {
        // Otherwise add it to the end of the title area
        titleArea.appendChild(toggleBtn);
    }
    
    // Add hover effect
    toggleBtn.addEventListener('mouseenter', () => {
        toggleBtn.style.transform = 'rotate(180deg)';
    });
    
    toggleBtn.addEventListener('mouseleave', () => {
        toggleBtn.style.transform = 'rotate(0deg)';
    });
    
    return true;
}; 