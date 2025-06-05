import { createAtom } from '../../state/atom';

export interface NoteInfo {
  note: string;
  frequency: number;
  octave: number;
  midiNumber: number;
}

export type InstrumentType = 'piano' | 'electric-piano' | 'synthesizer';

export class AudioEngineState {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private activeNotes = new Map<string, { gainNode: GainNode; oscillator?: OscillatorNode }>();

  // Reactive state atoms
  public volume = createAtom(0.7);
  public instrument = createAtom<InstrumentType>('piano');
  public reverbMix = createAtom(0.3);
  public isInitialized = createAtom(false);

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume();

      // Create reverb (simple delay for now, can be enhanced with impulse response)
      this.reverbNode = this.audioContext.createConvolver();
      this.setupReverb();

      this.isInitialized.set(true);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private setupReverb() {
    if (!this.audioContext || !this.reverbNode) return;

    // Create impulse response for reverb
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2; // 2 second reverb
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.reverbNode.buffer = impulse;
  }

  public async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public noteToFrequency(note: string, octave: number = 4): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
      'A#': 10, 'Bb': 10, 'B': 11
    };

    const noteNumber = noteMap[note];
    if (noteNumber === undefined) return 440; // Default to A4

    return 440 * Math.pow(2, ((octave - 4) * 12 + noteNumber - 9) / 12);
  }

  public playNote(noteInfo: NoteInfo, velocity: number = 1) {
    if (!this.audioContext || !this.masterGain) return;

    const noteKey = `${noteInfo.note}${noteInfo.octave}`;

    // Stop existing note if playing
    this.stopNote(noteInfo);

    // Create note-specific gain node
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    // Apply ADSR envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.8, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(velocity * 0.6, now + 0.1); // Decay
    gainNode.gain.setValueAtTime(velocity * 0.4, now + 0.1); // Sustain

    let oscillator: OscillatorNode | undefined;

    // Create sound based on instrument type
    switch (this.instrument()) {
      case 'piano':
        oscillator = this.createPianoSound(noteInfo.frequency, gainNode, now);
        break;
      case 'electric-piano':
        oscillator = this.createElectricPianoSound(noteInfo.frequency, gainNode, now);
        break;
      case 'synthesizer':
        oscillator = this.createSynthSound(noteInfo.frequency, gainNode, now);
        break;
    }

    // Store active note
    this.activeNotes.set(noteKey, { gainNode, oscillator });
  }

  private createPianoSound(frequency: number, gainNode: GainNode, startTime: number): OscillatorNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    // Create multiple harmonics for richer piano sound
    const fundamental = this.audioContext.createOscillator();
    const harmonic2 = this.audioContext.createOscillator();
    const harmonic3 = this.audioContext.createOscillator();

    fundamental.frequency.setValueAtTime(frequency, startTime);
    harmonic2.frequency.setValueAtTime(frequency * 2, startTime);
    harmonic3.frequency.setValueAtTime(frequency * 3, startTime);

    fundamental.type = 'triangle';
    harmonic2.type = 'sine';
    harmonic3.type = 'sine';

    // Mix harmonics with different levels
    const fundamentalGain = this.audioContext.createGain();
    const harmonic2Gain = this.audioContext.createGain();
    const harmonic3Gain = this.audioContext.createGain();

    fundamentalGain.gain.value = 1.0;
    harmonic2Gain.gain.value = 0.3;
    harmonic3Gain.gain.value = 0.1;

    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);

    fundamentalGain.connect(gainNode);
    harmonic2Gain.connect(gainNode);
    harmonic3Gain.connect(gainNode);

    fundamental.start(startTime);
    harmonic2.start(startTime);
    harmonic3.start(startTime);

    return fundamental; // Return main oscillator for reference
  }

  private createElectricPianoSound(frequency: number, gainNode: GainNode, startTime: number): OscillatorNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'square';

    // Add some filtering for electric piano character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.Q.setValueAtTime(2, startTime);

    oscillator.connect(filter);
    filter.connect(gainNode);
    oscillator.start(startTime);

    return oscillator;
  }

  private createSynthSound(frequency: number, gainNode: GainNode, startTime: number): OscillatorNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'sawtooth';

    // Add LPF with envelope
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, startTime);
    filter.frequency.exponentialRampToValueAtTime(2000, startTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(800, startTime + 0.3);
    filter.Q.setValueAtTime(10, startTime);

    oscillator.connect(filter);
    filter.connect(gainNode);
    oscillator.start(startTime);

    return oscillator;
  }

  public stopNote(noteInfo: NoteInfo) {
    const noteKey = `${noteInfo.note}${noteInfo.octave}`;
    const activeNote = this.activeNotes.get(noteKey);

    if (activeNote && this.audioContext) {
      const now = this.audioContext.currentTime;

      // Apply release envelope
      activeNote.gainNode.gain.cancelScheduledValues(now);
      activeNote.gainNode.gain.setValueAtTime(activeNote.gainNode.gain.value, now);
      activeNote.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      // Stop oscillator after release
      if (activeNote.oscillator) {
        activeNote.oscillator.stop(now + 0.3);
      }

      // Clean up
      setTimeout(() => {
        this.activeNotes.delete(noteKey);
      }, 300);
    }
  }

  public stopAllNotes() {
    for (const [noteKey, _] of this.activeNotes) {
      const [note, octaveStr] = noteKey.match(/([A-G][#b]?)(\d+)/)?.slice(1) || [];
      if (note && octaveStr) {
        this.stopNote({
          note,
          octave: parseInt(octaveStr),
          frequency: 0,
          midiNumber: 0
        });
      }
    }
  }

  public setVolume(volume: number) {
    this.volume.set(Math.max(0, Math.min(1, volume)));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume(), this.audioContext?.currentTime || 0);
    }
  }

  public setInstrument(instrument: InstrumentType) {
    this.instrument.set(instrument);
  }

  public setReverbMix(mix: number) {
    this.reverbMix.set(Math.max(0, Math.min(1, mix)));
    // TODO: Implement reverb mixing
  }

  // Getters for computed values
  get currentVolume() { return this.volume(); }
  get currentInstrument() { return this.instrument(); }
  get currentReverbMix() { return this.reverbMix(); }
  get audioInitialized() { return this.isInitialized(); }
}

// Export singleton instance
export const audioEngineState = new AudioEngineState();
