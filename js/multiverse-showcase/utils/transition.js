/**
 * Transition utility
 * Handles smooth transitions between states
 */
class Transition {
  /**
   * Create a new transition
   * @param {Object} options - Configuration options
   * @param {number} options.duration - Duration in milliseconds
   * @param {Function} options.easing - Easing function
   * @param {Function} options.onUpdate - Update callback
   * @param {Function} options.onComplete - Complete callback
   */
  constructor(options = {}) {
    this.duration = options.duration || 500;
    this.easing = options.easing || this.easeOutCubic;
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});
    
    this.startValue = 0;
    this.endValue = 0;
    this.currentValue = 0;
    this.startTime = 0;
    this.isRunning = false;
  }
  
  /**
   * Start a transition
   * @param {number} startValue - Starting value
   * @param {number} endValue - Ending value
   * @param {Object} options - Optional configuration overrides
   */
  start(startValue, endValue, options = {}) {
    // Stop any running transition
    this.stop();
    
    // Set values
    this.startValue = startValue;
    this.endValue = endValue;
    this.currentValue = startValue;
    
    // Override options if provided
    if (options.duration) this.duration = options.duration;
    if (options.easing) this.easing = options.easing;
    if (options.onUpdate) this.onUpdate = options.onUpdate;
    if (options.onComplete) this.onComplete = options.onComplete;
    
    // Start animation
    this.startTime = performance.now();
    this.isRunning = true;
    
    // Request first frame
    requestAnimationFrame(this.update.bind(this));
  }
  
  /**
   * Stop the transition
   */
  stop() {
    this.isRunning = false;
  }
  
  /**
   * Update the transition
   * @param {number} timestamp - Current timestamp
   */
  update(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate progress
    const elapsed = timestamp - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // Apply easing
    const easedProgress = this.easing(progress);
    
    // Calculate current value
    this.currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;
    
    // Call update callback
    this.onUpdate(this.currentValue, easedProgress);
    
    // Check if complete
    if (progress >= 1) {
      this.isRunning = false;
      this.onComplete(this.endValue);
    } else {
      // Request next frame
      requestAnimationFrame(this.update.bind(this));
    }
  }
  
  /**
   * Cubic ease out function
   * @param {number} t - Progress (0-1)
   * @returns {number} - Eased value
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  /**
   * Cubic ease in out function
   * @param {number} t - Progress (0-1)
   * @returns {number} - Eased value
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Bounce ease out function
   * @param {number} t - Progress (0-1)
   * @returns {number} - Eased value
   */
  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
}

export default Transition; 