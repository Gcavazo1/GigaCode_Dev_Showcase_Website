class AudioAnalyzer {
  constructor() {
    this.frequencyData = {
      low: 0,
      mid: 0,
      high: 0
    };
    this.smoothingFactor = 0.6; // Less smoothing = more responsive (was 0.8)
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.isConnected = false;
    
    // Frequency ranges (in Hz)
    this.frequencyRanges = {
      low: [20, 250],    // Bass
      mid: [250, 2000],  // Midrange
      high: [2000, 20000] // Treble
    };
  }

  connect(audioElement) {
    if (!audioElement || this.isConnected) return false;
    
    try {
      // Look for existing audio context in the audio player
      if (window.audioPlayerInstance && window.audioPlayerInstance.audioContext) {
        console.log('[AudioAnalyzer] Using existing AudioContext from audio player');
        this.audioContext = window.audioPlayerInstance.audioContext;
        
        // Create analyzer node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.5; // More responsive (default is 0.8)
        this.analyser.minDecibels = -100; // Detect quieter sounds (default is -100)
        this.analyser.maxDecibels = -30; // Better dynamic range (default is -30)
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        // Connect to the destination to capture audio
        this.analyser.connect(this.audioContext.destination);
        
        this.isConnected = true;
        return true;
      } else {
        // Continue with original code to create a new context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyzer node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.5; // More responsive (default is 0.8)
        this.analyser.minDecibels = -100; // Detect quieter sounds (default is -100)
        this.analyser.maxDecibels = -30; // Better dynamic range (default is -30)
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        // Create source from audio element and connect
        this.source = this.audioContext.createMediaElementSource(audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.isConnected = true;
        console.log('[AudioAnalyzer] New audio context created and connected');
        return true;
      }
    } catch (error) {
      console.error('[AudioAnalyzer] Error connecting:', error);
      return false;
    }
  }

  update() {
    if (!this.analyser || !this.dataArray) return this.frequencyData;
    
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate the values for low, mid, and high frequency ranges
    const newData = {
      low: this.calculateBandValue(this.frequencyRanges.low),
      mid: this.calculateBandValue(this.frequencyRanges.mid),
      high: this.calculateBandValue(this.frequencyRanges.high)
    };
    
    // Apply smoothing
    this.frequencyData.low = this.smooth(this.frequencyData.low, newData.low);
    this.frequencyData.mid = this.smooth(this.frequencyData.mid, newData.mid);
    this.frequencyData.high = this.smooth(this.frequencyData.high, newData.high);
    
    return this.frequencyData;
  }

  calculateBandValue(range) {
    if (!this.analyser || !this.dataArray) return 0;
    
    // Convert Hz range to indices in the frequency data array
    const lowIndex = Math.floor(range[0] * this.bufferLength / this.audioContext.sampleRate);
    const highIndex = Math.floor(range[1] * this.bufferLength / this.audioContext.sampleRate);
    
    // Sum all frequency values in the range
    let sum = 0;
    let count = 0;
    for (let i = lowIndex; i <= highIndex && i < this.bufferLength; i++) {
      sum += this.dataArray[i];
      count++;
    }
    
    // Return normalized value (0-1)
    return count > 0 ? (sum / count) / 255 : 0;
  }

  smooth(oldValue, newValue) {
    return oldValue * this.smoothingFactor + newValue * (1 - this.smoothingFactor);
  }
}

export default AudioAnalyzer; 