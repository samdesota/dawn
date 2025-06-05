import { Component } from 'solid-js';
import { playbackState } from '../state/PlaybackState';
import { chordProgressionState } from '../state/ChordProgressionState';
import { chordCompingState } from '../state/ChordCompingState';
import { ChordCompingControls } from './ChordCompingControls';

export const TransportControls: Component = () => {
  const handlePlayPause = () => {
    playbackState.togglePlayPause();

    // Sync chord comping with playback
    if (playbackState.isPlaying && chordCompingState.isEnabledValue) {
      // Comping will automatically sync with the tempo
    } else if (!playbackState.isPlaying) {
      // Optionally stop comping when playback stops
      // chordCompingState.disable();
    }
  };

  const handleStop = () => {
    playbackState.stop();
    // Stop comping when transport stops
    chordCompingState.disable();
  };

  const handlePreviousChord = () => {
    playbackState.skipToPreviousChord();
  };

  const handleNextChord = () => {
    playbackState.skipToNextChord();
  };

  const handleTempoChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newTempo = parseInt(target.value);
    playbackState.setTempo(newTempo);

    // Sync comping with new tempo
    chordCompingState.syncWithTempo();
  };

  const handleBeatsPerChordChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const newBeats = parseInt(target.value);
    playbackState.setBeatsPerChord(newBeats);
  };

  const toggleMetronome = () => {
    playbackState.toggleMetronome();
  };

  const toggleAutoAdvance = () => {
    playbackState.toggleAutoAdvance();
  };

  const getPlayPauseIcon = () => {
    return playbackState.isPlaying ? '⏸️' : '▶️';
  };

  const getPlayPauseLabel = () => {
    if (playbackState.isStopped) return 'Play';
    return playbackState.isPlaying ? 'Pause' : 'Resume';
  };

  return (
    <div class="transport-controls-container space-y-4">
      {/* Main Transport Controls */}
      <div class="transport-controls bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Transport</h3>

          <div class="transport-buttons flex items-center space-x-2">
            <button
              onClick={handlePreviousChord}
              class="btn-transport px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              aria-label="Previous chord"
            >
              ⏮️
            </button>

            <button
              onClick={handlePlayPause}
              class="btn-play-pause px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-medium transition-colors"
              aria-label={getPlayPauseLabel()}
            >
              <span class="mr-2">{getPlayPauseIcon()}</span>
              {getPlayPauseLabel()}
            </button>

            <button
              onClick={handleStop}
              class="btn-stop px-3 py-2 bg-red-600 hover:bg-red-500 rounded transition-colors"
              aria-label="Stop"
            >
              ⏹️
            </button>

            <button
              onClick={handleNextChord}
              class="btn-transport px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              aria-label="Next chord"
            >
              ⏭️
            </button>
          </div>
        </div>

        <div class="controls-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tempo Control */}
          <div class="tempo-control">
            <label class="block text-sm font-medium mb-2">
              Tempo: {chordProgressionState.tempoValue} BPM
            </label>
            <input
              type="range"
              min="60"
              max="180"
              value={chordProgressionState.tempoValue}
              onInput={handleTempoChange}
              class="tempo-slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>60</span>
              <span>120</span>
              <span>180</span>
            </div>
          </div>

          {/* Beats per Chord */}
          <div class="beats-control">
            <label class="block text-sm font-medium mb-2">
              Beats per Chord: {playbackState.beatsPerChordValue}
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={playbackState.beatsPerChordValue}
              onInput={handleBeatsPerChordChange}
              class="beats-slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>4</span>
              <span>8</span>
            </div>
          </div>
        </div>

        {/* Transport Options */}
        <div class="transport-options flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={playbackState.isAutoAdvanceValue}
                onChange={toggleAutoAdvance}
                class="form-checkbox h-4 w-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
              />
              <span class="text-sm">Auto-advance chords</span>
            </label>

            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={playbackState.isMetronomeEnabledValue}
                onChange={toggleMetronome}
                class="form-checkbox h-4 w-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
              />
              <span class="text-sm">Metronome</span>
            </label>
          </div>

          {/* Current Status */}
          <div class="status-info text-sm text-gray-400">
            {playbackState.isPlaying && (
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Playing</span>
              </div>
            )}
            {playbackState.isPaused && (
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Paused</span>
              </div>
            )}
            {playbackState.isStopped && (
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Stopped</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chord Comping Controls */}
      <ChordCompingControls />
    </div>
  );
};
