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
        
        // Create PowerShell widget
        setTimeout(() => this.createPowerShellWidget(), 1000);
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
                console.log("Audio element already connected, using alternative approach");
                
                // Create analyzer node without directly connecting to audio element
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                // Connect analyzer to destination to hear audio
                this.analyser.connect(this.audioContext.destination);
            }
            
            // Load the actual audio source
            this.loadTrack(this.currentTrack);
            
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
        
        widget.querySelector('.ps-widget-minimize').addEventListener('click', () => {
            widget.classList.remove('ps-active');
            // Show again after 30 seconds if no choice was made
            setTimeout(() => {
                if (document.body.contains(widget) && !widget.classList.contains('ps-active')) {
                    widget.classList.add('ps-active');
                }
            }, 30000);
        });
    }
    
    closePowerShellWidget(widget) {
        widget.style.transition = 'all 0.5s cubic-bezier(0.7, 0, 0.84, 0)';
        widget.classList.remove('ps-active');
        widget.style.opacity = '0';
        widget.style.transform = 'translateY(20px) scale(0.95)';
        
        setTimeout(() => {
            if (document.body.contains(widget)) {
                document.body.removeChild(widget);
            }
        }, 500);
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
        
        // Create carousel wrapper
        const carousel = document.createElement('div');
        carousel.className = 'ps-playlist-carousel';
        
        // Add track cards
        this.playlist.forEach((track, index) => {
            const card = document.createElement('div');
            card.className = 'ps-track-card';
            card.dataset.index = index;
            
            // Add active class to current track
            if (index === this.currentTrack) {
                card.classList.add('ps-track-active');
            }
            
            // Create card content
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
            
            // Add click event to play track
            card.addEventListener('click', () => {
                if (!this.audioContext) {
                    this.initAudio();
                }
                this.loadTrack(index);
                this.playAudio();
                this.updatePlaylistActiveTrack(index);
            });
            
            carousel.appendChild(card);
        });
        
        // Add navigation buttons
        const prevBtn = document.createElement('button');
        prevBtn.className = 'ps-playlist-nav ps-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.rotateCarousel('prev');
        });
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'ps-playlist-nav ps-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.rotateCarousel('next');
        });
        
        // Assemble components
        playlistContainer.appendChild(prevBtn);
        playlistContainer.appendChild(carousel);
        playlistContainer.appendChild(nextBtn);
        
        // Add to audio container
        audioContainer.appendChild(playlistContainer);
        
        // Initialize carousel position
        this.currentCarouselIndex = this.currentTrack;
        this.updateCarouselPosition();
    }

    rotateCarousel(direction) {
        const totalTracks = this.playlist.length;
        
        if (direction === 'next') {
            this.currentCarouselIndex = (this.currentCarouselIndex + 1) % totalTracks;
        } else {
            this.currentCarouselIndex = (this.currentCarouselIndex - 1 + totalTracks) % totalTracks;
        }
        
        this.updateCarouselPosition();
    }

    updateCarouselPosition() {
        const carousel = document.querySelector('.ps-playlist-carousel');
        if (!carousel) {
            console.warn('Playlist carousel not found');
            return;
        }
        
        const cards = carousel.querySelectorAll('.ps-track-card');
        const totalCards = cards.length;
        if (totalCards === 0) return;
        
        cards.forEach((card, index) => {
            let relativePos = (index - this.currentCarouselIndex + totalCards) % totalCards;
            
            if (relativePos > totalCards / 2) {
                relativePos -= totalCards;
            }
            
            // Adjusted positioning for better spread and depth
            const rotation = relativePos * 25; // Reduced rotation for better readability
            const zTranslation = Math.cos(Math.abs(relativePos) * 0.4) * 250 - 250; // More depth
            const xTranslation = Math.sin(relativePos * 0.4) * 400; // Wider spread
            const scale = Math.max(0.6, 1 - Math.abs(relativePos) * 0.2); // More dramatic scaling
            const opacity = Math.max(0.2, 1 - Math.abs(relativePos) * 0.4); // More dramatic fade
            
            card.style.transform = `
                translateX(${xTranslation}px) 
                translateZ(${zTranslation}px) 
                rotateY(${rotation}deg) 
                scale(${scale})
            `;
            card.style.opacity = opacity;
            card.style.zIndex = 100 - Math.abs(relativePos);
        });
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioPlayer();
}); 