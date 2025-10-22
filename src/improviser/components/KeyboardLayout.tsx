import { Component, For, onCleanup, onMount } from "solid-js";
import { keyboardState } from "../state/KeyboardState";
import { audioEngineState } from "../state/AudioEngineState";
import { uiState } from "../state/UIState";
import { KeyButton } from "./KeyButton";
import type { NoteInfo } from "../state/AudioEngineState";
import { Key } from "@solid-primitives/keyed";
import { debounce } from "../../utils/audioUtils/debounce";

// Unified interface for interaction events (mouse or touch)
interface InteractionPoint {
  id: number | string;
  x: number;
  y: number;
  force?: number;
}

export const KeyboardLayout: Component = () => {
  let keyboardContainer: HTMLDivElement | undefined;
  let keyboardLayoutRef: HTMLDivElement | undefined;
  let emergencyStopTimeout: number | undefined;
  let isMouseDown = false;

  onMount(() => {
    // Set up keyboard container for touch and mouse handling
    if (keyboardContainer) {
      // Touch events
      keyboardContainer.addEventListener("touchstart", handleTouchEvent, {
        passive: false,
      });
      keyboardContainer.addEventListener("touchmove", handleTouchEvent, {
        passive: false,
      });
      keyboardContainer.addEventListener("touchend", handleTouchEvent, {
        passive: false,
      });
      keyboardContainer.addEventListener("touchcancel", handleTouchCancel, {
        passive: false,
      });

      // Mouse events
      keyboardContainer.addEventListener("mousedown", handleMouseDown, {
        passive: false,
      });
      keyboardContainer.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      keyboardContainer.addEventListener("mouseup", handleMouseUp, {
        passive: false,
      });
      keyboardContainer.addEventListener("mouseleave", handleMouseLeave, {
        passive: false,
      });
    }

    // Set up ResizeObserver for keyboard container
    const resizeHandler = debounce(() => {
      const rect = keyboardLayoutRef?.getBoundingClientRect();
      console.log("Keyboard layout resized", rect.width, rect.height);
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
      console.log("Window blur detected, stopping all notes");
      audioEngineState.stopAllKeyboardNotes();
      uiState.clearAllTouches();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, stopping all notes");
        audioEngineState.stopAllKeyboardNotes();
        uiState.clearAllTouches();
      }
    };

    // Add global escape key handler for emergency stop
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        console.log("Escape key pressed, emergency stopping all notes");
        audioEngineState.emergencyStopAll();
        uiState.clearAllTouches();
        if (emergencyStopTimeout) {
          clearTimeout(emergencyStopTimeout);
          emergencyStopTimeout = undefined;
        }
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    onCleanup(() => {
      resizeObserver.disconnect();
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      if (emergencyStopTimeout) {
        clearTimeout(emergencyStopTimeout);
      }
    });
  });

  // Extract interaction points from either touch or mouse events
  const extractInteractionPoints = (
    event: TouchEvent | MouseEvent
  ): InteractionPoint[] => {
    if ("touches" in event) {
      const points: InteractionPoint[] = [];
      const rect = keyboardContainer?.getBoundingClientRect();
      if (!rect) return points;

      for (let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        points.push({
          id: touch.identifier,
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          force: (touch as any).force,
        });
      }
      return points;
    } else {
      // MouseEvent
      const rect = keyboardContainer?.getBoundingClientRect();
      if (!rect || !isMouseDown) return [];

      return [
        {
          id: "mouse",
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          force: undefined,
        },
      ];
    }
  };

  // Unified handler that processes both touch and mouse interactions
  const handleInteractionEvent = (interactionPoints: InteractionPoint[]) => {
    const activeNotes: Array<{ noteInfo: NoteInfo; velocity: number }> = [];

    // Clear existing touches and rebuild from current interaction points
    uiState.clearAllTouches();

    for (const point of interactionPoints) {
      // Find the key at this position
      const key = keyboardState.getKeyAtCoordinates(point.x, point.y);

      if (key) {
        // Calculate velocity from force (if available) or default
        const baseVelocity = point.force || (point.id === "mouse" ? 0.8 : 1.0);
        const adjustedVelocity =
          point.id === "mouse"
            ? baseVelocity
            : baseVelocity * uiState.touchSensitivityMultiplier;

        activeNotes.push({
          noteInfo: key,
          velocity: adjustedVelocity,
        });

        // Record note if recording
        if (uiState.isRecordingValue) {
          uiState.addRecordedNote(`${key.note}${key.octave}`, adjustedVelocity);
        }

        // Track touch/interaction in UI state
        const keyId = `${key.note}${key.octave}`;
        uiState.addTouch(point.id, point.x, point.y, keyId);
      } else {
        // Track interaction even if not over a key
        uiState.addTouch(point.id, point.x, point.y, undefined);
      }
    }

    uiState.lastTouchTime.set(Date.now());

    console.log("activeNotes", activeNotes);

    // Update the audio engine with the current set of notes that should be playing
    audioEngineState.setActiveKeyboardNotes(activeNotes);

    // Manage emergency stop timeout
    if (activeNotes.length > 0) {
      // Set emergency stop timeout for long holds (10 seconds)
      if (emergencyStopTimeout) {
        clearTimeout(emergencyStopTimeout);
      }
      emergencyStopTimeout = window.setTimeout(() => {
        console.warn("Emergency stop triggered after 10 seconds");
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

  // Touch event handlers
  const handleTouchEvent = (event: TouchEvent) => {
    event.preventDefault();

    // Resume audio context on first touch (required for iOS)
    audioEngineState.resumeContext();

    const interactionPoints = extractInteractionPoints(event);
    handleInteractionEvent(interactionPoints);
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
    isMouseDown = false;
  };

  // Mouse event handlers
  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    isMouseDown = true;

    // Resume audio context
    audioEngineState.resumeContext();

    const interactionPoints = extractInteractionPoints(event);
    handleInteractionEvent(interactionPoints);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isMouseDown) return;
    event.preventDefault();

    const interactionPoints = extractInteractionPoints(event);
    handleInteractionEvent(interactionPoints);
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    isMouseDown = false;

    // Clear all notes when mouse is released
    audioEngineState.stopAllKeyboardNotes();
    uiState.clearAllTouches();

    // Clear emergency timeout
    if (emergencyStopTimeout) {
      clearTimeout(emergencyStopTimeout);
      emergencyStopTimeout = undefined;
    }
  };

  const handleMouseLeave = (event: MouseEvent) => {
    if (!isMouseDown) return;

    isMouseDown = false;

    // Stop all notes when mouse leaves the container
    audioEngineState.stopAllKeyboardNotes();
    uiState.clearAllTouches();

    // Clear emergency timeout
    if (emergencyStopTimeout) {
      clearTimeout(emergencyStopTimeout);
      emergencyStopTimeout = undefined;
    }
  };

  // Calculate total keyboard width for scrolling
  const getTotalWidth = () => {
    const keys = keyboardState.keys;
    if (keys.length === 0) return 0;

    const lastKey = keys[keys.length - 1];
    return lastKey.position + lastKey.width + 20; // Add some padding
  };

  return (
    <div
      ref={keyboardLayoutRef}
      class="keyboard-layout w-full h-full flex-1 flex flex-col min-h-250px overflow-hidden"
    >
      <div
        ref={keyboardContainer}
        class="keyboard-container relative h-full overflow-hidden flex-1 flex flex-col"
        style={{
          width: "100%",
        }}
      >
        <div
          class="keyboard-keys relative h-full flex-1"
          style={{
            height: "100%",
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
                    uiState.addRecordedNote(
                      `${key().note}${key().octave}`,
                      velocity
                    );
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
