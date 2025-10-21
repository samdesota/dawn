import { Component, For, onCleanup, onMount } from 'solid-js';
import { keyboardState } from '../state/KeyboardState';
import { audioEngineState } from '../state/AudioEngineState';
import { uiState } from '../state/UIState';
import { KeyButton } from './KeyButton';
import type { NoteInfo } from '../state/AudioEngineState';
import { Key } from '@solid-primitives/keyed';
import { debounce } from '../../utils/audioUtils/debounce';

export const KeyboardLayout: Component = () => {
  let keyboardContainer: HTMLDivElement | undefined;
  let keyboardLayoutRef: HTMLDivElement | undefined;
  let emergencyStopTimeout: number | undefined;

  onMount(() => {
    // Set up keyboard container for touch handling
    if (keyboardContainer) {
      keyboardContainer.addEventListener('touchstart', handleTouchEvent, { passive: false });
      keyboardContainer.addEventListener('touchmove', handleTouchEvent, { passive: false });
      keyboardContainer.addEventListener('touchend', handleTouchEvent, { passive: false });
      keyboardContainer.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    }


    // Set up ResizeObserver for keyboard container
    const resizeHandler = debounce(() => {
      const rect = keyboardLayoutRef?.getBoundingClientRect();
      console.log('Keyboard layout resized', rect.width, rect.height);
      keyboardState.onResize(rect?.width ?? 0, rect?.height ?? 0);
    }, 100);
    const resizeObserver = new ResizeObserver(resizeHandler);
    
    if (keyboardLayoutRef) {
       resizeObserver.observe(keyboardLayoutRef);
       const rect = keyboardLayoutRef.getBoundingClientRect();
       if (rect.width > 0 && rect.height > 0) {
         keyboardState.onResize(rect.width, rect.height);
       }
    }

    // Add emergency stop on window blur/focus loss
    const handleWindowBlur = () => {
      console.log('Window blur detected, stopping all notes');
      audioEngineState.stopAllKeyboardNotes();
      uiState.clearAllTouches();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, stopping all notes');
        audioEngineState.stopAllKeyboardNotes();
        uiState.clearAllTouches();
      }
    };

    // Add global escape key handler for emergency stop
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed, emergency stopping all notes');
        audioEngineState.emergencyStopAll();
        uiState.clearAllTouches();
        if (emergencyStopTimeout) {
          clearTimeout(emergencyStopTimeout);
          emergencyStopTimeout = undefined;
        }
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    onCleanup(() => {
      resizeObserver.disconnect();
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (emergencyStopTimeout) {
        clearTimeout(emergencyStopTimeout);
      }
    });
  });

  // Declarative function to determine which notes should be playing based on current touches
  const determineActiveNotes = (touchList: TouchList): Array<{ noteInfo: NoteInfo; velocity: number }> => {
    const activeNotes: Array<{ noteInfo: NoteInfo; velocity: number }> = [];
    const rect = keyboardContainer?.getBoundingClientRect();
    if (!rect) return activeNotes;

    for (let i = 0; i < touchList.length; i++) {
      const touch = touchList[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Find the key at this position
      const key = keyboardState.getKeyAtCoordinates(x, y);
      if (key) {
        // Calculate velocity from touch force (if available) or default
        const velocity = (touch as any).force || 1.0;
        const adjustedVelocity = velocity * uiState.touchSensitivityMultiplier;

        activeNotes.push({
          noteInfo: key,
          velocity: adjustedVelocity
        });

        // Record note if recording
        if (uiState.isRecordingValue) {
          uiState.addRecordedNote(`${key.note}${key.octave}`, adjustedVelocity);
        }
      }
    }

    return activeNotes;
  };

  // Update touch tracking in UI state
  const updateTouchTracking = (touchList: TouchList) => {
    const rect = keyboardContainer?.getBoundingClientRect();
    if (!rect) return;

    // Clear existing touches and rebuild from current touch list
    uiState.clearAllTouches();

    for (let i = 0; i < touchList.length; i++) {
      const touch = touchList[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const key = keyboardState.getKeyAtCoordinates(x, y);
      const keyId = key ? `${key.note}${key.octave}` : undefined;

      uiState.addTouch(touch.identifier, x, y, keyId);
    }

    uiState.lastTouchTime.set(Date.now());
  };

  // Single touch event handler that processes all touch events declaratively
  const handleTouchEvent = (event: TouchEvent) => {
    event.preventDefault()

    // Resume audio context on first touch (required for iOS)
    audioEngineState.resumeContext();

    // Update touch tracking
    updateTouchTracking(event.touches);

    // Determine which notes should be playing based on current touches
    const activeNotes = determineActiveNotes(event.touches);

    console.log('activeNotes', event, activeNotes);

    // Update the audio engine with the current set of notes that should be playing
    audioEngineState.setActiveKeyboardNotes(activeNotes);

    // Manage emergency stop timeout
    if (activeNotes.length > 0) {
      // Set emergency stop timeout for long holds (10 seconds)
      if (emergencyStopTimeout) {
        clearTimeout(emergencyStopTimeout);
      }
      emergencyStopTimeout = window.setTimeout(() => {
        console.warn('Emergency stop triggered after 10 seconds');
        audioEngineState.emergencyStopAll();
        uiState.clearAllTouches();
      }, 10000);
    } else {
      // Clear emergency timeout when no notes are playing
      if (emergencyStopTimeout) {
        clearTimeout(emergencyStopTimeout);
        emergencyStopTimeout = undefined;
      }
    }
  };

  const handleTouchCancel = (event: TouchEvent) => {
    event.preventDefault();

    // Clear emergency timeout
    if (emergencyStopTimeout) {
      clearTimeout(emergencyStopTimeout);
      emergencyStopTimeout = undefined;
    }

    // Stop all keyboard notes and clear touches
    audioEngineState.stopAllKeyboardNotes();
    uiState.clearAllTouches();
  };

  // Calculate total keyboard width for scrolling
  const getTotalWidth = () => {
    const keys = keyboardState.keys;
    if (keys.length === 0) return 0;

    const lastKey = keys[keys.length - 1];
    return lastKey.position + lastKey.width + 20; // Add some padding
  };

  return (
    <div ref={keyboardLayoutRef} class="keyboard-layout w-full h-full overflow-hidden flex-1 flex flex-col min-h-250px">
      <div
        ref={keyboardContainer}
        class="keyboard-container relative h-full overflow-y-hidden flex-1 flex flex-col"
        style={{
          width: '100%',
        }}
      >
        <div
          class="keyboard-keys relative h-full flex-1"
          style={{
            height: '100%'
          }}
        >
          <Key each={keyboardState.keys} by={(key) => key.note + key.octave}>
            {(key) => (
              <KeyButton
                key={key()}
                onPlay={(velocity) => {
                  audioEngineState.resumeContext();
                  audioEngineState.playKeyboardNote(key(), velocity);
                  if (uiState.isRecordingValue) {
                    uiState.addRecordedNote(`${key().note}${key().octave}`, velocity);
                  }
                }}
                onStop={() => {
                  audioEngineState.stopKeyboardNote(key());
                }}
              />
            )}
          </Key>
        </div>
      </div>
    </div>
  );
};
