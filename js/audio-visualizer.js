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
        
        // Add color transition
        this.currentHue = 0;
        this.colorSchemes = {
            cyberpunk: {
                bars: [
                    { hue: 320, saturation: 100, lightness: 60 }, // Neon Pink
                    { hue: 180, saturation: 100, lightness: 50 }, // Cyan
                    { hue: 275, saturation: 100, lightness: 55 }, // Purple
                    { hue: 120, saturation: 100, lightness: 45 }  // Neon Green
                ],
                background: {
                    primary: '#120458',    // Deep Purple
                    secondary: '#20124d'   // Rich Purple
                }
            }
        };
        
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
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawCyberpunkBackground();
        
        if (this.isPlaying && this.audioNodesInitialized && this.analyser && this.dataArray) {
            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Draw both visualizations
            this.drawMainVisualization();
            // Uncomment to add waveform visualization
            // this.drawWaveformVisualization();
            
            this.drawParticles();
        } else {
            this.drawStaticVisualization();
        }
    }
    
    drawCyberpunkBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 10, 0.9)');  // Almost black at top
        gradient.addColorStop(1, 'rgba(10, 10, 25, 0.9)'); // Very dark blue at bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw monochromatic grid with subtle animation
        const time = Date.now() * 0.001;
        const gridOpacity = 0.1 + Math.sin(time) * 0.05;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity * 0.5})`; // White lines with reduced opacity
            this.ctx.lineWidth = 0.5;  // Thinner lines
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity * 0.5})`; // White lines with reduced opacity
            this.ctx.lineWidth = 0.5;  // Thinner lines
            this.ctx.stroke();
        }
        
        // Add subtle vignette effect
        const vignette = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        
        // Rotate starting position by -90 degrees (pointing up) and go counter-clockwise
        const startAngle = -Math.PI / 2; // Start from top
        
        // Update the color transition
        this.currentHue = (this.currentHue + 0.5) % 360;
        
        const colors = {
            bars: {
                baseHue: this.currentHue,
                hueRange: 60,
                saturation: 100,
                lightness: 50,
                minOpacity: 0.4,
                maxOpacity: 0.9
            },
            innerCircle: {
                color: 'rgba(255, 0, 255, 0.3)',  // Neon Pink
                glowColor: 'rgba(255, 0, 255, 0.5)',
                pulseIntensity: 0.3
            },
            rings: {
                baseColor: 'rgba(0, 255, 255, ',  // Cyan
                glowColor: 'rgba(255, 0, 255, ',  // Pink
                count: 4,
                spacing: 0.25,
                baseOpacity: 0.15
            },
            connections: {
                opacity: 0.4,
                glowIntensity: 0.6
            }
        };

        // Draw circular visualizer with custom colors
        for (let i = 0; i < this.dataArray.length; i += 4) {
            const amplitude = this.dataArray[i] / 255;
            const angle = startAngle + ((2 * Math.PI) - (i / this.dataArray.length) * Math.PI * 2);
            const barHeight = radius * amplitude * 1.8; // Increased height
            
            // Cycle through cyberpunk colors
            const colorIndex = Math.floor(i / (this.dataArray.length / 4));
            const baseColor = this.colorSchemes.cyberpunk.bars[colorIndex % 4];
            const hue = baseColor.hue + (amplitude * 30); // Small hue variation
            const opacity = colors.bars.minOpacity + (amplitude * (colors.bars.maxOpacity - colors.bars.minOpacity));
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            // Draw main bars with custom colors
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = `hsla(${hue}, ${baseColor.saturation}%, ${baseColor.lightness}%, ${opacity})`;
            this.ctx.lineWidth = 2 + amplitude * 3;
            this.ctx.shadowBlur = 15 + (amplitude * 10);
            this.ctx.shadowColor = `hsla(${hue}, ${baseColor.saturation}%, ${baseColor.lightness}%, ${amplitude})`;
            this.ctx.stroke();
            
            // Draw connecting lines with custom opacity
            if (i > 0) {
                const prevAngle = startAngle + ((2 * Math.PI) - ((i - 4) / this.dataArray.length) * Math.PI * 2);
                const prevAmplitude = this.dataArray[i - 4] / 255;
                const prevX2 = centerX + Math.cos(prevAngle) * (radius + radius * prevAmplitude * 1.5);
                const prevY2 = centerY + Math.sin(prevAngle) * (radius + radius * prevAmplitude * 1.5);
                
                this.ctx.beginPath();
                this.ctx.moveTo(prevX2, prevY2);
                this.ctx.lineTo(x2, y2);
                this.ctx.strokeStyle = `hsla(${hue}, ${baseColor.saturation}%, ${baseColor.lightness}%, ${amplitude * colors.connections.opacity})`;
                this.ctx.stroke();
            }
        }
        
        // Draw inner circle with custom colors
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * (0.8 + intensity * colors.innerCircle.pulseIntensity), 0, Math.PI * 2);
        this.ctx.strokeStyle = colors.innerCircle.color;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = colors.innerCircle.glowColor;
        this.ctx.stroke();
        
        // Draw outer rings with custom colors
        for (let i = 0; i < colors.rings.count; i++) {
            const ringRadius = radius * (1.2 + i * colors.rings.spacing) * (1 + intensity * 0.2);
            const opacity = colors.rings.baseOpacity - (i * 0.02) + (intensity * 0.1);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = colors.rings.baseColor + opacity + ')';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Update particle colors
        if (this.particles) {
            this.particles.forEach(particle => {
                const colorIndex = Math.floor(Math.random() * 4);
                const baseColor = this.colorSchemes.cyberpunk.bars[colorIndex];
                particle.hue = baseColor.hue;
            });
        }
    }
    
    drawWaveformVisualization() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;
        const intensity = Array.from(this.dataArray).reduce((a, b) => a + b, 0) / this.dataArray.length / 255;
        
        // Create gradient for waveform
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, `hsla(180, 100%, 50%, ${0.5 + intensity * 0.5})`);
        gradient.addColorStop(0.5, `hsla(210, 100%, 50%, ${0.5 + intensity * 0.5})`);
        gradient.addColorStop(1, `hsla(180, 100%, 50%, ${0.5 + intensity * 0.5})`);
        
        // Draw mirrored waveform
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        
        // Top wave
        for (let i = 0; i < this.dataArray.length; i++) {
            const x = (i / this.dataArray.length) * width;
            const y = centerY - (this.dataArray[i] / 255) * height * 0.4;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                // Use quadratic curves for smoother lines
                const xc = (x + ((i - 1) / this.dataArray.length) * width) / 2;
                const yc = (y + (centerY - (this.dataArray[i - 1] / 255) * height * 0.4)) / 2;
                this.ctx.quadraticCurveTo(xc, yc, x, y);
            }
        }
        
        // Bottom wave (mirrored)
        for (let i = this.dataArray.length - 1; i >= 0; i--) {
            const x = (i / this.dataArray.length) * width;
            const y = centerY + (this.dataArray[i] / 255) * height * 0.4;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `rgba(0, 255, 255, ${intensity})`;
        
        // Add moving particles along the waveform
        for (let i = 0; i < this.dataArray.length; i += 8) {
            const amplitude = this.dataArray[i] / 255;
            const x = (i / this.dataArray.length) * width;
            const y1 = centerY - amplitude * height * 0.4;
            const y2 = centerY + amplitude * height * 0.4;
            
            // Draw particles
            this.ctx.beginPath();
            this.ctx.arc(x, y1, 2 + amplitude * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${amplitude})`;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(x, y2, 2 + amplitude * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${amplitude})`;
            this.ctx.fill();
        }
    }
    
    drawParticles() {
        // Increase number of particles and make them bigger
        if (!this.particles) {
            this.particles = Array.from({ length: 150 }, () => ({  // Increased from 50 to 150
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 2,  // Increased base size (was 2 + 1)
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                hue: Math.random() * 60 + 180
            }));
        }
        
        // Get average frequency for particle reactivity
        const average = Array.from(this.dataArray).reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = average / 255;
        
        // Update and draw particles with enhanced effects
        this.particles.forEach(particle => {
            particle.x += particle.speedX * (1 + intensity * 2);
            particle.y += particle.speedY * (1 + intensity * 2);
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Draw larger particles with stronger glow
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * (1 + intensity), 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${particle.hue}, 100%, 50%, ${0.3 + intensity * 0.5})`; // Increased base opacity
            this.ctx.fill();
            
            // Enhanced glow effect
            this.ctx.shadowBlur = 10 + intensity * 15;  // Increased glow
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