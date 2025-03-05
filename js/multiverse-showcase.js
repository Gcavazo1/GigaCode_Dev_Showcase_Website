import Carousel from './multiverse-showcase/core/carousel.js';
import Controls from './multiverse-showcase/core/controls.js';

// Check if DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get container element
  const container = document.getElementById('multiverse-container');
  
  if (!container) {
    console.error('Multiverse container not found');
    return;
  }
  
  // Define shader configurations
  const shaderConfigs = [
    {
      title: 'Cosmic Nebula',
      description: 'A swirling cosmic gas cloud with stars',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase1/nebula.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase1/nebula.frag'
    },
    {
      title: 'Liquid Ripples',
      description: 'Mesmerizing water-like ripple patterns',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase2/ripple.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase2/ripple.frag'
    },
    {
      title: 'Portal Vortex',
      description: 'Swirling portal to another dimension',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase3/portal.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase3/portal.frag'
    },
    {
      title: 'Digital Rain',
      description: 'Matrix-style falling digital characters',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase4/matrix.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase4/matrix.frag'
    },
    {
      title: 'Fractal Patterns',
      description: 'Mesmerizing Mandelbrot/Julia set fractal',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase5/fractal.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase5/fractal.frag'
    },
    {
      title: 'Aurora Borealis',
      description: 'Northern lights dancing in the sky',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase6/aurora.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase6/aurora.frag'
    },
    {
      title: 'Liquid Metal',
      description: 'Dynamic liquid metal surface with realistic physics',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase7/liquid-metal.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase7/liquid-metal.frag'
    },
    {
      title: 'Neon Grid',
      description: 'Retrowave cyberpunk landscape with infinite grid',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase8/neon-grid.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase8/neon-grid.frag'
    }
  ];
  
  // Try-catch to handle any initialization errors
  try {
    // Create carousel
    const carousel = new Carousel({
      container,
      shaderConfigs
    });
    
    console.log('Multiverse showcase initialized');
    
    // Export carousel instance for debugging
    window.multiverseCarousel = carousel;
  } catch (error) {
    console.error('Failed to initialize multiverse showcase:', error);
    
    // Show error message in container
    container.innerHTML = `
      <div class="multiverse-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">
          <h3>Initialization Error</h3>
          <p>${error.message}</p>
        </div>
      </div>
    `;
  }
}); 