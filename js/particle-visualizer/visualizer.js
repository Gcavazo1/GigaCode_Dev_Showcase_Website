import * as THREE from 'three';
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
    
    // Update audio analyzer
    if (this.isPlaying) {
      const audioData = this.audioAnalyzer.update();
      const beatDetected = this.beatDetector.update(audioData, elapsedTime * 1000);
      
      // Update particle system
      this.particleSystem.update(elapsedTime, audioData, beatDetected);
    } else {
      // Update with default values when not playing
      this.particleSystem.update(elapsedTime);
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    if (this.debugMode && this.isPlaying && this.clock.getElapsedTime() % 5 < 0.1) {
      console.log('[Visualizer] Audio data:', this.audioAnalyzer.frequencyData);
      console.log('[Visualizer] FPS:', Math.round(1 / this.clock.getDelta()));
    }
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