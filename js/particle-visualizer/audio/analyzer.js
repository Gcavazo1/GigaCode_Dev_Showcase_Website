class AudioAnalyzer {
  constructor() {
    this.frequencyData = {
      low: 0,
      mid: 0,
      high: 0
    };
    this.smoothingFactor = 0.3;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.isConnected = false;
    
    // Frequency ranges (in Hz) - adjust low range for better beat detection
    this.frequencyRanges = {
      low: [5, 250],     // Bass (lowered from 10 to 5)
      mid: [250, 2000],   // Midrange
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
        
        // Create analyzer node with more sensitive settings
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.25;
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        // Connect to the destination to capture audio
        this.analyser.connect(this.audioContext.destination);
        
        this.isConnected = true;
        return true;
      } else {
        // Create a new context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyzer node
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.25;
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;
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
    if (!this.analyser || !this.dataArray) {
      return { low: 0, mid: 0, high: 0 };
    }
    
    try {
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate the values with appropriate amplification
      const newData = {
        low: this.calculateBandValue(this.frequencyRanges.low) * 1.5,
        mid: this.calculateBandValue(this.frequencyRanges.mid) * 1.2,
        high: this.calculateBandValue(this.frequencyRanges.high)
      };
      
      // Apply smoothing
      this.frequencyData.low = this.smooth(this.frequencyData.low, newData.low);
      this.frequencyData.mid = this.smooth(this.frequencyData.mid, newData.mid);
      this.frequencyData.high = this.smooth(this.frequencyData.high, newData.high);
      
      return this.frequencyData;
    } catch (err) {
      return { low: 0, mid: 0, high: 0 };
    }
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

  useExternalAnalyser(externalAnalyser, audioElement) {
    if (!externalAnalyser) return false;
    
    // Store references
    this.analyser = externalAnalyser;
    this.audio = audioElement;
    this.audioContext = this.analyser.context;
    
    // Setup the data array
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    
    // Test data access
    try {
      this.analyser.getByteFrequencyData(this.dataArray);
    } catch (e) {
      // Silent fail
    }
    
    this.isConnected = true;
    return true;
  }
}

export default AudioAnalyzer; 