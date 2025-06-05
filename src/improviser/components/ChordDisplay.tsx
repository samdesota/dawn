import { Component } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { playbackState } from '../state/PlaybackState';
import { uiState } from '../state/UIState';

export const ChordDisplay: Component = () => {
  const getCurrentChordInfo = () => {
    const chord = chordProgressionState.getCurrentChord();
    const song = chordProgressionState.currentSongValue;
    const chordIndex = chordProgressionState.currentChordIndexValue;

    return {
      symbol: chord?.symbol || '',
      romanNumeral: chord?.romanNumeral || '',
      songName: song?.name || '',
      chordIndex,
      totalChords: song?.chords.length || 0,
      key: chordProgressionState.currentKeyValue
    };
  };

  const getProgressPercentage = () => {
    return Math.round(playbackState.getOverallProgress() * 100);
  };

  const getCurrentBeatInfo = () => {
    return {
      beat: playbackState.getCurrentBeatInMeasure(),
      totalBeats: playbackState.beatsPerChordValue,
      measure: playbackState.getCurrentMeasure()
    };
  };

  return (
    <div class="chord-display bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <div class="flex items-center justify-between mb-2">
        <div class="chord-info flex items-center space-x-4">
          <div class="current-chord">
            <div class="chord-symbol text-4xl font-bold text-yellow-400">
              {getCurrentChordInfo().symbol}
            </div>
            <div class="roman-numeral text-sm text-gray-300">
              {getCurrentChordInfo().romanNumeral}
            </div>
          </div>

          <div class="key-info">
            <div class="text-sm text-gray-400">Key of</div>
            <div class="text-lg font-semibold">
              {getCurrentChordInfo().key}
            </div>
          </div>
        </div>

        <div class="progression-info text-right">
          <div class="song-name text-sm text-gray-300 mb-1">
            {getCurrentChordInfo().songName}
          </div>
          <div class="chord-position text-sm text-yellow-400">
            {getCurrentChordInfo().chordIndex + 1} / {getCurrentChordInfo().totalChords}
          </div>
        </div>
      </div>

      {uiState.preferencesValue.showProgressBar && (
        <div class="progress-section mt-3">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div class="progress-bar w-full bg-gray-700 rounded-full h-2">
            <div
              class="progress-fill bg-yellow-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${getProgressPercentage()}%`
              }}
            />
          </div>
        </div>
      )}

      {playbackState.isPlaying && (
        <div class="beat-info mt-3 flex items-center justify-between text-sm">
          <div class="beat-counter text-gray-300">
            Beat {getCurrentBeatInfo().beat} / {getCurrentBeatInfo().totalBeats}
          </div>
          <div class="measure-counter text-gray-400">
            Measure {getCurrentBeatInfo().measure}
          </div>
          <div class="tempo text-gray-400">
            {chordProgressionState.tempoValue} BPM
          </div>
        </div>
      )}

      {/* Chord tone indicators */}
      <div class="chord-tones mt-3">
        <div class="text-xs text-gray-400 mb-1">Chord Tones</div>
        <div class="flex space-x-2">
          {chordProgressionState.getCurrentChord()?.notes.map((note, index) => (
            <div
              class="chord-tone px-2 py-1 rounded text-xs font-medium"
              classList={{
                'bg-yellow-500 text-black': index === 0, // Root
                'bg-yellow-600 text-white': index === 1, // Third
                'bg-yellow-700 text-white': index === 2, // Fifth
                'bg-yellow-800 text-white': index >= 3   // Seventh/Extensions
              }}
            >
              {note}
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
};
