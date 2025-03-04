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
  } catch (error) {
    console.error("Error initializing visualizer:", error);
  }
});

// Terminal setup simplified
function showVisualizerControls() {
  const terminal = document.querySelector('.visualizer-terminal');
  if (!terminal || terminal.classList.contains('active')) return;
  
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
  if (!window.particleVisualizer) return;
  
  // Shape buttons
  document.querySelectorAll('.visualizer-terminal [data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      const shape = btn.getAttribute('data-shape');
      if (window.particleVisualizer.particleSystem) {
        window.particleVisualizer.particleSystem.create(shape);
      }
    });
  });
  
  // Randomize button
  const randomizeBtn = document.getElementById('randomize-segments');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', () => {
      if (window.particleVisualizer.particleSystem) {
        window.particleVisualizer.particleSystem.randomizeCurrentShape();
      }
    });
  }
  
  // Color pickers
  const startColorPicker = document.getElementById('start-color-picker');
  const endColorPicker = document.getElementById('end-color-picker');
  
  if (startColorPicker && endColorPicker) {
    const updateColors = () => {
      if (window.particleVisualizer.particleSystem) {
        const startColor = new THREE.Color(parseInt(startColorPicker.value.replace('#', '0x')));
        const endColor = new THREE.Color(parseInt(endColorPicker.value.replace('#', '0x')));
        window.particleVisualizer.particleSystem.uniforms.startColor.value = startColor;
        window.particleVisualizer.particleSystem.uniforms.endColor.value = endColor;
      }
    };
    
    startColorPicker.addEventListener('input', updateColors);
    endColorPicker.addEventListener('input', updateColors);
  }
  
  // Reactivity slider
  const reactivitySlider = document.getElementById('reactivity-control');
  const reactivityValue = document.getElementById('reactivity-value');
  
  if (reactivitySlider && reactivityValue) {
    reactivitySlider.addEventListener('input', () => {
      const value = parseFloat(reactivitySlider.value);
      reactivityValue.textContent = value.toFixed(1);
      
      if (window.particleVisualizer.particleSystem) {
        window.particleVisualizer.particleSystem.reactivityMultiplier = value;
      }
    });
  }
}