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
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private activeNotes = new Map<string, {
    gainNode: GainNode;
    oscillators: OscillatorNode[]; // Store all oscillators for proper cleanup
  }>();

  // Reactive state atoms
  public volume = createAtom(0.5);
  public instrument = createAtom<InstrumentType>('piano');
  public reverbMix = createAtom(0.3);
  public isInitialized = createAtom(false);

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      // Create audio context with proper iOS handling
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      this.audioContext = new AudioContextClass();
      console.log('Audio context created:', this.audioContext.state);

      // Create compressor to prevent clipping
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume();

      // Connect: compressor -> master gain -> destination
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Create reverb (simple delay for now, can be enhanced with impulse response)
      this.reverbNode = this.audioContext.createConvolver();
      this.setupReverb();

      console.log('Audio engine initialized successfully');
      this.isInitialized.set(true);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.isInitialized.set(false);
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
    if (!this.audioContext) {
      console.warn('Audio context not initialized');
      return;
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed:', this.audioContext.state);
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    } else {
      console.log('Audio context state:', this.audioContext.state);
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
    console.log('playNote called:', noteInfo.note + noteInfo.octave, 'velocity:', velocity);

    if (!this.audioContext || !this.compressor) {
      console.warn('Audio context or compressor not available');
      return;
    }

    if (this.audioContext.state !== 'running') {
      console.warn('Audio context not running, state:', this.audioContext.state);
      return;
    }

    const noteKey = `${noteInfo.note}${noteInfo.octave}`;

    // Stop existing note if playing
    this.stopNote(noteInfo);

    // Create note-specific gain node
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.compressor); // Connect to compressor instead of master gain

    // Apply ADSR envelope with reduced levels to prevent clipping
    const now = this.audioContext.currentTime;
    const safeVelocity = Math.min(velocity, 1.0); // Clamp velocity to 1.0
    const baseGain = safeVelocity * 0.3; // Reduced base gain significantly

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(baseGain, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(baseGain * 0.8, now + 0.1); // Decay
    gainNode.gain.setValueAtTime(baseGain * 0.6, now + 0.1); // Sustain

    let oscillators: OscillatorNode[] = [];

    // Create sound based on instrument type
    switch (this.instrument()) {
      case 'piano':
        oscillators = this.createPianoSound(noteInfo.frequency, gainNode, now);
        break;
      case 'electric-piano':
        oscillators = this.createElectricPianoSound(noteInfo.frequency, gainNode, now);
        break;
      case 'synthesizer':
        oscillators = this.createSynthSound(noteInfo.frequency, gainNode, now);
        break;
    }

    // Store active note with all oscillators
    this.activeNotes.set(noteKey, { gainNode, oscillators });
    console.log('Note started:', noteKey, 'Active notes:', this.activeNotes.size);
  }

  private createPianoSound(frequency: number, gainNode: GainNode, startTime: number): OscillatorNode[] {
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

    // Mix harmonics with much lower levels to prevent clipping
    const fundamentalGain = this.audioContext.createGain();
    const harmonic2Gain = this.audioContext.createGain();
    const harmonic3Gain = this.audioContext.createGain();

    fundamentalGain.gain.value = 0.6; // Reduced from 1.0
    harmonic2Gain.gain.value = 0.15; // Reduced from 0.3
    harmonic3Gain.gain.value = 0.05; // Reduced from 0.1

    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);

    fundamentalGain.connect(gainNode);
    harmonic2Gain.connect(gainNode);
    harmonic3Gain.connect(gainNode);

    fundamental.start(startTime);
    harmonic2.start(startTime);
    harmonic3.start(startTime);

    return [fundamental, harmonic2, harmonic3]; // Return all oscillators
  }

  private createElectricPianoSound(frequency: number, gainNode: GainNode, startTime: number): OscillatorNode[] {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'square';

    // Add some filtering for electric piano character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.Q.setValueAtTime(1, startTime);

    // Add gain control to prevent clipping
    const oscGain = this.audioContext.createGain();
    oscGain.gain.value = 0.4; // Reduce gain to prevent clipping

    oscillator.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(gainNode);
    oscillator.start(startTime);

    return [oscillator]; // Return as array for consistency
  }

  private createSynthSound(frequency: number, gainNode: GainNode, startTime: number): OscillatorNode[] {
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

    // Add gain control to prevent clipping
    const oscGain = this.audioContext.createGain();
    oscGain.gain.value = 0.3; // Reduce gain to prevent clipping from sawtooth wave

    oscillator.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(gainNode);
    oscillator.start(startTime);

    return [oscillator]; // Return as array for consistency
  }

  public stopNote(noteInfo: NoteInfo) {
    const noteKey = `${noteInfo.note}${noteInfo.octave}`;
    const activeNote = this.activeNotes.get(noteKey);

    console.log('stopNote called:', noteKey, 'activeNote exists:', !!activeNote);

    if (activeNote && this.audioContext) {
      const now = this.audioContext.currentTime;

      // Apply release envelope
      activeNote.gainNode.gain.cancelScheduledValues(now);
      activeNote.gainNode.gain.setValueAtTime(activeNote.gainNode.gain.value, now);
      activeNote.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      // Stop ALL oscillators after release
      activeNote.oscillators.forEach(oscillator => {
        try {
          oscillator.stop(now + 0.3);
        } catch (error) {
          console.warn('Error stopping oscillator:', error);
        }
      });

      // Clean up immediately and also with timeout as backup
      this.activeNotes.delete(noteKey);
      console.log('Note stopped:', noteKey, 'Remaining active notes:', this.activeNotes.size);
    }
  }

  public stopAllNotes() {
    console.log('stopAllNotes called, active notes:', this.activeNotes.size);

    for (const [noteKey, activeNote] of this.activeNotes) {
      if (this.audioContext) {
        const now = this.audioContext.currentTime;

        // Immediately stop gain to silence the note
        activeNote.gainNode.gain.cancelScheduledValues(now);
        activeNote.gainNode.gain.setValueAtTime(0, now);

        // Stop all oscillators immediately
        activeNote.oscillators.forEach(oscillator => {
          try {
            oscillator.stop(now);
          } catch (error) {
            console.warn('Error force-stopping oscillator:', error);
          }
        });
      }
    }

    // Clear all active notes
    this.activeNotes.clear();
    console.log('All notes stopped, remaining active notes:', this.activeNotes.size);
  }

  // Emergency method to force stop everything
  public emergencyStopAll() {
    console.warn('Emergency stop all notes called!');

    // Try to stop all tracked notes first
    this.stopAllNotes();

    // If audio context exists, disconnect everything as last resort
    if (this.audioContext && this.compressor && this.masterGain) {
      try {
        this.masterGain.disconnect();
        this.compressor.disconnect();

        // Recreate the audio chain
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
        this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.volume();

        // Reconnect the chain
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        console.log('Audio chain recreated with compressor');
      } catch (error) {
        console.error('Error in emergency stop:', error);
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
