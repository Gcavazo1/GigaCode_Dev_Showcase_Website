class BeatDetector {
  constructor() {
    this.sensitivity = 1.5;
    this.threshold = 0.15;
    this.decayRate = 0.01;
    this.minBeatInterval = 200; // Minimum ms between beats
    
    this.prevLowValue = 0;
    this.energyHistory = Array(8).fill(0);
    this.energyIndex = 0;
    this.lastBeatTime = 0;
    
    this.onBeat = null; // Callback for beat detection
  }

  update(frequencyData, time) {
    if (!frequencyData) return false;
    
    const { low } = frequencyData;
    
    // Add current energy to history
    this.energyHistory[this.energyIndex] = low;
    this.energyIndex = (this.energyIndex + 1) % this.energyHistory.length;
    
    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    
    // Beat detected if current energy is above average by threshold
    const isBeat = low > avgEnergy * this.sensitivity && 
                   low > this.threshold && 
                   low - this.prevLowValue > this.threshold;
    
    // Ensure minimum time between beats
    const timeSinceLastBeat = time - this.lastBeatTime;
    const beatDetected = isBeat && timeSinceLastBeat > this.minBeatInterval;
    
    if (beatDetected) {
      this.lastBeatTime = time;
      if (this.onBeat) this.onBeat(frequencyData);
    }
    
    this.prevLowValue = low;
    return beatDetected;
  }
}

export default BeatDetector; 