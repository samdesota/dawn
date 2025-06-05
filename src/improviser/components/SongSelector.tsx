import { Component, For } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { keyboardState } from '../state/KeyboardState';

export const SongSelector: Component = () => {
  const handleSongChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const songName = target.value;
    chordProgressionState.selectSong(songName);
    keyboardState.updateHighlighting();
  };

  const getSongInfo = () => {
    const song = chordProgressionState.currentSongValue;
    if (!song) return null;

    return {
      name: song.name,
      key: song.key,
      chordCount: song.chords.length,
      timeSignature: song.timeSignature,
      defaultTempo: song.defaultTempo
    };
  };

  const getChordProgressionPreview = () => {
    const song = chordProgressionState.currentSongValue;
    if (!song) return [];

    return song.chords.map((chord, index) => ({
      ...chord,
      index,
      isCurrent: index === chordProgressionState.currentChordIndexValue
    }));
  };

  const handleChordClick = (chordIndex: number) => {
    chordProgressionState.currentChordIndex.set(chordIndex);
    keyboardState.updateHighlighting();
  };

  return (
    <div class="song-selector text-white p-4 rounded-lg" style="background-color: #1c1c1c;">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Song Selection</h3>
      </div>

      {/* Song Dropdown */}
      <div class="song-dropdown mb-4">
        <label class="block text-sm font-medium mb-2">Choose a Chord Progression</label>
        <select
          onChange={handleSongChange}
          value={chordProgressionState.currentSongValue?.name || ''}
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        >
          <For each={chordProgressionState.getAvailableSongs()}>
            {(songName) => (
              <option value={songName}>
                {songName}
              </option>
            )}
          </For>
        </select>
      </div>

      {/* Song Information */}
      {getSongInfo() && (
        <div class="song-info mb-4 p-3 rounded" style="background-color: #1c1c1c;">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-400">Key:</span>
              <span class="ml-2 font-medium">{getSongInfo()!.key}</span>
            </div>
            <div>
              <span class="text-gray-400">Tempo:</span>
              <span class="ml-2 font-medium">{getSongInfo()!.defaultTempo} BPM</span>
            </div>
            <div>
              <span class="text-gray-400">Time:</span>
              <span class="ml-2 font-medium">
                {getSongInfo()!.timeSignature[0]}/{getSongInfo()!.timeSignature[1]}
              </span>
            </div>
            <div>
              <span class="text-gray-400">Chords:</span>
              <span class="ml-2 font-medium">{getSongInfo()!.chordCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chord Progression Preview */}
      <div class="chord-progression-preview">
        <div class="text-sm font-medium mb-2 text-gray-300">Chord Progression</div>
        <div class="chord-grid grid grid-cols-4 gap-2">
          <For each={getChordProgressionPreview()}>
            {(chord) => (
              <button
                onClick={() => handleChordClick(chord.index)}
                class="chord-preview p-2 rounded transition-all duration-200"
                classList={{
                  'bg-yellow-600 text-black': chord.isCurrent,
                  'text-white': !chord.isCurrent
                }}
                style={chord.isCurrent ? {} : { 'background-color': '#1c1c1c' }}
                aria-label={`Select chord ${chord.symbol}`}
              >
                <div class="chord-symbol font-bold text-sm">
                  {chord.symbol}
                </div>
                <div class="roman-numeral text-xs opacity-75">
                  {chord.romanNumeral}
                </div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Current Chord Details */}
      {chordProgressionState.getCurrentChord() && (
        <div class="current-chord-details mt-4 p-3 rounded" style="background-color: #1c1c1c;">
          <div class="text-sm font-medium mb-2 text-gray-300">Current Chord Details</div>
          <div class="chord-info">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl font-bold text-yellow-400">
                {chordProgressionState.getCurrentChord()!.symbol}
              </span>
              <span class="text-lg text-gray-300">
                {chordProgressionState.getCurrentChord()!.romanNumeral}
              </span>
            </div>

            <div class="chord-notes">
              <div class="text-xs text-gray-400 mb-1">Notes in chord:</div>
              <div class="flex space-x-2">
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
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div class="quick-actions mt-4 flex justify-center space-x-2">
        <button
          onClick={() => chordProgressionState.previousChord()}
          class="px-3 py-1 rounded text-sm transition-colors text-white"
          style="background-color: #1c1c1c;"
        >
          ← Prev
        </button>
        <button
          onClick={() => chordProgressionState.nextChord()}
          class="px-3 py-1 rounded text-sm transition-colors text-white"
          style="background-color: #1c1c1c;"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
