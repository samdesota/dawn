import { Component } from "solid-js";
import { Rerun } from "@solid-primitives/keyed";
import { SongSelector } from "./SongSelector";
import { ChordDisplay } from "./ChordDisplay";
import { KeyboardLayout } from "./KeyboardLayout";
import { chordProgressionState } from "../state/ChordProgressionState";
import { ControlsBar } from "./ControlsBar";

export const DesktopAppLayout: Component = () => {
  return (
    <main class="app-main flex flex-col flex-1 min-h-100dvh">
      {/* Cover Flow Song Selector - Top */}
      <div class="vflex w-full pt-4 bg-black flex-basis-350px">
        <SongSelector />
      </div>

      <Rerun on={() => chordProgressionState.currentSong().name}>
        <div class="chord-display-area pb-8 relative">
          {/* Centered arrow pointing down */}
          <svg 
            class="absolute left-1/2 top-[-20px] -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-yellow-400"
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
          <ChordDisplay />
        </div>
      </Rerun>

      {/* Main Content Area - Vertical Layout */}
      <div class="content-area flex-1 flex flex-col bg-gray-950 border-t border-gray-800 pt-4">
        {/* Chord Progression Display */}
        <Rerun on={() => chordProgressionState.currentSong().name}>
          <div class="px-4">
            <ControlsBar />
          </div>
        </Rerun>

        {/* Keyboard Area */}
        <div class="keyboard-area flex-1 p-4 overflow-hidden flex flex-col">
          <div class="keyboard-container flex flex-col flex-1 w-full">
            <KeyboardLayout />
          </div>
        </div>
      </div>
    </main>
  );
};
