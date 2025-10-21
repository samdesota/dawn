import { Component, createEffect, onMount } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { playbackState } from '../state/PlaybackState';
import { keyboardState } from '../state/KeyboardState';
import { Key } from '@solid-primitives/keyed';
import { ControlsBar } from './ControlsBar';

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

  console.log('rendering chord display');

  return (
    <div class="chord-progression-display">
      {/* Chord Progression */}
      <div class="chord-progression-container overflow-x-hidden relative" ref={scrollContainerRef}>
        <div class="flex items-stretch py-4 h-40">
          {/* Left spacing */}
          <div class="flex-shrink-0" style={{ width: '50vw' }}></div>
          
          <Key each={getChordProgressionData()} by={(chord) => chord.index}>
            {(chord) => (
              <div
                ref={(el) => chordRefs.set(chord().index, el)}
                class={`chord-item relative cursor-pointer transition-all duration-300 flex-shrink-0 ${
                  chord().isCurrent ? 'mx-4.5' : chord().isPrevious || chord().isNext ? 'mx-3' : 'mx-1.5'
                }`}
                onClick={() => handleChordClick(chord().index)}
              >
                {/* Chord Card */}
                <div
                  class={`chord-card shadow-sm h-full p-4 rounded-4px min-w-[120px] transition-all duration-300 ${
                    chord().isCurrent ? 'scale-120' : ''
                  }`} 
                  style={
                    {
                      "background-color": '#1c1c1c',
                      'border': '1px solid rgba(255, 255, 255, 0.1)',
                      'border-bottom': chord().isCurrent ?  `4px solid oklch(0.852 0.199 91.936)` : "4px solid rgba(255, 255, 255, 0.1)",
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
          
          {/* Right spacing */}
          <div class="flex-shrink-0" style={{ width: '50vw' }}></div>
        </div>
      </div> 
    </div>
  );
};
