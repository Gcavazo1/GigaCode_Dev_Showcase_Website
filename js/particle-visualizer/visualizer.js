import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import ParticleSystem from './particles.js';
import AudioAnalyzer from './audio/analyzer.js';
import BeatDetector from './audio/beat-detector.js';

class ParticleVisualizer {
  constructor() {
    // DOM elements
    this.canvas = document.getElementById('background-visualizer');
    
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Audio components
    this.audioAnalyzer = new AudioAnalyzer();
    this.beatDetector = new BeatDetector();
    
    // Particle system
    this.particleSystem = new ParticleSystem();
    
    // Animation
    this.clock = new THREE.Clock();
    this.isPlaying = false;
    this.isInitialized = false;
    
    // Debug mode
    this.debugMode = true;
    
    // Add rotation properties
    this.autoRotate = true;
    this.rotationSpeed = 0.005;
    
    // Initialize
    this.init();
    this.animate();
  }

  async init() {
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.z = 12;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    
    // Configure beat detector
    this.beatDetector.onBeat = () => {
      console.log('Beat detected!');
      // You could add additional beat reactions here
    };
    
    // Load and create particle system
    await this.particleSystem.load();
    const particles = this.particleSystem.create();
    this.scene.add(particles);
    
    // Set up listeners
    window.addEventListener('resize', this.resize.bind(this));
    
    if (this.debugMode) {
      console.log('[Visualizer] Initializing particle visualizer');
      console.log('[Visualizer] Canvas dimensions:', window.innerWidth, window.innerHeight);
    }
    
    this.isInitialized = true;
  }

  connectToAudioPlayer(audioElement) {
    if (!audioElement) return false;
    
    const connected = this.audioAnalyzer.connect(audioElement);
    if (connected) {
      this.isPlaying = true;
      console.log('Connected to audio player successfully');
      
      if (this.debugMode) {
        console.log('[Visualizer] Attempting to connect to audio element:', !!audioElement);
        console.log('[Visualizer] Audio context created:', !!this.audioAnalyzer.audioContext);
      }
      
      return true;
    }
    
    return false;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (!this.isInitialized) return;
    
    const elapsedTime = this.clock.getElapsedTime();
    
    // IMPORTANT: Add debug logging to see if this is being called
    console.log("Animate frame, audio playing:", this.isPlaying);
    
    // Update audio analyzer only if playing
    if (this.isPlaying) {
      const audioData = this.audioAnalyzer.update();
      const beatDetected = this.beatDetector.update(audioData, elapsedTime * 1000);
      
      // Debug the audio data to see what values we're getting
      console.log("Audio data:", audioData);
      
      // Update time with constant increment (more reliable)
      if (this.particleSystem) {
        this.particleSystem.uniforms.time.value += 0.1;
        
        // Set direct values from audio
        if (audioData) {
          this.particleSystem.uniforms.amplitude.value = 0.8 + (audioData.high * 2.0);
          this.particleSystem.uniforms.frequency.value = 2.0 + (audioData.low * 3.0);
          this.particleSystem.uniforms.offsetGain.value = 0.5 + (audioData.mid * 2.0);
        }
      }
    } else {
      // Just update time when not playing
      if (this.particleSystem) {
        this.particleSystem.uniforms.time.value += 0.1;
      }
    }
    
    // Apply auto-rotation
    if (this.autoRotate && this.particleSystem && this.particleSystem.points) {
      this.particleSystem.points.rotation.x += this.rotationSpeed;
      this.particleSystem.points.rotation.y += this.rotationSpeed;
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    if (!this.isInitialized) return;
    
    // Update sizes
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Update particles if needed
    this.particleSystem.resize(width, height);
  }

  show() {
    if (this.canvas) {
      this.canvas.classList.add('active');
    }
  }

  hide() {
    if (this.canvas) {
      this.canvas.classList.remove('active');
    }
  }
}

export default ParticleVisualizer;