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
    
    // Make sure canvas is visible by default
    this.canvas.style.display = 'block';
    this.canvas.style.opacity = '1';
    this.canvas.classList.add('active');
    
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
    this.camera.position.z = 30;
    
    // Create holder object like in reference
    this.holder = new THREE.Object3D();
    this.holder.name = 'holder';
    this.scene.add(this.holder);
    
    // Audio components
    this.audioAnalyzer = new AudioAnalyzer();
    this.beatDetector = new BeatDetector();
    
    // Create the GUI instance for particles
    this.gui = null;
    try {
      // Check if dat.GUI is available, use a minimal version if not
      if (window.dat && window.dat.GUI) {
        this.gui = new dat.GUI({ autoPlace: false });
        this.gui.close(); // Keep it closed by default
      } else {
        // Create a minimal GUI-like interface that supports the particles.js structure
        this.gui = {
          addFolder: (name) => {
            console.log(`Creating GUI folder: ${name}`);
            return {
              add: (obj, prop, min, max) => {
                console.log(`Added GUI control for ${prop}`);
                return { 
                  onChange: (fn) => {},
                  name: (n) => { 
                    console.log(`Named control: ${n}`); 
                    return { onChange: (fn) => {} }; 
                  }
                };
              },
              onChange: (fn) => {},
              destroy: () => {}
            };
          },
          add: (obj, prop, min, max) => {
            console.log(`Added GUI control for ${prop}`);
            return { 
              onChange: (fn) => {},
              name: (n) => { 
                console.log(`Named control: ${n}`); 
                return { onChange: (fn) => {} }; 
              }
            };
          },
          onChange: (fn) => {},
          destroy: () => {}
        };
      }
    } catch (e) {
      console.warn("Could not create GUI, using minimal version:", e);
      // Create minimal GUI
      this.gui = {
        addFolder: () => ({
          add: () => ({ onChange: () => {} }),
          onChange: () => {},
          destroy: () => {}
        })
      };
    }
    
    // Initialize particle system with GUI
    this.particleSystem = new ParticleSystem(this.gui);
    
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
      
      // Ensure the GUI is properly set up
      if (this.gui) {
        // Set up any common GUI controls if needed
        this.gui.add(this.particleSystem, 'reactivityMultiplier', 0.1, 3.0)
          .name('Audio Reactivity')
          .onChange(() => {
            console.log("Reactivity changed via GUI:", this.particleSystem.reactivityMultiplier);
          });
      }
      
      // Create particles with ring as default instead of torusKnot
      const particleHolder = this.particleSystem.create('ring');
      if (particleHolder) {
        this.holder.add(particleHolder);
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

  connectToAudioElement(audioElement, existingAnalyser) {
    console.log('[Visualizer] Reconnecting to new audio element');
    
    if (!audioElement) {
        console.error('[Visualizer] No audio element provided to connectToAudioElement');
        return false;
    }
    
    try {
        if (existingAnalyser) {
            // Use the existing analyser from the audio player
            this.audioAnalyzer.useExternalAnalyser(existingAnalyser, audioElement);
            console.log('[Visualizer] Using existing analyser from audio player');
            this.isPlaying = true;
            return true;
        } else {
            // Create new connection
            const connected = this.audioAnalyzer.connect(audioElement);
            if (connected) {
                this.isPlaying = true;
                console.log('[Visualizer] Created new connection to audio element');
                return true;
            }
        }
        
        console.error('[Visualizer] Failed to connect to new audio element');
        return false;
    } catch (error) {
        console.error('[Visualizer] Error connecting to new audio element:', error);
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
      
      // Log audio data for debugging
      console.log('[Visualizer] Audio data:', audioData);
      
      // Update beat detector with current time in milliseconds
      const beatDetected = this.beatDetector.update(audioData, performance.now());
      
      // Update particle system with the updated interface
      if (this.particleSystem) {
        this.particleSystem.update(elapsedTime, audioData, beatDetected);
      }
    } else {
      // Update with no audio
      if (this.particleSystem) {
        this.particleSystem.update(elapsedTime);
      }
    }
    
    // Rotate holder - auto-rotate is always enabled now
    if (this.holder) {
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
    console.log('[Visualizer] Showing visualizer');
    if (this.canvas) {
      this.canvas.style.display = 'block';
      this.canvas.style.opacity = '1';
      this.canvas.classList.add('active');
      
      // Force a resize to ensure proper dimensions
      this.resize();
    }
  }

  hide() {
    console.log('[Visualizer] Hiding visualizer');
    if (this.canvas) {
      this.canvas.style.opacity = '0';
      this.canvas.classList.remove('active');
      // Don't set display: none to avoid WebGL context loss
    }
  }
}

export default ParticleVisualizer;