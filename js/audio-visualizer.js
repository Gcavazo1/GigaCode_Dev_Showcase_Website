// Audio Visualizer for Cyberpunk Portfolio

class AudioVisualizer {
    constructor() {
        this.canvas = document.getElementById('audio-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.audioElement = document.getElementById('background-audio');
        this.playButton = document.getElementById('play-audio');
        
        this.init();
    }
    
    init() {
        if (!this.canvas || !this.audioElement || !this.playButton) {
            console.warn('Audio visualizer elements not found');
            return;
        }
        
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Draw placeholder visualization
        this.drawPlaceholder();
        
        // Set up audio context when user interacts
        this.playButton.addEventListener('click', () => {
            // Initialize audio context on first click (to comply with autoplay policies)
            if (!this.audioContext) {
                this.initAudio();
            }
            
            this.togglePlay();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            
            if (!this.isPlaying) {
                this.drawPlaceholder();
            }
        });
    }
    
    initAudio() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            // Connect audio element to analyser
            const source = this.audioContext.createMediaElementSource(this.audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        } catch (error) {
            console.error('Error initializing audio:', error);
            this.audioContext = null;
        }
    }
    
    togglePlay() {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            this.playButton.textContent = 'Play Music';
            this.drawPlaceholder();
        } else {
            this.audioElement.play()
                .then(() => {
                    this.isPlaying = true;
                    this.playButton.textContent = 'Pause Music';
                    this.visualize();
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                    // Show error message to user
                    alert('Could not play audio. Please make sure you have an audio file at audio/cyberpunk-theme.mp3');
                });
        }
    }
    
    drawPlaceholder() {
        if (!this.ctx) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw placeholder bars
        const barWidth = (width / 64) * 2.5;
        let x = 0;
        
        for (let i = 0; i < 64; i++) {
            // Create a gradient based on position
            const hue = (i / 64) * 360;
            const barHeight = Math.sin(i * 0.1) * (height / 2) * 0.8 + (height / 4);
            
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        // Add text overlay
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '16px var(--heading-font)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click Play to start the music visualization', width / 2, height / 2);
    }
    
    visualize() {
        if (!this.isPlaying || !this.analyser || !this.ctx) return;
        
        requestAnimationFrame(() => this.visualize());
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw visualization
        const barWidth = (width / this.dataArray.length) * 2.5;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = this.dataArray[i] / 255 * height * 0.8;
            
            // Create gradient based on frequency and amplitude
            const hue = i / this.dataArray.length * 360;
            const saturation = 80 + (this.dataArray[i] / 255) * 20; // 80-100%
            const lightness = 40 + (this.dataArray[i] / 255) * 20; // 40-60%
            
            this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            // Draw bar with rounded top
            this.ctx.beginPath();
            this.ctx.moveTo(x, height);
            this.ctx.lineTo(x, height - barHeight);
            this.ctx.arc(x + barWidth / 2, height - barHeight, barWidth / 2, Math.PI, 0, false);
            this.ctx.lineTo(x + barWidth, height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            this.ctx.shadowBlur = 10;
            
            x += barWidth + 1;
        }
        
        // Reset shadow for next frame
        this.ctx.shadowBlur = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AudioVisualizer();
}); 