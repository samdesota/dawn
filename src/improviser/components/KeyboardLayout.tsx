import { Component, For, onMount } from 'solid-js';
import { keyboardState } from '../state/KeyboardState';
import { audioEngineState } from '../state/AudioEngineState';
import { uiState } from '../state/UIState';
import { KeyButton } from './KeyButton';

export const KeyboardLayout: Component = () => {
  let keyboardContainer: HTMLDivElement | undefined;
  let emergencyStopTimeout: number | undefined;

  onMount(() => {
    // Set up keyboard container for touch handling
    if (keyboardContainer) {
      keyboardContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      keyboardContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      keyboardContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
      keyboardContainer.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    }

    // Add emergency stop on window blur/focus loss
    const handleWindowBlur = () => {
      console.log('Window blur detected, stopping all notes');
      audioEngineState.stopAllNotes();
      uiState.clearAllTouches();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, stopping all notes');
        audioEngineState.stopAllNotes();
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
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (emergencyStopTimeout) {
        clearTimeout(emergencyStopTimeout);
      }
    };
  });

  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();

    // Resume audio context on first touch (required for iOS)
    audioEngineState.resumeContext();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = keyboardContainer?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Find the key at this position
      const targetElement = event.target as HTMLElement;

      // find the element with data-note and data-octave by traversing the DOM
      let currentElement = targetElement;
      while (currentElement && !currentElement.dataset.note) {
        currentElement = currentElement.parentElement;
      }

      if (!currentElement) {
        console.error('No key found at position', x, y);
        return;
      }

      const note = currentElement.dataset.note;
      const octave = currentElement.dataset.octave;

      const key = keyboardState.findKeyByNote(note, parseInt(octave));

      if (key) {
        // Calculate velocity from touch force (if available) or default
        const velocity = (touch as any).force || 1.0;
        const adjustedVelocity = velocity * uiState.touchSensitivityMultiplier;

        // Track the touch
        uiState.addTouch(touch.identifier, x, y, `${key.note}${key.octave}`);

        // Play the note
        audioEngineState.playNote(key, adjustedVelocity);

        // Record note if recording
        if (uiState.isRecordingValue) {
          uiState.addRecordedNote(`${key.note}${key.octave}`, adjustedVelocity);
        }

        // Set emergency stop timeout for long holds (10 seconds)
        if (emergencyStopTimeout) {
          clearTimeout(emergencyStopTimeout);
        }
        emergencyStopTimeout = window.setTimeout(() => {
          console.warn('Emergency stop triggered after 10 seconds');
          audioEngineState.emergencyStopAll();
          uiState.clearAllTouches();
        }, 10000);
      }
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = keyboardContainer?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Update touch position
      uiState.updateTouch(touch.identifier, x, y);

      // Check if we've moved to a different key (glissando effect)
      const currentKey = keyboardState.getKeyAtPosition(x);
      const activeTouches = uiState.activeTouchesValue;
      const activeTouch = activeTouches.get(touch.identifier);

      if (currentKey && activeTouch && activeTouch.keyId !== `${currentKey.note}${currentKey.octave}`) {
        // Stop previous note and play new one
        if (activeTouch.keyId) {
          const [note, octaveStr] = activeTouch.keyId.match(/([A-G][#b]?)(\d+)/)?.slice(1) || [];
          if (note && octaveStr) {
            audioEngineState.stopNote({
              note,
              octave: parseInt(octaveStr),
              frequency: 0,
              midiNumber: 0
            });
          }
        }

        // Play new note
        const velocity = (touch as any).force || 1.0;
        audioEngineState.playNote(currentKey, velocity * uiState.touchSensitivityMultiplier);

        // Update touch tracking
        uiState.activeTouches.produce(touches => {
          const existingTouch = touches.get(touch.identifier);
          if (existingTouch) {
            existingTouch.keyId = `${currentKey.note}${currentKey.octave}`;
          }
        });
      }
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();

    // Clear emergency timeout since touch is ending
    if (emergencyStopTimeout) {
      clearTimeout(emergencyStopTimeout);
      emergencyStopTimeout = undefined;
    }

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const activeTouches = uiState.activeTouchesValue;
      const activeTouch = activeTouches.get(touch.identifier);

      if (activeTouch && activeTouch.keyId) {
        // Stop the note
        const [note, octaveStr] = activeTouch.keyId.match(/([A-G][#b]?)(\d+)/)?.slice(1) || [];
        if (note && octaveStr) {
          try {
            audioEngineState.stopNote({
              note,
              octave: parseInt(octaveStr),
              frequency: 0,
              midiNumber: 0
            });
          } catch (error) {
            console.error('Error stopping note in touch end:', error);
            // Force stop all notes as fallback
            audioEngineState.stopAllNotes();
          }
        }
      }

      // Remove touch tracking
      uiState.removeTouch(touch.identifier);
    }
  };

  const handleTouchCancel = (event: TouchEvent) => {
    // Clear emergency timeout
    if (emergencyStopTimeout) {
      clearTimeout(emergencyStopTimeout);
      emergencyStopTimeout = undefined;
    }

    // Stop all notes on touch cancel to be safe
    audioEngineState.stopAllNotes();
    uiState.clearAllTouches();

    handleTouchEnd(event);
  };

  // Calculate total keyboard width for scrolling
  const getTotalWidth = () => {
    const keys = keyboardState.keys;
    if (keys.length === 0) return 0;

    const lastKey = keys[keys.length - 1];
    return lastKey.position + lastKey.width + 20; // Add some padding
  };

  const getKeyZIndex = (noteType: string) => {
    // Higher z-index for non-triad keys so they appear on top of triad keys
    // This creates the layered piano effect
    switch (noteType) {
      case 'chromatic':
        return '40'; // Highest layer - chromatic notes on top
      case 'scale':
        return '30'; // Scale notes above pentatonic
      case 'pentatonic':
        return '20'; // Pentatonic notes above triads
      case 'triad':
        return '10'; // Base layer - triad keys at bottom
      default:
        return '10';
    }
  };

  return (
    <div class="keyboard-layout w-full h-full overflow-hidden bg-black">
      <div
        ref={keyboardContainer}
        class="keyboard-container relative h-full overflow-x-auto overflow-y-hidden"
        style={{
          width: '100%',
          'min-width': `${getTotalWidth()}px`
        }}
      >
        <div
          class="keyboard-keys relative h-full"
          style={{
            width: `${getTotalWidth()}px`,
            height: '100%'
          }}
        >
          <For each={keyboardState.keys}>
            {(key) => (
              <div
                style={{
                  position: 'absolute',
                  'z-index': getKeyZIndex(key.noteType)
                }}
              >
                <KeyButton
                  key={key}
                  onPlay={(velocity) => {
                    audioEngineState.resumeContext();
                    audioEngineState.playNote(key, velocity);
                    if (uiState.isRecordingValue) {
                      uiState.addRecordedNote(`${key.note}${key.octave}`, velocity);
                    }
                  }}
                  onStop={() => {
                    audioEngineState.stopNote(key);
                  }}
                />
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
