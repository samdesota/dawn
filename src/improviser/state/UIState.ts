import { createAtom } from '../../state/atom';

export interface UIPreferences {
  showNoteNames: boolean;
  showChordRoles: boolean;
  enableAnimations: boolean;
  keyboardTheme: 'dark' | 'light';
  showProgressBar: boolean;
  showMetronome: boolean;
  touchSensitivity: number; // 0.1 to 2.0
}

export type LayoutMode = 'full' | 'compact' | 'minimal';
export type PanelVisibility = {
  settings: boolean;
  chordDisplay: boolean;
  transport: boolean;
  songSelector: boolean;
  recording: boolean;
};

export class UIState {
  // Reactive state atoms
  public preferences = createAtom<UIPreferences>({
    showNoteNames: true,
    showChordRoles: true,
    enableAnimations: true,
    keyboardTheme: 'dark',
    showProgressBar: true,
    showMetronome: true,
    touchSensitivity: 1.0
  });

  public layoutMode = createAtom<LayoutMode>('full');
  public panelVisibility = createAtom<PanelVisibility>({
    settings: false,
    chordDisplay: true,
    transport: true,
    songSelector: true,
    recording: false
  });

  public isKeyboardFocused = createAtom(false);
  public selectedKey = createAtom<string | null>(null);
  public isRecording = createAtom(false);
  public recordedNotes = createAtom<Array<{ note: string; time: number; velocity: number }>>([]);

  // Screen and orientation
  public screenSize = createAtom<'mobile' | 'tablet' | 'desktop'>('tablet');
  public orientation = createAtom<'portrait' | 'landscape'>('landscape');
  public isFullscreen = createAtom(false);
  
  // Mobile keyboard mode
  public showFullscreenKeyboard = createAtom(false);

  // Touch and interaction
  public activeTouches = createAtom<Map<number, { x: number; y: number; keyId?: string }>>(new Map());
  public lastTouchTime = createAtom(0);

  constructor() {
    this.loadPreferences();
    this.detectScreenSize();
    this.setupOrientationListener();
  }

