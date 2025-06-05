import { Component, For } from 'solid-js';
import { chordCompingState } from '../state/ChordCompingState';

export const ChordCompingControls: Component = () => {
  const handleToggleComping = () => {
    chordCompingState.toggle();
  };

  const handleRhythmChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    chordCompingState.setRhythm(target.value);
  };

  const handleVolumeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const volume = parseFloat(target.value);
    chordCompingState.setVolume(volume);
  };

  const handleVoicingChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    chordCompingState.setVoicing(target.value as 'close' | 'open' | 'rootless');
  };

  const getCompingButtonText = () => {
    return chordCompingState.isEnabledValue ? 'Stop Comping' : 'Start Comping';
  };

  const getCompingButtonIcon = () => {
    return chordCompingState.isEnabledValue ? '⏹️' : '🎹';
  };

  const getCurrentPattern = () => {
    return chordCompingState.getAvailableRhythms().find(
      p => p.name === chordCompingState.selectedRhythmValue
    ) || null;
  };

  return (
    <div class="chord-comping-controls bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Chord Comping</h3>

        <button
          onClick={handleToggleComping}
          class="comping-toggle px-4 py-2 rounded font-medium transition-colors"
          classList={{
            'bg-green-600 hover:bg-green-500': chordCompingState.isEnabledValue,
            'bg-blue-600 hover:bg-blue-500': !chordCompingState.isEnabledValue
          }}
          aria-label={getCompingButtonText()}
        >
          <span class="mr-2">{getCompingButtonIcon()}</span>
          {getCompingButtonText()}
        </button>
      </div>

      <div class="comping-settings grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rhythm Pattern Selection */}
        <div class="rhythm-selection">
          <label class="block text-sm font-medium mb-2">
            Rhythm Pattern
          </label>
          <select
            value={chordCompingState.selectedRhythmValue}
            onChange={handleRhythmChange}
            class="rhythm-select w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <For each={chordCompingState.getAvailableRhythms()}>
              {(rhythm) => (
                <option value={rhythm.name}>
                  {rhythm.description}
                </option>
              )}
            </For>
          </select>
          <div class="text-xs text-gray-400 mt-1">
            Current: {chordCompingState.getCurrentRhythmDescription()}
          </div>
        </div>

        {/* Volume Control */}
        <div class="volume-control">
          <label class="block text-sm font-medium mb-2">
            Comping Volume: {Math.round(chordCompingState.volumeValue * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={chordCompingState.volumeValue}
            onInput={handleVolumeChange}
            class="volume-slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Voicing Selection */}
        <div class="voicing-selection">
          <label class="block text-sm font-medium mb-2">
            Chord Voicing
          </label>
          <select
            value={chordCompingState.voicingValue}
            onChange={handleVoicingChange}
            class="voicing-select w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="close">Close (Same Octave)</option>
            <option value="open">Open (Spread Octaves)</option>
            <option value="rootless">Rootless (No Root)</option>
          </select>
          <div class="text-xs text-gray-400 mt-1">
            Changes chord note arrangement
          </div>
        </div>
      </div>

      {/* Rhythm Pattern Visualization */}
      <div class="rhythm-visualization mt-4 pt-4 border-t border-gray-700">
        <div class="text-sm font-medium mb-2">Pattern Preview</div>
        <div class="pattern-display flex space-x-1">
          <For each={getCurrentPattern()?.pattern || []}>
            {(hit, index) => (
              <div
                class="pattern-step w-3 h-6 rounded-sm"
                classList={{
                  'bg-yellow-500': hit,
                  'bg-gray-600': !hit,
                  'border-2 border-white': index() % 4 === 0 // Beat markers
                }}
                title={`Step ${index() + 1}: ${hit ? 'Hit' : 'Rest'}`}
              />
            )}
          </For>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Yellow = chord hit, Gray = rest, White border = beat
        </div>
      </div>

      {/* Status Indicator */}
      {chordCompingState.isEnabledValue && (
        <div class="status-indicator mt-4 pt-4 border-t border-gray-700">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-green-400">
              Comping active with {chordCompingState.getCurrentRhythmDescription()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
