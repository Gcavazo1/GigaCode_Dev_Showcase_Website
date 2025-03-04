/**
 * AI Loading Sequence - Handles loading animation and transition to AI Assistant
 * 
 * This file creates and manages the cyberpunk-style loading sequence
 * that appears before revealing the AI Assistant interface.
 * It handles:
 * - Creating the loading bar and animation
 * - Progressive status updates
 * - Smooth transition to the AI Assistant
 */

// Dedicated JS file for AI loading animation
document.addEventListener('DOMContentLoaded', function () {
    const tagline = document.querySelector('.typing-text');
    const aiSection = document.querySelector('#virtual-assistant');

    // Flag to ensure we only initialize once
    let initialized = false;

    // Initial delay before starting animations
    setTimeout(() => {
        // Prevent multiple initializations
        if (initialized || !tagline) return;
        initialized = true;

        // Store original text and clear it
        const taglineText = tagline.getAttribute('data-text') || tagline.textContent;
        tagline.textContent = '';

        // Create loading sequence element right away
        const loadingSequence = document.createElement('div');
        loadingSequence.innerHTML = `
        <div class="loading-bar-container">
            <div class="loading-bar"></div>
            <div class="loading-percentage">0%</div>
        </div>
        <div class="loading-text" data-text="Establishing neural connection...">Establishing neural connection...</div>
        <div class="loading-status">Initializing...</div>
    `; 

        // Add to DOM
        const homeSection = document.querySelector('#home');
        if (homeSection) {
            homeSection.appendChild(loadingSequence);

            // Start with opacity 0
            loadingSequence.style.opacity = '0';

            // Type the tagline character by character
            let charIndex = 0;
            function typeTagline() {
                if (charIndex < taglineText.length) {
                    tagline.textContent += taglineText.charAt(charIndex);
                    tagline.classList.add('typing');
                    charIndex++;

                    // When we're halfway through typing, start fading in the loading bar
                    if (charIndex === Math.floor(taglineText.length / 2)) {
                        loadingSequence.style.opacity = '1';
                    }

                    setTimeout(typeTagline, 50);
                } else {
                    tagline.classList.remove('typing');
                    console.log("Tagline typing complete, showing loading sequence");

                    // Start the loading bar animation
                    animateLoadingBar(loadingSequence, aiSection);
                }
            }

            // Start typing
            typeTagline();
        }
    }, 500);

    // Function to animate the loading bar
    function animateLoadingBar(loadingSequence, aiSection) {
        // Get elements
        const percentageElement = loadingSequence.querySelector('.loading-percentage');
        const loadingBar = loadingSequence.querySelector('.loading-bar');
        const statusElement = loadingSequence.querySelector('.loading-status');

        // Animate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 1;

            // Update percentage and bar width
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

            // When complete
            if (progress === 100) {
                clearInterval(progressInterval);
                if (statusElement) statusElement.textContent = "Neural network online";

                // Position the AI Assistant in the same place as the loading sequence
                positionAIAssistant(loadingSequence, aiSection);

                // Fade out loading sequence and show AI with fade-in effect
                setTimeout(() => {
                    // Fade out loading sequence
                    loadingSequence.style.opacity = '0';

                    // After loading sequence is gone, show AI with fade-in effect
                    setTimeout(() => {
                        loadingSequence.remove();
                        showAIWithTVEffect(aiSection);
                    }, 300);
                }, 300);
            }
        }, 30);
    }

    // Function to position the AI Assistant in the same place as the loading sequence
    function positionAIAssistant(loadingSequence, aiSection) {
        if (!aiSection || !loadingSequence) return;

        // Make AI visible but with 0 opacity
        aiSection.style.visibility = 'visible';
        aiSection.style.opacity = '0';

        // Position it in the same place
        const loadingRect = loadingSequence.getBoundingClientRect();
        const homeSection = document.querySelector('#home');
        const homeRect = homeSection.getBoundingClientRect();

        // Calculate position relative to home section
        const topOffset = loadingRect.top - homeRect.top;

        // Set AI position
        aiSection.style.position = 'absolute';
        aiSection.style.top = `${topOffset}px`;
        aiSection.style.left = '0';
        aiSection.style.right = '0';
        aiSection.style.margin = '0 auto'; // Center it horizontally
        aiSection.style.width = `${loadingSequence.offsetWidth}px`; // Match width
        aiSection.style.zIndex = '10'; // Ensure it's above other elements
    }

    // Function to show AI with a glitch effect
    function showAIWithTVEffect(aiSection) {
        if (!aiSection) return;
        
        console.log("Starting AI assistant reveal");
        
        // Make sure AI is visible from the start
        aiSection.style.visibility = 'visible';
        aiSection.style.opacity = '0';
        
        // Position it correctly immediately
        aiSection.style.position = 'relative';
        aiSection.style.top = '0';
        aiSection.style.left = '0';
        aiSection.style.right = '0';
        aiSection.style.width = '100%';
        
        // Small delay before fading in
        setTimeout(() => {
            console.log("Fading in AI assistant");
            
            // Set explicit opacity
            aiSection.style.opacity = '1';
            
            // Add fade-in class for animation
            aiSection.classList.add('fade-in-effect');
            
            // After fade completes, add loaded class
            setTimeout(() => {
                console.log("AI assistant fade complete, adding loaded class");
                
                // Add loaded class
                aiSection.classList.add('loaded');
                
                // Ensure the pulse-glow animation continues
                aiSection.style.animation = 'pulse-glow 4s ease-in-out infinite alternate';
                
                console.log("AI Assistant fully loaded");
            }, 600);
        }, 300);
    }
}); 