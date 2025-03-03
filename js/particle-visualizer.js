// Merge the two DOMContentLoaded listeners to avoid race conditions
document.addEventListener('DOMContentLoaded', async () => {
  // First section: Dynamic import and setup of visualizer 
  try {
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
      
      // Set initial active shape button to torusKnot instead of sphere
      document.querySelector('[data-shape="sphere"]').classList.remove('active');
      document.querySelector('[data-shape="torusKnot"]').classList.add('active');
      
      // Update slider values to match new defaults
      const sliderSize = document.getElementById('size-control');
      const sizeDisplay = document.getElementById('size-value');
      if (sliderSize && sizeDisplay) {
        sliderSize.value = "25"; // Default to 25 instead of 30
        sizeDisplay.textContent = "25";
      }
      
      const sliderReactivity = document.getElementById('reactivity-control');
      const reactivityDisplay = document.getElementById('reactivity-value');
      if (sliderReactivity && reactivityDisplay) {
        sliderReactivity.value = "0.5"; // Default to 0.5 instead of 1.0
        reactivityDisplay.textContent = "0.5";
      }
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

    // Update the initial values to be set AFTER the visualizer is created
    if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
      // Set default frequency and amplitude based on lower reactivity
      window.particleVisualizer.particleSystem.uniforms.frequency.value = 2.0 * 0.5; // 0.5 instead of 1.0
      window.particleVisualizer.particleSystem.uniforms.amplitude.value = 0.8 * 0.5; // 0.5 instead of 1.0
      window.particleVisualizer.particleSystem.uniforms.offsetGain.value = 0.5;
      window.particleVisualizer.particleSystem.uniforms.maxDistance.value = 1.8;
      
      // Set initial size
      window.particleVisualizer.particleSystem.uniforms.size.value = 25 / 10; // 2.5 instead of 2.0
      window.particleVisualizer.particleSystem.uniforms.offsetSize.value = 45; // Default for torusKnot
      
      // Set reactivity multiplier
      window.particleVisualizer.particleSystem.reactivityMultiplier = 0.5;
    }

    // Now add the terminal-related event handlers that were in the second listener
    
    // Attach click handler to close button
    const closeButton = document.querySelector('.visualizer-terminal .terminal-button.close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        document.querySelector('.visualizer-terminal').classList.remove('active');
      });
    }
    
    // Find the correct music button by trying various common selectors
    const musicButtons = document.querySelectorAll('.Enable-Music, #enable-music, .enable-music, [id*="music"], [class*="music-enable"], [class*="enable-music"]');

    if (musicButtons.length > 0) {
      console.log('Found music buttons:', musicButtons);
      
      // Add click listeners to all potential buttons
      musicButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          console.log('Music button clicked:', btn);
          setTimeout(showVisualizerControls, 1200);
        });
      });
    } else {
      console.warn('No music enable button found with common selectors');
    }
    
    // Handle audio play button with similar robustness
    document.addEventListener('click', (e) => {
      const playButton = e.target.closest('#play-audio');
      if (playButton) {
        console.log('Music play button clicked');
        if (!document.querySelector('.visualizer-terminal').classList.contains('active')) {
          showVisualizerControls();
        }
      }
    });
    
    // Add minimize functionality to the terminal
    const minimizeButton = document.querySelector('.visualizer-terminal .terminal-button.minimize');
    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => {
        const terminal = document.querySelector('.visualizer-terminal');
        if (terminal.classList.contains('minimized')) {
          terminal.classList.remove('minimized');
        } else {
          terminal.classList.add('minimized');
        }
      });
    }
    
  } catch (error) {
    console.error("Error initializing visualizer:", error);
  }
});

// Make the terminal draggable for better user experience
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  const header = element.querySelector('.terminal-header');
  if (header) {
    header.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get mouse position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
    // Reset transform which could interfere with dragging
    element.style.transform = 'none';
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Call this function to add terminal command typing effect
function addTerminalTypingEffect() {
  const terminalLines = document.querySelectorAll('.visualizer-terminal .terminal-line .command');
  
  terminalLines.forEach((line, index) => {
    const text = line.textContent;
    line.textContent = '';
    line.classList.add('typing');
    
    // Type with delay based on index
    setTimeout(() => {
      let i = 0;
      const typeSpeed = 30;
      
      function typeText() {
        if (i < text.length) {
          line.textContent += text.charAt(i);
          i++;
          setTimeout(typeText, typeSpeed);
        } else {
          line.classList.remove('typing');
          
          // Reveal the content after the command is typed
          const group = line.closest('.control-group');
          if (group) {
            const content = group.querySelector('.terminal-buttons-grid, .terminal-colors, .terminal-sliders, .terminal-options');
            if (content) {
              content.style.opacity = '1';
            }
          }
        }
      }
      
      typeText();
    }, index * 400); // Stagger the typing of each line
  });
}

// Enhanced show function with typing effect
function showVisualizerControls() {
  const terminal = document.querySelector('.visualizer-terminal');
  
  // Hide content initially for typing effect
  const contentAreas = terminal.querySelectorAll('.terminal-buttons-grid, .terminal-colors, .terminal-sliders, .terminal-options');
  contentAreas.forEach(area => {
    area.style.opacity = '0';
    area.style.transition = 'opacity 0.5s ease';
  });
  
  // Show terminal
  terminal.classList.add('active');
  
  // Make it draggable
  makeDraggable(terminal);
  
  // Add typing effect
  setTimeout(addTerminalTypingEffect, 300);
  
  // Highlight the active shape button (should be torusKnot by default)
  setTimeout(() => {
    const torusKnotButton = document.querySelector('[data-shape="torusKnot"]');
    if (torusKnotButton) {
      document.querySelectorAll('[data-shape]').forEach(btn => btn.classList.remove('active'));
      torusKnotButton.classList.add('active');
    }
  }, 1500);
}