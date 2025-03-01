// Audio Visualizer for Cyberpunk Portfolio

class AudioVisualizer {
    constructor() {
        // First check browser compatibility
        if (!this.checkBrowserSupport()) {
            this.showStatus("Your browser doesn't support Web Audio API. Please try Chrome, Firefox, or Safari.", "error");
            return;
        }

        this.audio = document.getElementById('background-audio');
        this.playButton = document.getElementById('play-audio');
        this.volumeSlider = document.getElementById('volume-slider');
        this.canvas = document.getElementById('audio-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add status message element first
        this.statusMessage = document.createElement('div');
        this.statusMessage.className = 'audio-status';
        document.querySelector('.audio-container').appendChild(this.statusMessage);
        
        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        
        this.playlist = [
            {
                title: "Cyberpunk Theme",
                file: "audio/cyberpunk-theme.mp3"
            },
            {
                title: "Echoes of Valor",
                file: "audio/EchoesofValor.mp3"
            },
            {
                title: "Final Confrontation",
                file: "audio/FinalConfrontation.mp3"
            },
            {
                title: "Legacy of Solitude",
                file: "audio/LegacyofSolitude.mp3"
            },
            {
                title: "Neon Shadows Dark",
                file: "audio/NeonShadows_dark.mp3"
            },
            {
                title: "Neon Shadows",
                file: "audio/NeonShadows.mp3"
            },
            {
                title: "Shadows of Desolation",
                file: "audio/ShadowsofDesolation.mp3"
            },
            {
                title: "Shadows of Tomorrow",
                file: "audio/ShadowsofTomorrow.mp3"
            },
            {
                title: "Synth Shadows",
                file: "audio/SynthShadows.mp3"
            },
            {
                title: "The Last Victory",
                file: "audio/TheLastVictory.mp3"
            }
        ];
        
        this.currentTrack = 0;
        
        // Add autoplay flag
        this.shouldAutoplay = true;
        this.hasInteracted = false;
        
        // Listen for user interactions across the entire page
        document.addEventListener('click', () => this.handleUserInteraction());
        document.addEventListener('keydown', () => this.handleUserInteraction());
        document.addEventListener('touchstart', () => this.handleUserInteraction());
        
        // Add looping by default
        this.isLooping = true;
        
        this.init();
        
        // Initialize playlist UI after audio setup
        this.initPlaylist();
    }
    
    checkBrowserSupport() {
        return !!(window.AudioContext || window.webkitAudioContext) && 
               !!document.createElement('audio').canPlayType('audio/mp3');
    }
    
    init() {
        try {
            // Create audio context with error handling
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                throw new Error('Web Audio API is not supported');
            }
            
            this.audioContext = new AudioContext();
            
            // Try multiple audio sources
            const isGitHubPages = window.location.hostname.includes('github.io');
            
            // Use a CDN-hosted fallback for GitHub Pages
            const audioSources = [
                // Local path
                isGitHubPages ? '/GigaCode_Dev_Showcase_Website/audio/cyberpunk-theme.mp3' : '/audio/cyberpunk-theme.mp3',
                // Fallback to a CDN-hosted version
                'https://assets.codepen.io/4358584/Anitek_-_Komorebi.mp3'
            ];
            
            // Try loading each source until one works
            this.tryLoadAudio(audioSources, 0);
            
            // Set up canvas
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Set up controls
            this.setupEventListeners();
            
            // Start animation only after audio is set up
            this.animate();
            
            // Set default looping
            this.audio.loop = this.isLooping;
        } catch (error) {
            console.error("Audio initialization error:", error);
            this.showStatus("Audio system initialization failed. Please try a different browser.", "error");
        }
    }
    
