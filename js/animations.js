// Animations JavaScript for Cyberpunk Portfolio

document.addEventListener('DOMContentLoaded', function() {
    // Initialize GSAP animations
    initGSAPAnimations();
    
    // Initialize typing effect
    initTypingEffect();
    
    // Initialize terminal command typing effect
    initTerminalCommandEffect();
    
    // Initialize glitch effect
    initGlitchEffect();
    
    // Initialize hover animations
    initHoverAnimations();
});

// GSAP animations for scroll-triggered effects
function initGSAPAnimations() {
    // Check if GSAP and ScrollTrigger are loaded
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate bio section
        gsap.from('#bio .section-header', {
            scrollTrigger: {
                trigger: '#bio',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 1
        });
        
        // Animate mobile apps section
        gsap.from('#mobile-apps .project-card', {
            scrollTrigger: {
                trigger: '#mobile-apps',
                start: 'top 70%',
                toggleActions: 'play none none none'
            },
            y: 100,
            opacity: 0,
            stagger: 0.2,
            duration: 0.8
        });
        
        // Animate Roblox projects section
        gsap.from('#roblox-projects .roblox-card', {
            scrollTrigger: {
                trigger: '#roblox-projects',
                start: 'top 70%',
                toggleActions: 'play none none none'
            },
            x: -100,
            opacity: 0,
            stagger: 0.2,
            duration: 0.8
        });
        
        // Animate donation section
        gsap.from('#donate .donation-button', {
            scrollTrigger: {
                trigger: '#donate',
                start: 'top 70%',
                toggleActions: 'play none none none'
            },
            scale: 0.5,
            opacity: 0,
            stagger: 0.2,
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
        
        // Animate recruitment section
        gsap.from('#join-team .animated-headline', {
            scrollTrigger: {
                trigger: '#join-team',
                start: 'top 70%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 1
        });
        
        gsap.from('#join-team .position-badge', {
            scrollTrigger: {
                trigger: '#join-team',
                start: 'top 60%',
                toggleActions: 'play none none none'
            },
            scale: 0,
            opacity: 0,
            stagger: 0.1,
            duration: 0.5,
            ease: 'back.out(1.7)'
        });
    }
}

// Typing effect for the tagline
function initTypingEffect() {
    // Get all terminal typing elements
    const typingElements = document.querySelectorAll('.terminal-typing');
    
    if (typingElements.length > 0) {
        // For each typing element, set up the text content
        typingElements.forEach((element, index) => {
            const text = element.getAttribute('data-text');
            element.textContent = ''; // Clear the element
            
            // Calculate delay based on index
            let delay;
            if (element.classList.contains('delay-1')) {
                delay = 3500;
            } else if (element.classList.contains('delay-2')) {
                delay = 7000;
            } else if (element.classList.contains('delay-3')) {
                delay = 10500;
            } else if (element.classList.contains('delay-4')) {
                delay = 14000;
            } else {
                delay = 1000;
            }
            
            // Start typing after delay
            setTimeout(() => {
                let i = 0;
                const typeSpeed = 30; // milliseconds
                
                function typeWriter() {
                    if (i < text.length) {
                        element.textContent += text.charAt(i);
                        // Force a reflow to ensure the text is visible
                        element.style.display = 'block';
                        i++;
                        setTimeout(typeWriter, typeSpeed);
                    }
                }
                
                typeWriter();
            }, delay);
        });
    }
    
    // We'll handle the home section typing text separately in the AI loading sequence
    // so we're removing this part to avoid conflicts
}

// Update the animation sequence
document.addEventListener('DOMContentLoaded', () => {
    const tagline = document.querySelector('.typing-text');
    const aiSection = document.querySelector('#virtual-assistant');
    
    // Initial delay before starting animations
    setTimeout(() => {
        // Start tagline typing
        if (tagline) {
            const taglineText = tagline.textContent;
            tagline.textContent = '';
            let charIndex = 0;
            
            function typeTagline() {
                if (charIndex < taglineText.length) {
                    tagline.textContent += taglineText.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeTagline, 50);
                } else {
                    // After tagline is typed, show loading sequence
                    const loadingSequence = document.createElement('div');
                    loadingSequence.className = 'loading-sequence';
                    loadingSequence.innerHTML = `
                        <div class="loading-text">Initializing AI Core</div>
                        <div class="loading-bar-container">
                            <div class="loading-bar"></div>
                            <div class="loading-percentage">0%</div>
                        </div>
                        <div class="loading-status">Establishing neural connection...</div>
                    `;
                    
                    document.querySelector('#home').appendChild(loadingSequence);
                    
                    // Animate loading sequence
                    setTimeout(() => {
                        loadingSequence.style.opacity = '1';
                        
                        // Update loading percentage
                        const percentageElement = loadingSequence.querySelector('.loading-percentage');
                        const loadingBar = loadingSequence.querySelector('.loading-bar');
                        const statusElement = loadingSequence.querySelector('.loading-status');
                        
                        let progress = 0;
                        const progressInterval = setInterval(() => {
                            progress += 1;
                            if (percentageElement) percentageElement.textContent = `${progress}%`;
                            if (loadingBar) loadingBar.style.width = `${progress}%`;
                            
                            // Update status messages
                            if (statusElement) {
                                if (progress === 20) {
                                    statusElement.textContent = "Calibrating quantum processors...";
                                } else if (progress === 40) {
                                    statusElement.textContent = "Loading neural pathways...";
                                } else if (progress === 60) {
                                    statusElement.textContent = "Synchronizing AI matrices...";
                                } else if (progress === 80) {
                                    statusElement.textContent = "Initializing consciousness core...";
                                }
                            }
                            
                            if (progress === 100) {
                                clearInterval(progressInterval);
                                if (statusElement) statusElement.textContent = "Neural network online";
                                
                                // Show AI Assistant
                                setTimeout(() => {
                                    if (aiSection) {
                                        aiSection.style.visibility = 'visible';
                                        aiSection.classList.add('loaded');
                                    }
                                    
                                    // Fade out loading sequence
                                    loadingSequence.style.opacity = '0';
                                    setTimeout(() => {
                                        loadingSequence.remove();
                                    }, 500);
                                }, 800);
                            }
                        }, 30);
                    }, 500);
                }
            }
            
            typeTagline();
        }
    }, 500);
});

// Update terminal command effect to accept a delay parameter
function initTerminalCommandEffect(delayed = false) {
    const commands = document.querySelectorAll('.terminal-command');
    
    commands.forEach((command, index) => {
        const text = command.textContent;
        command.textContent = '';
        
        // Calculate delay based on index and whether we want additional delay
        const delay = delayed ? 1000 + (index * 1500) : index * 3500;
        
        setTimeout(() => {
            let i = 0;
            const typeSpeed = 50;
            
            function typeCommand() {
                if (i < text.length) {
                    command.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeCommand, typeSpeed);
                }
            }
            
            typeCommand();
        }, delay);
    });
}

// Enhanced glitch effect
function initGlitchEffect() {
    const glitchText = document.querySelector('.glitch-text');
    
    if (glitchText) {
        // Make sure the highlighted letters stay yellow
        const highlightedLetters = document.querySelectorAll('.highlight-letter');
        highlightedLetters.forEach(letter => {
            letter.style.color = 'var(--yellow-color)';
            letter.style.textShadow = '0 0 10px rgba(249, 249, 0, 0.7)';
        });
        
        // Initial intensify
        setTimeout(() => {
            glitchText.classList.add('intensify');
            
            setTimeout(() => {
                glitchText.classList.remove('intensify');
                // Ensure letters are still yellow after effect
                highlightedLetters.forEach(letter => {
                    letter.style.color = 'var(--yellow-color)';
                });
            }, 500);
        }, 1000);
        
        // Randomly intensify the glitch effect more frequently
        setInterval(() => {
            glitchText.classList.add('intensify');
            
            setTimeout(() => {
                glitchText.classList.remove('intensify');
                // Ensure letters are still yellow after effect
                highlightedLetters.forEach(letter => {
                    letter.style.color = 'var(--yellow-color)';
                });
            }, Math.random() * 500 + 200);
        }, Math.random() * 2000 + 1000);
    }
}

// Hover animations for cards and buttons
function initHoverAnimations() {
    // Project cards hover effect
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
    });
    
    // Donation buttons glow effect
    const donationButtons = document.querySelectorAll('.donation-button');
    
    donationButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            const glow = this.querySelector('.button-glow');
            if (glow) {
                glow.style.opacity = '1';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            const glow = this.querySelector('.button-glow');
            if (glow) {
                glow.style.opacity = '0';
            }
        });
    });
    
    // Nav links hover effect
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            if (icon) {
                gsap.to(icon, {
                    scale: 1.2,
                    duration: 0.3,
                    ease: 'back.out(1.7)'
                });
            }
        });
        
        link.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            if (icon) {
                gsap.to(icon, {
                    scale: 1,
                    duration: 0.3
                });
            }
        });
    });
}

// Keep your existing scroll reveal logic for other sections
function checkReveal() {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;
    
    document.querySelectorAll('.reveal').forEach(element => {
        if (element.classList.contains('bio-content')) return; // Skip bio content
        
        const revealTop = element.getBoundingClientRect().top;
        if (revealTop < windowHeight - revealPoint) {
            element.classList.add('reveal-active');
        }
    });
}

// Add this function at the end of your animations.js file
function debugTerminal() {
    console.log("Debugging terminal elements:");
    
    const typingElements = document.querySelectorAll('.terminal-typing');
    typingElements.forEach((el, i) => {
        console.log(`Element ${i}:`, {
            text: el.textContent,
            dataText: el.getAttribute('data-text'),
            width: el.offsetWidth,
            height: el.offsetHeight,
            display: window.getComputedStyle(el).display,
            visibility: window.getComputedStyle(el).visibility,
            opacity: window.getComputedStyle(el).opacity,
            color: window.getComputedStyle(el).color
        });
    });
}

// Call this function after a delay
setTimeout(debugTerminal, 15000); 