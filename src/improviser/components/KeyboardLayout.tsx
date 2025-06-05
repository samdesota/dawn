import { Component, For, onMount } from 'solid-js';
import { keyboardState } from '../state/KeyboardState';
import { audioEngineState } from '../state/AudioEngineState';
import { uiState } from '../state/UIState';
import { KeyButton } from './KeyButton';

export const KeyboardLayout: Component = () => {
  let keyboardContainer: HTMLDivElement | undefined;

  onMount(() => {
    // Set up keyboard container for touch handling
    if (keyboardContainer) {
      keyboardContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      keyboardContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      keyboardContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
      keyboardContainer.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    }
  });

  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    audioEngineState.resumeContext(); // Ensure audio context is active on touch

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = keyboardContainer?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Find which key was touched
      const key = keyboardState.getKeyAtPosition(x);
      if (key) {
        // Calculate velocity based on touch pressure or use default
        const velocity = (touch as any).force || 1.0;
        const adjustedVelocity = velocity * uiState.touchSensitivityMultiplier;

        // Add touch tracking
        uiState.addTouch(touch.identifier, x, y, `${key.note}${key.octave}`);

        // Play the note
        audioEngineState.playNote(key, adjustedVelocity);

        // Record note if recording
        if (uiState.isRecordingValue) {
          uiState.addRecordedNote(`${key.note}${key.octave}`, adjustedVelocity);
        }
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

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const activeTouches = uiState.activeTouchesValue;
      const activeTouch = activeTouches.get(touch.identifier);

      if (activeTouch && activeTouch.keyId) {
        // Stop the note
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

      // Remove touch tracking
      uiState.removeTouch(touch.identifier);
    }
  };

  const handleTouchCancel = (event: TouchEvent) => {
    handleTouchEnd(event);
  };

  // Calculate total keyboard width for scrolling
  const getTotalWidth = () => {
    const keys = keyboardState.keys;
    if (keys.length === 0) return 0;

    const lastKey = keys[keys.length - 1];
    return lastKey.position + lastKey.width + 20; // Add some padding
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
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
