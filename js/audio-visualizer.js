// Audio Visualizer for Cyberpunk Portfolio

class AudioVisualizer {
    constructor() {
        this.audio = document.getElementById('background-audio');
        this.playButton = document.getElementById('play-audio');
        this.volumeSlider = document.getElementById('volume-slider');
        this.canvas = document.getElementById('audio-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Add status message element
        this.statusMessage = document.createElement('div');
        this.statusMessage.className = 'audio-status';
        document.querySelector('.audio-container').appendChild(this.statusMessage);
        
        // Initialize properties
        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.audioNodesInitialized = false;
        this.sourceCreated = false;
        
        // Initialize playlist
        this.playlist = [
            { title: "Cyberpunk Theme", file: "audio/cyberpunk-theme.mp3" },
            { title: "Echoes of Valor", file: "audio/EchoesofValor.mp3" },
            { title: "Final Confrontation", file: "audio/FinalConfrontation.mp3" },
            { title: "Legacy of Solitude", file: "audio/LegacyofSolitude.mp3" },
            { title: "Neon Shadows Dark", file: "audio/NeonShadows_dark.mp3" },
            { title: "Neon Shadows", file: "audio/NeonShadows.mp3" },
            { title: "Shadows of Desolation", file: "audio/ShadowsofDesolation.mp3" },
            { title: "Shadows of Tomorrow", file: "audio/ShadowsofTomorrow.mp3" },
            { title: "Synth Shadows", file: "audio/SynthShadows.mp3" },
            { title: "The Last Victory", file: "audio/TheLastVictory.mp3" }
        ];
        
        this.currentTrack = 0;
        this.hasInteracted = false;
        
        // Initialize
        this.init();
        this.initPlaylist();
        
        // Start animation loop
        this.animate();
    }
    
    init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Determine if we're on GitHub Pages or local
            const isGitHubPages = window.location.hostname.includes('github.io');
            const baseUrl = isGitHubPages ? '/GigaCode_Dev_Showcase_Website' : '';
            const audioPath = `${baseUrl}/${this.playlist[this.currentTrack].file}`;
            
            console.log('Loading audio from:', audioPath);
            
            // Load the audio file
            this.loadAudioFile(audioPath);
            
            // Set up canvas and event listeners
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.setupEventListeners();
            
            // Listen for user interactions
            document.addEventListener('click', () => this.handleUserInteraction());
            document.addEventListener('keydown', () => this.handleUserInteraction());
            document.addEventListener('touchstart', () => this.handleUserInteraction());
            
        } catch (error) {
            console.error("Audio initialization error:", error);
            this.showStatus("Audio initialization failed. Please try a different browser.", "error");
        }
    }
    
    loadAudioFile(path) {
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const audioUrl = URL.createObjectURL(blob);
                this.audio.src = audioUrl;
                
                this.audio.addEventListener('canplaythrough', () => {
                    console.log('Audio loaded and can play');
                    this.setupAudioNodes();
                    this.showStatus("Audio loaded successfully", "success");
                    this.playButton.disabled = false;
                    this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
                }, { once: true });
                
                this.audio.addEventListener('error', (e) => {
                    console.error('Audio loading error:', e);
                    this.showStatus("Error loading audio file", "error");
                });
                
                this.audio.load();
            })
            .catch(error => {
                console.error("Error loading audio file:", error);
                this.showStatus(`Error loading audio: ${error.message}`, "error");
            });
    }
    
    setupAudioNodes() {
        try {
            // If we've already created a source node, just reconnect it
            if (this.sourceCreated) {
                console.log('Source already created, reconnecting nodes');
                
                // Disconnect and reconnect
                if (this.source) {
                    this.source.disconnect();
                    this.source.connect(this.analyser);
                    this.analyser.connect(this.audioContext.destination);
                }
            } else {
                // First time setup - create new nodes
                console.log('Creating new audio nodes');
                
                // Create analyzer
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 1024;
                this.analyser.smoothingTimeConstant = 0.8;
                
                // Create data array for visualization
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                
                // Create source node only once
                this.source = this.audioContext.createMediaElementSource(this.audio);
                this.sourceCreated = true;
                
                // Connect nodes
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
            
            // Set initial volume
            if (this.volumeSlider) {
                this.audio.volume = this.volumeSlider.value;
            }
            
            this.audioNodesInitialized = true;
            console.log('Audio nodes setup complete');
        } catch (error) {
            console.error('Error setting up audio nodes:', error);
            this.showStatus("Error setting up audio visualization", "error");
        }
    }
    
    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `audio-status ${type}`;
        this.statusMessage.style.opacity = '1';
        
        // Hide status after 5 seconds
        setTimeout(() => {
            this.statusMessage.style.opacity = '0';
        }, 5000);
    }
    
    setupEventListeners() {
        // Play/pause button
        this.playButton.addEventListener('click', () => {
            this.togglePlay();
        });
        
        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });
        
        // Audio state changes
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.playButton.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
            this.playButton.classList.add('playing');
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
            this.playButton.classList.remove('playing');
        });
        
        this.audio.addEventListener('ended', () => {
            if (!this.audio.loop) {
                this.nextTrack();
            }
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
            this.audio.play().catch(error => {
                console.error("Play failed:", error);
                this.showStatus("Playback failed. Try clicking again.", "error");
            });
        }
    }
    
    handleUserInteraction() {
        if (!this.hasInteracted) {
            this.hasInteracted = true;
            console.log("User interaction detected");
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log("AudioContext resumed");
                });
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Draw background regardless of audio state
        this.drawCyberpunkBackground();
        
        // Only process audio data if playing and nodes are initialized
        if (this.isPlaying && this.audioNodesInitialized && this.analyser && this.dataArray) {
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Draw visualization
            this.drawMainVisualization();
            this.drawParticles();
        } else {
            // Draw static visualization when not playing
            this.drawStaticVisualization();
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
    
    drawStaticVisualization() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        
        // Draw static circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw pulsing inner circle with time-based animation
        const pulse = 0.1 * Math.sin(Date.now() / 1000) + 0.9;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.8 * pulse, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw static particles
        if (!this.particles) {
            this.particles = Array.from({ length: 50 }, () => ({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                hue: Math.random() * 60 + 180
            }));
        }
        
        // Update and draw particles with subtle movement
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, 0.3)`;
            this.ctx.fill();
        });
    }
    
    drawMainVisualization() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        
        // Calculate average for intensity
        const average = Array.from(this.dataArray).reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = average / 255;
        
        // Draw circular visualizer
        for (let i = 0; i < this.dataArray.length; i += 4) {
            const amplitude = this.dataArray[i] / 255;
            const angle = (i / this.dataArray.length) * Math.PI * 2;
            const barHeight = radius * amplitude * 1.5;
            const hue = 180 + (amplitude * 60);
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            // Draw line
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${amplitude})`;
            this.ctx.lineWidth = 2 + amplitude * 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = `hsla(${hue}, 100%, 50%, ${amplitude})`;
            this.ctx.stroke();
        }
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * (1 + intensity * 0.1), 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + intensity * 0.4})`;
        this.ctx.lineWidth = 2 + intensity * 2;
        this.ctx.stroke();
    }
    
    drawParticles() {
        if (!this.particles) {
            this.particles = Array.from({ length: 50 }, () => ({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                hue: Math.random() * 60 + 180
            }));
        }
        
        // Calculate average for particle reactivity
        const average = Array.from(this.dataArray).reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = average / 255;
        
        // Update and draw particles
        this.particles.forEach(particle => {
            particle.x += particle.speedX * (1 + intensity);
            particle.y += particle.speedY * (1 + intensity);
            
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * (1 + intensity * 0.5), 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${0.2 + intensity * 0.5})`;
            this.ctx.fill();
            
            this.ctx.shadowBlur = 5 + intensity * 10;
            this.ctx.shadowColor = `hsla(${particle.hue}, 100%, 50%, ${intensity})`;
        });
    }
    
    initPlaylist() {
        // Create playlist container
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'audio-playlist';
        
        // Add title
        const playlistTitle = document.createElement('div');
        playlistTitle.className = 'playlist-title';
        playlistTitle.innerHTML = '<i class="fas fa-music"></i> Playlist';
        playlistContainer.appendChild(playlistTitle);
        
        // Create track list
        const trackList = document.createElement('div');
        trackList.className = 'track-list';
        
        // Add tracks
        this.playlist.forEach((track, index) => {
            const trackButton = document.createElement('button');
            trackButton.className = 'track-button cyber-button small';
            trackButton.innerHTML = `<span>${track.title}</span>`;
            
            if (index === this.currentTrack) {
                trackButton.classList.add('active');
            }
            
            trackButton.addEventListener('click', () => {
                document.querySelectorAll('.track-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                trackButton.classList.add('active');
                this.loadTrack(index);
            });
            
            trackList.appendChild(trackButton);
        });
        
        playlistContainer.appendChild(trackList);
        
        // Add controls
        const playlistControls = document.createElement('div');
        playlistControls.className = 'playlist-controls';
        
        // Shuffle button
        const shuffleButton = document.createElement('button');
        shuffleButton.className = 'playlist-control-button';
        shuffleButton.innerHTML = '<i class="fas fa-random"></i>';
        shuffleButton.addEventListener('click', () => this.shufflePlaylist());
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'playlist-control-button';
        prevButton.innerHTML = '<i class="fas fa-step-backward"></i>';
        prevButton.addEventListener('click', () => this.prevTrack());
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'playlist-control-button';
        nextButton.innerHTML = '<i class="fas fa-step-forward"></i>';
        nextButton.addEventListener('click', () => this.nextTrack());
        
        // Repeat button
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
        
        // Add playlist to container
        document.querySelector('.audio-container').appendChild(playlistContainer);
    }
    
    loadTrack(index) {
        this.currentTrack = index;
        
        // Get path
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? '/GigaCode_Dev_Showcase_Website' : '';
        const audioPath = `${baseUrl}/${this.playlist[index].file}`;
        
        console.log('Loading track:', audioPath);
        
        // We don't need to reset audio nodes completely, just mark as not initialized
        this.audioNodesInitialized = false;
        
        // Load new track
        fetch(audioPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const audioUrl = URL.createObjectURL(blob);
                
                // Set new source without disconnecting
                this.audio.src = audioUrl;
                this.audio.load();
                
                // Set up audio nodes after loading
                this.audio.addEventListener('canplaythrough', () => {
                    // Reconnect existing nodes
                    this.setupAudioNodes();
                    
                    // Play if already playing
                    if (this.isPlaying) {
                        this.audio.play().catch(e => console.error("Playback error:", e));
                    }
                    
                    // Update UI
                    document.querySelectorAll('.track-button').forEach((btn, i) => {
                        btn.classList.toggle('active', i === index);
                    });
                    
                    this.showStatus(`Now playing: ${this.playlist[index].title}`, "success");
                }, { once: true });
            })
            .catch(error => {
                console.error("Error loading track:", error);
                this.showStatus(`Error loading track: ${error.message}`, "error");
            });
    }
    
    nextTrack() {
        const nextIndex = (this.currentTrack + 1) % this.playlist.length;
        this.loadTrack(nextIndex);
    }
    
    prevTrack() {
        const prevIndex = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(prevIndex);
    }
    
    shufflePlaylist() {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.playlist.length);
        } while (randomIndex === this.currentTrack && this.playlist.length > 1);
        
        this.loadTrack(randomIndex);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioVisualizer();
});