/**
 * Controls class
 * Manages user interaction with the showcase
 */
class Controls {
  /**
   * Create new controls
   * @param {Object} options - Configuration options
   * @param {Carousel} options.carousel - The carousel instance
   * @param {HTMLElement} options.container - Container element
   */
  constructor(options) {
    this.carousel = options.carousel;
    this.container = options.container;
    
    // State
    this.isDragging = false;
    this.lastMouseX = 0;
    this.touchStartX = 0;
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize controls
   */
  init() {
    // Mouse events
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Touch events
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this));
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Prevent context menu
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Handle mouse down event
   * @param {MouseEvent} event - Mouse event
   */
  onMouseDown(event) {
    if (event.button !== 0) return; // Only left mouse button
    
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    
    // Prevent text selection during drag
    event.preventDefault();
  }
  
  /**
   * Handle mouse move event
   * @param {MouseEvent} event - Mouse event
   */
  onMouseMove(event) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.lastMouseX;
    this.lastMouseX = event.clientX;
    
    // Update carousel rotation
    if (this.carousel.expandedWindowIndex === -1) {
      this.carousel.targetRotationAngle += deltaX * 0.01;
    }
  }
  
  /**
   * Handle mouse up event
   */
  onMouseUp() {
    this.isDragging = false;
  }
  
  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch event
   */
  onTouchStart(event) {
    if (event.touches.length !== 1) return;
    
    this.isDragging = true;
    this.touchStartX = event.touches[0].clientX;
    
    // Prevent scrolling
    event.preventDefault();
  }
  
  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch event
   */
  onTouchMove(event) {
    if (!this.isDragging || event.touches.length !== 1) return;
    
    const deltaX = event.touches[0].clientX - this.touchStartX;
    this.touchStartX = event.touches[0].clientX;
    
    // Update carousel rotation
    if (this.carousel.expandedWindowIndex === -1) {
      this.carousel.targetRotationAngle += deltaX * 0.01;
    }
    
    // Prevent scrolling
    event.preventDefault();
  }
  
  /**
   * Handle touch end event
   */
  onTouchEnd() {
    this.isDragging = false;
  }
}

export default Controls; 