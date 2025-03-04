// Minimalist initialization for particle visualizer
console.log("Particle visualizer script loaded");

// Single clean initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Initializing particle visualizer");
  
  try {
    // Import the visualizer module
    const ParticleVisualizer = await import('./particle-visualizer/visualizer.js').then(module => module.default);
    
    // Create visualizer instance and make it globally accessible
    const visualizer = new ParticleVisualizer();
    window.particleVisualizer = visualizer;
    console.log("Visualizer created and attached to window");
    
    // Setup visualizer controls
    setupVisualizerControls();
    
    // Setup nav button
    const navButton = document.getElementById('visualizer-nav-button');
    if (navButton) {
      navButton.addEventListener('click', showVisualizerControls);
    }
    
    // RESTORE AUTO-OPEN FUNCTIONALITY:
    // Listen for clicks on the Enable-Music button
    document.addEventListener('click', function(event) {
      // Check if clicked element is the Enable-Music button
      console.log("Click detected, checking if Enable-Music button:", event.target);
      
      if (event.target.classList.contains('ps-enable-btn') || 
          event.target.textContent.includes('Enable-Music')) {
        console.log("Enable-Music button detected and clicked!");
        
        // Show visualizer when music is enabled
        setTimeout(function() {
          console.log("Attempting to show visualizer after Enable-Music");
          showVisualizerControls();
        }, 1000);
      }
    });
    
    // Test audio connection after a few seconds
    setTimeout(() => {
        if (window.particleVisualizer) {
            // Add test method if not present
            if (!window.particleVisualizer.testAudioConnection) {
                window.particleVisualizer.testAudioConnection = function() {
                    if (!this.audioAnalyzer || !this.audioAnalyzer.analyser) {
                        console.error('No analyzer to test');
                        return false;
                    }
                    
                    try {
                        // Get fresh data
                        const data = this.audioAnalyzer.update();
                        
                        // Check if we have any non-zero values
                        const hasData = Object.values(data).some(val => val > 0.01);
                        
                        console.log('Audio connection test:', 
                                   hasData ? 'DATA FLOWING' : 'NO DATA', 
                                   data);
                        
                        return hasData;
                    } catch (e) {
                        console.error('Error testing audio connection:', e);
                        return false;
                    }
                };
            }
            
            // Run test
            window.particleVisualizer.testAudioConnection();
            
            // Schedule another test when audio is playing
            if (window.audioPlayerInstance && window.audioPlayerInstance.isPlaying) {
                console.log("Testing visualizer connection with playing audio");
                window.particleVisualizer.testAudioConnection();
            }
        }
    }, 5000);
    
  } catch (error) {
    console.error("Error initializing visualizer:", error);
  }
});

// Terminal setup simplified
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
  
  // Show terminal
  terminal.classList.add('active');
  
  // Close button
  const closeButton = terminal.querySelector('.terminal-button.close');
  if (closeButton) {
    closeButton.addEventListener('click', () => terminal.classList.remove('active'));
  }
  
  // Setup controls
  setupVisualizerControls();
}

function setupVisualizerControls() {
  if (!window.particleVisualizer || !window.particleVisualizer.particleSystem) {
    console.warn("Particle system not available for controls");
    return;
  }
  
  console.log("Setting up visualizer controls");
  
  // Shape buttons
  document.querySelectorAll('.visualizer-terminal [data-shape]').forEach(btn => {
    // Remove old event listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
      const shape = newBtn.getAttribute('data-shape');
      console.log(`Shape button clicked: ${shape}`);
      if (window.particleVisualizer.particleSystem) {
        try {
          // Try both create methods (for compatibility)
          if (typeof window.particleVisualizer.particleSystem.create === 'function') {
            window.particleVisualizer.particleSystem.create(shape);
          } else {
            window.particleVisualizer.particleSystem.createShapedGeometry(shape);
          }
          console.log(`Created new ${shape} particles`);
        } catch (error) {
          console.error("Error changing particle shape:", error);
        }
      }
    });
  });
  
  // Randomize button
  const randomizeBtn = document.getElementById('randomize-segments');
  if (randomizeBtn) {
    // Remove existing listeners
    const newRandomizeBtn = randomizeBtn.cloneNode(true);
    randomizeBtn.parentNode.replaceChild(newRandomizeBtn, randomizeBtn);
    
    newRandomizeBtn.addEventListener('click', () => {
      console.log("Randomize segments button clicked");
      if (window.particleVisualizer.particleSystem) {
        try {
          window.particleVisualizer.particleSystem.randomizeCurrentShape();
          console.log("Segments randomized for current shape");
        } catch (error) {
          console.error("Error randomizing segments:", error);
        }
      }
    });
  }
  
  // Reactivity slider - FIXED IMPLEMENTATION
  const reactivitySlider = document.getElementById('reactivity-control');
  const reactivityValue = document.getElementById('reactivity-value');
  
  if (reactivitySlider && reactivityValue) {
    // Remove old event listeners by cloning
    const newSlider = reactivitySlider.cloneNode(true);
    reactivitySlider.parentNode.replaceChild(newSlider, reactivitySlider);
    
    // Initialize with current value
    const currentValue = window.particleVisualizer.particleSystem.reactivityMultiplier || 0.8;
    newSlider.value = currentValue.toString();
    reactivityValue.textContent = currentValue.toFixed(1);
    
    // Add new event listener
    newSlider.addEventListener('input', () => {
      const value = parseFloat(newSlider.value);
      reactivityValue.textContent = value.toFixed(1);
      
      console.log(`Setting reactivity to: ${value}`);
      if (window.particleVisualizer.particleSystem) {
        window.particleVisualizer.particleSystem.reactivityMultiplier = value;
      }
    });
    
    // Trigger the input event to apply initial value
    const event = new Event('input');
    newSlider.dispatchEvent(event);
  }
  
  // Color pickers
  const startColorPicker = document.getElementById('start-color-picker');
  const endColorPicker = document.getElementById('end-color-picker');
  
  if (startColorPicker && endColorPicker && window.THREE) {
    const updateColors = () => {
      if (window.particleVisualizer.particleSystem && 
          window.particleVisualizer.particleSystem.uniforms) {
        // Convert HTML color to THREE.Color
        const startColor = new THREE.Color(parseInt(startColorPicker.value.replace('#', '0x')));
        const endColor = new THREE.Color(parseInt(endColorPicker.value.replace('#', '0x')));
        
        window.particleVisualizer.particleSystem.uniforms.startColor.value.copy(startColor);
        window.particleVisualizer.particleSystem.uniforms.endColor.value.copy(endColor);
        console.log("Colors updated:", startColorPicker.value, endColorPicker.value);
      }
    };
    
    // Remove old listeners by cloning
    const newStartPicker = startColorPicker.cloneNode(true);
    const newEndPicker = endColorPicker.cloneNode(true);
    
    startColorPicker.parentNode.replaceChild(newStartPicker, startColorPicker);
    endColorPicker.parentNode.replaceChild(newEndPicker, endColorPicker);
    
    newStartPicker.addEventListener('input', updateColors);
    newEndPicker.addEventListener('input', updateColors);
    
    // Initial update
    setTimeout(updateColors, 500);
  }
}