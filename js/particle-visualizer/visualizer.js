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
    try {
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
      if (!this.canvas) {
        console.error('[Visualizer] Canvas element not found! Creating fallback.');
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
      }
      
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
        console.log('[BeatDetector] Beat detected!');
      };
      
      // Load and create particle system
      await this.particleSystem.load();
      const particles = this.particleSystem.create();
      
      // SAFETY CHECK: Make sure particles were created
      if (particles) {
        this.scene.add(particles);
        console.log('[Visualizer] Particles added to scene');
      } else {
        console.error('[Visualizer] Failed to create particles');
      }
      
      // Set up listeners
      window.addEventListener('resize', this.resize.bind(this));
      
      console.log('[Visualizer] Initialization complete');
      this.isInitialized = true;
    } catch (error) {
      console.error('[Visualizer] Initialization error:', error);
    }
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
    
    // Skip if not initialized
    if (!this.isInitialized) return;
    
    const elapsedTime = this.clock.getElapsedTime();
    
    // SAFETY CHECK: Ensure all objects exist before updating
    if (!this.scene || !this.camera || !this.renderer) {
      console.warn('[Visualizer] Scene, camera or renderer not initialized');
      return;
    }
    
    // Update audio analyzer
    if (this.isPlaying) {
      const audioData = this.audioAnalyzer.update();
      
      // Enhanced debug logging
      if (this.debugMode) {
        console.log("Audio levels - Low:", audioData.low.toFixed(3), 
                   "Mid:", audioData.mid.toFixed(3), 
                   "High:", audioData.high.toFixed(3));
      }
      
      const beatDetected = this.beatDetector.update(audioData, elapsedTime * 1000);
      
      // SAFETY CHECK: Make sure particle system exists before updating
      if (this.particleSystem) {
        this.particleSystem.update(elapsedTime, audioData, beatDetected);
      }
    } else {
      // SAFETY CHECK: Make sure particle system exists before updating
      if (this.particleSystem) {
        this.particleSystem.update(elapsedTime);
      }
    }
    
    // SAFETY CHECK: Make sure points exist before rotating
    if (this.autoRotate && this.particleSystem && this.particleSystem.points) {
      this.particleSystem.points.rotation.x += this.rotationSpeed;
      this.particleSystem.points.rotation.y += this.rotationSpeed;
    }
    
    // SAFETY CHECK: Make sure scene and camera exist before rendering
    if (this.scene && this.camera) {
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (error) {
        console.error('[Visualizer] Error during rendering:', error);
      }
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