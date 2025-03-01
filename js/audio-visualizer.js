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
        
        this.playlist = [
            {
                title: "Cyberpunk Theme",
                file: "audio/cyberpunk-theme.mp3"
            }
        ];
        
        this.currentTrack = 0;
        
        this.init();
    }
    
    init() {
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Set up audio source
        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Set initial volume
        this.audio.volume = this.volumeSlider.value;
        
        // Set up canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Set up controls
        this.setupEventListeners();
        
        // Start animation
        this.animate();
        
        // Add loading indicator
        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
            this.playButton.disabled = false;
            this.playButton.textContent = 'Play Music';
        });
        
        // Add error handling
        this.audio.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            this.playButton.textContent = 'Audio Load Error';
            this.playButton.disabled = true;
        });
        
        this.initPlaylist();
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioVisualizer();
}); 