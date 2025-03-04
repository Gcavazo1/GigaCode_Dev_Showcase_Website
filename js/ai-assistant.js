/**
 * Advanced AI Assistant - Interactive chat interface with animations
 * 
 * This file provides the core functionality for the AI Assistant including:
 * - Chat interface with user interaction
 * - Response generation based on user queries
 * - Avatar animations and visual effects
 * - Voice synthesis for spoken responses
 * - Idle animations and interactive elements
 */

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
    
    generateResponse(input) {
        // Simple response generation based on keywords
        input = input.toLowerCase();
        
        if (input.includes('portfolio') || input.includes('website')) {
            return "This portfolio showcases advanced web development skills with cyberpunk aesthetics. It features interactive 3D models, holographic interfaces, audio visualization, and this AI assistant you're talking to!";
        } else if (input.includes('project') || input.includes('work')) {
            return "The portfolio highlights mobile apps, Roblox game development, 3D modeling, and interactive web experiences. Each project demonstrates technical skills and creative design.";
        } else if (input.includes('contact') || input.includes('hire') || input.includes('email')) {
            return "You can contact the developer through the social links in the navigation bar or by filling out the join team form at the bottom of the page.";
        } else if (input.includes('skill') || input.includes('technology') || input.includes('tech stack')) {
            return "The developer specializes in JavaScript, Three.js, WebGL, CSS animations, React, Flutter, and Roblox Lua programming. This portfolio demonstrates advanced front-end techniques like 3D rendering, audio visualization, and interactive UI.";
        } else if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
            return "Hello! I'm your cyberpunk AI assistant. I can tell you about this portfolio, the developer's projects, or how to get in touch.";
        } else if (input.includes('name') || input.includes('who are you')) {
            return "I'm the GigaCode AI Assistant, designed to help you navigate this portfolio and answer questions about the developer's work.";
        } else if (input.includes('thank')) {
            return "You're welcome! Feel free to ask if you have any other questions.";
        } else if (input.includes('music') || input.includes('audio') || input.includes('sound')) {
            return "This portfolio features a cyberpunk soundtrack with an interactive audio visualizer. You can control the music using the player in the Audio section.";
        } else if (input.includes('3d') || input.includes('model') || input.includes('showcase')) {
            return "The 3D showcase section features an interactive model rendered with Three.js. You can rotate and examine the model using the controls below it.";
        } else if (input.includes('holographic') || input.includes('holo') || input.includes('interface')) {
            return "The holographic interface demonstrates advanced CSS and JavaScript techniques to create a futuristic UI with animated elements like the neural network visualization and system status displays.";
        } else if (input.includes('roblox')) {
            return "The developer creates Roblox games like Cyber City Simulator and Neon Racer, showcasing skills in Lua programming, game design, and 3D modeling.";
        } else if (input.includes('mobile') || input.includes('app')) {
            return "The mobile apps section showcases applications built with Flutter and React Native, demonstrating cross-platform development skills.";
        } else {
            return "I'm programmed to provide information about this portfolio and the developer's work. Try asking about projects, skills, or contact information.";
        }
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
}); 