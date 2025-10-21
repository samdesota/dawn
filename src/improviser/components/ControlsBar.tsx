import { Component, For } from 'solid-js';
import { chordProgressionState } from '../state/ChordProgressionState';
import { playbackState } from '../state/PlaybackState';
import { chordCompingState } from '../state/ChordCompingState';
import { uiState } from '../state/UIState';

type ControlsBarProps = {
  showExitButton?: boolean;
  onExit?: () => void;
};

export const ControlsBar: Component<ControlsBarProps> = (props) => {
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

  return (
    <div class="controls-bar p-4 rounded-lg">
      {chordProgressionState.getCurrentChord() && (
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
          
          <div class="flex items-center gap-3">
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

            {/* Exit Button (conditionally rendered) */}
            {props.showExitButton && (
              <button
                onClick={props.onExit}
                class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-lg"
                aria-label="Exit fullscreen"
              >
                ✕ Exit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

