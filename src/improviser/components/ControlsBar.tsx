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
      // Pause everything
      playbackState.pause();
      chordCompingState.pause();
    } else {
      // Check if we're resuming from pause or starting fresh
      const wasPaused = playbackState.isPaused;

      // Start or resume playback
      playbackState.play();

      if (wasPaused) {
        // Resume from paused state
        chordCompingState.resume();
      } else {
        // Start fresh
        chordCompingState.enable();
      }
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
    <div class="controls-bar rounded-lg">
      {chordProgressionState.getCurrentChord() && (
        <div class="flex items-stretch justify-between">
          <div class="flex items-stretch gap-3">
            {props.showExitButton && (
              <button
                onClick={props.onExit}
                class="px-4 py-2 bg-gray-900 border border-gray-800 text-white rounded font-medium"
                aria-label="Exit fullscreen"
              >
                Back
              </button>
            )}
            {/* Play Progression Button */}
            <button
              onClick={handlePlayProgression}
              class={`hflex items-center gap-1 px-4 py-2 rounded font-medium bg-yellow-600 text-yellow-50 border border-yellow-500`}
              aria-label={getPlayButtonText()}
            >
              {playbackState.isPlaying ? <PauseIcon /> : <PlayIcon />}
              <span>{playbackState.isPlaying ? "Pause" : "Start"}</span>
            </button>
          </div>
          <div class="flex items-stretch gap-3">
            {/* Octaves Control */}
            <div class="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded px-3 py-1">
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
          </div>
        </div>
      )}
    </div>
  );
};
