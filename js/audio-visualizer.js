// Audio Visualizer for Cyberpunk Portfolio

class AudioVisualizer {
    constructor() {
        this.audio = document.getElementById('background-audio');
        this.playButton = document.getElementById('play-audio');
        this.volumeSlider = document.getElementById('volume-slider');
        this.canvas = document.getElementById('audio-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.isPlaying = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        
        // Add a status message element
        this.statusMessage = document.createElement('div');
        this.statusMessage.className = 'audio-status';
        document.querySelector('.audio-container').appendChild(this.statusMessage);
        
        this.playlist = [
            {
                title: "Cyberpunk Theme",
                file: "audio/cyberpunk-theme.mp3"
            }
        ];
        
        this.currentTrack = 0;
        
        // Add autoplay with user interaction flag
        this.hasInteracted = false;
        
        // Listen for first user interaction
        document.addEventListener('click', () => this.handleFirstInteraction(), { once: true });
        document.addEventListener('keydown', () => this.handleFirstInteraction(), { once: true });
        
        this.init();
    }
    
    init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Determine if we're on GitHub Pages or local
            const isGitHubPages = window.location.hostname.includes('github.io');
            const baseUrl = isGitHubPages ? '/GigaCode_Dev_Showcase_Website' : '';
            const audioPath = `${baseUrl}/audio/cyberpunk-theme.mp3`;
            
            console.log('Loading audio from:', audioPath);
            
            // Create a fetch request to check if the file exists
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
                    
                    // Create analyzer after audio is loaded
                    this.audio.addEventListener('loadedmetadata', () => {
                        this.setupAudioNodes();
                        this.showStatus("Audio loaded successfully", "success");
                        this.playButton.disabled = false;
                        this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play Music</span>';
                    });
                })
                .catch(error => {
                    console.error("Error loading audio file:", error);
                    this.showStatus(`Error loading audio: ${error.message}`, "error");
                });
            
            // Set up canvas
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Set up controls
            this.setupEventListeners();
            
            // Start animation
            this.animate();
        } catch (error) {
            console.error("Audio initialization error:", error);
            this.showStatus("Your browser doesn't support Web Audio API", "error");
        }
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
        
        requestAnimationFrame(() => this.animate());
    }
    
    initPlaylist() {
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'audio-playlist';
        
        this.playlist.forEach((track, index) => {
            const trackButton = document.createElement('button');
            trackButton.className = 'track-button cyber-button small';
            trackButton.textContent = track.title;
            trackButton.addEventListener('click', () => this.loadTrack(index));
            playlistContainer.appendChild(trackButton);
        });
        
        this.audio.parentElement.appendChild(playlistContainer);
    }
    
    loadTrack(index) {
        this.currentTrack = index;
        this.audio.src = this.playlist[index].file;
        this.audio.load();
        if (this.isPlaying) {
            this.audio.play();
        }
    }
    
    handleFirstInteraction() {
        if (!this.hasInteracted) {
            this.hasInteracted = true;
            
            // Try to autoplay after user interaction
            this.audio.play().then(() => {
                this.isPlaying = true;
                this.playButton.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
                this.playButton.classList.add('playing');
                this.showStatus("Music playing", "success");
            }).catch(error => {
                console.error("Autoplay failed:", error);
                this.showStatus("Click play to start music", "info");
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioVisualizer();
}); 