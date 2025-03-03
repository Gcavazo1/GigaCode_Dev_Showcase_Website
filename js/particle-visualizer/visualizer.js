import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import ParticleSystem from './particles.js';
import AudioAnalyzer from './audio/analyzer.js';
import BeatDetector from './audio/beat-detector.js';

class ParticleVisualizer {
  constructor() {
    // DOM elements
    this.canvas = document.getElementById('background-visualizer');
    
    // Create scene, camera and renderer
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.z = 12;
    
    if (!this.canvas) {
      console.error('[Visualizer] Canvas element not found! Creating fallback.');
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'background-visualizer';
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
    this.isInitialized = false;
    
    // Add rotation properties
    this.autoRotate = true;
    this.rotationSpeed = 0.01;
    
    // Initialize and start animation
    this.init();
    this.animate();
    
    // Resize handling
    window.addEventListener('resize', this.resize.bind(this));
  }

  async init() {
    try {
      // Load and create particle system
      await this.particleSystem.load();
      const particles = this.particleSystem.create();
      
      if (particles) {
        this.holder.add(particles);
        console.log('[Visualizer] Particles added to scene');
      } else {
        console.error('[Visualizer] Failed to create particles');
      }
      
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
      console.log('[Visualizer] Connected to audio player successfully');
      return true;
    }
    
    console.error('[Visualizer] Failed to connect to audio player');
    return false;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Skip if not initialized
    if (!this.isInitialized) return;
    
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update audio analyzer
    if (this.isPlaying) {
      const audioData = this.audioAnalyzer.update();
      console.log("Audio data:", audioData);
      
      const beatDetected = this.beatDetector.update(audioData, elapsedTime * 1000);
      this.particleSystem.update(elapsedTime, audioData, beatDetected);
    } else {
      this.particleSystem.update(elapsedTime);
    }
    
    // Auto-rotate like in reference
    if (this.autoRotate && this.holder) {
      this.holder.rotation.x += this.rotationSpeed;
      this.holder.rotation.y += this.rotationSpeed;
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