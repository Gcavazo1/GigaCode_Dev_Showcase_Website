// Cyberpunk Audio Player with PowerShell-style widget
let audioPlayerInstance = null;

class AudioPlayer {
    constructor() {
        // Singleton pattern
        if (audioPlayerInstance) {
            return audioPlayerInstance;
        }
        audioPlayerInstance = this;

        console.log('Initializing Audio Player');
        
        // Core elements
        this.audio = document.getElementById('background-audio');
        this.playButton = document.getElementById('play-audio');
        this.volumeSlider = document.getElementById('volume-slider');
        
        // State
        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        
        // Playlist
        this.playlist = [
            // Original tracks
            { title: "Cyberpunk Theme", file: "audio/cyberpunk-theme.mp3" },
            { title: "Echoes of Valor", file: "audio/EchoesofValor.mp3" },
            { title: "Final Confrontation", file: "audio/FinalConfrontation.mp3" },
            { title: "Legacy of Solitude", file: "audio/LegacyofSolitude.mp3" },
            { title: "Neon Shadows Dark", file: "audio/NeonShadows_dark.mp3" },
            { title: "Neon Shadows", file: "audio/NeonShadows.mp3" },
            { title: "Shadows of Desolation", file: "audio/ShadowsofDesolation.mp3" },
            { title: "Shadows of Tomorrow", file: "audio/ShadowsofTomorrow.mp3" },
            { title: "Synth Shadows", file: "audio/SynthShadows.mp3" },
            { title: "The Last Victory", file: "audio/TheLastVictory.mp3" },
            { title: "Digital Shadows", file: "audio/DigitalShadows.mp3" },
            { title: "Veil of Shadows", file: "audio/VeilofShadows.mp3" },
            { title: "Haunting Whispers", file: "audio/HauntingWhispers.mp3" },
            { title: "Pixelated Rise", file: "audio/PixelatedRise.mp3" },
            { title: "Quest for Triumph", file: "audio/QuestforTriumph.mp3" },
            { title: "Champion Rise", file: "audio/ChampionRise.mp3" },
            { title: "Rise My Heroes", file: "audio/RiseMyHeroes.mp3" },
            
            // New tracks
            { title: "Shadow Rise", file: "audio/ShadowRise.mp3" },
            { title: "Epic Ascendancy", file: "audio/EpicAscendancy.mp3" },
            { title: "Echoes of Legend", file: "audio/EchoesofLegend.mp3" },
            { title: "Chasing Legends", file: "audio/ChasingLegends.mp3" }
        ];
        this.currentTrack = 0;
        
        // Initialize
        this.initBasic();
    }
    
    initBasic() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Load first track info
        this.loadTrackInfo(this.currentTrack);
        
        // Create playlist carousel
        this.createPlaylistCarousel();
        
