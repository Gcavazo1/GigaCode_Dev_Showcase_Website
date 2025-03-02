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
    const accentColorPicker = document.getElementById('accent-color-picker');
    const presetButtons = document.querySelectorAll('.preset-btn');
    
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
        
        uniforms.startColor.value.setHex(htmlColorToHex(startColorPicker.value));
        uniforms.endColor.value.setHex(htmlColorToHex(endColorPicker.value));
        uniforms.uColor.value.setHex(htmlColorToHex(accentColorPicker.value));
      }
    }
    
    // Apply color changes when pickers are adjusted
    if (startColorPicker && endColorPicker && accentColorPicker) {
      startColorPicker.addEventListener('input', updateColors);
      endColorPicker.addEventListener('input', updateColors);
      accentColorPicker.addEventListener('input', updateColors);
    }
    
    // Handle preset buttons
    if (presetButtons.length) {
      presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove active class from all buttons
          presetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Get colors from data attributes
          const startColor = btn.getAttribute('data-start');
          const endColor = btn.getAttribute('data-end');
          const accentColor = btn.getAttribute('data-accent');
          
          // Update color pickers
          startColorPicker.value = startColor;
          endColorPicker.value = endColor;
          accentColorPicker.value = accentColor;
          
          // Apply colors
          updateColors();
        });
      });
      
      // Set initial active preset
      presetButtons[0].classList.add('active');
    }
    
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
});