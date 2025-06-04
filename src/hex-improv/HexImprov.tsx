import { Component, createSignal, onMount } from 'solid-js';
import Controls from './Controls';
import HexGrid from './HexGrid';
import hexImprovState from './hexImprovState';
import audioEngine from './audioEngine';

const HexImprov: Component = () => {
  // Only render the HexGrid component when isPlaying is true
  const [audioUnlocked, setAudioUnlocked] = createSignal(false);
  
  // Function to handle the back button click
  const handleBackClick = () => {
    // Access the hexImprovState to stop playback
    if (hexImprovState().isPlaying) {
      const event = new CustomEvent('stopPlayback');
      window.dispatchEvent(event);
    }
  };
  
  // Function to unlock audio on iOS Safari
  const unlockAudio = () => {
    // Initialize audio engine - critical for iOS Safari
    const ctx = audioEngine.initAudio();
    console.log('Attempting to unlock audio, context state:', ctx.state);
    
    try {
      // Play a test sound immediately - this should be audible
      const testOsc = ctx.createOscillator();
      const testGain = ctx.createGain();
      
      // Make this one audible so we can verify sound works
      testGain.gain.value = 0.2;
      testOsc.frequency.value = 440; // A4 note
      
      testOsc.connect(testGain);
      testGain.connect(ctx.destination);
      
      // Start and stop with current time to ensure it plays immediately
      testOsc.start(ctx.currentTime);
      testOsc.stop(ctx.currentTime + 0.3); // Short beep
      
      console.log('Test sound played');
      setAudioUnlocked(true);
    } catch (err) {
      console.error('Error playing test sound:', err);
    }
  };
  
  // Set up touch and click listeners to unlock audio
  onMount(() => {
    // Add event listeners to the entire document to catch any touch/click
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
  });
  
  return (
    <div class="flex flex-col p-2.5 min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Show header and controls only when not playing */}
      {!hexImprovState().isPlaying && (
        <>
          <div class="text-center mb-5">
            <h1 class="text-2xl font-bold">🎵 Hex Music Player</h1>
            {/* Audio status indicator */}
            <div class={`text-sm mt-1 ${audioUnlocked() ? 'text-green-400' : 'text-yellow-400 animate-pulse'}`}>
              {audioUnlocked() ? '✓ Audio Ready' : 'Check if your device is unmuted'}
            </div>
          </div>
          
          <Controls />
          
          <div class="text-center text-2xl font-bold mb-2.5 text-yellow-300 drop-shadow-md">
            {hexImprovState().chordDisplay}
          </div>
        </>
      )}
      
      {/* Only render HexGrid when playing */}
      {hexImprovState().isPlaying && (
        <div class="flex flex-col h-screen w-full relative">
          {/* Floating chord display at top */}
          <div class="fixed top-2 left-0 right-0 z-10 text-center text-2xl font-bold text-yellow-300 drop-shadow-md">
            {hexImprovState().chordDisplay}
          </div>
          
          {/* Back button */}
          <button 
            class="fixed top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg"
            onClick={handleBackClick}
          >
            <span class="text-xl">&larr;</span>
          </button>
          
          {/* Full-screen hex grid */}
          <div class="flex-grow">
            <HexGrid />
          </div>
        </div>
      )}
    </div>
  );
};

export default HexImprov;