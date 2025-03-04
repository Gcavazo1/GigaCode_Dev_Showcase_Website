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
                    
                    // Initialize 3D carousel if it exists
                    initCarousel();
                    
                    console.log("Audio system enabled");
                } else {
                    console.warn("No audio element found");
                }
            } catch (e) {
                console.error("Error initializing audio context:", e);
            }
        }
    }
    
    // Initialize 3D carousel
    function initCarousel() {
        const carousel = document.querySelector('.ps-carousel-container');
        const prevBtn = document.querySelector('.ps-prev');
        const nextBtn = document.querySelector('.ps-next');
        
        if (!carousel || !prevBtn || !nextBtn) {
            console.log("Carousel elements not found, creating them");
            createCarousel();
            return;
        }
        
        let currentIndex = 0;
        const items = carousel.querySelectorAll('.ps-carousel-item');
        const itemCount = items.length;
        
        // Position items in 3D space
        function updateCarousel() {
            const angle = 360 / itemCount;
            const radius = 200;
            
            items.forEach((item, index) => {
                const rotationY = angle * (index - currentIndex);
                const z = radius * Math.cos(rotationY * Math.PI / 180);
                const x = radius * Math.sin(rotationY * Math.PI / 180);
                
                item.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotationY}deg)`;
                item.classList.toggle('active', index === currentIndex);
                
                // Adjust opacity based on position
                const opacity = (z + radius) / (2 * radius);
                item.style.opacity = 0.4 + (opacity * 0.6);
            });
        }
        
        // Initialize positions
        updateCarousel();
        
        // Navigation handlers
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + itemCount) % itemCount;
            updateCarousel();
        });
        
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % itemCount;
            updateCarousel();
        });
        
        // Click on item to select
        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
                
                // If there's an audio element, change the track
                if (audioElement && item.dataset.src) {
                    audioElement.src = item.dataset.src;
                    audioElement.play().catch(e => console.warn("Playback prevented:", e));
                }
            });
        });
    }
    
    // Create carousel if it doesn't exist
    function createCarousel() {
        // Sample playlist data - replace with your actual tracks
        const playlist = [
            { title: "Cyberpunk Ambient", src: "audio/cyberpunk-ambient.mp3", cover: "images/cover1.jpg" },
            { title: "Neon Nights", src: "audio/neon-nights.mp3", cover: "images/cover2.jpg" },
            { title: "Digital Dreams", src: "audio/digital-dreams.mp3", cover: "images/cover3.jpg" }
        ];
        
        // Create carousel container
        const carouselSection = document.createElement('div');
        carouselSection.innerHTML = `
            <div class="ps-command-line">
                <span class="ps-prompt">PS C:\\GIGACODE\\AUDIO></span>
                <span class="ps-command">Get-Playlist</span>
            </div>
            <div class="ps-playlist-carousel">
                <div class="ps-carousel-container"></div>
                <div class="ps-playlist-nav ps-prev"><i class="fas fa-chevron-left"></i></div>
                <div class="ps-playlist-nav ps-next"><i class="fas fa-chevron-right"></i></div>
            </div>
        `;
        
        // Add to PowerShell content before the buttons
        const psContent = document.querySelector('.ps-content');
        const psButtons = document.querySelector('.ps-buttons');
        if (psContent && psButtons) {
            psContent.insertBefore(carouselSection, psButtons);
            
            // Add carousel items
            const carouselContainer = document.querySelector('.ps-carousel-container');
            if (carouselContainer) {
                playlist.forEach((track, index) => {
                    const item = document.createElement('div');
                    item.className = 'ps-carousel-item';
                    item.dataset.src = track.src;
                    item.innerHTML = `
                        <img src="${track.cover}" alt="${track.title}">
                        <div class="ps-track-info">${track.title}</div>
                    `;
                    carouselContainer.appendChild(item);
                });
                
                // Initialize the carousel
                setTimeout(initCarousel, 100);
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