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
    
    // Check if we have the main audio player instance
    const audioPlayer = window.audioPlayer;
    
    // Function to update the PowerShell widget state based on audio player
    function updateWidgetState() {
        if (!audioPlayer) return;
        
        // Update status indicator
        if (statusIndicator) {
            const isPlaying = audioPlayer.isPlaying || false;
            statusIndicator.textContent = isPlaying ? "Active" : "Inactive";
            statusIndicator.classList.toggle('active', isPlaying);
            statusIndicator.classList.toggle('inactive', !isPlaying);
        }
        
        // Update EQ animation
        if (eqContainer) {
            const isPlaying = audioPlayer.isPlaying || false;
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
    
    // Connect enable button to the existing audio player
    if (enableAudioBtn) {
        enableAudioBtn.addEventListener('click', function() {
            // Add click effect
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 800);
            
            // Use the existing audio player if available
            if (audioPlayer && audioPlayer.initAudio) {
                audioPlayer.initAudio();
                audioPlayer.playAudio();
                
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
            } else {
                // Fallback if audioPlayer is not available
                const audioElement = document.querySelector('audio');
                if (audioElement) {
                    audioElement.play().catch(e => console.warn("Autoplay prevented:", e));
                    
                    // Update status
                    if (statusIndicator) {
                        statusIndicator.textContent = "Active";
                        statusIndicator.classList.add('active');
                        statusIndicator.classList.remove('inactive');
                    }
                    
                    // Activate EQ animation
                    if (eqContainer) {
                        eqContainer.classList.add('active');
                    }
                    
                    // Show visualizer terminal
                    showVisualizerTerminal();
                    
                    // Hide PowerShell widget
                    setTimeout(() => {
                        psWidget.style.display = 'none';
                    }, 1000);
                } else {
                    console.warn("No audio element found");
                }
            }
        });
    }
    
    // Connect disable button
    if (disableAudioBtn) {
        disableAudioBtn.addEventListener('click', function() {
            // Add click effect
            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 800);
            
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
    
    // Listen for audio player events to update the widget
    if (audioPlayer) {
        // Check if the audio player has an event system
        if (audioPlayer.addEventListener) {
            audioPlayer.addEventListener('play', updateWidgetState);
            audioPlayer.addEventListener('pause', updateWidgetState);
            audioPlayer.addEventListener('trackchange', updateWidgetState);
        }
        
        // Initial state update
        updateWidgetState();
    } else {
        // Fallback for audio element events
        const audioElement = document.querySelector('audio');
        if (audioElement) {
            audioElement.addEventListener('play', updateWidgetState);
            audioElement.addEventListener('pause', updateWidgetState);
            audioElement.addEventListener('ended', updateWidgetState);
        }
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
}); 