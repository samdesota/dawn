import { Component } from "solid-js";
import { Rerun } from "@solid-primitives/keyed";
import { SongSelector } from "./SongSelector";
import { ChordDisplay } from "./ChordDisplay";
import { uiState } from "../state/UIState";
import { chordProgressionState } from "../state/ChordProgressionState";
import { playbackState } from "../state/PlaybackState";
import { chordCompingState } from "../state/ChordCompingState";

export const MobileAppLayout: Component = () => {
  const handleStartPlaying = () => {
    // Auto-play the progression when opening fullscreen keyboard
    if (!playbackState.isPlaying) {
      playbackState.play();
      chordCompingState.enable();
    }
    uiState.openFullscreenKeyboard();
  };

  return (
    <main class="app-main flex flex-col flex-1 min-h-100dvh">
      {/* Portrait Orientation Warning - Only shows on mobile in landscape */}
      <div class="landscape-warning-mobile">
        <div class="text-6xl mb-6">📱</div>
        <h2 class="text-2xl font-bold text-white mb-4">
          Please Rotate Your Device
        </h2>
        <p class="text-gray-300 text-lg">
          Song selection works best in portrait orientation
        </p>
      </div>

      {/* Song Selector with Chord Progression - Takes flex space */}
      <div class="flex-1 flex flex-col bg-black">
        <SongSelector />
      </div>

      {/* Start Playing Button - Fixed at Bottom */}
      <div class="p-4 bg-gray-950 border-t border-gray-800">
        <button
          onClick={handleStartPlaying}
          class="w-full px-8 py-4 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white rounded-xl text-xl font-bold transition-colors shadow-xl"
        >
          🎹 Start Playing
        </button>
        <p class="text-gray-400 mt-3 text-center text-sm">
          Opens keyboard in fullscreen mode
        </p>
      </div>
    </main>
  );
};
