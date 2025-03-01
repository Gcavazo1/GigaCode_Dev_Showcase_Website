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
        try {
            // Disconnect any existing nodes
            if (this.source) {
                this.source.disconnect();
            }
            
            // Create new analyzer with higher resolution
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Increased for better resolution
            this.analyser.smoothingTimeConstant = 0.85;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Create and connect nodes
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Set initial volume
            if (this.volumeSlider) {
                this.audio.volume = this.volumeSlider.value;
            }
            
            console.log('Audio nodes setup complete', {
                fftSize: this.analyser.fftSize,
                frequencyBinCount: this.analyser.frequencyBinCount,
                audioContext: this.audioContext.state
            });
        } catch (error) {
            console.error('Error setting up audio nodes:', error);
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
        
        // Only draw visualization if analyzer is set up and audio is playing
        if (!this.analyser || !this.dataArray || !this.isPlaying) {
            // Draw static visualization when not playing
            this.drawCyberpunkBackground();
            this.drawMainVisualization();
            this.drawParticles();
            return;
        }
        
        // Get fresh frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate average frequency for overall intensity
        const average = Array.from(this.dataArray).reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = average / 255;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw visualization layers
        this.drawCyberpunkBackground();
        this.drawMainVisualization();
        this.drawParticles();
        
        // Log visualization data occasionally for debugging
        if (Math.random() < 0.01) { // Log roughly every 100 frames
            console.log('Visualization data:', {
                average,
                intensity,
                sampleValue: this.dataArray[0]
            });
        }
    }
    
    drawCyberpunkBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000B1F');
        gradient.addColorStop(1, '#0F2043');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawMainVisualization() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate average frequency for glow effect
        const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = average / 255;
        
        // Draw circular visualizer
        for (let i = 0; i < this.dataArray.length; i += 2) { // Skip every other value for performance
            const amplitude = this.dataArray[i] / 255;
            const angle = (i / this.dataArray.length) * Math.PI * 2;
            const barHeight = radius * amplitude * 1.5; // Increased multiplier for more visible effect
            const hue = 180 + (amplitude * 60); // Cyan to blue range
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            // Draw glowing line with dynamic width
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${amplitude})`;
            this.ctx.lineWidth = 2 + amplitude * 3;
            this.ctx.shadowBlur = 15 + intensity * 15;
            this.ctx.shadowColor = `hsla(${hue}, 100%, 50%, ${amplitude})`;
            this.ctx.stroke();
            
            // Draw connecting lines between bars with dynamic opacity
            if (i > 0) {
                const prevAngle = ((i - 2) / this.dataArray.length) * Math.PI * 2;
                const prevAmplitude = this.dataArray[i - 2] / 255;
                const prevX = centerX + Math.cos(prevAngle) * (radius + radius * prevAmplitude);
                const prevY = centerY + Math.sin(prevAngle) * (radius + radius * prevAmplitude);
                
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(x2, y2);
                this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${amplitude * 0.3})`;
                this.ctx.stroke();
            }
        }
        
        // Draw reactive center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * (1 + intensity * 0.1), 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + intensity * 0.4})`;
        this.ctx.lineWidth = 2 + intensity * 2;
        this.ctx.stroke();
        
        // Add pulsing inner circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.8 * (1 + intensity * 0.2), 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + intensity * 0.2})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawParticles() {
        // Initialize particles if they don't exist
        if (!this.particles) {
            this.particles = Array.from({ length: 100 }, () => ({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                hue: Math.random() * 60 + 180 // Cyan to blue range
            }));
        }
        
        // Get average frequency for particle reactivity
        const average = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = average / 255;
        
        // Update and draw particles
        this.particles.forEach(particle => {
            // Update position with audio reactivity
            particle.x += particle.speedX * (1 + intensity * 2);
            particle.y += particle.speedY * (1 + intensity * 2);
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Draw particle with audio-reactive size and opacity
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * (1 + intensity), 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${0.2 + intensity * 0.5})`;
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowBlur = 5 + intensity * 10;
            this.ctx.shadowColor = `hsla(${particle.hue}, 100%, 50%, ${intensity})`;
        });
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
        
        // Add repeat button
        const repeatButton = document.createElement('button');
        repeatButton.className = 'playlist-control-button';
        repeatButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
        repeatButton.addEventListener('click', () => {
            this.audio.loop = !this.audio.loop;
            repeatButton.classList.toggle('active');
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
        
        // Add event listener for track end to play next track
        this.audio.addEventListener('ended', () => {
            if (!this.audio.loop) {
                this.nextTrack();
            }
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
                
                // Disconnect old audio nodes before changing source
                if (this.source) {
                    this.source.disconnect();
                }
                
                this.audio.src = audioUrl;
                this.audio.load();
                
                // Set up new audio nodes after loading new track
                this.audio.addEventListener('canplaythrough', () => {
                    this.setupAudioNodes();
                    
                    // Play if we were already playing
                    if (this.isPlaying) {
                        this.audio.play();
                    }
                    
                    // Update the track button UI
                    document.querySelectorAll('.track-button').forEach((btn, i) => {
                        btn.classList.toggle('active', i === index);
                    });
                    
                    this.showStatus(`