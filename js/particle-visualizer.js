// Use dynamic import instead
document.addEventListener('DOMContentLoaded', async () => {
  // Dynamically import the visualizer module
  const { default: ParticleVisualizer } = await import('./particle-visualizer/visualizer.js');
  
  const visualizer = new ParticleVisualizer();
  
  // Make it globally accessible
  window.particleVisualizer = visualizer;
  
  // Connect to audio player when it exists
  const connectToAudioPlayer = () => {
    const audioElement = document.getElementById('background-audio');
    
    if (audioElement) {
      visualizer.connectToAudioPlayer(audioElement);
      
      // Listen for play/pause events
      audioElement.addEventListener('play', () => {
        visualizer.isPlaying = true;
        visualizer.show();
      });
      
      audioElement.addEventListener('pause', () => {
        visualizer.isPlaying = false;
        visualizer.hide();
      });
      
      // Also connect to audio player instance if it exists
      if (window.audioPlayerInstance) {
        // Override the play method to show visualizer
        const originalPlayMethod = window.audioPlayerInstance.playAudio;
        window.audioPlayerInstance.playAudio = function() {
          originalPlayMethod.apply(this);
          visualizer.isPlaying = true;
          visualizer.show();
        };
        
        // Override the pause method to hide visualizer
        const originalPauseMethod = window.audioPlayerInstance.pauseAudio;
        window.audioPlayerInstance.pauseAudio = function() {
          originalPauseMethod.apply(this);
          visualizer.isPlaying = false;
          visualizer.hide();
        };
      }
      
      return true;
    }
    
    return false;
  };
  
  // Try to connect immediately, or wait for the player to be available
  if (!connectToAudioPlayer()) {
    // If audio player isn't available yet, try again when play button is clicked
    const playButton = document.getElementById('play-audio');
    if (playButton) {
      playButton.addEventListener('click', () => {
        setTimeout(connectToAudioPlayer, 100);
      });
    }
  }

  // Control panel functionality
  const toggleButton = document.querySelector('.toggle-controls');
  const controlPanel = document.querySelector('.control-panel');
  
  if (toggleButton && controlPanel) {
    // Toggle controls panel
    toggleButton.addEventListener('click', () => {
      controlPanel.classList.toggle('active');
      toggleButton.classList.toggle('active');
    });
    
    // Shape buttons
    const shapeButtons = document.querySelectorAll('.control-buttons [data-shape]');
    shapeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.getAttribute('data-shape');
        
        // Remove active class from all buttons
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Apply shape change if visualizer exists
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          // Remove old particles
          window.particleVisualizer.scene.remove(window.particleVisualizer.particleSystem.points);
          
          // Create new shape
          window.particleVisualizer.particleSystem.createShapedGeometry(shape);
          const particles = window.particleVisualizer.particleSystem.create();
          window.particleVisualizer.scene.add(particles);
        }
      });
    });
    
    // Color buttons
    const colorButtons = document.querySelectorAll('.color-buttons [data-color]');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const colorScheme = btn.getAttribute('data-color');
        
        // Remove active class from all buttons
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Apply color change if visualizer exists
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          const uniforms = window.particleVisualizer.particleSystem.uniforms;
          
          switch(colorScheme) {
            case 'cyan':
              uniforms.startColor.value.set(0x0a2463); // Deep blue
              uniforms.endColor.value.set(0x08f7fe);   // Cyan
              uniforms.uColor.value.set(0x08f7fe);     // Cyan
              break;
            case 'purple':
              uniforms.startColor.value.set(0x33001b); // Dark purple
              uniforms.endColor.value.set(0xff00ff);   // Magenta
              uniforms.uColor.value.set(0xff00ff);     // Magenta
              break;
            case 'green':
              uniforms.startColor.value.set(0x003300); // Dark green
              uniforms.endColor.value.set(0x00ff99);   // Cyber green
              uniforms.uColor.value.set(0x00ff99);     // Cyber green
              break;
            case 'multi':
              uniforms.startColor.value.set(0xff0099); // Pink
              uniforms.endColor.value.set(0x0099ff);   // Blue
              uniforms.uColor.value.set(0x00ff99);     // Green
              break;
          }
        }
      });
    });
    
    // Particle size control
    const sizeSlider = document.getElementById('size-control');
    const sizeValue = document.getElementById('size-value');
    
    if (sizeSlider && sizeValue) {
      sizeSlider.addEventListener('input', () => {
        const size = parseFloat(sizeSlider.value);
        sizeValue.textContent = size;
        
        // Apply size change
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          window.particleVisualizer.particleSystem.uniforms.uSize.value = size;
        }
      });
    }
    
    // Reactivity control
    const reactivitySlider = document.getElementById('reactivity-control');
    const reactivityValue = document.getElementById('reactivity-value');
    
    if (reactivitySlider && reactivityValue) {
      reactivitySlider.addEventListener('input', () => {
        const reactivity = parseFloat(reactivitySlider.value);
        reactivityValue.textContent = reactivity.toFixed(1);
        
        // Apply reactivity change
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          window.particleVisualizer.particleSystem.reactivityMultiplier = reactivity;
        }
      });
    }
    
    // Set initial active buttons
    document.querySelector('[data-shape="sphere"]').classList.add('active');
    document.querySelector('[data-color="cyan"]').classList.add('active');
  }
});