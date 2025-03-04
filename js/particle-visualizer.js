// Minimalist initialization for particle visualizer
console.log("Particle visualizer initialized");

// Single clean initialization
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Import the visualizer module
    const ParticleVisualizer = await import('./particle-visualizer/visualizer.js').then(module => module.default);
    
    // Create visualizer instance and make it globally accessible
    const visualizer = new ParticleVisualizer();
    window.particleVisualizer = visualizer;
    
    // Setup visualizer controls
    setupVisualizerControls();
    
    // Setup nav button
    const navButton = document.getElementById('visualizer-nav-button');
    if (navButton) {
      navButton.addEventListener('click', showVisualizerControls);
    }
    
    // Auto-open functionality for Enable-Music button
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('ps-enable-btn') || 
          event.target.textContent.includes('Enable-Music')) {
        
        // Show visualizer when music is enabled
        setTimeout(() => showVisualizerControls(), 1000);
      }
    });
  } catch (error) {
    console.error("Error initializing visualizer:", error);
  }
});

// Show visualizer terminal controls
function showVisualizerControls() {
  const terminal = document.querySelector('.visualizer-terminal');
  if (!terminal || terminal.classList.contains('active')) return;
  
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

// Setup the visualizer controls
function setupVisualizerControls() {
  if (!window.particleVisualizer || !window.particleVisualizer.particleSystem) return;
  
  // Shape buttons
  document.querySelectorAll('.visualizer-terminal [data-shape]').forEach(btn => {
    // Remove old event listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
      const shape = newBtn.getAttribute('data-shape');
      if (window.particleVisualizer.particleSystem) {
        try {
          if (typeof window.particleVisualizer.particleSystem.create === 'function') {
            window.particleVisualizer.particleSystem.create(shape);
          } else {
            window.particleVisualizer.particleSystem.createShapedGeometry(shape);
          }
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
      if (window.particleVisualizer.particleSystem) {
        window.particleVisualizer.particleSystem.randomizeCurrentShape();
      }
    });
  }
  
  // Reactivity slider
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