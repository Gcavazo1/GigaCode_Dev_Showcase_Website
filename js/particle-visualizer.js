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
          // Create new geometry with selected shape
          window.particleVisualizer.particleSystem.createShapedGeometry(shape);
          
          // Force recreate the points with the new geometry
          if (window.particleVisualizer.particleSystem.points) {
            // Remove old points
            window.particleVisualizer.scene.remove(window.particleVisualizer.particleSystem.points);
            window.particleVisualizer.particleSystem.points.geometry.dispose();
            window.particleVisualizer.particleSystem.points = null;
          }
          
          // Create new points and add to scene
          const particles = window.particleVisualizer.particleSystem.create();
          window.particleVisualizer.scene.add(particles);
          
          console.log(`[Visualizer] Shape changed to ${shape}`);
        }
      });
    });
    
    // Color picker functionality
    const startColorPicker = document.getElementById('start-color-picker');
    const endColorPicker = document.getElementById('end-color-picker');
    
    // Function to convert HTML color to hex
    function htmlColorToHex(htmlColor) {
      // Remove the # if it exists
      const color = htmlColor.replace('#', '');
      // Convert to integer
      return parseInt(color, 16);
    }
    
    // Function to update colors
    function updateColors() {
      if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
        const uniforms = window.particleVisualizer.particleSystem.uniforms;
        const startColor = new THREE.Color(htmlColorToHex(startColorPicker.value));
        const endColor = new THREE.Color(htmlColorToHex(endColorPicker.value));
        
        uniforms.startColor.value.copy(startColor);
        uniforms.endColor.value.copy(endColor);
      }
    }
    
    // Apply color changes when pickers are adjusted
    if (startColorPicker && endColorPicker) {
      startColorPicker.addEventListener('input', updateColors);
      endColorPicker.addEventListener('input', updateColors);
    }
    
    // Particle size control
    const sizeSlider = document.getElementById('size-control');
    const sizeValue = document.getElementById('size-value');
    
    if (sizeSlider && sizeValue) {
      sizeSlider.addEventListener('input', () => {
        const size = parseFloat(sizeSlider.value);
        sizeValue.textContent = size;
        
        // Directly set the size value - don't rely on particleSize
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          window.particleVisualizer.particleSystem.uniforms.size.value = size / 10; // Scale down to match reference
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
        
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          // Update reactivity
          window.particleVisualizer.particleSystem.reactivityMultiplier = reactivity;
          
          // Directly update frequency and amplitude to match
          window.particleVisualizer.particleSystem.uniforms.frequency.value = 2.0 * reactivity;
          window.particleVisualizer.particleSystem.uniforms.amplitude.value = 0.8 * reactivity;
        }
      });
    }
    
    // Set initial active buttons
    document.querySelector('[data-shape="sphere"]').classList.add('active');
  }

  // Add rotation toggle functionality
  const rotationToggle = document.getElementById('toggle-rotation');
  if (rotationToggle) {
    rotationToggle.addEventListener('click', () => {
      rotationToggle.classList.toggle('active');
      if (window.particleVisualizer) {
        window.particleVisualizer.autoRotate = rotationToggle.classList.contains('active');
      }
    });
  }

  // Add this after we create visualizer
  // Set initial control values to match reference
  if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
    // Set initial frequency and amplitude
    window.particleVisualizer.particleSystem.uniforms.frequency.value = 2.0;
    window.particleVisualizer.particleSystem.uniforms.amplitude.value = 0.8;
    window.particleVisualizer.particleSystem.uniforms.offsetGain.value = 0.5;
    
    // Make sure size is properly initialized
    window.particleVisualizer.particleSystem.uniforms.size.value = 2.0;
  }
});