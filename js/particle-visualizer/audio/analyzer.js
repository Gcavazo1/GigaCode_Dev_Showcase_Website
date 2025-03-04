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
      // Get frequency data - this is the critical part
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Calculate the values with higher values for better visibility
      const newData = {
        low: this.calculateBandValue(this.frequencyRanges.low) * 1.5,  // Amplify low frequencies
        mid: this.calculateBandValue(this.frequencyRanges.mid) * 1.2,  // Amplify mid frequencies
        high: this.calculateBandValue(this.frequencyRanges.high)       // Keep high frequencies as is
      };
      
      // Apply smoothing
      this.frequencyData.low = this.smooth(this.frequencyData.low, newData.low);
      this.frequencyData.mid = this.smooth(this.frequencyData.mid, newData.mid);
      this.frequencyData.high = this.smooth(this.frequencyData.high, newData.high);
      
      // Debug log occasionally
      if (Math.random() < 0.01) {
        console.log('[AudioAnalyzer] Frequency data:', {
          low: this.frequencyData.low.toFixed(3),
          mid: this.frequencyData.mid.toFixed(3),
          high: this.frequencyData.high.toFixed(3)
        });
      }
      
      return this.frequencyData;
    } catch (err) {
      console.error('[AudioAnalyzer] Error updating:', err);
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
    if (!externalAnalyser) {
      console.error('[AudioAnalyzer] No external analyser provided');
      return false;
    }
    
    // Store the external analyser reference
    this.analyser = externalAnalyser;
    
    // Store the audio element reference
    this.audio = audioElement;
    
    // Store audioContext reference for frequency calculations
    this.audioContext = this.analyser.context;
    
    // Setup the data array PROPER SIZE
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    
    console.log('[AudioAnalyzer] Using external analyser, buffer length:', this.bufferLength);
    
    // Test immediate data access
    try {
      this.analyser.getByteFrequencyData(this.dataArray);
      const hasData = this.dataArray.some(val => val > 0);
      console.log('[AudioAnalyzer] Initial data check:', hasData ? 'Data present' : 'No data yet');
    } catch (e) {
      console.error('[AudioAnalyzer] Error testing data access:', e);
    }
    
    // Set connected flag
    this.isConnected = true;
    
    return true;
  }
}

export default AudioAnalyzer; 