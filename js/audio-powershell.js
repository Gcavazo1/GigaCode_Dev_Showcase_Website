/**
 * PowerShell Music Widget Controller
 * Connects to the existing audio player system
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get elements from the existing PowerShell widget
    const psWidget = document.querySelector('.ps-music-widget');
    const enableAudioBtn = document.querySelector('.ps-enable-audio');
    const disableAudioBtn = document.querySelector('.ps-disable-audio');
    const statusIndicator = document.querySelector('.ps-status');
    const eqContainer = document.querySelector('.ps-eq-container');
    
    // Function to get the audio player instance
    function getAudioPlayer() {
        // Try to get from window.audioPlayer (set by audio-player.js)
        if (window.audioPlayer) {
            return window.audioPlayer;
        }
        
        // Try to get from audioPlayerInstance (another way it might be stored)
        if (window.audioPlayerInstance) {
            return window.audioPlayerInstance;
        }
        
        // If no instance exists yet, try to create one
        if (typeof AudioPlayer === 'function') {
            return new AudioPlayer();
        }
        
        return null;
    }
    
    // Get or create audio player instance
    const audioPlayer = getAudioPlayer();
    
    // Function to update the PowerShell widget state based on audio player
    function updateWidgetState() {
        // Update status indicator
        if (statusIndicator) {
            // Check if audio is playing
            const audioElement = document.querySelector('audio');
            const isPlaying = audioElement ? !audioElement.paused : false;
            
            statusIndicator.textContent = isPlaying ? "Active" : "Inactive";
            statusIndicator.classList.toggle('active', isPlaying);
            statusIndicator.classList.toggle('inactive', !isPlaying);
        }
        
        // Update EQ animation
        if (eqContainer) {
            const audioElement = document.querySelector('audio');
            const isPlaying = audioElement ? !audioElement.paused : false;
            eqContainer.classList.toggle('active', isPlaying);
        }
    }
    
    // Function to show the visualizer terminal after enabling audio
    function showVisualizerTerminal() {
        const visualizerTerminal = document.querySelector('.visualizer-terminal');
        if (visualizerTerminal) {
            visualizerTerminal.style.display = 'block';
            visualizerTerminal.classList.add('active');
        }
    }
    
    // Function to directly play audio without relying on the audio player instance
    function playAudioDirectly() {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
            // Create audio context if needed
            if (!window.audioContext) {
                try {
                    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Connect audio element to context if not already connected
                    if (!window.audioSource) {
                        window.audioSource = window.audioContext.createMediaElementSource(audioElement);
                        window.audioSource.connect(window.audioContext.destination);
                    }
                } catch (e) {
                    console.error("Error creating audio context:", e);
                }
            }
            
            // Play the audio
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("Audio playback started successfully");
                    updateWidgetState();
                }).catch(e => {
                    console.warn("Audio playback was prevented:", e);
                });
            }
            
            return true;
        }
        return false;
    }
    
    // Connect enable button to the existing audio player
    if (enableAudioBtn) {
        enableAudioBtn.addEventListener('click', function() {
            // Add click effect
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 800);
            
            let audioStarted = false;
            
            // Try multiple methods to start audio
            
            // Method 1: Use the audio player instance if available
            if (audioPlayer) {
                console.log("Using audio player instance to play audio");
                
                // Initialize audio if needed
                if (typeof audioPlayer.initAudio === 'function') {
                    audioPlayer.initAudio();
                }
                
                // Play audio
                if (typeof audioPlayer.playAudio === 'function') {
                    audioPlayer.playAudio();
                    audioStarted = true;
                }
            }
            
            // Method 2: Direct audio element control (fallback)
            if (!audioStarted) {
                console.log("Falling back to direct audio element control");
                audioStarted = playAudioDirectly();
            }
            
            // Update button text
            this.textContent = "AUDIO ENABLED";
            
            // Update widget state
            updateWidgetState();
            
            // Show visualizer terminal
            showVisualizerTerminal();
            
            // Hide PowerShell widget with animation
            setTimeout(() => {
                psWidget.style.transition = 'all 0.5s cubic-bezier(0.7, 0, 0.84, 0)';
                psWidget.classList.remove('ps-active');
                psWidget.style.opacity = '0';
                psWidget.style.transform = 'translateY(20px) scale(0.95)';
                
                // Don't completely remove, just hide
                setTimeout(() => {
                    psWidget.style.display = 'none';
                }, 500);
            }, 1000);
        });
    }
    
    // Connect disable button
    if (disableAudioBtn) {
        disableAudioBtn.addEventListener('click', function() {
            // Add click effect
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 800);
            
            // Try to pause audio
            const audioElement = document.querySelector('audio');
            if (audioElement) {
                audioElement.pause();
            }
            
            // Hide PowerShell widget
            setTimeout(() => {
                psWidget.style.transition = 'all 0.5s cubic-bezier(0.7, 0, 0.84, 0)';
                psWidget.classList.remove('ps-active');
                psWidget.style.opacity = '0';
                psWidget.style.transform = 'translateY(20px) scale(0.95)';
                
                setTimeout(() => {
                    psWidget.style.display = 'none';
                }, 500);
            }, 500);
            
            // Hide visualizer terminal if it's visible
            const visualizerTerminal = document.querySelector('.visualizer-terminal');
            if (visualizerTerminal) {
                visualizerTerminal.style.display = 'none';
            }
        });
    }
    
    // Make the PowerShell window draggable
    if (psWidget) {
        const header = psWidget.querySelector('.ps-header');
        if (header) {
            let isDragging = false;
            let offsetX, offsetY;
            
            header.addEventListener('mousedown', function(e) {
                isDragging = true;
                offsetX = e.clientX - psWidget.getBoundingClientRect().left;
                offsetY = e.clientY - psWidget.getBoundingClientRect().top;
                
                // Add active class to header during drag
                header.classList.add('dragging');
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
                if (header) {
                    header.classList.remove('dragging');
                }
            });
        }
        
        // Add window control functionality
        const minimizeBtn = psWidget.querySelector('.ps-minimize');
        const maximizeBtn = psWidget.querySelector('.ps-maximize');
        const closeBtn = psWidget.querySelector('.ps-close');
        
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
                
                // Show again after 30 seconds
                setTimeout(() => {
                    if (psWidget) {
                        psWidget.style.display = '';
                        psWidget.classList.add('ps-active');
                    }
                }, 30000);
            });
        }
    }
    
    // Listen for audio events to update the widget
    const audioElement = document.querySelector('audio');
    if (audioElement) {
        audioElement.addEventListener('play', updateWidgetState);
        audioElement.addEventListener('pause', updateWidgetState);
        audioElement.addEventListener('ended', updateWidgetState);
    }
    
    // Expose functions to global scope for external access
    window.psEnableAudio = function() {
        if (enableAudioBtn) {
            enableAudioBtn.click();
        }
    };
    
    // Initial update
    updateWidgetState();
    
    // Add ps-active class to make the widget visible initially
    if (psWidget && !psWidget.classList.contains('ps-active')) {
        setTimeout(() => {
            psWidget.classList.add('ps-active');
        }, 1000);
    }
    
    // Debug info
    console.log("PowerShell Audio Widget initialized");
    console.log("Audio player instance:", audioPlayer ? "Found" : "Not found");
    console.log("Audio element:", audioElement ? "Found" : "Not found");
}); 