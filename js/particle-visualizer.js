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
          // First remove old points from holder
          if (window.particleVisualizer.particleSystem.points) {
            window.particleVisualizer.holder.remove(window.particleVisualizer.particleSystem.points);
          }
          
          // Create new geometry with selected shape
          window.particleVisualizer.particleSystem.createShapedGeometry(shape);
          
          // Create new points and add to holder
          const particles = window.particleVisualizer.particleSystem.create();
          window.particleVisualizer.holder.add(particles);
          
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
        
        uniforms.startColor.value = startColor;
        uniforms.endColor.value = endColor;
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
        
        if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
          // Directly set the size uniform value (divide by 10 to match reference scale)
          window.particleVisualizer.particleSystem.uniforms.size.value = size / 10;
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
          // Set reactivity multiplier
          window.particleVisualizer.particleSystem.reactivityMultiplier = reactivity;
          
          // Also update base values according to reactivity
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

  // Add this after we create visualizer to ensure it's using our reference values
  // Set initial control values to match reference
  if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
    // Set initial frequency and amplitude
    window.particleVisualizer.particleSystem.uniforms.frequency.value = 2.0;
    window.particleVisualizer.particleSystem.uniforms.amplitude.value = 0.8;
    window.particleVisualizer.particleSystem.uniforms.offsetGain.value = 0.5;
    window.particleVisualizer.particleSystem.uniforms.maxDistance.value = 1.8;
    
    // Make sure size is properly initialized
    window.particleVisualizer.particleSystem.uniforms.size.value = 2.0;
    window.particleVisualizer.particleSystem.uniforms.offsetSize.value = 2.0;
  }

  // Add new shape buttons to the control panel
  const shapeButtonsContainer = document.querySelector('.control-buttons');
  if (shapeButtonsContainer) {
    // Create TorusKnot button
    const torusKnotButton = document.createElement('button');
    torusKnotButton.setAttribute('data-shape', 'torusKnot');
    torusKnotButton.innerHTML = '<i class="fas fa-atom"></i><span>Knot</span>';
    torusKnotButton.className = 'control-button';
    shapeButtonsContainer.appendChild(torusKnotButton);
    
    // Create Icosahedron button
    const icosahedronButton = document.createElement('button');
    icosahedronButton.setAttribute('data-shape', 'icosahedron');
    icosahedronButton.innerHTML = '<i class="fas fa-dice-d20"></i><span>Icosa</span>';
    icosahedronButton.className = 'control-button';
    shapeButtonsContainer.appendChild(icosahedronButton);
    
    // Create Klein bottle button
    const kleinBottleButton = document.createElement('button');
    kleinBottleButton.setAttribute('data-shape', 'kleinBottle');
    kleinBottleButton.innerHTML = '<i class="fas fa-infinity"></i><span>Klein</span>';
    kleinBottleButton.className = 'control-button';
    shapeButtonsContainer.appendChild(kleinBottleButton);
  }
});