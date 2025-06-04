import { scales, progressions } from './musicData';

// Define interfaces for active notes tracking
interface ActiveNote {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  noteIndex: number;
  additionalOscillators?: OscillatorNode[]; // For additive synthesis
}

// Synth types available
export type SynthType = 'sine' | 'sawtooth' | 'square' | 'triangle' | 'warm' | 'bright' | 'organ';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private baseFreq: number = 16.3516; // C0 - lowest C on piano
  private audioInitialized: boolean = false;
  private activeNotes: Map<number, ActiveNote> = new Map(); // Track active notes by noteIndex
  private synthType: SynthType = 'sine'; // Default synth type

  // Initialize audio context
  initAudio() {
    // For iOS Safari, we need to initialize audio on a user interaction
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // On iOS, the context might be suspended by default
    if (this.audioContext.state === 'suspended') {
      // Try to resume the context
      const resumePromise = this.audioContext.resume();

      // Handle the promise to ensure we know if it succeeds
      resumePromise.then(() => {
        console.log('AudioContext resumed successfully');
        this.audioInitialized = true;
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    } else {
      this.audioInitialized = true;
    }

    return this.audioContext;
  }

  // Set the synth type
  setSynthType(type: SynthType) {
    this.synthType = type;
    console.log(`🎛️ Synth type changed to: ${type}`);
  }

  // Get current synth type
  getSynthType(): SynthType {
    return this.synthType;
  }

  // Create oscillator(s) based on synth type
  private createSynthOscillators(frequency: number): {
    mainOscillator: OscillatorNode,
    additionalOscillators: OscillatorNode[],
    gainNode: GainNode
  } {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const mainOscillator = this.audioContext.createOscillator();
    const additionalOscillators: OscillatorNode[] = [];
    const gainNode = this.audioContext.createGain();

    switch (this.synthType) {
      case 'sine':
        mainOscillator.type = 'sine';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        break;

      case 'sawtooth':
        mainOscillator.type = 'sawtooth';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        break;

      case 'square':
        mainOscillator.type = 'square';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        break;

      case 'triangle':
        mainOscillator.type = 'triangle';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        break;

      case 'warm':
        // Warm pad: fundamental + soft harmonics
        mainOscillator.type = 'sine';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Add harmonics at lower volumes
        const harmonics = [2, 3, 4];
        const volumes = [0.3, 0.2, 0.1];

        harmonics.forEach((harmonic, index) => {
          const osc = this.audioContext!.createOscillator();
          const harmonicGain = this.audioContext!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency * harmonic, this.audioContext!.currentTime);
          harmonicGain.gain.setValueAtTime(volumes[index], this.audioContext!.currentTime);

          osc.connect(harmonicGain);
          harmonicGain.connect(gainNode);

          additionalOscillators.push(osc);
        });
        break;

      case 'bright':
        // Bright lead: sawtooth + high harmonics
        mainOscillator.type = 'sawtooth';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Add bright harmonics
        const brightHarmonics = [2, 4, 8];
        const brightVolumes = [0.4, 0.25, 0.15];

        brightHarmonics.forEach((harmonic, index) => {
          const osc = this.audioContext!.createOscillator();
          const harmonicGain = this.audioContext!.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(frequency * harmonic, this.audioContext!.currentTime);
          harmonicGain.gain.setValueAtTime(brightVolumes[index], this.audioContext!.currentTime);

          osc.connect(harmonicGain);
          harmonicGain.connect(gainNode);

          additionalOscillators.push(osc);
        });
        break;

      case 'organ':
        // Organ: multiple sine waves at specific harmonic ratios
        mainOscillator.type = 'sine';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Classic organ harmonics (drawbar style)
        const organHarmonics = [2, 3, 4, 5, 6, 8];
        const organVolumes = [0.8, 0.6, 0.4, 0.3, 0.2, 0.15];

        organHarmonics.forEach((harmonic, index) => {
          const osc = this.audioContext!.createOscillator();
          const harmonicGain = this.audioContext!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency * harmonic, this.audioContext!.currentTime);
          harmonicGain.gain.setValueAtTime(organVolumes[index], this.audioContext!.currentTime);

          osc.connect(harmonicGain);
          harmonicGain.connect(gainNode);

          additionalOscillators.push(osc);
        });
        break;

      default:
        mainOscillator.type = 'sine';
        mainOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    }

    // Connect main oscillator
    mainOscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    return { mainOscillator, additionalOscillators, gainNode };
  }

  // Start playing a sustained note
  startNote(noteIndex: number) {
    if (!this.audioContext || !this.audioInitialized) {
      // Try to initialize again, in case this is being called from a user interaction
      this.initAudio();
      // If still not initialized, return without playing
      if (!this.audioInitialized) {
        console.warn('Cannot play note: AudioContext not initialized');
        return;
      }
    }

    // If note is already playing, stop it first to avoid overlapping
    if (this.activeNotes.has(noteIndex)) {
      this.stopNote(noteIndex);
    }

    const frequency = this.getFrequency(noteIndex);
    const { mainOscillator, additionalOscillators, gainNode } = this.createSynthOscillators(frequency);

    // Set initial gain (volume) - adjust based on synth type
    let baseVolume = 0.1;
    if (this.synthType === 'organ' || this.synthType === 'warm') {
      baseVolume = 0.06; // Lower volume for complex sounds
    } else if (this.synthType === 'bright') {
      baseVolume = 0.08;
    }

    gainNode.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);

    // Start all oscillators
    mainOscillator.start(this.audioContext.currentTime);
    additionalOscillators.forEach(osc => osc.start(this.audioContext.currentTime));

    // Store the active note
    this.activeNotes.set(noteIndex, {
      oscillator: mainOscillator,
      gainNode,
      noteIndex,
      additionalOscillators
    });
  }

  // Stop a sustained note
  stopNote(noteIndex: number) {
    const activeNote = this.activeNotes.get(noteIndex);
    if (!activeNote) return;

    const { gainNode, oscillator, additionalOscillators } = activeNote;

    // Fade out the note (50ms release)
    const releaseTime = 0.05;
    gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + releaseTime);

    // Schedule all oscillators to stop after fade out
    setTimeout(() => {
      oscillator.stop();
      additionalOscillators?.forEach(osc => osc.stop());
      // Remove from active notes
      this.activeNotes.delete(noteIndex);
    }, releaseTime * 1000);
  }

  // For backward compatibility - non-sustained notes
  playNote(frequency: number, duration: number = 0.5) {
    if (!this.audioContext || !this.audioInitialized) {
      // Try to initialize again, in case this is being called from a user interaction
      this.initAudio();
      // If still not initialized, return without playing
      if (!this.audioInitialized) {
        console.warn('Cannot play note: AudioContext not initialized');
        return;
      }
    }

    const { mainOscillator, additionalOscillators, gainNode } = this.createSynthOscillators(frequency);

    // Set volume based on synth type
    let baseVolume = 0.1;
    if (this.synthType === 'organ' || this.synthType === 'warm') {
      baseVolume = 0.06;
    } else if (this.synthType === 'bright') {
      baseVolume = 0.08;
    }

    gainNode.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    mainOscillator.start(this.audioContext.currentTime);
    mainOscillator.stop(this.audioContext.currentTime + duration);

    additionalOscillators.forEach(osc => {
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + duration);
    });
  }

  // Play chord
  playChord(chordNotes: number[], duration: number = 1.5) {
    // Make sure audio is initialized before playing
    if (!this.audioContext || !this.audioInitialized) {
      this.initAudio();
    }

    chordNotes.forEach((note, index) => {
      setTimeout(() => this.playNote(note, duration), index * 50);
    });
  }

  // Stop all currently playing notes
  stopAllNotes() {
    for (const noteIndex of this.activeNotes.keys()) {
      this.stopNote(noteIndex);
    }
  }

  // Get frequency from note index (where noteIndex 0 = C0, 12 = C1, 24 = C2, etc.)
  getFrequency(noteIndex: number) {
    // Standard formula: frequency = baseFreq * 2^(noteIndex/12)
    // Where baseFreq is C0 (16.3516 Hz) and noteIndex 0 = C0
    return this.baseFreq * Math.pow(2, noteIndex / 12);
  }

  // Get chord notes based on scale and chord index
  getChordNotes(scale: string, chordRoot: number) {
    const scaleNotes = scales[scale as keyof typeof scales];
    return [
      this.getFrequency(scaleNotes[chordRoot % scaleNotes.length]),
      this.getFrequency(scaleNotes[(chordRoot + 2) % scaleNotes.length]),
      this.getFrequency(scaleNotes[(chordRoot + 4) % scaleNotes.length])
    ];
  }

  // Check if a note is currently playing
  isNotePlaying(noteIndex: number): boolean {
    return this.activeNotes.has(noteIndex);
  }
}

// Create a singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;
