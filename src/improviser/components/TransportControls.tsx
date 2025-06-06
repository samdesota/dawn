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
    <div class="transport-sidebar flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">

      {/* Transport Controls */}
      <div class="transport-section flex-1 p-4 rounded-lg" style="background-color: #1c1c1c;">
        <h3 class="text-lg font-semibold text-white mb-4">Transport</h3>

        {/* Main Transport Buttons */}
        <div class="transport-buttons space-y-3 mb-4">
          <button
            onClick={handlePlayPause}
            class="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium transition-colors text-black"
            aria-label={getPlayPauseLabel()}
          >
            <span class="mr-2">{getPlayPauseIcon()}</span>
            {getPlayPauseLabel()}
          </button>

          <div class="flex space-x-2">
            <button
              onClick={handlePreviousChord}
              class="flex-1 px-3 py-2 rounded transition-colors text-white hover:bg-gray-600"
              aria-label="Previous chord"
            >
              ⏮️ Prev
            </button>

            <button
              onClick={handleStop}
              class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded transition-colors text-white"
              aria-label="Stop"
            >
              ⏹️
            </button>

            <button
              onClick={handleNextChord}
              class="flex-1 px-3 py-2 rounded transition-colors text-white hover:bg-gray-600"
              aria-label="Next chord"
            >
              Next ⏭️
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div class="status-info text-center text-sm">
          {playbackState.isPlaying && (
            <div class="flex items-center justify-center space-x-2 text-green-400">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Playing</span>
            </div>
          )}
          {playbackState.isPaused && (
            <div class="flex items-center justify-center space-x-2 text-yellow-400">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Paused</span>
            </div>
          )}
          {playbackState.isStopped && (
            <div class="flex items-center justify-center space-x-2 text-gray-400">
              <div class="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>Stopped</span>
            </div>
          )}
        </div>
      </div>

      {/* Tempo & Settings */}
      <div class="settings-section flex-1 p-4 rounded-lg" style="background-color: #1c1c1c;">
        <h3 class="text-lg font-semibold text-white mb-4">Settings</h3>

        {/* Tempo Control */}
        <div class="tempo-control mb-4">
          <label class="block text-sm font-medium mb-2 text-white">
            Tempo: {chordProgressionState.tempoValue} BPM
          </label>
          <input
            type="range"
            min="60"
            max="200"
            step="5"
            value={chordProgressionState.tempoValue}
            onInput={handleTempoChange}
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>60</span>
            <span>130</span>
            <span>200</span>
          </div>
        </div>

        {/* Beats per Chord */}
        <div class="beats-control mb-4">
          <label class="block text-sm font-medium mb-2 text-white">
            Beats per Chord: {playbackState.beatsPerChordValue}
          </label>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={playbackState.beatsPerChordValue}
            onInput={handleBeatsPerChordChange}
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>4</span>
            <span>8</span>
          </div>
        </div>

        {/* Options */}
        <div class="options space-y-3">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={playbackState.isAutoAdvanceValue}
              onChange={toggleAutoAdvance}
              class="form-checkbox h-4 w-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
            />
            <span class="text-sm text-white">Auto-advance chords</span>
          </label>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={playbackState.isMetronomeEnabledValue}
              onChange={toggleMetronome}
              class="form-checkbox h-4 w-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
            />
            <span class="text-sm text-white">Metronome</span>
          </label>
        </div>
      </div>

      {/* Chord Comping Controls */}
      <div class="flex-1">
        <ChordCompingControls />
      </div>
    </div>
  );
};
