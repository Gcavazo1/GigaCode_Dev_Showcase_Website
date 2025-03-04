// Advanced AI Assistant with Voice Synthesis and Animation

class GANShowcase {
  constructor() {
    this.canvas = document.getElementById('gan-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.styleSlider = document.getElementById('style-slider');
    this.complexitySlider = document.getElementById('complexity-slider');
    this.generateBtn = document.getElementById('generate-btn');
    this.loadingOverlay = document.querySelector('.loading-overlay');
    this.generationStatus = document.querySelector('.generation-status');
    
    this.model = null;
    this.isGenerating = false;
    this.noiseSeeds = [];
    
    this.init();
  }
  
  async init() {
    this.setupEventListeners();
    this.showLoading('Loading GAN model...');
    
    try {
      // In a real implementation, you would load a TensorFlow.js model here
      // For demo purposes, we'll simulate the model loading
      await this.simulateModelLoading();
      
      // Generate initial noise seeds for consistency
      for (let i = 0; i < 20; i++) {
        this.noiseSeeds.push(Math.random() * 1000);
      }
      
      this.hideLoading();
      this.generateBtn.disabled = false;
      
      // Generate initial image
      this.generateImage();
    } catch (error) {
      console.error('Error loading GAN model:', error);
      this.generationStatus.textContent = 'Error loading model';
    }
  }
  
  setupEventListeners() {
    this.generateBtn.addEventListener('click', () => this.generateImage());
    
    // Add event listeners for new buttons
    const randomizeBtn = document.getElementById('randomize-btn');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => this.generateRandomSeed());
    }
    
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveImage());
    }
    
    // Real-time generation on slider change (with debounce)
    let debounceTimer;
    const handleSliderChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.generateImage(), 300);
    };
    
    this.styleSlider.addEventListener('input', handleSliderChange);
    this.complexitySlider.addEventListener('input', handleSliderChange);
  }
  
  async generateImage() {
    if (this.isGenerating) return;
    
    this.isGenerating = true;
    this.showLoading('Generating image...');
    
    try {
      // Get slider values
      const styleValue = this.styleSlider.value / 100;
      const complexityValue = this.complexitySlider.value / 100;
      
      // In a real implementation, you would use the model to generate an image
      // For demo purposes, we'll create a procedural cyberpunk-style image
      await this.generateProceduralImage(styleValue, complexityValue);
      
      this.hideLoading();
    } catch (error) {
      console.error('Error generating image:', error);
      this.generationStatus.textContent = 'Generation failed';
    } finally {
      this.isGenerating = false;
    }
  }
  
  async simulateModelLoading() {
    // Simulate loading a large model
    return new Promise(resolve => {
      setTimeout(() => {
        this.model = { loaded: true };
        resolve();
      }, 2000);
    });
  }
  
  async generateProceduralImage(styleValue, complexityValue) {
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Create a cyberpunk-style procedural image
    // This is a simplified version - a real GAN would generate much more complex images
    
    // Background
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, `rgba(${Math.floor(20 + styleValue * 40)}, 0, ${Math.floor(50 + styleValue * 100)}, 1)`);
    gradient.addColorStop(1, `rgba(0, ${Math.floor(20 + styleValue * 30)}, ${Math.floor(30 + styleValue * 50)}, 1)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Grid
    this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + styleValue * 0.2})`;
    this.ctx.lineWidth = 1;
    
    const gridSize = Math.floor(5 + complexityValue * 30);
    const cellSize = this.canvas.width / gridSize;
    
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * cellSize;
      
      // Horizontal line
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
      
      // Vertical line
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Generate buildings
    const buildingCount = Math.floor(10 + complexityValue * 40);
    
    for (let i = 0; i < buildingCount; i++) {
      // Use consistent seeds for more stable generation
      const seedIndex = i % this.noiseSeeds.length;
      const seed = this.noiseSeeds[seedIndex];
      const random = this.seededRandom(seed + styleValue);
      
      const x = random * this.canvas.width;
      const width = 20 + random * 100;
      const height = 100 + random * 300;
      const y = this.canvas.height - height;
      
      // Building body
      this.ctx.fillStyle = `rgba(10, 10, 30, ${0.7 + this.seededRandom(seed + 1) * 0.3})`;
      this.ctx.fillRect(x, y, width, height);
      
      // Windows
      const windowRows = Math.floor(5 + complexityValue * 15);
      const windowCols = Math.floor(2 + complexityValue * 5);
      const windowWidth = width / (windowCols * 1.5);
      const windowHeight = height / (windowRows * 1.5);
      
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const windowSeed = seed + row * 0.1 + col * 0.01;
          if (this.seededRandom(windowSeed) > 0.3) {
            const windowX = x + col * (width / windowCols) + (width / windowCols - windowWidth) / 2;
            const windowY = y + row * (height / windowRows) + (height / windowRows - windowHeight) / 2;
            
            // Window glow
            const glowColor = this.seededRandom(windowSeed + 0.5) > 0.5 ? 
              `rgba(0, 255, 255, ${0.1 + this.seededRandom(windowSeed + 0.6) * 0.4})` : 
              `rgba(255, 0, 255, ${0.1 + this.seededRandom(windowSeed + 0.7) * 0.4})`;
            
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 10;
            
            // Window
            this.ctx.fillStyle = glowColor.replace(/[^,]+(?=\))/, '0.8');
            this.ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
          }
        }
      }
    }
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    
    // Add neon signs
    const neonCount = Math.floor(3 + styleValue * 10);
    
    for (let i = 0; i < neonCount; i++) {
      const seedIndex = (i + buildingCount) % this.noiseSeeds.length;
      const seed = this.noiseSeeds[seedIndex];
      
      const x = this.seededRandom(seed) * this.canvas.width;
      const y = this.seededRandom(seed + 0.1) * (this.canvas.height / 2) + (this.canvas.height / 3);
      const radius = 20 + this.seededRandom(seed + 0.2) * 50;
      
      // Neon glow
      const neonColor = this.seededRandom(seed + 0.3) > 0.5 ? 
        `rgba(0, 255, 255, 0.8)` : 
        `rgba(255, 0, 255, 0.8)`;
      
      this.ctx.shadowColor = neonColor;
      this.ctx.shadowBlur = 20;
      
      // Neon shape
      this.ctx.strokeStyle = neonColor;
      this.ctx.lineWidth = 2 + this.seededRandom(seed + 0.4) * 3;
      
      if (this.seededRandom(seed + 0.5) > 0.5) {
        // Circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        // Rectangle
        this.ctx.strokeRect(x - radius, y - radius / 2, radius * 2, radius);
      }
    }
    
    // Add flying vehicles
    const vehicleCount = Math.floor(2 + complexityValue * 8);
    
    for (let i = 0; i < vehicleCount; i++) {
      const seedIndex = (i + buildingCount + neonCount) % this.noiseSeeds.length;
      const seed = this.noiseSeeds[seedIndex];
      
      const x = this.seededRandom(seed) * this.canvas.width;
      const y = this.seededRandom(seed + 0.1) * (this.canvas.height / 2);
      const width = 30 + this.seededRandom(seed + 0.2) * 40;
      const height = 10 + this.seededRandom(seed + 0.3) * 15;
      
      // Vehicle body
      this.ctx.fillStyle = `rgba(20, 20, 40, 0.8)`;
      this.ctx.fillRect(x, y, width, height);
      
      // Lights
      this.ctx.shadowColor = `rgba(255, 0, 0, 0.8)`;
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = `rgba(255, 0, 0, 0.8)`;
      this.ctx.fillRect(x + width - 5, y + 2, 3, 3);
      
      this.ctx.shadowColor = `rgba(0, 255, 255, 0.8)`;
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = `rgba(0, 255, 255, 0.8)`;
      this.ctx.fillRect(x + 2, y + 2, 5, 3);
      
      // Light trail
      this.ctx.shadowColor = `rgba(0, 255, 255, 0.5)`;
      this.ctx.shadowBlur = 10;
      this.ctx.strokeStyle = `rgba(0, 255, 255, 0.3)`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + height / 2);
      this.ctx.lineTo(x - 20 - this.seededRandom(seed + 0.4) * 30, y + height / 2);
      this.ctx.stroke();
    }
  }
  
  // Deterministic random function based on seed
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  showLoading(message) {
    this.loadingOverlay.style.display = 'flex';
    this.generationStatus.textContent = message;
  }
  
  hideLoading() {
    this.loadingOverlay.style.display = 'none';
  }
  
  // Add a method to save the generated image
  saveImage() {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.download = `cyberpunk-gan-${Date.now()}.png`;
      
      // Convert canvas to data URL
      link.href = this.canvas.toDataURL('image/png');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const originalText = this.generateBtn.textContent;
      this.generateBtn.textContent = 'Image Saved!';
      setTimeout(() => {
        this.generateBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  }
  
  // Add a method to generate a random seed
  generateRandomSeed() {
    // Regenerate noise seeds
    this.noiseSeeds = [];
    for (let i = 0; i < 20; i++) {
      this.noiseSeeds.push(Math.random() * 1000);
    }
    
    // Generate new image
    this.generateImage();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gan-canvas')) {
    new GANShowcase();
  }
}); 