import { Component, onMount, onCleanup, Show } from 'solid-js';
import { KeyboardLayout } from './KeyboardLayout';
import { ControlsBar } from './ControlsBar';
import { uiState } from '../state/UIState';
import { playbackState } from '../state/PlaybackState';
import { chordCompingState } from '../state/ChordCompingState';
import { enterFullscreen, exitFullscreen, lockToLandscape, unlockOrientation } from '../../utils/deviceUtils';

export const FullscreenKeyboard: Component = () => {
  let containerRef: HTMLDivElement | undefined;

  onMount(async () => {
    // Enter fullscreen and lock to landscape
    try {
      if (containerRef) {
        await enterFullscreen(containerRef);
      }
      await lockToLandscape();
    } catch (error) {
      console.warn('Failed to enter fullscreen or lock orientation:', error);
    }

    // Listen for fullscreen changes to close the component if user exits manually
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    onCleanup(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    });
  });

  const handleClose = async () => {
    // Stop the progression when exiting
    if (playbackState.isPlaying) {
      playbackState.stop();
      chordCompingState.disable();
    }

    try {
      await exitFullscreen();
      unlockOrientation();
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
    }
    uiState.closeFullscreenKeyboard();
  };

  return (
    <div
      ref={containerRef}
      class="fullscreen-keyboard fixed inset-0 z-50 bg-gray-950 flex flex-col"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Controls Bar at Top with Exit Button */}
      <div class="controls-area pt-4 px-4">
        <ControlsBar showExitButton={true} onExit={handleClose} />
      </div>

      {/* Keyboard Area - Takes remaining space */}
      <div class="keyboard-area flex-1 p-4 overflow-hidden">
        <KeyboardLayout />
      </div>
    </div>
  );
};

