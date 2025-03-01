// New dedicated JS file for terminal effects
document.addEventListener('DOMContentLoaded', function() {
    // Initialize terminal typing effect
    initTerminalTyping();
    
    // Reveal bio content after AI Assistant loads
    setTimeout(() => {
        const bioContent = document.querySelector('.bio-content');
        if (bioContent) {
            bioContent.classList.add('reveal-active');
        }
    }, 3000);
});

function initTerminalTyping() {
    const commands = document.querySelectorAll('.terminal-command');
    
    commands.forEach((command, index) => {
        const text = command.getAttribute('data-text') || command.textContent;
        command.textContent = '';
        
        // Calculate delay based on index
        const delay = 3000 + (index * 1500);
        
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