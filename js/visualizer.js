// Add this method to your Visualizer class
connectToAudioElement(audioElement, existingAnalyser) {
    console.log("[Visualizer] Reconnecting to new audio element");
    
    if (existingAnalyser) {
        // Use the existing analyser from the audio player
        this.analyzer.useExternalAnalyser(existingAnalyser);
        console.log("[Visualizer] Using existing analyser from audio player");
    } else {
        // Create new connection
        this.analyzer.connectToAudioElement(audioElement);
        console.log("[Visualizer] Created new connection to audio element");
    }
    
    // Make sure the visualizer is visible
    this.showVisualizer();
}

// Make sure this helper method exists
showVisualizer() {
    if (this.container) {
        this.container.style.opacity = '1';
        this.container.style.visibility = 'visible';
        console.log("[Visualizer] Made visualizer visible");
    }
}
