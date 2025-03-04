// Add debug logs at key points
console.log("Particle visualizer script loaded");

// Simplified initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log("DOMContentLoaded event triggered for visualizer");
  
  try {
    console.log("Attempting to import visualizer module");
    // Dynamically import the visualizer module
    const ParticleVisualizer = await import('./particle-visualizer/visualizer.js').then(module => module.default);
    console.log("Module imported successfully");
    
    // Create visualizer instance and make it globally accessible
    const visualizer = new ParticleVisualizer();
    window.particleVisualizer = visualizer;
    console.log("Visualizer instance created and attached to window object");
    
    // Initialize visualizer but don't connect to audio yet
    // The connection will happen via audio-player.js
    
    // REMOVE any auto-connection to audio element here
    // REMOVE play/pause event listeners that might hide visualizer
    
    // Setup visualizer terminal controls
    setupVisualizerTerminal();
    
  } catch (error) {
    console.error("Error initializing visualizer:", error);
  }
});

// Keep terminal setup functions
function setupVisualizerTerminal() {
  // Setup visualizer nav button
  setupVisualizerNavButton();
  
  // Set up control handlers when terminal is shown
  const setupControls = () => {
    if (window.particleVisualizer) {
      setupVisualizerControls();
    }
  };
  
  // Add listener to setup controls when terminal is shown
  const terminal = document.querySelector('.visualizer-terminal');
  if (terminal) {
    terminal.addEventListener('shown', setupControls);
  }
}

// Keep your existing button setup function
function setupVisualizerNavButton() {
  const navButton = document.getElementById('visualizer-nav-button');
  
  if (navButton) {
    console.log("Found visualizer nav button by ID");
    navButton.addEventListener('click', function() {
      console.log("Visualizer nav button clicked directly");
      showVisualizerControls();
    });
  }
}

// Keep your existing terminal functions - no changes needed to these
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
  
  // Make sure reactivity slider shows correct value
  const reactivitySlider = document.getElementById('reactivity-control');
  const reactivityValue = document.getElementById('reactivity-value');
  if (reactivitySlider && reactivityValue) {
    reactivitySlider.value = "0.8";
    reactivityValue.textContent = "0.8";
  }
}

function setupVisualizerControls() {
  console.log("Setting up visualizer control event handlers for updated particle system");
  
  // Setup shape buttons with the new approach
  const shapeButtons = document.querySelectorAll('.visualizer-terminal .control-buttons [data-shape]');
  console.log(`Found ${shapeButtons.length} shape buttons`);
  
  // Keep the shape button click handlers, but remove the active class toggling
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
        } catch (error) {
          console.error("Error changing particle shape:", error);
        }
      }
    });
  });
  
  // For the randomize button, also remove the active class update
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

// REPLACE makeDraggable with a simpler setup function
function setupTerminal(element) {
  // Set the terminal to position fixed so it's locked in the viewport
  element.style.position = 'fixed';
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