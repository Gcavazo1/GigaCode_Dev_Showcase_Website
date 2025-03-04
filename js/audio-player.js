// Cyberpunk Audio Player with PowerShell-style widget
let audioPlayerInstance = null;

// Add global document interaction events to help with autoplay permission
function setupGlobalAudioPermission() {
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    
    function handleUserInteraction() {
        // If we have an audio context, try to resume it
        if (audioPlayerInstance && audioPlayerInstance.audioContext) {
            if (audioPlayerInstance.audioContext.state === 'suspended') {
                audioPlayerInstance.audioContext.resume().then(() => {
                    console.log("AudioContext resumed by user interaction");
                });
            }
        }
        
        // Remove listeners after first interaction
        interactionEvents.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
        });
    }
    
    // Add listeners for user interaction
    interactionEvents.forEach(event => {
        document.addEventListener(event, handleUserInteraction);
    });
}

// Call this function when document is loaded
document.addEventListener('DOMContentLoaded', setupGlobalAudioPermission);

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
        this.source = null;
        this.analyser = null;
        this.dataArray = null;
        
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
        
        // Create PowerShell widget immediately - this is critical for autoplay handling
        this.createPowerShellWidget();
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
        
        // Previous/next track buttons
        document.getElementById('prev-track').addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudio();
            }
            this.prevTrack();
        });
        
        document.getElementById('next-track').addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudio();
            }
            this.nextTrack();
        });
    }
    
    initAudio() {
        if (this.audioContext) return; // Already initialized
        
        try {
            console.log("Initializing Audio Context");
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
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
                console.log("Audio element already connected, using alternative approach");
                console.warn("Detailed error:", sourceError);
                
                // Create analyzer node without directly connecting to audio element
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                // Connect analyzer to destination to hear audio
                this.analyser.connect(this.audioContext.destination);
            }
            
            // Try to resume AudioContext if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log("AudioContext resumed");
                }).catch(err => {
                    console.error("Failed to resume AudioContext:", err);
                });
            }
            
            // Load the actual audio source
            this.loadTrack(this.currentTrack);
            
            console.log("Audio initialized successfully");
        } catch (error) {
            console.error("Error initializing audio:", error);
            this.showAudioError("Error initializing audio system");
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
        
        console.log("Attempting to play:", this.audio.src);
        this.audio.play()
            .then(() => {
                console.log("Playback started successfully");
                this.isPlaying = true;
                this.updatePlayButton();
            })
            .catch(error => {
                console.error("Play failed:", error);
                
                // Show a message to the user about autoplay restrictions
                if (error.name === 'NotAllowedError') {
                    this.showAudioError("Please use the PowerShell widget to enable audio.");
                    // Re-show the PowerShell widget
                    this.createPowerShellWidget();
                } else {
                    this.showAudioError("Playback error: " + error.message);
                }
            });
    }
    
    pauseAudio() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        if (this.isPlaying) {
            this.playButton.querySelector('i').className = 'fas fa-pause';
            this.playButton.classList.add('playing');
        } else {
            this.playButton.querySelector('i').className = 'fas fa-play';
            this.playButton.classList.remove('playing');
        }
    }
    
    loadTrackInfo(index) {
        this.currentTrack = index;
        document.getElementById('track-title').textContent = this.playlist[index].title;
    }
    
    loadTrack(index) {
        try {
            this.currentTrack = index;
            const trackSrc = this.playlist[index].file;
            console.log(`Loading track: ${this.playlist[index].title} from ${trackSrc}`);
            
            // Set the source and update UI
            this.audio.src = trackSrc;
            document.getElementById('track-title').textContent = this.playlist[index].title;
            
            // Update active track in playlist carousel
            this.updatePlaylistActiveTrack(index);
            
            if (this.isPlaying) {
                this.playAudio();
            } else {
                this.updatePlayButton();
            }
        } catch (error) {
            console.error("Error in loadTrack:", error);
            this.showAudioError("Error loading track");
        }
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
        try {
            if (!this.analyser || !this.isPlaying) return;
            
            // Get the equalizer bars
            const eqBars = document.querySelectorAll('.ps-eq-bar');
            if (eqBars.length === 0) return; // No bars to animate
            
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Frequency ranges for bars
            const ranges = [
                [0, 50],     // Bass
                [50, 100],   // Low mids
                [100, 200],  // Mids
                [200, 300],  // High mids
                [300, 400]   // Highs
            ];
            
            // Animate equalizer bars based on frequency data
            eqBars.forEach((bar, i) => {
                if (i < ranges.length) {
                    const [start, end] = ranges[i];
                    let sum = 0;
                    for (let j = start; j < end; j++) {
                        sum += this.dataArray[j];
                    }
                    const avg = sum / (end - start);
                    const height = Math.max(5, Math.min(30, avg / 255 * 30));
                    bar.style.height = `${height}px`;
                }
            });
        } catch (error) {
            console.error('Error animating equalizer:', error);
        }
    }
    
    createPowerShellWidget() {
        // Remove any existing widgets
        const existingWidgets = document.querySelectorAll('.ps-music-widget');
        existingWidgets.forEach(widget => {
            if (widget && widget.parentNode) {
                widget.parentNode.removeChild(widget);
            }
        });
        
        // Create widget element
        const widget = document.createElement('div');
        widget.className = 'ps-music-widget';
        widget.innerHTML = `
            <div class="ps-scan-line"></div>
            <div class="ps-widget-header">
                <div class="ps-widget-title">
                    <i class="fas fa-terminal"></i>
                    PowerShell Music Module
                </div>
                <div class="ps-widget-controls">
                    <div class="ps-widget-control ps-widget-minimize"></div>
                    <div class="ps-widget-control ps-widget-close"></div>
                </div>
            </div>
            <div class="ps-widget-content">
                <div class="ps-terminal-prompt">
                    <span class="ps-terminal-command">Get-MusicPreference</span>
                    <span class="ps-terminal-cursor"></span>
                </div>
                <div class="ps-terminal-output">
                    [INFO] This site features an immersive cyberpunk soundtrack.
                    [QUERY] Would you like to enable background music?
                </div>
                <div class="ps-terminal-buttons">
                    <button class="ps-terminal-btn ps-enable-btn">Enable-Music</button>
                    <button class="ps-terminal-btn ps-disable-btn">Disable-Music</button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(widget);
        
        // Force a reflow before adding the active class
        widget.offsetHeight;
        
        // Animate in with a slight delay for smoother appearance
        setTimeout(() => {
            widget.classList.add('ps-active');
        }, 100);
        
        // Add event listeners
        widget.querySelector('.ps-enable-btn').addEventListener('click', () => {
            this.initAudio();
            this.playAudio();
            this.closePowerShellWidget(widget);
        });
        
        widget.querySelector('.ps-disable-btn').addEventListener('click', () => {
            this.closePowerShellWidget(widget);
        });
        
        widget.querySelector('.ps-widget-close').addEventListener('click', () => {
            this.closePowerShellWidget(widget);
        });
    }
    
    closePowerShellWidget(widget) {
        widget.classList.remove('ps-active');
        
        // Remove after animation completes
        setTimeout(() => {
            if (widget.parentNode) {
                widget.parentNode.removeChild(widget);
            }
        }, 700); // Match the CSS transition duration
    }

    createPlaylistCarousel() {
        // Check if audio container exists
        const audioContainer = document.querySelector('.audio-container');
        if (!audioContainer) {
            console.warn('Audio container not found, delaying playlist creation');
            setTimeout(() => this.createPlaylistCarousel(), 500);
            return;
        }
        
        // Create playlist container
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'ps-playlist-container';
        
        // Create playlist header
        playlistContainer.innerHTML = `
            <div class="ps-playlist-carousel">
                ${this.playlist.map((track, index) => `
                    <div class="ps-track-card" data-index="${index}">
                        <div class="ps-card-glitch-effect"></div>
                        <div class="ps-card-content">
                            <div class="ps-track-number">${(index + 1).toString().padStart(2, '0')}</div>
                            <div class="ps-track-title">${track.title}</div>
                            <div class="ps-track-equalizer">
                                ${Array(5).fill(0).map(() => '<div class="ps-eq-bar"></div>').join('')}
                            </div>
                        </div>
                        <div class="ps-card-shine"></div>
                    </div>
                `).join('')}
            </div>
            <button class="ps-playlist-nav ps-prev"><i class="fas fa-chevron-left"></i></button>
            <button class="ps-playlist-nav ps-next"><i class="fas fa-chevron-right"></i></button>
        `;
        
        // Add to audio container
        audioContainer.appendChild(playlistContainer);
        
        // Setup carousel navigation
        this.setupCarouselNavigation(playlistContainer);
        
        // Initial carousel position
        this.currentCarouselIndex = 0;
        this.updateCarouselPosition();
        
        // Add click events to cards
        playlistContainer.querySelectorAll('.ps-track-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                if (!this.audioContext) {
                    this.initAudio();
                }
                this.loadTrack(index);
                this.playAudio();
            });
        });
    }
    
    setupCarouselNavigation(container) {
        const prevButton = container.querySelector('.ps-prev');
        const nextButton = container.querySelector('.ps-next');
        
        prevButton.addEventListener('click', () => {
            this.rotateCarousel('prev');
        });
        
        nextButton.addEventListener('click', () => {
            this.rotateCarousel('next');
        });
    }
    
    rotateCarousel(direction) {
        if (direction === 'prev') {
            this.currentCarouselIndex = (this.currentCarouselIndex - 1 + this.playlist.length) % this.playlist.length;
        } else {
            this.currentCarouselIndex = (this.currentCarouselIndex + 1) % this.playlist.length;
        }
        this.updateCarouselPosition();
    }
    
    updateCarouselPosition() {
        const carousel = document.querySelector('.ps-playlist-carousel');
        if (!carousel) return;
        
        const totalCards = this.playlist.length;
        const angleIncrement = 360 / totalCards;
        const radius = 300; // Adjust for desired carousel size
        
        // Position each card in a circle
        const cards = carousel.querySelectorAll('.ps-track-card');
        cards.forEach((card, index) => {
            // Calculate the angle offset based on current index
            const angleOffset = ((index - this.currentCarouselIndex) * angleIncrement) % 360;
            
            // Convert to radians
            const angleRad = angleOffset * Math.PI / 180;
            
            // Calculate 3D position
            const z = radius * Math.cos(angleRad);
            const x = radius * Math.sin(angleRad);
            
            // Calculate scale and opacity based on z position
            const scale = this.mapRange(z, -radius, radius, 0.7, 1);
            const opacity = this.mapRange(z, -radius, radius, 0.3, 1);
            
            // Apply transform
            card.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
            card.style.opacity = opacity;
            card.style.zIndex = Math.round(z + radius); // Higher z = higher in stacking order
        });
    }
    
    mapRange(value, in_min, in_max, out_min, out_max) {
        return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    }

    updatePlaylistActiveTrack(index) {
        const cards = document.querySelectorAll('.ps-track-card');
        if (cards.length === 0) return; // Safety check
        
        // Remove active class from all cards
        cards.forEach(card => card.classList.remove('ps-track-active'));
        
        // Add active class to current track
        const activeCard = document.querySelector(`.ps-track-card[data-index="${index}"]`);
        if (activeCard) {
            activeCard.classList.add('ps-track-active');
            
            // Rotate carousel to show active track
            this.currentCarouselIndex = index;
            this.updateCarouselPosition();
        }
    }

    showAudioError(message) {
        // Create or find status element
        let statusElement = document.querySelector('.audio-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'audio-status error';
            this.audio.parentNode.appendChild(statusElement);
        } else {
            statusElement.className = 'audio-status error';
        }
        
        statusElement.textContent = message;
        
        // Fade out after 5 seconds
        setTimeout(() => {
            statusElement.style.opacity = '0';
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.parentNode.removeChild(statusElement);
                }
            }, 500);
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioPlayer();
}); 