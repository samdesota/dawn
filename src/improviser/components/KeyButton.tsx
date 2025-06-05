import { Component, createEffect, createSignal } from 'solid-js';
import { uiState } from '../state/UIState';
import type { KeyInfo } from '../state/KeyboardState';

interface KeyButtonProps {
  key: KeyInfo;
  onPlay: (velocity: number) => void;
  onStop: () => void;
}

export const KeyButton: Component<KeyButtonProps> = (props) => {
  const [isPressed, setIsPressed] = createSignal(false);
  const [animationClass, setAnimationClass] = createSignal('');

  createEffect(() => {
    // Add pulsing animation for highlighted chord tones
    if (props.key.isHighlighted && props.key.chordRole && uiState.shouldShowAnimations) {
      const intensity = getAnimationIntensity(props.key.chordRole);
      setAnimationClass(`animate-pulse-${intensity}`);
    } else {
      setAnimationClass('');
    }
  });

  const getAnimationIntensity = (role: string): string => {
    switch (role) {
      case 'root': return 'strong';
      case 'third': return 'moderate';
      case 'fifth': return 'subtle';
      case 'seventh':
      case 'extension': return 'gentle';
      default: return 'subtle';
    }
  };

  const getKeyStyles = () => {
    const backgroundColor = uiState.getKeyBackgroundColor(
      props.key.noteType,
      props.key.isHighlighted,
      props.key.chordRole
    );

    const textColor = uiState.getKeyTextColor();

    return {
      position: 'absolute' as const,
      left: `${props.key.position}px`,
      width: `${props.key.width}px`,
      height: `${props.key.height}px`,
      'background-color': backgroundColor,
      color: textColor,
      transform: isPressed() ? 'scale(0.95)' : 'scale(1)',
      'box-shadow': isPressed()
        ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
        : props.key.isHighlighted
          ? '0 0 8px rgba(251, 191, 36, 0.5)'
          : '0 1px 3px rgba(0,0,0,0.2)',
      'border-radius': '4px',
      border: props.key.isHighlighted
        ? '2px solid rgba(251, 191, 36, 0.7)'
        : '1px solid rgba(255,255,255,0.1)',
      transition: uiState.shouldShowAnimations
        ? 'all 0.1s ease-in-out, background-color 0.3s ease'
        : 'none',
      'z-index': getZIndex()
    };
  };

  const getZIndex = (): number => {
    // Higher z-index for more important notes
    switch (props.key.noteType) {
      case 'triad': return 40;
      case 'pentatonic': return 30;
      case 'scale': return 20;
      case 'chromatic': return 10;
      default: return 10;
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    setIsPressed(true);
    const velocity = 0.8; // Default velocity for mouse
    props.onPlay(velocity);
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    setIsPressed(false);
    props.onStop();
  };

  const handleMouseLeave = (event: MouseEvent) => {
    if (isPressed()) {
      setIsPressed(false);
      props.onStop();
    }
  };

  const getDisplayNoteName = () => {
    const preferences = uiState.preferencesValue;
    if (!preferences.showNoteNames) return '';

    return props.key.note;
  };

  const getChordRoleDisplay = () => {
    const preferences = uiState.preferencesValue;
    if (!preferences.showChordRoles || !props.key.chordRole) return '';

    switch (props.key.chordRole) {
      case 'root': return '●';
      case 'third': return '3';
      case 'fifth': return '5';
      case 'seventh': return '7';
      case 'extension': return '+';
      default: return '';
    }
  };

  return (
    <button
      class={`key-button select-none touch-none ${animationClass()}`}
      style={getKeyStyles()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label={`${props.key.note}${props.key.octave} - ${props.key.noteType} note`}
      data-note={props.key.note}
      data-octave={props.key.octave}
    >
      <div class="key-content h-full flex flex-col justify-between items-center p-1 text-xs font-medium">
        <div class="note-name text-center">
          {getDisplayNoteName()}
        </div>
        <div class="chord-role text-center font-bold">
          {getChordRoleDisplay()}
        </div>
        <div class="octave-number text-center opacity-50 text-xs">
          {props.key.octave}
        </div>
      </div>
    </button>
  );
};
