import Carousel from './multiverse-showcase/core/carousel.js';
import Controls from './multiverse-showcase/core/controls.js';

// Initialize the multiverse showcase
document.addEventListener('DOMContentLoaded', () => {
  // Find container element
  const container = document.getElementById('multiverse-container');
  if (!container) {
    console.error('Multiverse container not found');
    return;
  }
  
  // Shader configurations
  const shaderConfigs = [
    {
      title: 'Cosmic Nebula',
      description: 'A swirling cosmic nebula with stars and gas clouds',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase1/nebula.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase1/nebula.frag'
    },
    {
      title: 'Liquid Ripples',
      description: 'Mesmerizing liquid ripple patterns with light reflections',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase2/ripple.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase2/ripple.frag'
    },
    {
      title: 'Portal Vortex',
      description: 'A swirling portal to another dimension',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase3/portal.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase3/portal.frag'
    },
    {
      title: 'Digital Rain',
      description: 'Matrix-style digital rain effect with glowing characters',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase4/matrix.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase4/matrix.frag'
    },
    {
      title: 'Fractal Patterns',
      description: 'Infinite recursive fractal patterns that evolve over time',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase5/fractal.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase5/fractal.frag'
    },
    {
      title: 'Aurora Borealis',
      description: 'Shimmering northern lights dancing across the sky',
      vertexShaderPath: 'js/multiverse-showcase/shaders/showcase6/aurora.vert',
      fragmentShaderPath: 'js/multiverse-showcase/shaders/showcase6/aurora.frag'
    }
  ];
  
  // Create carousel
  const carousel = new Carousel({
    container: container,
    shaderConfigs: shaderConfigs
  });
  
  // Create controls
  const controls = new Controls({
    carousel: carousel,
    container: container
  });
  
  // Create info element
  const infoElement = document.createElement('div');
  infoElement.className = 'multiverse-info';
  infoElement.innerHTML = `
    <h2>GLSL Multiverse</h2>
    <p>Hover over a tile to see details. Click to expand.</p>
  `;
  container.appendChild(infoElement);
  
  // Hide info when a window is expanded
  carousel.onWindowExpand = (index) => {
    infoElement.style.opacity = '0';
  };
  
  carousel.onWindowCollapse = () => {
    infoElement.style.opacity = '0.8';
  };
  
  // Add to global scope for debugging
  window.multiverseCarousel = carousel;
  window.multiverseControls = controls;
}); 