  // Preference management
  public updatePreference<K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) {
    this.preferences.produce(prefs => {
      prefs[key] = value;
    });
    this.savePreferences();
  }

  public resetPreferences() {
    this.preferences.set({
      showNoteNames: true,
      showChordRoles: true,
      enableAnimations: true,
      keyboardTheme: 'dark',
      showProgressBar: true,
      showMetronome: true,
      touchSensitivity: 1.0
    });
    this.savePreferences();
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem('improviser-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.preferences.set({ ...this.preferences(), ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load preferences:', error);
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem('improviser-preferences', JSON.stringify(this.preferences()));
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }

  // Layout and panel management
  public setLayoutMode(mode: LayoutMode) {
    this.layoutMode.set(mode);
  }

  public togglePanel(panel: keyof PanelVisibility) {
    this.panelVisibility.produce(visibility => {
      visibility[panel] = !visibility[panel];
    });
  }

  public showPanel(panel: keyof PanelVisibility) {
    this.panelVisibility.produce(visibility => {
      visibility[panel] = true;
    });
  }

  public hidePanel(panel: keyof PanelVisibility) {
    this.panelVisibility.produce(visibility => {
      visibility[panel] = false;
    });
  }

  // Screen and device management
  private detectScreenSize() {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        this.screenSize.set('mobile');
      } else if (width < 1024) {
        this.screenSize.set('tablet');
      } else {
        this.screenSize.set('desktop');
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
  }

  private setupOrientationListener() {
    const updateOrientation = () => {
      this.orientation.set(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
  }

  public toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen.set(true);
      }).catch((error) => {
        console.warn('Failed to enter fullscreen:', error);
      });
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen.set(false);
      }).catch((error) => {
        console.warn('Failed to exit fullscreen:', error);
      });
    }
  }

  // Touch and interaction management
  public addTouch(id: number, x: number, y: number, keyId?: string) {
    this.activeTouches.produce(touches => {
      touches.set(id, { x, y, keyId });
    });
    this.lastTouchTime.set(Date.now());
  }

  public updateTouch(id: number, x: number, y: number) {
    this.activeTouches.produce(touches => {
      const touch = touches.get(id);
      if (touch) {
        touch.x = x;
        touch.y = y;
      }
    });
  }

  public removeTouch(id: number) {
    this.activeTouches.produce(touches => {
      touches.delete(id);
    });
  }

  public clearAllTouches() {
    this.activeTouches.set(new Map());
  }

  // Fullscreen keyboard mode management
  public openFullscreenKeyboard() {
    this.showFullscreenKeyboard.set(true);
  }

  public closeFullscreenKeyboard() {
    this.showFullscreenKeyboard.set(false);
  }

  // Recording management
  public startRecording() {
    this.isRecording.set(true);
    this.recordedNotes.set([]);
  }

  public stopRecording() {
    this.isRecording.set(false);
  }

  public addRecordedNote(note: string, velocity: number) {
    if (this.isRecording()) {
      this.recordedNotes.produce(notes => {
        notes.push({
          note,
          time: Date.now() - this.getRecordingStartTime(),
          velocity
        });
      });
    }
  }

  private getRecordingStartTime(): number {
    // This would be set when recording starts
    return 0; // Placeholder
  }

  public clearRecording() {
    this.recordedNotes.set([]);
  }

  // Keyboard focus and selection
  public setKeyboardFocus(focused: boolean) {
    this.isKeyboardFocused.set(focused);
  }

  public selectKey(keyId: string | null) {
    this.selectedKey.set(keyId);
  }

  // Computed getters
  public get isDarkTheme() {
    return this.preferences().keyboardTheme === 'dark';
  }

  public get isCompactLayout() {
    return this.layoutMode() === 'compact' || this.screenSize() === 'mobile';
  }

  public get isMinimalLayout() {
    return this.layoutMode() === 'minimal';
  }

  public get shouldShowAnimations() {
    return this.preferences().enableAnimations && this.screenSize() !== 'mobile';
  }

  public get touchSensitivityMultiplier() {
    return this.preferences().touchSensitivity;
  }

  public get isLandscapeOptimal() {
    return this.orientation() === 'landscape' && this.screenSize() === 'tablet';
  }

  // Theme and styling helpers
  public getKeyBackgroundColor(
    noteType: 'triad' | 'pentatonic' | 'scale' | 'chromatic',
    isHighlighted: boolean,
    chordRole?: 'root' | 'third' | 'fifth' | 'seventh' | 'extension'
  ): string {
    const theme = this.preferences().keyboardTheme;

    // Remove highlighted background colors - now using bottom border instead
    // Default colors based on note type
    const isDark = theme === 'dark';

    if (isDark) {
      switch (noteType) {
        case 'triad': return '#222222'; // Dark charcoal
        case 'pentatonic': return '#2a2a2a'; // Slightly lighter charcoal
        case 'scale': return '#333333'; // Medium dark gray
        case 'chromatic': return '#404040'; // Lighter gray
      }
    } else {
      switch (noteType) {
        case 'triad': return '#f8f9fa'; // Light gray
        case 'pentatonic': return '#e9ecef'; // Medium light gray
        case 'scale': return '#dee2e6'; // Medium gray
        case 'chromatic': return '#ced4da'; // Darker gray
      }
    }

    return isDark ? '#1c1c1c' : '#f8f9fa';
  }

  public getKeyBottomBorderColor(
    isHighlighted: boolean,
    chordRole?: 'root' | 'third' | 'fifth' | 'seventh' | 'extension'
  ): string {
    if (!isHighlighted || !chordRole) {
      return 'transparent';
    }

    // Bottom border colors for chord tones with intensity hierarchy
    switch (chordRole) {
      case 'extension': return '#92400e'; // Amber-800 - lightest
      case 'seventh': return '#ca8a04'; // Amber-700 - lighter
      case 'fifth': return '#d97706'; // Amber-600 - strongest
      case 'third': return '#f59e0b'; // Amber-500 - strong
      case 'root': return '#fbbf24'; // Amber-400 - medium
      default: return 'transparent';
    }
  }

  public getKeyTextColor(): string {
    return this.preferences().keyboardTheme === 'dark' ? '#ffffff' : '#000000';
  }

  // Getters for reactive values
  get preferencesValue() { return this.preferences(); }
  get layoutModeValue() { return this.layoutMode(); }
  get panelVisibilityValue() { return this.panelVisibility(); }
  get isKeyboardFocusedValue() { return this.isKeyboardFocused(); }
  get selectedKeyValue() { return this.selectedKey(); }
  get isRecordingValue() { return this.isRecording(); }
  get recordedNotesValue() { return this.recordedNotes(); }
  get screenSizeValue() { return this.screenSize(); }
  get orientationValue() { return this.orientation(); }
  get isFullscreenValue() { return this.isFullscreen(); }
  get activeTouchesValue() { return this.activeTouches(); }
  get lastTouchTimeValue() { return this.lastTouchTime(); }
  get showFullscreenKeyboardValue() { return this.showFullscreenKeyboard(); }
}

// Export singleton instance
export const uiState = new UIState();
