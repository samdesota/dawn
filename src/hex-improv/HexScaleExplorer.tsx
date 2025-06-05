import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import audioEngine, { SynthType } from './audioEngine';
import { scales } from './musicData';
import { ScaleExplorerCanvas, LayoutType } from './ScaleExplorerCanvas';

const HexScaleExplorer: Component = () => {
  const [selectedScale, setSelectedScale] = createSignal('major');
  const [selectedNote, setSelectedNote] = createSignal<number | null>(null); // Scale index of selected note
  const [audioUnlocked, setAudioUnlocked] = createSignal(false);
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | null>(null);
  const [synthType, setSynthType] = createSignal<SynthType>('sine');
  const [layoutType, setLayoutType] = createSignal<LayoutType>('spiral');

  let canvasManager: ScaleExplorerCanvas | null = null;

  // Synth type options with descriptions
  const synthOptions: { value: SynthType; label: string; description: string }[] = [
    { value: 'sine', label: 'Sine', description: 'Pure tone' },
    { value: 'sawtooth', label: 'Sawtooth', description: 'Bright & buzzy' },
    { value: 'square', label: 'Square', description: 'Hollow & digital' },
    { value: 'triangle', label: 'Triangle', description: 'Soft & mellow' },
    { value: 'warm', label: 'Warm Pad', description: 'Rich harmonics' },
    { value: 'bright', label: 'Bright Lead', description: 'Sharp & cutting' },
    { value: 'organ', label: 'Organ', description: 'Classic drawbar' }
  ];

  // Layout options with descriptions
  const layoutOptions: { value: LayoutType; label: string; description: string }[] = [
    { value: 'honeycomb', label: 'Honeycomb', description: 'Grid layout by octave' },
    { value: 'spiral', label: 'Spiral', description: 'Spiral from center outward' }
  ];

  // Function to unlock audio on iOS Safari
  const unlockAudio = () => {
    const ctx = audioEngine.initAudio();
    console.log('Attempting to unlock audio, context state:', ctx.state);

    try {
      const testOsc = ctx.createOscillator();
      const testGain = ctx.createGain();
      testGain.gain.value = 0.2;
      testOsc.frequency.value = 440;
      testOsc.connect(testGain);
      testGain.connect(ctx.destination);
      testOsc.start(ctx.currentTime);
      testOsc.stop(ctx.currentTime + 0.3);
      setAudioUnlocked(true);
    } catch (err) {
      console.error('Error playing test sound:', err);
    }
  };

  // Handle synth type change
  const handleSynthTypeChange = (newSynthType: SynthType) => {
    setSynthType(newSynthType);
    audioEngine.setSynthType(newSynthType);
  };

  // Handle layout type change
  const handleLayoutTypeChange = (newLayoutType: LayoutType) => {
    setLayoutType(newLayoutType);
    if (canvasManager) {
      canvasManager.setLayoutType(newLayoutType);
    }
  };

  // Initialize canvas
  onMount(() => {
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    const canvasElem = canvas();
    if (canvasElem) {
      const context = canvasElem.getContext('2d');
      if (context) {
        // Create canvas manager instance
        canvasManager = new ScaleExplorerCanvas(selectedScale, setSelectedNote);
        canvasManager.initialize(canvasElem, context);
        canvasManager.setLayoutType(layoutType());
      }
    }
  });

  // Update hexagons when scale changes
  createEffect(() => {
    selectedScale(); // Track this signal
    if (canvasManager) {
      canvasManager.updateScale();
      setSelectedNote(null); // Reset selection when scale changes
    }
  });

  // Update selected note in canvas manager when it changes
  createEffect(() => {
    const note = selectedNote();
    if (canvasManager) {
      canvasManager.updateSelectedNote(note);
    }
  });

  // Cleanup
  onCleanup(() => {
    if (canvasManager) {
      canvasManager.cleanup();
    }
  });

  // Get active notes for the legend display
  const getActiveNotes = () => {
    if (!canvasManager) return { activeTouches: new Map(), activeMouseNote: null };
    return canvasManager.getActiveNotes();
  };

  return (
    <div class="flex flex-col p-2.5 min-h-screen bg-gray-900 text-white">
      <div class="text-center mb-5">
        <h1 class="text-2xl font-bold">🎵 Scale Explorer</h1>
        <div class={`text-sm mt-1 ${audioUnlocked() ? 'text-green-400' : 'text-yellow-400 animate-pulse'}`}>
          {audioUnlocked() ? '✓ Audio Ready' : 'Check if your device is unmuted'}
        </div>
      </div>

      {/* Scale selector */}
      <div class="flex justify-center gap-2 mb-4">
        {Object.keys(scales).map((scale) => (
          <button
            class={`px-3 py-1 rounded ${
              selectedScale() === scale ? 'bg-blue-500' : 'bg-gray-700'
            } transition-colors`}
            onClick={() => setSelectedScale(scale)}
          >
            {scale}
          </button>
        ))}
      </div>

      {/* Layout selector */}
      <div class="mb-4">
        <div class="text-center text-sm text-gray-300 mb-2">🔄 Layout</div>
        <div class="flex justify-center gap-2">
          {layoutOptions.map((option) => (
            <button
              class={`px-3 py-1 text-sm rounded transition-colors ${
                layoutType() === option.value
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleLayoutTypeChange(option.value)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div class="text-center text-xs text-gray-400 mt-1">
          {layoutOptions.find(opt => opt.value === layoutType())?.description}
        </div>
      </div>

      {/* Synth type selector */}
      <div class="mb-4">
        <div class="text-center text-sm text-gray-300 mb-2">🎛️ Synth Type</div>
        <div class="flex justify-center gap-2 flex-wrap">
          {synthOptions.map((option) => (
            <button
              class={`px-2 py-1 text-xs rounded transition-colors ${
                synthType() === option.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleSynthTypeChange(option.value)}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div class="text-center text-xs text-gray-400 mt-1">
          {synthOptions.find(opt => opt.value === synthType())?.description}
        </div>
      </div>

      {/* Interval legend */}
      {(() => {
        const activeNotes = getActiveNotes();
        const hasActiveNotes = selectedNote() !== null || activeNotes.activeTouches.size > 0 || activeNotes.activeMouseNote !== null;

        return hasActiveNotes && (
          <div class="text-center mb-4">
            <div class="text-sm text-gray-300 mb-2">Consonance with Playing Notes (brighter = more resonant):</div>
            <div class="flex justify-center gap-3 flex-wrap">
              {[
                { name: 'Unison', intensity: 1.0 },
                { name: 'Fifth', intensity: 0.9 },
                { name: 'Fourth', intensity: 0.75 },
                { name: 'Third', intensity: 0.6 },
                { name: 'Sixth', intensity: 0.5 },
                { name: 'Second', intensity: 0.3 },
                { name: 'Seventh', intensity: 0.25 }
              ].map((item) => {
                const alpha = 0.3 + (item.intensity * 0.7);
                return (
                  <div class="flex items-center gap-1">
                    <div
                      class="w-4 h-4 rounded border border-gray-500"
                      style={{
                        "background-color": `rgba(70, 130, 255, ${alpha})`
                      }}
                    ></div>
                    <span class="text-xs">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Canvas */}
      <div class="flex-grow flex justify-center">
        <canvas
          ref={setCanvas}
          class="border border-gray-600 rounded-lg cursor-pointer"
          style="touch-action: none;"
        />
      </div>

      {/* Instructions */}
      <div class="text-center mt-4 text-sm text-gray-400">
        Click any note to hear it and see interval relationships highlighted in color
      </div>
    </div>
  );
};

export default HexScaleExplorer;
