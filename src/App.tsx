import type { Component } from 'solid-js';
import { onMount, onCleanup } from 'solid-js';

import { KeyboardLayout } from './improviser/components/KeyboardLayout';
import { ChordDisplay } from './improviser/components/ChordDisplay';
import { TransportControls } from './improviser/components/TransportControls';
import { SongSelector } from './improviser/components/SongSelector';

import { audioEngineState } from './improviser/state/AudioEngineState';
import { chordProgressionState } from './improviser/state/ChordProgressionState';
import { playbackState } from './improviser/state/PlaybackState';
import { uiState } from './improviser/state/UIState';

const App: Component = () => {
  // Initialize the application
  onMount(async () => {
    console.log('Musical Instrument App starting...');

    try {
      // Audio engine initializes automatically in its constructor
      console.log('Audio engine initialized');

      // Chord progressions are already initialized in constructor
      console.log('Chord progressions initialized');

      // Playback state is ready
      console.log('Playback system initialized');

      // Set default theme based on system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      uiState.updatePreference('keyboardTheme', isDarkMode ? 'dark' : 'light');

      // Handle theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e: MediaQueryListEvent) => {
        uiState.updatePreference('keyboardTheme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleThemeChange);

      // Cleanup listener on component unmount
      onCleanup(() => {
        mediaQuery.removeEventListener('change', handleThemeChange);
      });

    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  // Handle visibility change to pause when app is hidden
  onMount(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && playbackState.isPlaying) {
        playbackState.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    onCleanup(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  });

  // Prevent default touch behaviors that might interfere with the instrument
  onMount(() => {
    const preventTouchDefaults = (e: TouchEvent) => {
      // Allow single touch scrolling but prevent multi-touch gestures
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventContextMenu = (e: Event) => {
      // Only prevent context menu on keyboard and control elements
      const target = e.target as HTMLElement;
      if (target.closest('.keyboard-container') ||
        target.closest('.key-button') ||
        target.closest('.transport-controls')) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventTouchDefaults, { passive: false });
    document.addEventListener('touchmove', preventTouchDefaults, { passive: false });
    document.addEventListener('contextmenu', preventContextMenu);

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    onCleanup(() => {
      document.removeEventListener('touchstart', preventTouchDefaults);
      document.removeEventListener('touchmove', preventTouchDefaults);
      document.removeEventListener('contextmenu', preventContextMenu);
    });
  });

  // Handle device orientation changes
  onMount(() => {
    const handleOrientationChange = () => {
      // Small delay to allow the browser to adjust
      setTimeout(() => {
        // Trigger a recalculation of keyboard layout
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    onCleanup(() => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    });
  });

  const getThemeClasses = () => {
    return 'bg-black text-white';
  };

  const getCurrentTheme = () => {
    return uiState.preferencesValue.keyboardTheme;
  };

  return (
    <div
      class={`app min-h-screen ${getThemeClasses()} transition-colors duration-300`}
      data-theme={getCurrentTheme()}
    >
      {/* Header */}
      <header class="app-header bg-black text-white p-4 shadow-lg">
        <div class="container mx-auto">
          <h1 class="text-2xl font-bold text-center">
            Musical Improvisation Assistant
          </h1>
          <p class="text-center text-gray-300 text-sm mt-1">
            Touch-responsive chord progression tool for iPad
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main class="app-main flex flex-col min-h-[calc(100vh-80px)]">

        {/* Control Panel - Grid Layout */}
        <div class="control-panel w-full p-4 bg-black border-b border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-2  gap-4">

            {/* Song Selector */}
            <div class="control-section">
              <SongSelector />
            </div>

            {/* Chord Display and Transport Controls */}
            <div class="control-section flex-1 flex flex-col space-y-4">
              <TransportControls />
            </div>
          </div>
        </div>

        {/* Keyboard Area - Full Width */}
        <div class="keyboard-area flex-1 p-4 overflow-hidden flex flex-col bg-black">
          <div class="keyboard-container flex flex-col flex-1 w-full">
            <KeyboardLayout />
          </div>
        </div>
      </main>

      {/* Audio Status Indicator */}
      <div class="audio-status fixed bottom-4 right-4 z-50">
        <div
          class="status-indicator px-3 py-2 rounded-full text-sm font-medium shadow-lg"
          classList={{
            'bg-green-500 text-white': audioEngineState.audioInitialized,
            'bg-red-500 text-white': !audioEngineState.audioInitialized
          }}
        >
          {audioEngineState.audioInitialized ? 'Audio Ready' : 'Audio Error'}
        </div>
      </div>
    </div>
  );
};

export default App;