    tryLoadAudio(sources, index) {
        if (index >= sources.length) {
            this.showStatus("Failed to load audio from all sources", "error");
            return;
        }
        
        const source = sources[index];
        console.log(`Trying audio source ${index + 1}/${sources.length}: ${source}`);
        
        fetch(source)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const audioUrl = URL.createObjectURL(blob);
                this.audio.src = audioUrl;
                
                // Set up event listeners before loading
                this.audio.addEventListener('canplaythrough', () => {
                    console.log('Audio can play through from source:', source);
                    this.setupAudioNodes();
                    this.showStatus("Audio loaded successfully", "success");
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play Music</span>';
                    
                    // Initialize the analyzer for visualization
                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 256;
                    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                    
                    // Try autoplay if enabled
                    if (this.shouldAutoplay) {
                        this.attemptAutoplay();
                    }
                });
                
                this.audio.addEventListener('error', (e) => {
                    console.error('Audio loading error from source:', source, e);
                    // Try the next source
                    this.tryLoadAudio(sources, index + 1);
                });
                
                this.audio.load();
            })
            .catch(error => {
                console.error(`Error loading audio from source ${source}:`, error);
                // Try the next source
                this.tryLoadAudio(sources, index + 1);
            });
    }
    
    setupAudioNodes() {
        // Set up analyzer
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Connect audio to analyzer
        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Set initial volume
        if (this.volumeSlider) {
            this.audio.volume = this.volumeSlider.value;
        }
    }
    
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `audio-status ${type}`;
        
        // Hide status after 5 seconds
        setTimeout(() => {
            this.statusMessage.style.opacity = '0';
        }, 5000);
    }
    
    setupEventListeners() {
        this.playButton.addEventListener('click', () => this.togglePlay());
        
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });
        
        this.audio.addEventListener('play', () => {
            this.playButton.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
            this.playButton.classList.add('playing');
        });
        
        this.audio.addEventListener('pause', () => {
            this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
            this.playButton.classList.remove('playing');
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
            this.playButton.classList.remove('playing');
        });
    }
    
    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    togglePlay() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
        
        this.isPlaying = !this.isPlaying;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Only draw visualization if analyzer is set up
        if (!this.analyser || !this.dataArray) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate bar width and spacing
        const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
        const barSpacing = 2;
        let x = 0;
        
        // Draw visualization
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
            
            // Create gradient
            const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, 0);
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(0.5, '#ff00ff');
            gradient.addColorStop(1, '#0000ff');
            
            // Draw bar
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
            
            // Add glow effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#00ffff';
            
            x += barWidth + barSpacing;
        }
    }
    
    initPlaylist() {
        // Create a container for the playlist
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'audio-playlist';
        
        // Add a title
        const playlistTitle = document.createElement('div');
        playlistTitle.className = 'playlist-title';
        playlistTitle.innerHTML = '<i class="fas fa-music"></i> Playlist';
        playlistContainer.appendChild(playlistTitle);
        
        // Create a scrollable list for the tracks
        const trackList = document.createElement('div');
        trackList.className = 'track-list';
        
        // Add each track to the list
        this.playlist.forEach((track, index) => {
            const trackButton = document.createElement('button');
            trackButton.className = 'track-button cyber-button small';
            trackButton.innerHTML = `<span>${track.title}</span>`;
            
            // Highlight the current track
            if (index === this.currentTrack) {
                trackButton.classList.add('active');
            }
            
            trackButton.addEventListener('click', () => {
                // Update active class
                document.querySelectorAll('.track-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                trackButton.classList.add('active');
                
                // Load and play the track
                this.loadTrack(index);
            });
            
            trackList.appendChild(trackButton);
        });
        
        playlistContainer.appendChild(trackList);
        
        // Add playlist controls
        const playlistControls = document.createElement('div');
        playlistControls.className = 'playlist-controls';
        
        // Add shuffle button
        const shuffleButton = document.createElement('button');
        shuffleButton.className = 'playlist-control-button';
        shuffleButton.innerHTML = '<i class="fas fa-random"></i>';
        shuffleButton.addEventListener('click', () => this.shufflePlaylist());
        
        // Add previous track button
        const prevButton = document.createElement('button');
        prevButton.className = 'playlist-control-button';
        prevButton.innerHTML = '<i class="fas fa-step-backward"></i>';
        prevButton.addEventListener('click', () => this.prevTrack());
        
        // Add next track button
        const nextButton = document.createElement('button');
        nextButton.className = 'playlist-control-button';
        nextButton.innerHTML = '<i class="fas fa-step-forward"></i>';
        nextButton.addEventListener('click', () => this.nextTrack());
        
        // Add repeat button - make it active by default
        const repeatButton = document.createElement('button');
        repeatButton.className = 'playlist-control-button active';
        repeatButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
        repeatButton.addEventListener('click', () => {
            this.isLooping = !this.isLooping;
            this.audio.loop = this.isLooping;
            repeatButton.classList.toggle('active', this.isLooping);
            
            if (this.isLooping) {
                this.showStatus("Track will repeat", "info");
            } else {
                this.showStatus("Auto-advance to next track", "info");
            }
        });
        
        // Add buttons to controls
        playlistControls.appendChild(shuffleButton);
        playlistControls.appendChild(prevButton);
        playlistControls.appendChild(nextButton);
        playlistControls.appendChild(repeatButton);
        
        // Add controls to playlist
        playlistContainer.appendChild(playlistControls);
        
        // Add playlist to the audio container
        document.querySelector('.audio-container').appendChild(playlistContainer);
        
        // Update the ended event listener to respect looping setting
        this.audio.addEventListener('ended', () => {
            if (!this.isLooping) {
                this.nextTrack();
            }
            // If looping is enabled, the audio element's native loop will handle it
        });
    }
    
    loadTrack(index) {
        this.currentTrack = index;
        
        // Get the correct path based on whether we're on GitHub Pages
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? '/GigaCode_Dev_Showcase_Website' : '';
        const audioPath = `${baseUrl}/${this.playlist[index].file}`;
        
        console.log('Loading track:', audioPath);
        
        // Try to load the track
        fetch(audioPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const audioUrl = URL.createObjectURL(blob);
                this.audio.src = audioUrl;
                this.audio.load();
                
                // Play if we were already playing
                if (this.isPlaying) {
                    this.audio.play();
                }
                
                // Update the track button UI
                document.querySelectorAll('.track-button').forEach((btn, i) => {
                    btn.classList.toggle('active', i === index);
                });
                
                this.showStatus(`Now playing: ${this.playlist[index].title}`, "success");
                
                // Apply current loop setting to the new track
                this.audio.loop = this.isLooping;
            })
            .catch(error => {
                console.error("Error loading track:", error);
                this.showStatus(`