        // Start animation for equalizer
        this.animateEqualizer();
    }
    
    setupEventListeners() {
        // Play/pause button
        this.playButton.addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudio();
            }
            this.togglePlay();
        });
        
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });
        
        // Set initial volume
        this.volumeSlider.value = 70;
        this.audio.volume = 0.7;
        
        // Track ended
        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        // Next/prev track buttons
        document.getElementById('next-track').addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudio();
            }
            this.nextTrack();
        });
        
        document.getElementById('prev-track').addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudio();
            }
            this.prevTrack();
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.rotateCarousel('prev');
            } else if (e.key === 'ArrowRight') {
                this.rotateCarousel('next');
            } else if (e.key === 'Enter') {
                // Play the currently focused track
                if (this.currentCarouselIndex !== undefined) {
                    if (!this.audioContext) {
                        this.initAudio();
                    }
                    this.loadTrack(this.currentCarouselIndex);
                    this.playAudio();
                }
            }
        });
    }
    
    initAudio() {
        if (this.audioContext) return; // Already initialized
        
        try {
            console.log("Audio element found:", this.audio);
            console.log("Initial volume:", this.audio.volume);
            console.log("Audio muted?", this.audio.muted);
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("Audio context state:", this.audioContext.state);
            
            // Check if audio is already connected to another node
            try {
                // Set up audio nodes
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512; // For equalizer
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                // Try to create a source - might fail if already connected
                this.source = this.audioContext.createMediaElementSource(this.audio);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            } catch (sourceError) {
                console.log("Audio element already connected, creating a new audio element");
                
                // Create a new audio element since the original is being used elsewhere
                this.audio = document.createElement('audio');
                this.audio.id = 'background-audio-player';
                this.audio.volume = 0.7;
                
                // Connect the new audio element properly
                this.source = this.audioContext.createMediaElementSource(this.audio);
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                // Connect everything correctly
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                console.log("Created new audio element and connected properly");
                
                // Explicit debugging for visualization
                console.log("VISUALIZER DEBUG: Is particleVisualizer available?", !!window.particleVisualizer);
                
                // CONNECT DIRECTLY AFTER CREATING
                if (window.particleVisualizer) {
                    // Force direct connection to THIS analyser and audio element
                    try {
                        console.log("Directly connecting visualizer to analyser node");
                        if (window.particleVisualizer.audioAnalyzer) {
                            // Clear any existing connection
                            window.particleVisualizer.isPlaying = false;
                            
                            // Set up direct connection
                            const connected = window.particleVisualizer.audioAnalyzer.useExternalAnalyser(this.analyser, this.audio);
                            if (connected) {
                                window.particleVisualizer.isPlaying = true;
                                window.particleVisualizer.show();
                                console.log("VISUALIZER DEBUG: Direct connection successful");
                            }
                        }
                    } catch (e) {
                        console.error("Error connecting visualizer:", e);
                    }
                }
                
                // Immediately load the current track into the new audio element
                this.loadTrack(this.currentTrack);
            }
            
            console.log("Audio initialized successfully");
        } catch (error) {
            console.error("Error initializing audio:", error);
        }
    }
    
    togglePlay() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }
    
    playAudio() {
        if (!this.audio.src) {
            this.loadTrack(this.currentTrack);
        }
        
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
            })
            .catch(error => {
                console.error("Play failed:", error);
            });
    }
    
    pauseAudio() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        if (this.isPlaying) {
            this.playButton.innerHTML = '<i class="fas fa-pause"></i>';
            this.playButton.classList.add('playing');
        } else {
            this.playButton.innerHTML = '<i class="fas fa-play"></i>';
            this.playButton.classList.remove('playing');
        }
    }
    
    loadTrackInfo(index) {
        this.currentTrack = index;
        document.getElementById('track-title').textContent = this.playlist[index].title;
    }
    
    loadTrack(index) {
        this.currentTrack = index;
        this.audio.src = this.playlist[index].file;
        document.getElementById('track-title').textContent = this.playlist[index].title;
        
        // Update active track in playlist carousel
        this.updatePlaylistActiveTrack(index);
        
        if (this.isPlaying) {
            this.playAudio();
        } else {
            this.updatePlayButton();
        }
        
        console.log("Loading track:", this.playlist[index].title);
        console.log("Track path:", this.playlist[index].file);
        
        // Test if file exists
        fetch(this.playlist[index].file)
            .then(response => {
                if (!response.ok) {
                    console.error("Audio file not found:", this.playlist[index].file);
                } else {
                    console.log("Audio file exists:", this.playlist[index].file);
                }
            })
            .catch(error => {
                console.error("Error fetching audio file:", error);
            });
    }
    
    nextTrack() {
        const nextIndex = (this.currentTrack + 1) % this.playlist.length;
        if (this.audioContext) {
            this.loadTrack(nextIndex);
        } else {
            this.loadTrackInfo(nextIndex);
        }
    }
    
    prevTrack() {
        const prevIndex = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
        if (this.audioContext) {
            this.loadTrack(prevIndex);
        } else {
            this.loadTrackInfo(prevIndex);
        }
    }
    
    animateEqualizer() {
        if (this.analyser && this.dataArray) {
            this.updateEqualizer();
        }
        
        requestAnimationFrame(() => this.animateEqualizer());
    }
    
    updateEqualizer() {
        if (!this.analyser || !this.dataArray) return;
        
        // Get the active track card
        const activeCard = document.querySelector('.ps-track-active');
        if (!activeCard) return;
        
        // Get the equalizer bars
        const eqBars = activeCard.querySelectorAll('.ps-eq-bar');
        if (!eqBars.length) return;
        
        try {
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Animate equalizer bars based on frequency data
            const barCount = eqBars.length;
            const step = Math.floor(this.dataArray.length / barCount);
            
            for (let i = 0; i < barCount; i++) {
                const dataIndex = i * step;
                if (dataIndex < this.dataArray.length) {
                    const value = this.dataArray[dataIndex];
                    const height = Math.max(4, value / 5); // Scale down the value
                    
                    eqBars[i].style.height = `${height}px`;
                }
            }
        } catch (error) {
            console.error('Error animating equalizer:', error);
        }
    }
    
    createPlaylistCarousel() {
        const audioContainer = document.querySelector('.audio-container');
        if (!audioContainer) return;

        // Clear any existing carousel
        const existingPlaylist = document.querySelector('.ps-playlist-container');
        if (existingPlaylist) existingPlaylist.remove();

        // Create new structure
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'ps-playlist-container';

        const carousel = document.createElement('div');
        carousel.className = 'ps-playlist-carousel';

        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'ps-carousel-container';

        // Create and position cards
        this.playlist.forEach((track, index) => {
            const card = this.createTrackCard(track, index);
            carouselContainer.appendChild(card);
        });

        // No more navigation buttons - we're using drag interaction now
        
        // Assemble the carousel
        carousel.appendChild(carouselContainer);
        playlistContainer.appendChild(carousel);
        audioContainer.appendChild(playlistContainer);

        // Store references
        this.carouselContainer = carouselContainer;
        this.carousel = carousel;

        // Initial positioning
        this.positionCarouselCards();
        
        // Initialize drag functionality
        this.initCarouselDrag();
    }

    createTrackCard(track, index) {
        const card = document.createElement('div');
        card.className = 'ps-track-card';
        card.dataset.index = index;

        if (index === this.currentTrack) {
            card.classList.add('ps-track-active');
        }

        card.innerHTML = `
            <div class="ps-card-glitch-effect"></div>
            <div class="ps-card-content">
                <div class="ps-track-number">${(index + 1).toString().padStart(2, '0')}</div>
                <div class="ps-track-title">${track.title}</div>
                <div class="ps-track-equalizer">
                    ${Array(5).fill(0).map(() => '<div class="ps-eq-bar"></div>').join('')}
                </div>
            </div>
            <div class="ps-card-shine"></div>
        `;

        card.addEventListener('click', () => {
            if (!this.audioContext) this.initAudio();
            this.loadTrack(index);
            this.playAudio();
            this.updatePlaylistActiveTrack(index);
        });

        return card;
    }

    positionCarouselCards() {
        if (!this.carouselContainer) return;

        const cards = this.carouselContainer.querySelectorAll('.ps-track-card');
        const cardCount = cards.length;
        const theta = (2 * Math.PI) / cardCount;
        const radius = 350; // Increased radius for a wider carousel

        cards.forEach((card, index) => {
            const angle = theta * index;
            const transform = `
                rotateY(${angle * (180/Math.PI)}deg)
                translateZ(${radius}px)
            `;
            
            card.style.transform = transform;
            
            // Calculate opacity based on position
            const normalizedAngle = Math.abs((angle % (2 * Math.PI)) - Math.PI);
            const opacity = 0.3 + (0.7 * (1 - normalizedAngle / Math.PI));
            card.style.opacity = opacity.toFixed(2);
        });

        // Initial rotation to show current track
        this.rotateToTrack(this.currentTrack);
    }

    rotateToTrack(index) {
        if (!this.carouselContainer || !this.playlist) return;
        
        const cardCount = this.playlist.length;
        const anglePerCard = 360 / cardCount;
        // Calculate the exact angle needed for this card
        const angle = -anglePerCard * index; // Negative for correct rotation direction
        
        // Apply rotation centered on the carousel container
        this.carouselContainer.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.9, 0.1, 1)';
        this.carouselContainer.style.transform = `rotateY(${angle}deg)`;
    }

    // Handle carousel rotation
    rotateCarousel(direction) {
        if (!this.carouselContainer || !this.playlist) return;
        
        const cardCount = this.playlist.length;
        let newTrack;
        
        if (direction === 'next') {
            newTrack = (this.currentTrack + 1) % cardCount;
        } else {
            newTrack = (this.currentTrack - 1 + cardCount) % cardCount;
        }
        
        // Load and play the new track
        if (this.audioContext) {
            this.loadTrack(newTrack);
            this.playAudio();
        } else {
            this.loadTrackInfo(newTrack);
        }
        
        // Update active track in playlist
        this.updatePlaylistActiveTrack(newTrack);
        
        // Rotate carousel to show new track
        this.rotateToTrack(newTrack);
    }

    // Update active track in playlist
    updatePlaylistActiveTrack(index) {
        if (!this.carouselContainer) return;
        
        // Remove active class from all cards
        const cards = this.carouselContainer.querySelectorAll('.ps-track-card');
        cards.forEach(card => card.classList.remove('ps-track-active'));
        
        // Add active class to current track
        const activeCard = this.carouselContainer.querySelector(`.ps-track-card[data-index="${index}"]`);
        if (activeCard) {
            activeCard.classList.add('ps-track-active');
        }
        
        // Rotate carousel to show active track
        this.rotateToTrack(index);
    }

    // Add this method to handle dragging the carousel
    initCarouselDrag() {
        if (!this.carousel) return;
        
        let isDragging = false;
        let startX = 0;
        let startRotation = 0;
        let currentRotation = 0;
        let lastDragTime = 0;
        let lastDragX = 0;
        let dragSpeed = 0;
        
        // Helper to get current rotation in degrees
        const getCurrentRotation = () => {
            const transform = this.carouselContainer.style.transform;
            const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
            return match ? parseFloat(match[1]) : 0;
        };
        
        // Start dragging
        this.carousel.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ps-playlist-nav')) return; // Skip if clicking navigation buttons
            
            isDragging = true;
            startX = e.clientX;
            startRotation = getCurrentRotation();
            currentRotation = startRotation;
            lastDragTime = Date.now();
            lastDragX = e.clientX;
            
            this.carousel.style.cursor = 'grabbing';
            this.carouselContainer.style.transition = 'none'; // Disable transitions during drag
            
            e.preventDefault();
        });
        
        // Handle dragging
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const sensitivity = 0.5; // Adjust for faster/slower rotation
            
            // Calculate new rotation
            currentRotation = startRotation + (deltaX * sensitivity);
            
            // Apply new rotation
            this.carouselContainer.style.transform = `rotateY(${currentRotation}deg)`;
            
            // Calculate drag speed for inertia
            const now = Date.now();
            const dt = now - lastDragTime;
            if (dt > 0) {
                dragSpeed = (e.clientX - lastDragX) / dt;
            }
            lastDragTime = now;
            lastDragX = e.clientX;
        });
        
        // End dragging with inertia
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            
            this.carousel.style.cursor = 'grab';
            
            // Apply inertia
            if (Math.abs(dragSpeed) > 0.1) {
                const inertia = dragSpeed * 15; // Adjust for more/less inertia
                const targetRotation = currentRotation + inertia;
                
                // Re-enable smooth transition for inertia
                this.carouselContainer.style.transition = 'transform 1s cubic-bezier(0.2, 0.9, 0.1, 1)';
                this.carouselContainer.style.transform = `rotateY(${targetRotation}deg)`;
                
                // Snap to nearest track after inertia
                setTimeout(() => this.snapToNearestTrack(), 1000);
            } else {
                // If dragged slowly, just snap to nearest track
                this.snapToNearestTrack();
            }
        });
        
        // Touch support for mobile
        this.carousel.addEventListener('touchstart', (e) => {
            if (e.target.closest('.ps-playlist-nav')) return;
            
            isDragging = true;
            startX = e.touches[0].clientX;
            startRotation = getCurrentRotation();
            currentRotation = startRotation;
            lastDragTime = Date.now();
            lastDragX = e.touches[0].clientX;
            
            this.carouselContainer.style.transition = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.touches[0].clientX - startX;
            const sensitivity = 0.5;
            
            currentRotation = startRotation + (deltaX * sensitivity);
            this.carouselContainer.style.transform = `rotateY(${currentRotation}deg)`;
            
            const now = Date.now();
            const dt = now - lastDragTime;
            if (dt > 0) {
                dragSpeed = (e.touches[0].clientX - lastDragX) / dt;
            }
            lastDragTime = now;
            lastDragX = e.touches[0].clientX;
        });
        
        document.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            if (Math.abs(dragSpeed) > 0.1) {
                const inertia = dragSpeed * 15;
                const targetRotation = currentRotation + inertia;
                
                this.carouselContainer.style.transition = 'transform 1s cubic-bezier(0.2, 0.9, 0.1, 1)';
                this.carouselContainer.style.transform = `rotateY(${targetRotation}deg)`;
                
                setTimeout(() => this.snapToNearestTrack(), 1000);
            } else {
                this.snapToNearestTrack();
            }
        });
        
        // Initial cursor style
        this.carousel.style.cursor = 'grab';
    }

    // Add this method to snap to the nearest track after dragging
    snapToNearestTrack() {
        if (!this.carouselContainer || !this.playlist) return;
        
        // Get current rotation
        const transform = this.carouselContainer.style.transform;
        const match = transform.match(/rotateY\(([-\d.]+)deg\)/);
        if (!match) return;
        
        const currentRotation = parseFloat(match[1]);
        
        // Calculate parameters
        const cardCount = this.playlist.length;
        const anglePerCard = 360 / cardCount;
        
        // Find nearest track
        const normalizedRotation = ((currentRotation % 360) + 360) % 360;
        const nearestCardIndex = Math.round(normalizedRotation / anglePerCard) % cardCount;
        
        // Get the actual track index (reverse direction)
        const trackIndex = (cardCount - nearestCardIndex) % cardCount;
        
        // Smooth transition to nearest track
        this.carouselContainer.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.1, 1)';
        
        // Load and update the track
        if (this.audioContext) {
            this.loadTrack(trackIndex);
            this.playAudio();
        } else {
            this.loadTrackInfo(trackIndex);
        }
        
        // Update active track in playlist
        this.updatePlaylistActiveTrack(trackIndex);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioPlayer();
});

window.audioPlayerInstance = new AudioPlayer(); 