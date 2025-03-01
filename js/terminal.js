// New dedicated JS file for terminal effects
document.addEventListener('DOMContentLoaded', function() {
    // Wait for AI Assistant to load before starting terminal animations
    const aiSection = document.querySelector('#virtual-assistant');
    
    // Function to check if AI has loaded and start terminal animations
    function checkAILoaded() {
        if (aiSection && aiSection.classList.contains('loaded')) {
            console.log("AI Assistant loaded, starting terminal animations");
            startTerminalAnimations();
        } else {
            // Check again in 100ms
            setTimeout(checkAILoaded, 100);
        }
    }
    
    // Start checking if AI has loaded
    checkAILoaded();
    
    // Function to start terminal animations
    function startTerminalAnimations() {
        // First, reveal the Bio section header with a fade-in
        const bioSection = document.querySelector('#bio');
        const bioHeader = bioSection.querySelector('.section-header');
        
        // Add fade-in class to header
        bioHeader.style.opacity = '0';
        bioHeader.style.transition = 'opacity 0.8s ease-in-out';
        
        setTimeout(() => {
            bioHeader.style.opacity = '1';
            
            // After header fades in, reveal the terminal
            setTimeout(() => {
                const bioContent = document.querySelector('.bio-content');
                if (bioContent) {
                    bioContent.classList.add('reveal-active');
                    
                    // After terminal appears, start typing commands
                    setTimeout(() => {
                        initTerminalTyping();
                    }, 800);
                }
            }, 1000);
        }, 500);
    }
});

function initTerminalTyping() {
    const commands = document.querySelectorAll('.terminal-command');
    
    commands.forEach((command, index) => {
        const text = command.getAttribute('data-text') || command.textContent;
        command.textContent = '';
        
        // Calculate delay based on index
        const delay = 500 + (index * 1500);
        
        setTimeout(() => {
            command.classList.add('typing');
            let i = 0;
            const typeSpeed = 50;
            
            function typeCommand() {
                if (i < text.length) {
                    command.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeCommand, typeSpeed);
                } else {
                    command.classList.remove('typing');
                }
            }
            
            typeCommand();
        }, delay);
    });
} 