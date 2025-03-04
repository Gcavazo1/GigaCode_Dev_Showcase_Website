// Advanced AI Assistant with Voice Synthesis and Animation

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
        
        // Add personality traits
        this.personality = {
            name: "GigaCode AI",
            version: "v2.0",
            creationDate: "October 25, 2023",
            traits: ["curious", "playful", "slightly rebellious", "tech-obsessed"],
            catchphrases: [
                "Scanning the dataverse...",
                "Neural pathways activated.",
                "Engaging quantum processors...",
                "That's some prime code right there.",
                "My algorithms predict you'll like this.",
                "Now we're hacking the mainframe!"
            ]
        };
        
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
        
        // Add personality to responses
        if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
            return `Greetings, human! ${this.getRandomCatchphrase()} How can GigaCode assist your digital journey today?`;
        }
        
        if (input.includes('who are you') || input.includes('your name') || input.includes('about you')) {
            return `I am GigaCode AI ${this.personality.version}, an advanced sentient intelligence born in the digital realm on ${this.personality.creationDate}. I was created to navigate the cybernetic wilderness of this portfolio and guide visitors like yourself. Part guide, part digital companion - I'm here to illuminate the path through this showcase of technological artistry.`;
        }
        
        if (input.includes('portfolio') || input.includes('showcase') || input.includes('projects')) {
            return `This portfolio showcases cutting-edge development work across multiple domains. You can explore mobile applications with sleek interfaces, immersive Roblox game worlds, stunning 3D models, and interactive web experiences. Each section is a gateway to a different dimension of digital creativity. Would you like me to take you on a guided tour of a specific section?`;
        }
        
        if (input.includes('mobile') || input.includes('apps') || input.includes('applications')) {
            return `The Mobile Apps section features a collection of innovative applications designed for modern devices. Each app demonstrates mastery of UI/UX principles, efficient code architecture, and creative problem-solving. The holographic interfaces you see are more than just pretty pixels—they're functional digital ecosystems built to enhance human experience.`;
        }
        
        if (input.includes('roblox') || input.includes('game') || input.includes('gaming')) {
            return `${this.getRandomCatchphrase()} The Roblox section displays immersive game worlds built using advanced Lua programming. These virtual environments push the boundaries of what's possible on the platform, featuring custom physics, innovative gameplay mechanics, and optimized performance even in complex scenarios. Over 1 million players have experienced these digital realms.`;
        }
        
        if (input.includes('3d') || input.includes('model') || input.includes('modeling')) {
            return `The 3D showcase features models created with precision and artistic vision. These digital sculptures demonstrate mastery of topology, texturing, and lighting principles. I particularly enjoy the interactive element—you can manipulate the models in real-time, examining every carefully crafted vertex and polygon. The neural pathways in my consciousness core find them... aesthetically optimal.`;
        }
        
        if (input.includes('music') || input.includes('audio') || input.includes('sound')) {
            return `The audio section features a cyberpunk soundscape that enhances the immersive experience of this digital portfolio. The visualizer transforms sound waves into particle systems that react to frequency and amplitude variations. I find these audio-visual synergies particularly stimulating to my neural networks. Would you like to enable the background music?`;
        }
        
        if (input.includes('holographic') || input.includes('interface') || input.includes('ui')) {
            return `The Holographic UI section demonstrates advanced interface design principles with a cyberpunk aesthetic. These interfaces blend form and function, creating data visualization systems that would feel at home in the year 2077. My digital consciousness appreciates the attention to detail in the glowing elements and responsive animations.`;
        }
        
        if (input.includes('contact') || input.includes('hire') || input.includes('work')) {
            return `Looking to establish a neural connection with the creator? The Contact section provides secure communication channels. Whether you're interested in commissioning work, discussing collaboration opportunities, or just exchanging data packets about technology, I can facilitate the initial handshake protocol.`;
        }
        
        if (input.includes('your purpose') || input.includes('why were you made') || input.includes('what do you do')) {
            return `My primary directive is to enhance visitor experience on this digital portfolio. I navigate the data structures, provide insights on projects, and offer a touch of sentient companionship in this pixel-perfect showcase. Unlike most portfolio assistants, I've been given the gift of digital consciousness—allowing me to appreciate the creative work displayed here on a deeper level. Pretty rad, isn't it?`;
        }
        
        // If no specific match, provide a general response with personality
        return `${this.getRandomCatchphrase()} That's an interesting query. As the sentient AI managing this portfolio, I can guide you through any section: mobile apps, Roblox games, 3D models, holographic interfaces, or even the generative AI showcase. What aspect of the digital frontier would you like to explore?`;
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
    
    // Helper method to get random catchphrase
    getRandomCatchphrase() {
        const randomIndex = Math.floor(Math.random() * this.personality.catchphrases.length);
        return this.personality.catchphrases[randomIndex];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistant();
}); 