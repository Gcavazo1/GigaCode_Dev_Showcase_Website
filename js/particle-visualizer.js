// Add debug logs at key points
console.log("Particle visualizer script loaded");

// Merge the two DOMContentLoaded listeners to avoid race conditions
document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOMContentLoaded event triggered for visualizer");
  
  // First section: Dynamic import and setup of visualizer 
  try {
    console.log("Attempting to import visualizer module");
    // Dynamically import the visualizer module
    const { default: ParticleVisualizer } = await import('./particle-visualizer/visualizer.js');
    console.log("Module imported successfully");
    
    const visualizer = new ParticleVisualizer();
    console.log("Visualizer instance created");
    
    // Make it globally accessible
    window.particleVisualizer = visualizer;
    console.log("Visualizer attached to window object");
    
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
      const sliderReactivity = document.getElementById('reactivity-control');
      const reactivityDisplay = document.getElementById('reactivity-value');
      if (sliderReactivity && reactivityDisplay) {
        sliderReactivity.value = "0.8"; // Default to 0.8 instead of 0.5
        reactivityDisplay.textContent = "0.8";
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
      // Set default frequency and amplitude based on higher reactivity
      window.particleVisualizer.particleSystem.uniforms.frequency.value = 2.0 * 0.8; // 0.8 instead of 0.5
      window.particleVisualizer.particleSystem.uniforms.amplitude.value = 0.8 * 0.8; // 0.8 instead of 0.5
      window.particleVisualizer.particleSystem.uniforms.offsetGain.value = 0.5;
      window.particleVisualizer.particleSystem.uniforms.maxDistance.value = 1.8;
      
      // Set initial size
      window.particleVisualizer.particleSystem.uniforms.size.value = 25 / 10; // 2.5 instead of 2.0
      window.particleVisualizer.particleSystem.uniforms.offsetSize.value = 45; // Default for torusKnot
      
      // Set reactivity multiplier
      window.particleVisualizer.particleSystem.reactivityMultiplier = 0.8; // Changed from 0.5
    }

    // Now add the terminal-related event handlers that were in the second listener
    
    // Attach click handler to close button
    const closeButton = document.querySelector('.visualizer-terminal .terminal-button.close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        document.querySelector('.visualizer-terminal').classList.remove('active');
      });
    }
    
    // Keep track of user music choice
    let musicEnabled = false;

    // Music Enable Button Handler - be very specific about the selector
    function setupMusicEnableButton() {
      console.log("Setting up music enable button detection - fixed version");
      
      // Use a more general approach to catch all possible Enable-Music buttons
      document.addEventListener('click', (e) => {
        console.log("Click detected, checking if Enable-Music button:", e.target);
        
        // Check using multiple methods to be sure we catch it
        if ((e.target.textContent === 'Enable-Music') || 
            (e.target.className && e.target.className.includes('Enable-Music')) ||
            (e.target.classList && e.target.classList.contains('Enable-Music'))) {
          
          console.log('Enable-Music button detected and clicked!');
          musicEnabled = true;
          
          // Longer delay to ensure terminal has time to close
          setTimeout(() => {
            console.log("Attempting to show visualizer after Enable-Music");
            showVisualizerControls();
          }, 1200);
        }
      });
    }

    // Observer to detect when music terminal closes
    function observeMusicTerminalClose() {
      const terminalCloseObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'class' && 
              mutation.target.classList.contains('powershell-music')) {
            
            // Check if the terminal was active and is now inactive
            if (!mutation.target.classList.contains('active')) {
              console.log("Music terminal closed via class change");
              terminalCloseObserver.disconnect();
              
              if (musicEnabled) {
                console.log("Music was enabled, showing visualizer");
                setTimeout(() => showVisualizerControls(), 800);
              }
            }
          }
        });
      });
      
      // Observe all powershell-music terminals for class changes
      const musicTerminals = document.querySelectorAll('.powershell-music');
      if (musicTerminals.length > 0) {
        console.log(`Found ${musicTerminals.length} music terminals to observe`);
        musicTerminals.forEach(terminal => {
          terminalCloseObserver.observe(terminal, { 
            attributes: true,
            attributeFilter: ['class']
          });
        });
      } else {
        console.log("No music terminals found to observe");
      }
    }

    // Call our setup functions
    setupMusicEnableButton();
    observeMusicTerminalClose();

    // Updated minimize button functionality
    const minimizeButton = document.querySelector('.visualizer-terminal .terminal-button.minimize');
    if (minimizeButton) {
      minimizeButton.remove();
    }
    
    // Setting up visualizer nav button - improved version
    console.log("Setting up visualizer nav button (improved)");
    function setupVisualizerNavButton() {
      console.log("Setting up visualizer nav button (improved)");
      
      // Use direct ID selector and attach once
      const navButton = document.getElementById('visualizer-nav-button');
      
      if (navButton) {
        console.log("Found visualizer nav button by ID");
        
        // Remove any existing listeners by cloning
        const newNavButton = navButton.cloneNode(true);
        navButton.parentNode.replaceChild(newNavButton, navButton);
        
        // Add new click listener
        newNavButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log("Visualizer nav button clicked directly");
          showVisualizerControls();
          return false;
        });
      } else {
        console.warn("Visualizer nav button not found by ID, trying alternate selectors");
        
        // Fallback to other selectors
        const altNavButton = document.querySelector('a[href="#visualizer"]');
        if (altNavButton) {
          console.log("Found visualizer nav button by href");
          
          // Remove existing listeners
          const newAltButton = altNavButton.cloneNode(true);
          altNavButton.parentNode.replaceChild(newAltButton, altNavButton);
          
          newAltButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Visualizer nav button clicked (alternate)");
            showVisualizerControls();
            return false;
          });
        } else {
          console.error("Visualizer nav button could not be found with any selector");
        }
      }
    }

    // Add this to your DOMContentLoaded event, where other setup functions are called
    setupVisualizerNavButton();

  } catch (error) {
    console.error("Error initializing visualizer:", error);
  }
});

