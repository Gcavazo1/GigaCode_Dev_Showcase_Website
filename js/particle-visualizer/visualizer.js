import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import ParticleSystem from './particles.js';
import AudioAnalyzer from './audio/analyzer.js';
import BeatDetector from './audio/beat-detector.js';

class ParticleVisualizer {
  constructor() {
    // Set initialized flag to false
    this.isInitialized = false;
    
    // DOM elements - Create canvas if it doesn't exist
    this.canvas = document.getElementById('background-visualizer');
    if (!this.canvas) {
      console.warn('[Visualizer] Canvas element not found! Creating fallback.');
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'background-visualizer';
      this.canvas.className = 'particles-canvas';
      document.body.appendChild(this.canvas);
    }
    
    // Create renderer first
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    
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
    
    // Create holder object like in reference
    this.holder = new THREE.Object3D();
    this.holder.name = 'holder';
    this.scene.add(this.holder);
    
    // Audio components
    this.audioAnalyzer = new AudioAnalyzer();
    this.beatDetector = new BeatDetector();
    
    // Particle system 
    this.particleSystem = new ParticleSystem();
    
    // Animation
    this.clock = new THREE.Clock();
    this.isPlaying = false;
    
    // Add rotation properties - slower rotation speed
    this.autoRotate = true;
    this.rotationSpeed = 0.004; // Reduced from 0.01 to make rotation more subtle
    
    // Initialize
    this.init();
    
    // Start animation loop
    this.animate();
    
    // Handle window resizing
    window.addEventListener('resize', this.resize.bind(this));
  }

  async init() {
    try {
      // Load particle system
      await this.particleSystem.load();
      
      // Create particles and add to holder
      const particles = this.particleSystem.create();
      
      if (particles) {
        this.holder.add(particles);
        console.log('[Visualizer] Particles added to holder');
        
        // Mark as initialized
        this.isInitialized = true;
      } else {
        console.error('[Visualizer] Failed to create particles');
      }
    } catch (error) {
      console.error('[Visualizer] Initialization error:', error);
    }
  }

  connectToAudioPlayer(audioElement) {
    if (!audioElement) {
      console.error('[Visualizer] No audio element provided');
      return false;
    }
    
    try {
      const connected = this.audioAnalyzer.connect(audioElement);
      if (connected) {
        this.isPlaying = true;
        console.log('[Visualizer] Connected to audio player successfully');
        return true;
      }
      
      console.error('[Visualizer] Failed to connect to audio player');
      return false;
    } catch (error) {
      console.error('[Visualizer] Error connecting to audio player:', error);
      return false;
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Skip if not initialized
    if (!this.isInitialized) {
      return;
    }
    
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update audio analyzer
    if (this.isPlaying) {
      const audioData = this.audioAnalyzer.update();
      
      // Update beat detector
      const beatDetected = this.beatDetector.update(audioData, elapsedTime * 1000);
      
      // Update particle system 
      if (this.particleSystem) {
        this.particleSystem.update(elapsedTime, audioData, beatDetected);
      }
    } else {
      // Update with no audio
      if (this.particleSystem) {
        this.particleSystem.update(elapsedTime);
      }
    }
    
    // Rotate holder
    if (this.autoRotate && this.holder) {
      this.holder.rotation.x += this.rotationSpeed;
      this.holder.rotation.y += this.rotationSpeed;
    }
    
    // Safety check before rendering
    if (this.scene && this.camera) {
      try {
        this.renderer.render(this.scene, this.camera);
      } catch (error) {
        console.error('[Visualizer] Error during rendering:', error);
      }
    }
  }

  resize() {
    // Update sizes
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    
    // Update renderer
    if (this.renderer) {
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    // Update particles if needed
    if (this.particleSystem) {
      this.particleSystem.resize(width, height);
    }
  }

  show() {
    if (this.canvas) {
      this.canvas.style.display = 'block';
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