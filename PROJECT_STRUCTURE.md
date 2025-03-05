# Multiverse Showcase Structure

## Directory Layout

js/
  multiverse-showcase/
    core/
      carousel.js        # Core 3D carousel functionality
      shader-window.js   # Individual window/tile management
      controls.js        # User interaction and hover effects
    
    shaders/
      common/
        base.vert       # Base vertex shader
        base.frag       # Base fragment shader
      showcase1/
        nebula.vert     # Cosmic nebula effect
        nebula.frag
      showcase2/
        ripple.vert     # Liquid ripple effect
        ripple.frag
      showcase3/
        portal.vert     # Portal/vortex effect
        portal.frag
      showcase4/
        matrix.vert     # Digital rain/matrix effect
        matrix.frag
      showcase5/
        fractal.vert    # Fractal pattern effect
        fractal.frag
      showcase6/
        aurora.vert     # Aurora borealis effect
        aurora.frag
    
    utils/
      shader-loader.js  # Async shader loading utility
      transition.js     # Smooth transition effects
      hover-effect.js   # Hover expansion handling
    
css/
  multiverse.css        # Styles for the showcase
  shader-windows.css    # Individual window styling 