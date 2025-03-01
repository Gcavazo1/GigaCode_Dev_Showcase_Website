// Dedicated JS file for AI loading animation
document.addEventListener('DOMContentLoaded', function() {
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
        
        console.log("Starting tagline typing with text:", taglineText);
        
        // Type the tagline character by character
        let charIndex = 0;
        function typeTagline() {
            if (charIndex < taglineText.length) {
                tagline.textContent += taglineText.charAt(charIndex);
                charIndex++;
                setTimeout(typeTagline, 50);
            } else {
                console.log("Tagline typing complete, showing loading sequence");
                // After tagline is typed, show loading sequence
                showLoadingSequence();
            }
        }
        
        // Start typing
        typeTagline();
    }, 500);
    
    // Function to show and animate the loading sequence
    function showLoadingSequence() {
        // Create loading sequence element
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
        
        // Add to DOM
        const homeSection = document.querySelector('#home');
        if (homeSection) {
            homeSection.appendChild(loadingSequence);
            
            // Animate loading sequence
            setTimeout(() => {
                loadingSequence.style.opacity = '1';
                
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
                        
                        // Show AI Assistant
                        setTimeout(() => {
                            if (aiSection) {
                                aiSection.style.visibility = 'visible';
                                aiSection.classList.add('loaded');
                                console.log("AI Assistant revealed");
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
}); 