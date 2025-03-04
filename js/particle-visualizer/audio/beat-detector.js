class BeatDetector {
  constructor() {
    this.sensitivity = 2.0;
    this.threshold = 0.10;
    this.decayRate = 0.01;
    this.minBeatInterval = 150; // Minimum ms between beats
    
    this.prevLowValue = 0;
    this.energy = 0;
    this.lastEnergy = 0;
    this.lastBeatTime = 0;
    
    this.onBeat = null; // Callback for beat detection
    
    // Add debug flag
    this.debugMode = true;
  }

  update(audioData, currentTime) {
    if (!audioData) {
      if (this.debugMode) console.log('[BeatDetector] No audio data received');
      return false;
    }
    
    // Focus on low frequencies for better beat detection
    const value = audioData.low;
    
    if (this.debugMode) {
      console.log('[BeatDetector] Processing:', {
        value: value.toFixed(3),
        energy: (value * value * 2.0).toFixed(3),
        threshold: this.threshold
      });
    }
    
    // Calculate energy with higher multiplier
    this.energy = value * value * 2.0;
    
    // More sensitive beat detection algorithm
    const isBeat = this.energy > this.threshold && 
                   this.energy > this.lastEnergy * 1.08 &&
                   currentTime > this.lastBeatTime + this.minBeatInterval;
    
    // Update values
    this.lastEnergy = this.energy;
    
    if (isBeat) {
      this.lastBeatTime = currentTime;
      if (this.onBeat) this.onBeat();
      console.log('[BeatDetector] Beat detected!', {
        energy: this.energy.toFixed(3),
        threshold: this.threshold
      });
    }
    
    return isBeat;
  }
}

export default BeatDetector; 