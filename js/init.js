// Main initialization file
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components in the correct order
    
    // 1. First, initialize particles background
    if (typeof initParticles === 'function') {
        initParticles();
    }
    
    // 2. Initialize AI loading sequence
    // This is handled by ai-loading.js
    
    // 3. Initialize terminal effects
    // This is handled by terminal.js
    
    // 4. Initialize holographic UI
    // This is handled by holographic-ui.js
    
    // 5. Initialize 3D model viewer
    if (document.getElementById('model-showcase')) {
        if (typeof window.initializeModelViewer === 'function') {
            window.initializeModelViewer('model-showcase');
        }
    }
    
    // 6. Initialize GAN showcase
    // This is handled by gan-showcase.js
    
    // 7. Initialize audio visualizer
    // This is handled by audio-visualizer.js
    
    // 8. Initialize mobile menu
    // This is handled by mobile-menu.js
}); 