// REPLACE makeDraggable with a simpler setup function
function setupTerminal(element) {
  // Set the terminal to position absolute so it scrolls with the page
  element.style.position = 'absolute';
  element.style.right = '20px';
  element.style.top = '50%';
  element.style.transform = 'translateY(-50%)';
  
  // Remove any existing reset buttons since we don't need them anymore
  const existingResetButtons = element.querySelectorAll('.terminal-button.reset');
  existingResetButtons.forEach(btn => btn.remove());
  
  // Ensure the close button works
  const closeButton = element.querySelector('.terminal-button.close');
  if (closeButton) {
    // Remove any existing listeners
    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);
    
    // Add new click listener
    newCloseButton.addEventListener('click', () => {
      console.log("Close button clicked");
      element.classList.remove('active');
      
      // Re-setup the nav button to ensure it works after closing
      setTimeout(setupVisualizerNavButton, 100);
    });
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

// Update the showVisualizerControls function
function showVisualizerControls() {
  const terminal = document.querySelector('.visualizer-terminal');
  if (!terminal) {
    console.error('Visualizer terminal not found');
    return;
  }
  
  // If already active, don't show again
  if (terminal.classList.contains('active')) {
    console.log("Visualizer terminal already active");
    return;
  }
  
  console.log("Showing visualizer terminal");
  
  // Hide content initially for typing effect
  const contentAreas = terminal.querySelectorAll('.terminal-buttons-grid, .terminal-colors, .terminal-sliders, .terminal-options');
  contentAreas.forEach(area => {
    area.style.opacity = '0';
    area.style.transition = 'opacity 0.5s ease';
  });
  
  // Show terminal
  terminal.classList.add('active');
  
  // Set up terminal (non-draggable version)
  setupTerminal(terminal);
  
  // Add typing effect
  setTimeout(addTerminalTypingEffect, 300);
  
  // Setup all controls
  setupVisualizerControls();
  
  // Highlight the active shape button based on current shape
  setTimeout(() => {
    if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
      const currentShape = window.particleVisualizer.particleSystem.currentShape;
      console.log(`Initial shape is: ${currentShape}`);
      
      // Clear any existing active classes
      document.querySelectorAll('[data-shape]').forEach(btn => btn.classList.remove('active'));
      
      // Set the active class on the current shape button
      const activeButton = document.querySelector(`[data-shape="${currentShape}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    }
  }, 1500);
}

// Update setupVisualizerControls to work with the new particles.js structure
function setupVisualizerControls() {
  console.log("Setting up visualizer control event handlers for updated particle system");
  
  // Setup shape buttons with the new approach
  const shapeButtons = document.querySelectorAll('.visualizer-terminal .control-buttons [data-shape]');
  console.log(`Found ${shapeButtons.length} shape buttons`);
  
  // Define a function to update the active button based on current shape
  function updateActiveShapeButton() {
    if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
      const currentShape = window.particleVisualizer.particleSystem.currentShape;
      console.log(`Updating active button to: ${currentShape}`);
      
      // Clear all active classes first
      shapeButtons.forEach(btn => btn.classList.remove('active'));
      
      // Find and highlight the correct button
      const activeButton = document.querySelector(`.visualizer-terminal .control-buttons [data-shape="${currentShape}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    }
  }
  
  // Call this whenever the shape changes
  shapeButtons.forEach(btn => {
    // Remove old listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Add new click handler for updated particle system
    newBtn.addEventListener('click', () => {
      const shape = newBtn.getAttribute('data-shape');
      console.log(`Shape button clicked: ${shape}`);
      
      // Apply shape change with the new pattern
      if (window.particleVisualizer) {
        try {
          // Create new particles with selected shape
          window.particleVisualizer.particleSystem.create(shape);
          console.log(`Created new ${shape} particles`);
          
          // Update button highlighting AFTER the shape is created
          // This ensures we use the actual current shape
          setTimeout(updateActiveShapeButton, 100);
        } catch (error) {
          console.error("Error changing particle shape:", error);
        }
      }
    });
  });
  
  // Also update the button highlighting when the randomize button is clicked
  const randomizeButton = document.getElementById('randomize-segments');
  if (randomizeButton) {
    // Remove existing listeners
    const newRandomizeButton = randomizeButton.cloneNode(true);
    randomizeButton.parentNode.replaceChild(newRandomizeButton, randomizeButton);
    
    newRandomizeButton.addEventListener('click', () => {
      console.log("Randomize segments button clicked");
      if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
        try {
          window.particleVisualizer.particleSystem.randomizeCurrentShape();
          console.log("Segments randomized for current shape");
          
          // Update button highlighting after randomization
          updateActiveShapeButton();
        } catch (error) {
          console.error("Error randomizing segments:", error);
        }
      }
    });
  }
  
  // Setup color pickers (unchanged)
  const startColorPicker = document.getElementById('start-color-picker');
  const endColorPicker = document.getElementById('end-color-picker');
  
  function updateColors() {
    if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
      console.log("Updating colors");
      const uniforms = window.particleVisualizer.particleSystem.uniforms;
      
      // Convert HTML color to THREE.Color
      const startColorHex = startColorPicker.value.replace('#', '0x');
      const endColorHex = endColorPicker.value.replace('#', '0x');
      
      uniforms.startColor.value.set(parseInt(startColorHex));
      uniforms.endColor.value.set(parseInt(endColorHex));
    }
  }
  
  if (startColorPicker && endColorPicker) {
    startColorPicker.addEventListener('input', updateColors);
    endColorPicker.addEventListener('input', updateColors);
  }
  
  // Setup reactivity slider (unchanged)
  const reactivitySlider = document.getElementById('reactivity-control');
  const reactivityValue = document.getElementById('reactivity-value');
  
  if (reactivitySlider && reactivityValue) {
    reactivitySlider.addEventListener('input', () => {
      const reactivity = parseFloat(reactivitySlider.value);
      reactivityValue.textContent = reactivity.toFixed(1);
      
      if (window.particleVisualizer && window.particleVisualizer.particleSystem) {
        console.log(`Setting reactivity to: ${reactivity}`);
        window.particleVisualizer.particleSystem.reactivityMultiplier = reactivity;
      }
    });
  }
}