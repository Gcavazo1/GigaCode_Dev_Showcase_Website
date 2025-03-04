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
  const reactivitySlider = document.getElementById('reactivity-control');
  const reactivityValue = document.getElementById('reactivity-value');
  
  if (reactivitySlider && reactivityValue) {
    // Set initial value from particle system or default to 0.6
    const currentValue = window.particleVisualizer?.particleSystem?.reactivityMultiplier || 0.6;
    reactivitySlider.value = currentValue;
    reactivityValue.textContent = currentValue.toFixed(1);
    
    reactivitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      reactivityValue.textContent = value.toFixed(1);
      if (window.particleVisualizer?.particleSystem) {
        window.particleVisualizer.particleSystem.reactivityMultiplier = value;
      }
    });
  }

  // Fix color picker implementation
  const startColorPicker = document.getElementById('start-color-picker');
  const endColorPicker = document.getElementById('end-color-picker');
  
  if (startColorPicker && endColorPicker && window.particleVisualizer?.particleSystem) {
    const updateColors = () => {
      const system = window.particleVisualizer.particleSystem;
      if (system && system.uniforms) {
        // Convert hex colors to THREE.Color
        system.uniforms.startColor.value.set(startColorPicker.value);
        system.uniforms.endColor.value.set(endColorPicker.value);
      }
    };

    // Set initial colors from HTML
    startColorPicker.value = '#00ffff';  // Cyan
    endColorPicker.value = '#ff00ff';    // Magenta
    
    // Add event listeners
    startColorPicker.addEventListener('input', updateColors);
    endColorPicker.addEventListener('input', updateColors);
    
    // Initial update
    updateColors();
  }
}

// Ensure visualizer is initialized before setting up controls
document.addEventListener('DOMContentLoaded', () => {
  // Wait for particle system to be ready
  const checkVisualizer = setInterval(() => {
    if (window.particleVisualizer?.particleSystem) {
      setupVisualizerControls();
      clearInterval(checkVisualizer);
    }
  }, 100);
});