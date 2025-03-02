import ParticleVisualizer from './particle-visualizer/visualizer.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const visualizer = new ParticleVisualizer();
  
  // Make it globally accessible
  window.particleVisualizer = visualizer;
  
  // Connect to audio player when it exists
  const connectToAudioPlayer = () => {
    const audioElement = document.getElementById('background-audio');
    
    if (audioElement) {
      visualizer.connectToAudioPlayer(audioElement);
      
      // Listen for play/pause events
      audioElement.addEventListener('play', () => {
        visualizer.isPlaying = true;
        visualizer.show();
      });
      
      audioElement.addEventListener('pause', () => {
        visualizer.isPlaying = false;
        visualizer.hide();
      });
      
      // Also connect to audio player instance if it exists
      if (window.audioPlayerInstance) {
        // Override the play method to show visualizer
        const originalPlayMethod = window.audioPlayerInstance.playAudio;
        window.audioPlayerInstance.playAudio = function() {
          originalPlayMethod.apply(this);
          visualizer.isPlaying = true;
          visualizer.show();
        };
        
        // Override the pause method to hide visualizer
        const originalPauseMethod = window.audioPlayerInstance.pauseAudio;
        window.audioPlayerInstance.pauseAudio = function() {
          originalPauseMethod.apply(this);
          visualizer.isPlaying = false;
          visualizer.hide();
        };
      }
      
      return true;
    }
    
    return false;
  };
  
  // Try to connect immediately, or wait for the player to be available
  if (!connectToAudioPlayer()) {
    // If audio player isn't available yet, try again when play button is clicked
    const playButton = document.getElementById('play-audio');
    if (playButton) {
      playButton.addEventListener('click', () => {
        setTimeout(connectToAudioPlayer, 100);
      });
    }
  }
});