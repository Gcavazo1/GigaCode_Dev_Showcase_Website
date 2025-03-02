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
              uniforms.startColor.value.setHex(0x0a2463);
              uniforms.endColor.value.setHex(0x08f7fe);
              uniforms.uColor.value.setHex(0x08f7fe);
              break;
            case 'purple':
              uniforms.startColor.value.setHex(0x33001b);
              uniforms.endColor.value.setHex(0xff00ff);
              uniforms.uColor.value.setHex(0xff00ff);
              break;
            case 'green':
              uniforms.startColor.value.setHex(0x003300);
              uniforms.endColor.value.setHex(0x00ff99);
              uniforms.uColor.value.setHex(0x00ff99);
              break;
            case 'multi':
              uniforms.startColor.value.setHex(0xff0099);
              uniforms.endColor.value.setHex(0x0099ff);
              uniforms.uColor.value.setHex(0x00ff99);
              break;
            case 'cyberpunk':
              uniforms.startColor.value.setHex(0xff0055);
              uniforms.endColor.value.setHex(0x00ffe7);
              uniforms.uColor.value.setHex(0xff00cc);
              break;
            case 'neon':
              uniforms.startColor.value.setHex(0xff00cc);
              uniforms.endColor.value.setHex(0x00ffaa);
              uniforms.uColor.value.setHex(0xffcc00);
              break;
            case 'sunset':
              uniforms.startColor.value.setHex(0xff3300);
              uniforms.endColor.value.setHex(0xffcc00);
              uniforms.uColor.value.setHex(0xff6600);
              break;
            case 'matrix':
              uniforms.startColor.value.setHex(0x001100);
              uniforms.endColor.value.setHex(0x00ff00);
              uniforms.uColor.value.setHex(0x88ff88);
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

// Update the color buttons in the HTML first
const colorButtonsHTML = `
  <div class="color-buttons">
    <button data-color="cyan" class="color-btn cyan-theme"></button>
    <button data-color="purple" class="color-btn purple-theme"></button>
    <button data-color="green" class="color-btn green-theme"></button>
    <button data-color="multi" class="color-btn multi-theme"></button>
    <button data-color="cyberpunk" class="color-btn cyberpunk-theme"></button>
    <button data-color="neon" class="color-btn neon-theme"></button>
    <button data-color="sunset" class="color-btn sunset-theme"></button>
    <button data-color="matrix" class="color-btn matrix-theme"></button>
  </div>
`;

// Then add these CSS styles
.cyberpunk-theme {
  background: linear-gradient(45deg, #ff0055, #00ffe7);
}

.neon-theme {
  background: linear-gradient(45deg, #ff00cc, #00ffaa);
}

.sunset-theme {
  background: linear-gradient(45deg, #ff3300, #ffcc00);
}

.matrix-theme {
  background: linear-gradient(45deg, #001100, #00ff00);
}