import { Component, For, createEffect, onMount } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { playbackState } from '../state/PlaybackState';
import { keyboardState } from '../state/KeyboardState';
import { chordCompingState } from '../state/ChordCompingState';
import { Key } from '@solid-primitives/keyed';

export const ChordDisplay: Component = () => {
  let scrollContainerRef: HTMLDivElement | undefined;
  let chordRefs: Map<number, HTMLDivElement> = new Map();

  // Scroll to center the current chord
  const scrollToCurrentChord = () => {
    if (!scrollContainerRef) return;
    
    const currentIndex = chordProgressionState.currentChordIndexValue;
    const currentChordElement = chordRefs.get(currentIndex);
    
    if (currentChordElement) {
      const container = scrollContainerRef;
      const chordLeft = currentChordElement.offsetLeft;
      const chordWidth = currentChordElement.offsetWidth;
      const containerWidth = container.offsetWidth;
      
      // Calculate the scroll position to center the chord
      const scrollTo = chordLeft - (containerWidth / 2) + (chordWidth / 2);
      
      container.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  // Watch for chord changes and scroll to center
  createEffect(() => {
    // Access the reactive value to track changes
    chordProgressionState.currentChordIndexValue;
    // Scroll after a small delay to ensure DOM is updated
    setTimeout(scrollToCurrentChord, 50);
  });

  onMount(() => {
    // Initial scroll to current chord
    setTimeout(scrollToCurrentChord, 100);
  });
  const getCurrentSong = () => {
    return chordProgressionState.currentSongValue;
  };

  const getChordProgressionData = () => {
    const song = getCurrentSong();
    if (!song) return [];

    return song.chords.map((chord, index) => ({
      ...chord,
      index,
      isCurrent: index === chordProgressionState.currentChordIndexValue,
      isPrevious: index === chordProgressionState.currentChordIndexValue - 1,
      isNext: index === chordProgressionState.currentChordIndexValue + 1,
      isPlayed: index < chordProgressionState.currentChordIndexValue
    }));
  };

  const handleChordClick = (chordIndex: number) => {
    chordProgressionState.currentChordIndex.set(chordIndex);
    keyboardState.updateHighlighting();
  };

  const getCurrentBeatInfo = () => {
    return {
      beat: Math.floor(playbackState.currentBeatValue) + 1,
      totalBeats: playbackState.beatsPerChordValue,
      progress: (playbackState.currentBeatValue % 1) * 100
    };
  };

  const getProgressPercentage = () => {
    const currentChord = chordProgressionState.currentChordIndexValue;
    const totalChords = getCurrentSong()?.chords.length || 1;
    const chordProgress = currentChord / totalChords;
    const beatProgress = (playbackState.currentBeatValue % playbackState.beatsPerChordValue) / playbackState.beatsPerChordValue;
    return Math.round((chordProgress + beatProgress / totalChords) * 100);
  };

  const handlePlayProgression = () => {
    // Start both playback and comping together
    if (playbackState.isPlaying) {
      // Stop everything
      playbackState.stop();
      chordCompingState.disable();
    } else {
      // Start everything
      playbackState.play();
      chordCompingState.enable();
    }
  };

  const getPlayButtonText = () => {
    return playbackState.isPlaying ? 'Stop Progression' : 'Play Progression';
  };

  const getPlayButtonIcon = () => {
    return playbackState.isPlaying ? '⏹️' : '▶️';
  };

  console.log('rendering chord display');

  return (
    <div class="chord-progression-display">
      {/* Chord Progression */}
      <div class="chord-progression-container overflow-x-hidden relative" ref={scrollContainerRef}>
        <div class="flex items-stretch py-4 px-[50vw] h-40">
          <Key each={getChordProgressionData()} by={(chord) => chord.index}>
            {(chord) => (
              <div
                ref={(el) => chordRefs.set(chord().index, el)}
                class={`chord-item relative cursor-pointer transition-all duration-300 ${
                  chord().isCurrent ? 'mx-4.5' : chord().isPrevious || chord().isNext ? 'mx-3' : 'mx-1.5'
                }`}
                onClick={() => handleChordClick(chord().index)}
              >
                {/* Chord Card */}
                <div
                  class={`chord-card bg-gray-900 shadow-sm p-4 rounded-4px min-w-[120px] transition-all duration-300 ${
                    chord().isCurrent ? 'scale-120' :
                    chord().isPrevious || chord().isNext ? 'scale-110' :
                    'opacity-60'
                  }`} 
                  style={
                    {
                      'border-bottom': chord().isCurrent ?  `4px solid oklch(0.852 0.199 91.936)` : undefined,
                    }
                  }
                >
                  {/* Chord Symbol */}
                  <div class="text-center">
                    <div
                      class={`chord-symbol font-bold text-2xl mb-1 ${
                        chord().isCurrent ? 'text-yellow-400' : 'text-white'
                      }`}
                    >
                      {chord().symbol}
                    </div>

                    {/* Roman Numeral */}
                    <div class="roman-numeral text-sm text-gray-400 mb-2">
                      {chord().romanNumeral}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Key>
        </div>
      </div>

      {/* Current Chord Details */}
      {chordProgressionState.getCurrentChord() && (
        <div class="current-chord-details mt-4 p-4 rounded-lg" style="background-color: #1c1c1c;">
          <div class="flex items-center justify-between">
            <div class="chord-info">
              <div class="text-lg font-semibold text-yellow-400 mb-1">
                Current: {chordProgressionState.getCurrentChord()!.symbol}
              </div>
              <div class="chord-notes flex space-x-2">
                <For each={chordProgressionState.getCurrentChord()!.notes}>
                  {(note, index) => (
                    <span
                      class={`note-pill px-2 py-1 rounded text-xs font-medium ${
                        index() === 0 ? 'bg-yellow-500 text-black' :
                        index() === 1 ? 'bg-yellow-600 text-white' :
                        index() === 2 ? 'bg-yellow-700 text-white' :
                        'bg-yellow-800 text-white'
                      }`}
                    >
                      {note}
                    </span>
                  )}
                </For>
              </div>
            </div>
            
            {/* Play Progression Button */}
            <button
              onClick={handlePlayProgression}
              class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                playbackState.isPlaying 
                  ? 'bg-red-600 hover:bg-red-500 text-white' 
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
              aria-label={getPlayButtonText()}
            >
              {getPlayButtonText()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
