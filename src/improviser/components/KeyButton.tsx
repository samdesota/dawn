import { Component, createMemo } from "solid-js";
import { uiState } from "../state/UIState";
import type { KeyInfo } from "../state/KeyboardState";
import "./KeyButton.css";

interface KeyButtonProps {
  key: KeyInfo;
  onPlay: (velocity: number) => void;
  onStop: () => void;
}

export const KeyButton: Component<KeyButtonProps> = (props) => {
  // Determine if this key is currently pressed by checking active touches
  const isPressed = createMemo(() => {
    const touches = uiState.activeTouches();
    const keyId = `${props.key.note}${props.key.octave}`;

    for (const [_, touch] of touches) {
      if (touch.keyId === keyId) {
        return true;
      }
    }
    return false;
  });

  const getKeyStyles = () => {
    const backgroundColor = uiState.getKeyBackgroundColor(
      props.key.noteType,
      props.key.isHighlighted,
      props.key.chordRole
    );

    const textColor = uiState.getKeyTextColor();
    const bottomBorderColor = uiState.getKeyBottomBorderColor(
      props.key.isHighlighted,
      props.key.chordRole
    );

    // Z-index based on note type hierarchy
    const getZIndex = (): number => {
      switch (props.key.noteType) {
        case "chromatic":
          return 40; // Highest layer
        case "scale":
          return 30;
        case "pentatonic":
          return 20;
        case "triad":
          return 10; // Base layer
        default:
          return 10;
      }
    };

    return {
      position: "absolute" as const,
      left: `${props.key.position}px`,
      width: `${props.key.width}px`,
      height: `${props.key.height}px`,
      "background-color": backgroundColor,
      color: textColor,
      "z-index": getZIndex(),
      transform: isPressed() ? "scale(0.95)" : "scale(1)",
      "box-shadow": isPressed()
        ? "inset 0 2px 4px rgba(0,0,0,0.3)"
        : "0 1px 3px rgba(0,0,0,0.2)",
      "border-bottom-left-radius": "4px",
      "border-bottom-right-radius": "4px",
      border: "1px solid #444",
      "--highlight-color": bottomBorderColor,
    };
  };

  const getDisplayNoteName = () => {
    const preferences = uiState.preferencesValue;
    if (!preferences.showNoteNames) return "";

    return props.key.note;
  };

  const getChordRoleDisplay = () => {
    const preferences = uiState.preferencesValue;
    if (!preferences.showChordRoles || !props.key.chordRole) return "";

    switch (props.key.chordRole) {
      case "root":
        return "●";
      case "third":
        return "3";
      case "fifth":
        return "5";
      case "seventh":
        return "7";
      case "extension":
        return "+";
      default:
        return "";
    }
  };

  return (
    <button
      class={`key-button select-none touch-none pointer-events-none`}
      style={getKeyStyles()}
      aria-label={`${props.key.note}${props.key.octave} - ${props.key.noteType} note`}
      data-note={props.key.note}
      data-octave={props.key.octave}
    >
      <div class="key-content h-full flex flex-col justify-between items-center pt-1 pb-2 text-xs font-medium">
        <div class="octave-number text-center opacity-50 text-xs mt-auto">
          {getDisplayNoteName()}
        </div>
      </div>
    </button>
  );
};
