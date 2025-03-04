/**
 * PowerShell Music Widget Controller
 * Handles audio playback and visualizer integration
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const psWidget = document.querySelector('.ps-music-widget');
    const enableAudioBtn = document.querySelector('.ps-enable-audio');
    const toggleVisualizerBtn = document.querySelector('.ps-toggle-visualizer');
    const statusIndicator = document.querySelector('.ps-status');
    const visualizerStatus = document.querySelector('.ps-visualizer-status');
    const eqContainer = document.querySelector('.ps-eq-container');
    const minimizeBtn = document.querySelector('.ps-minimize');
    const maximizeBtn = document.querySelector('.ps-maximize');
    const closeBtn = document.querySelector('.ps-close');
    
    // Audio context and elements
    let audioContext;
    let audioElement;
    let visualizerEnabled = false;
    let audioEnabled = false;
    
    // Initialize audio context on user interaction (required by browsers)
    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("Audio context initialized");
                
                // Find the audio element
                audioElement = document.querySelector('audio');
                
                if (audioElement) {
                    // Connect audio element to context
                    const source = audioContext.createMediaElementSource(audioElement);
                    source.connect(audioContext.destination);
                    
                    // Update status
                    audioEnabled = true;
                    statusIndicator.textContent = "Active";
                    statusIndicator.classList.add('active');
                    statusIndicator.classList.remove('inactive');
                    
                    // Activate EQ animation
                    eqContainer.classList.add('active');
                    
                    // Update button text
                    enableAudioBtn.textContent = "AUDIO ENABLED";
                    enableAudioBtn.classList.add('clicked');
                    
                    // Play audio if it exists
                    if (audioElement.readyState >= 2) {
                        audioElement.play().catch(e => {
                            console.warn("Autoplay prevented:", e);
                        });
                    }
                    
                    console.log("Audio system enabled");
                } else {
                    console.warn("No audio element found");
                }
            } catch (e) {
                console.error("Error initializing audio context:", e);
            }
        }
    }
    
    // Toggle visualizer
    function toggleVisualizer() {
        visualizerEnabled = !visualizerEnabled;
        
        // Update status
        visualizerStatus.textContent = visualizerEnabled ? "Enabled" : "Disabled";
        visualizerStatus.classList.toggle('enabled', visualizerEnabled);
        visualizerStatus.classList.toggle('disabled', !visualizerEnabled);
        
        // Update button appearance
        toggleVisualizerBtn.classList.add('clicked');
        setTimeout(() => toggleVisualizerBtn.classList.remove('clicked'), 800);
        
        // Trigger visualizer if it exists
        if (window.toggleBackgroundVisualizer) {
            window.toggleBackgroundVisualizer(visualizerEnabled);
        }
        
        console.log("Visualizer " + (visualizerEnabled ? "enabled" : "disabled"));
    }
    
    // Button click effects
    function addClickEffect(button) {
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 800);
    }
    
    // Event listeners
    if (enableAudioBtn) {
        enableAudioBtn.addEventListener('click', function() {
            addClickEffect(this);
            initAudio();
        });
    }
    
    if (toggleVisualizerBtn) {
        toggleVisualizerBtn.addEventListener('click', function() {
            addClickEffect(this);
            toggleVisualizer();
        });
    }
    
    // PowerShell window controls
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function() {
            psWidget.classList.toggle('minimized');
        });
    }
    
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', function() {
            psWidget.classList.toggle('maximized');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            psWidget.style.display = 'none';
        });
    }
    
    // Make the PowerShell window draggable
    if (psWidget) {
        let isDragging = false;
        let offsetX, offsetY;
        
        psWidget.querySelector('.ps-header').addEventListener('mousedown', function(e) {
            isDragging = true;
            offsetX = e.clientX - psWidget.getBoundingClientRect().left;
            offsetY = e.clientY - psWidget.getBoundingClientRect().top;
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                psWidget.style.right = 'auto';
                psWidget.style.bottom = 'auto';
                psWidget.style.left = (e.clientX - offsetX) + 'px';
                psWidget.style.top = (e.clientY - offsetY) + 'px';
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }
    
    // Expose functions to global scope for external access
    window.psEnableAudio = initAudio;
    window.psToggleVisualizer = toggleVisualizer;
}); 