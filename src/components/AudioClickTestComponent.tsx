import { Component, createSignal } from 'solid-js';
import { audioEngineState, NoteInfo } from '../improviser/state/AudioEngineState';

interface TestMethod {
  id: string;
  name: string;
  description: string;
  testFunction: () => void;
}

export const AudioClickTestComponent: Component = () => {
  const [lastTestedMethod, setLastTestedMethod] = createSignal<string>('');
  const [isAudioReady, setIsAudioReady] = createSignal(false);

  // Test note - middle C
  const testNote: NoteInfo = {
    note: 'C',
    frequency: 261.63,
    octave: 4,
    midiNumber: 60
  };

  // Initialize audio context on first interaction
  const initializeAudio = async () => {
    await audioEngineState.resumeContext();
    setIsAudioReady(true);
  };

  // Method 1: Very gradual exponential attack (200ms)
  const testMethod1 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();
    gainNode.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;

    // Very gradual 200ms exponential attack
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 1);

    setLastTestedMethod('Method 1: Very gradual exponential attack (200ms)');
  };

  // Method 2: Linear attack with pre-delay
  const testMethod2 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();
    gainNode.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;

    // Linear attack with 10ms pre-delay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.setValueAtTime(0, now + 0.01); // 10ms delay
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15); // 140ms linear ramp

    oscillator.start(now);
    oscillator.stop(now + 1);

    setLastTestedMethod('Method 2: Linear attack with pre-delay');
  };

  // Method 3: Multiple exponential stages
  const testMethod3 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();
    gainNode.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;

    // Multiple exponential stages
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 1);

    setLastTestedMethod('Method 3: Multiple exponential stages');
  };

  // Method 4: Sine wave envelope shaping
  const testMethod4 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();
    gainNode.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;

    // Sine wave envelope (quarter sine for smooth attack)
    const attackTime = 0.1;
    const steps = 20;

    gainNode.gain.setValueAtTime(0, now);

    for (let i = 0; i <= steps; i++) {
      const time = now + (i / steps) * attackTime;
      const progress = i / steps;
      const sineValue = Math.sin(progress * Math.PI / 2); // Quarter sine wave
      const gainValue = Math.max(0.0001, sineValue * 0.2);
      gainNode.gain.exponentialRampToValueAtTime(gainValue, time);
    }

    oscillator.start(now);
    oscillator.stop(now + 1);

    setLastTestedMethod('Method 4: Sine wave envelope shaping');
  };

  // Method 5: High-frequency filtering + gentle attack
  const testMethod5 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();

    // Add low-pass filter to remove high-frequency artifacts
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(8000, audioContext.currentTime);
    filter.Q.setValueAtTime(0.5, audioContext.currentTime);

    gainNode.connect(filter);
    filter.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;

    // Gentle exponential attack with filtering
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.12);

    oscillator.start(now);
    oscillator.stop(now + 1);

    setLastTestedMethod('Method 5: High-frequency filtering + gentle attack');
  };

  // Method 6: DC offset removal + smooth attack
  const testMethod6 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();

    // Add high-pass filter to remove DC offset
    const dcFilter = audioContext.createBiquadFilter();
    dcFilter.type = 'highpass';
    dcFilter.frequency.setValueAtTime(20, audioContext.currentTime);
    dcFilter.Q.setValueAtTime(0.7, audioContext.currentTime);

    gainNode.connect(dcFilter);
    dcFilter.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;

    // Smooth attack with DC filtering
    gainNode.gain.setValueAtTime(0.00001, now); // Even lower start
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 1);

    setLastTestedMethod('Method 6: DC offset removal + smooth attack');
  };

  // Method 7: Exponential attack AND decay (100ms each)
  const testMethod7 = () => {
    if (!audioEngineState.audioInitialized) return;

    const audioContext = (audioEngineState as any).audioContext;
    const compressor = (audioEngineState as any).compressor;

    if (!audioContext || !compressor) return;

    const gainNode = audioContext.createGain();
    gainNode.connect(compressor);

    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(testNote.frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    oscillator.connect(gainNode);

    const now = audioContext.currentTime;
    const noteDuration = 1.0; // 1 second total
    const attackTime = 0.1; // 100ms attack
    const decayTime = 0.1; // 100ms decay
    const sustainStart = now + attackTime;
    const releaseStart = now + noteDuration - decayTime;

    // Exponential attack (100ms)
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + attackTime);

    // Sustain level
    gainNode.gain.setValueAtTime(0.2, sustainStart);
    gainNode.gain.setValueAtTime(0.2, releaseStart);

    // Exponential decay (100ms)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

    oscillator.start(now);
    oscillator.stop(now + noteDuration + 0.01); // Stop slightly after gain reaches zero

    setLastTestedMethod('Method 7: Exponential attack AND decay (100ms each)');
  };

  // Method 8: Current implementation for comparison
  const testCurrentImplementation = () => {
    audioEngineState.playNote(testNote, 0.8);
    setTimeout(() => {
      audioEngineState.stopNote(testNote);
    }, 1000);

    setLastTestedMethod('Current Implementation (for comparison)');
  };

  const testMethods: TestMethod[] = [
    {
      id: 'current',
      name: 'Current Implementation',
      description: 'Test the current audio engine implementation',
      testFunction: testCurrentImplementation
    },
    {
      id: 'method1',
      name: 'Very Gradual Attack',
      description: 'Exponential attack over 200ms with multiple stages',
      testFunction: testMethod1
    },
    {
      id: 'method2',
      name: 'Linear with Pre-delay',
      description: '10ms silence then 140ms linear ramp',
      testFunction: testMethod2
    },
    {
      id: 'method3',
      name: 'Multi-stage Exponential',
      description: 'Multiple exponential ramps for ultra-smooth attack',
      testFunction: testMethod3
    },
    {
      id: 'method4',
      name: 'Sine Wave Envelope',
      description: 'Quarter sine wave for natural attack curve',
      testFunction: testMethod4
    },
    {
      id: 'method5',
      name: 'Low-pass Filtered',
      description: 'Gentle attack with high-frequency filtering',
      testFunction: testMethod5
    },
    {
      id: 'method6',
      name: 'DC Offset Removal',
      description: 'High-pass filter to remove DC offset + smooth attack',
      testFunction: testMethod6
    },
    {
      id: 'method7',
      name: 'Attack + Decay (100ms)',
      description: 'Exponential attack AND decay over 100ms each',
      testFunction: testMethod7
    }
  ];

  return (
    <div class="audio-click-test bg-red-100 border-2 border-red-500 p-4 m-4 rounded-lg">
      <h2 class="text-xl font-bold text-red-800 mb-4">🔧 Audio Click Test Component</h2>

      {!isAudioReady() && (
        <div class="mb-4">
          <button
            onClick={initializeAudio}
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          >
            Initialize Audio Context
          </button>
          <p class="text-sm text-gray-600 mt-2">Click to enable audio testing</p>
        </div>
      )}

      {isAudioReady() && (
        <>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {testMethods.map((method) => (
              <div class="bg-white p-3 rounded border">
                <h3 class="font-semibold text-sm mb-1">{method.name}</h3>
                <p class="text-xs text-gray-600 mb-2">{method.description}</p>
                <button
                  onClick={method.testFunction}
                  class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm w-full"
                >
                  Test {method.id === 'current' ? 'Current' : method.id.replace('method', '#')}
                </button>
              </div>
            ))}
          </div>

          <div class="bg-yellow-50 border border-yellow-300 p-3 rounded">
            <h3 class="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
            <ol class="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Use headphones or good speakers to hear subtle clicks</li>
              <li>Test on your iPad specifically (mobile Safari)</li>
              <li>Try each method and note which ones eliminate the click</li>
              <li>Pay attention to the very beginning of each note</li>
              <li>Test with different volume levels</li>
            </ol>

            {lastTestedMethod() && (
              <div class="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <strong>Last tested:</strong> {lastTestedMethod()}
              </div>
            )}
          </div>

          <div class="mt-4 bg-gray-50 p-3 rounded">
            <h3 class="font-semibold text-gray-800 mb-2">Debug Info:</h3>
            <div class="text-xs text-gray-600 space-y-1">
              <div>Audio Context State: {audioEngineState.audioInitialized ? 'Initialized' : 'Not Ready'}</div>
              <div>User Agent: {navigator.userAgent.includes('iPad') ? 'iPad' : 'Other Device'}</div>
              <div>Active Notes: {JSON.stringify(audioEngineState.getActiveNotesInfo())}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
