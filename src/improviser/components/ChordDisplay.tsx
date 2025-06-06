import { Component, For } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { playbackState } from '../state/PlaybackState';
import { keyboardState } from '../state/KeyboardState';

export const ChordDisplay: Component = () => {
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

  return (
    <div class="chord-progression-display">
      {/* Header with Song Info */}
      <div class="flex items-center justify-between mb-4">
        <div class="song-info">
          <h3 class="text-xl font-semibold text-white">{getCurrentSong()?.name}</h3>
          <div class="text-sm text-gray-400">
            Key of {chordProgressionState.currentKeyValue} • {chordProgressionState.tempoValue} BPM
          </div>
        </div>

        {playbackState.isPlaying && (
          <div class="playback-info text-right">
            <div class="text-sm text-yellow-400">
              Beat {getCurrentBeatInfo().beat} / {getCurrentBeatInfo().totalBeats}
            </div>
            <div class="text-xs text-gray-400">
              {getProgressPercentage()}% Complete
            </div>
          </div>
        )}
      </div>

      {/* Chord Progression */}
      <div class="chord-progression-container">
        <div class="flex items-center justify-center space-x-3 overflow-x-auto pb-4">
          <For each={getChordProgressionData()}>
            {(chord) => (
              <div
                class="chord-item relative transition-all duration-300 cursor-pointer"
                onClick={() => handleChordClick(chord.index)}
              >
                {/* Chord Card */}
                <div
                  class="chord-card p-4 rounded-lg transition-all duration-300 min-w-[120px]"
                  style="background-color: #1c1c1c;"
                  classList={{
                    'ring-2 ring-yellow-500 scale-110': chord.isCurrent,
                    'ring-1 ring-gray-500 scale-105': chord.isPrevious || chord.isNext,
                    'opacity-60': !chord.isCurrent && !chord.isPrevious && !chord.isNext,
                    'hover:ring-2 hover:ring-blue-400': !chord.isCurrent
                  }}
                >
                  {/* Chord Symbol */}
                  <div class="text-center">
                    <div
                      class="chord-symbol font-bold text-2xl mb-1"
                      classList={{
                        'text-yellow-400': chord.isCurrent,
                        'text-white': !chord.isCurrent
                      }}
                    >
                      {chord.symbol}
                    </div>

                    {/* Roman Numeral */}
                    <div class="roman-numeral text-sm text-gray-400 mb-2">
                      {chord.romanNumeral}
                    </div>

                    {/* Chord Index */}
                    <div class="chord-index text-xs text-gray-500">
                      {chord.index + 1}
                    </div>
                  </div>

                  {/* Current Chord Indicator */}
                  {chord.isCurrent && (
                    <div class="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div class="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        NOW
                      </div>
                    </div>
                  )}

                  {/* Beat Progress for Current Chord */}
                  {chord.isCurrent && playbackState.isPlaying && (
                    <div class="absolute -bottom-1 left-0 right-0">
                      <div class="bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div
                          class="bg-yellow-400 h-full transition-all duration-100"
                          style={{
                            width: `${getCurrentBeatInfo().progress}%`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Played Indicator */}
                  {chord.isPlayed && (
                    <div class="absolute top-1 right-1">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </For>
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
                      class="note-pill px-2 py-1 rounded text-xs font-medium"
                      classList={{
                        'bg-yellow-500 text-black': index() === 0, // Root
                        'bg-yellow-600 text-white': index() === 1, // Third
                        'bg-yellow-700 text-white': index() === 2, // Fifth
                        'bg-yellow-800 text-white': index() >= 3   // Seventh/Extensions
                      }}
                    >
                      {note}
                    </span>
                  )}
                </For>
              </div>
            </div>

            {/* Quick Navigation */}
            <div class="chord-navigation flex space-x-2">
              <button
                onClick={() => chordProgressionState.previousChord()}
                class="px-3 py-1 rounded text-sm transition-colors text-white hover:bg-gray-600"
                disabled={chordProgressionState.currentChordIndexValue === 0}
              >
                ← Prev
              </button>
              <button
                onClick={() => chordProgressionState.nextChord()}
                class="px-3 py-1 rounded text-sm transition-colors text-white hover:bg-gray-600"
                disabled={chordProgressionState.currentChordIndexValue >= (getCurrentSong()?.chords.length || 1) - 1}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
