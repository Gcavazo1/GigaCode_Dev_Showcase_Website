/**
 * HoverEffect class
 * Manages hover expansion and effects
 */
class HoverEffect {
  /**
   * Create a new hover effect
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.element - Target element
   * @param {number} options.scale - Scale factor on hover
   * @param {number} options.duration - Animation duration in ms
   */
  constructor(options) {
    this.element = options.element;
    this.scale = options.scale || 1.2;
    this.duration = options.duration || 300;
    
    this.isHovered = false;
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    this.lastTime = 0;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize hover effect
   */
  init() {
    // Add event listeners
    this.element.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    // Start animation loop
    this.animate();
  }
  
  /**
   * Handle mouse enter
   */
  onMouseEnter() {
    this.isHovered = true;
    this.targetScale = this.scale;
  }
  
  /**
   * Handle mouse leave
   */
  onMouseLeave() {
    this.isHovered = false;
    this.targetScale = 1.0;
  }
  
  /**
   * Animation loop
   * @param {number} timestamp - Current timestamp
   */
  animate(timestamp = 0) {
    // Calculate delta time
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // Update scale with smooth transition
    const scaleDelta = this.targetScale - this.currentScale;
    if (Math.abs(scaleDelta) > 0.001) {
      this.currentScale += scaleDelta * Math.min(1.0, deltaTime * 5);
      
      // Apply scale to element
      this.element.style.transform = `scale(${this.currentScale})`;
    }
    
    // Request next frame
    requestAnimationFrame(this.animate.bind(this));
  }
  
  /**
   * Set hover state manually
   * @param {boolean} isHovered - Whether the element is hovered
   */
  setHover(isHovered) {
    this.isHovered = isHovered;
    this.targetScale = isHovered ? this.scale : 1.0;
  }
  
  /**
   * Set expanded state
   * @param {boolean} isExpanded - Whether the element is expanded
   * @param {number} expandedScale - Scale when expanded
   */
  setExpanded(isExpanded, expandedScale = 2.0) {
    this.targetScale = isExpanded ? expandedScale : (this.isHovered ? this.scale : 1.0);
  }
}

export default HoverEffect; 