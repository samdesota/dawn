import { Component, For } from "solid-js";
import { chordProgressionState } from "../state/ChordProgressionState";
import { playbackState } from "../state/PlaybackState";
import { chordCompingState } from "../state/ChordCompingState";
import { uiState } from "../state/UIState";
import { keyboardState } from "../state/KeyboardState";
import {
  PlayIcon,
  PauseIcon,
  MinusIcon,
  PlusIcon,
} from "../../components/Icons";

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
    return playbackState.isPlaying ? "Stop Progression" : "Play Progression";
  };

  const handleDecreaseOctaves = () => {
    const current = keyboardState.getNumberOfOctaves();
    if (current > 1) {
      keyboardState.setNumberOfOctaves(current - 1);
    }
  };

  const handleIncreaseOctaves = () => {
    const current = keyboardState.getNumberOfOctaves();
    if (current < 3) {
      keyboardState.setNumberOfOctaves(current + 1);
    }
  };

  return (
    <div class="controls-bar py-2 rounded-lg">
      {chordProgressionState.getCurrentChord() && (
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="chord-notes flex space-x-2">
              <For each={chordProgressionState.getCurrentChord()!.notes}>
                {(note, index) => (
                  <span
                    class={`note-pill px-2 py-1 rounded text-base font-medium ${
                      index() === 0
                        ? "bg-yellow-500 text-black"
                        : index() === 1
                        ? "bg-yellow-600 text-white"
                        : index() === 2
                        ? "bg-yellow-700 text-white"
                        : "bg-yellow-800 text-white"
                    }`}
                  >
                    {note}
                  </span>
                )}
              </For>
            </div>
          </div>

          <div class="flex items-stretch gap-3">
            {/* Octaves Control */}
            <div class="flex items-center gap-2 bg-gray-800 rounded px-3 py-1">
              <span class="text-gray-400 text-xs uppercase font-semibold mr-2">
                Octaves
              </span>
              <button
                onClick={handleDecreaseOctaves}
                disabled={keyboardState.getNumberOfOctaves() <= 1}
                class="w-6 h-6 flex items-center justify-center rounded disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
                aria-label="Decrease octaves"
              >
                <MinusIcon class="w-12px h-12px" />
              </button>
              <div class="flex items-center text-sm">
                <span class="text-white font-semibold">
                  {keyboardState.getNumberOfOctaves()}
                </span>
              </div>
              <button
                onClick={handleIncreaseOctaves}
                disabled={keyboardState.getNumberOfOctaves() >= 3}
                class="w-6 h-6 flex items-center justify-center rounded disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
                aria-label="Increase octaves"
              >
                <PlusIcon class="w-12px h-12px" />
              </button>
            </div>

            {/* Play Progression Button */}
            <button
              onClick={handlePlayProgression}
              class={`px-4 py-2 rounded font-medium bg-yellow-600 text-white`}
              aria-label={getPlayButtonText()}
            >
              {playbackState.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Exit Button (conditionally rendered) */}
            {props.showExitButton && (
              <button
                onClick={props.onExit}
                class="px-4 py-2 bg-red-600 text-white rounded font-medium"
                aria-label="Exit fullscreen"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
