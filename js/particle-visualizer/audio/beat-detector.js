class BeatDetector {
  constructor() {
    this.sensitivity = 1.5;
    this.threshold = 0.15;
    this.decayRate = 0.01;
    this.minBeatInterval = 200; // Minimum ms between beats
    
    this.prevLowValue = 0;
    this.energy = 0;
    this.lastEnergy = 0;
    this.lastBeatTime = 0;
    
    this.onBeat = null; // Callback for beat detection
  }

  update(audioData, currentTime) {
    if (!audioData) return false;
    
    // Focus on low frequencies for better beat detection
    const value = audioData.low;
    
    // Calculate energy
    this.energy = value * value * 1.5;
    
    // Check if it's a beat - using a dynamic threshold based on previous energy
    const isBeat = this.energy > this.threshold && 
                   this.energy > this.lastEnergy * 1.1 && 
                   currentTime > this.lastBeatTime + this.minBeatInterval;
    
    // Update values
    this.lastEnergy = this.energy;
    
    if (isBeat) {
      this.lastBeatTime = currentTime;
      if (this.onBeat) this.onBeat();
      console.log('[BeatDetector] Beat detected!', this.energy);
    }
    
    return isBeat;
  }
}

export default BeatDetector; 