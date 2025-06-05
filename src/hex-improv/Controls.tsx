import { Component, createEffect, onCleanup } from 'solid-js';
import hexImprovState, { setScale, setProgression, startProgression, stopProgression, advanceChord } from './hexImprovState';
import audioEngine from './audioEngine';
import { progressions } from './musicData';

const Controls: Component = () => {
  let playbackInterval: number | undefined;

  // Play/stop progression handler
  const handlePlayClick = () => {
    const state = hexImprovState();

    if (state.isPlaying) {
      stopProgression();
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = undefined;
      }
    } else {
      // Initialize audio context - use a direct oscillator to ensure iOS allows audio
      try {
        const ctx = audioEngine.initAudio();
        console.log('Play button pressed, audio context state:', ctx.state);

        // Force a sound to play first to unlock audio on iOS
        const unlockOsc = ctx.createOscillator();
        const unlockGain = ctx.createGain();
        unlockGain.gain.value = 0.1;
        unlockOsc.connect(unlockGain);
        unlockGain.connect(ctx.destination);
        unlockOsc.start(ctx.currentTime);
        unlockOsc.stop(ctx.currentTime + 0.1);

        // Wait a moment for the test sound to complete before starting progression
        setTimeout(() => {
          startProgression();

          // Start playing chord progression
          playNextChord();

          // Set up interval for chord progression
          playbackInterval = window.setInterval(playNextChord, 2000);
        }, 200);
      } catch (err) {
        console.error('Error initializing audio from play button:', err);
      }
    }
  };

  // Clean up interval when component unmounts
  onCleanup(() => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }
  });

  // Play the next chord in the progression
  const playNextChord = () => {
    const state = hexImprovState();
    if (!state.isPlaying) return;

    const chordIndices = progressions[state.progression as keyof typeof progressions];
    const chordRoot = chordIndices[state.currentChordIndex];

    // Get chord notes based on current scale and chord index
    const chordNotes = audioEngine.getChordNotes(state.scale, chordRoot, 4);

    // Play the chord
    audioEngine.playChord(chordNotes);

    // Advance to next chord
    setTimeout(() => {
      if (hexImprovState().isPlaying) {
        advanceChord();
      }
    }, 1900); // Slightly before the next interval to ensure smooth transition
  };

  // Handle scale change
  const handleScaleChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    setScale(select.value);
  };

  // Handle progression change
  const handleProgressionChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    setProgression(select.value);

    // Stop playing if currently playing
    if (hexImprovState().isPlaying) {
      stopProgression();
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = undefined;
      }
    }
  };

  // Listen for stopPlayback event
  const handleStopPlayback = () => {
    stopProgression();
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = undefined;
    }
  };

  // Set up event listener for stop playback
  onCleanup(() => {
    window.addEventListener('stopPlayback', handleStopPlayback);
    return () => {
      window.removeEventListener('stopPlayback', handleStopPlayback);
    };
  });

  // Set up an effect to clean up the interval when playing stops
  createEffect(() => {
    const state = hexImprovState();
    if (!state.isPlaying && playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = undefined;
    }
  });

  return (
    <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-5 border border-white/20">
      <div class="mb-4">
        <label for="scaleSelect" class="block mb-1 font-semibold text-sm">
          Scale:
        </label>
        <select
          id="scaleSelect"
          class="w-full py-3 px-3 border-none rounded-lg text-base bg-white/90 text-gray-800"
          onChange={handleScaleChange}
        >
          <option value="major">C Major</option>
          <option value="minor">C Minor</option>
          <option value="dorian">C Dorian</option>
          <option value="mixolydian">C Mixolydian</option>
          <option value="pentatonic">C Pentatonic</option>
        </select>
      </div>

      <div class="mb-4">
        <label for="progressionSelect" class="block mb-1 font-semibold text-sm">
          Chord Progression:
        </label>
        <select
          id="progressionSelect"
          class="w-full py-3 px-3 border-none rounded-lg text-base bg-white/90 text-gray-800"
          onChange={handleProgressionChange}
        >
          <option value="I-V-vi-IV">I-V-vi-IV (Pop)</option>
          <option value="vi-IV-I-V">vi-IV-I-V (Classic)</option>
          <option value="I-vi-ii-V">I-vi-ii-V (Jazz)</option>
          <option value="I-bVII-IV-I">I-bVII-IV-I (Rock)</option>
          <option value="i-bVI-bVII-i">i-bVI-bVII-i (Minor)</option>
        </select>
      </div>

      <div>
        <button
          class="w-full py-3 px-3 border-none rounded-lg text-base bg-gradient-to-r from-red-400 to-orange-500 text-white font-semibold cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-[1px]"
          onClick={handlePlayClick}
        >
          ▶️ Play Progression
        </button>
      </div>
    </div>
  );
};

export default Controls;
