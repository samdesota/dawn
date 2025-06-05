import { createAtom } from '../../state/atom';

export interface NoteInfo {
  note: string;
  frequency: number;
  octave: number;
  midiNumber: number;
}

export type InstrumentType = 'piano' | 'electric-piano' | 'synthesizer';
export type NoteContext = 'keyboard' | 'chord' | 'general';

// Encapsulated note playing class that manages its own lifecycle
class PlayingNote {
  private gainNode: GainNode;
  private oscillators: OscillatorNode[];
  private audioContext: AudioContext;
  private isActive: boolean = true;
  private isReleasing: boolean = false;
  private cleanupTimeout: number | undefined;
  private readonly context: NoteContext;
  private readonly startTime: number;
  private readonly noteKey: string;

  constructor(
    audioContext: AudioContext,
    compressor: DynamicsCompressorNode,
    noteInfo: NoteInfo,
    velocity: number,
    instrument: InstrumentType,
    attackTime: number,
    releaseTime: number,
    context: NoteContext,
    noteKey: string,
    startTime?: number
  ) {
    this.audioContext = audioContext;
    this.context = context;
    this.startTime = startTime ?? audioContext.currentTime;
    this.noteKey = noteKey;

    // Create note-specific gain node
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(compressor);

    // Smooth exponential attack envelope to prevent clicks
    const safeVelocity = Math.min(velocity, 1.0);
    const baseGain = safeVelocity * 0.3;

    // Exponential attack over configurable time
    this.gainNode.gain.setValueAtTime(0.0001, this.startTime); // Start very low to avoid clicks
    this.gainNode.gain.exponentialRampToValueAtTime(baseGain, this.startTime + attackTime);

    // Create sound based on instrument type
    switch (instrument) {
      case 'piano':
        this.oscillators = this.createPianoSound(noteInfo.frequency, this.startTime);
        break;
      case 'electric-piano':
        this.oscillators = this.createElectricPianoSound(noteInfo.frequency, this.startTime);
        break;
      case 'synthesizer':
        this.oscillators = this.createSynthSound(noteInfo.frequency, this.startTime);
        break;
      default:
        this.oscillators = this.createPianoSound(noteInfo.frequency, this.startTime);
        break;
    }

    console.log('PlayingNote created:', noteKey, 'oscillators:', this.oscillators.length, 'startTime:', this.startTime);
  }

  private createPianoSound(frequency: number, startTime: number): OscillatorNode[] {
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

    // Mix harmonics with controlled levels
    const fundamentalGain = this.audioContext.createGain();
    const harmonic2Gain = this.audioContext.createGain();
    const harmonic3Gain = this.audioContext.createGain();

    fundamentalGain.gain.value = 0.6;
    harmonic2Gain.gain.value = 0.15;
    harmonic3Gain.gain.value = 0.05;

    fundamental.connect(fundamentalGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);

    fundamentalGain.connect(this.gainNode);
    harmonic2Gain.connect(this.gainNode);
    harmonic3Gain.connect(this.gainNode);

    fundamental.start(startTime);
    harmonic2.start(startTime);
    harmonic3.start(startTime);

    return [fundamental, harmonic2, harmonic3];
  }

  private createElectricPianoSound(frequency: number, startTime: number): OscillatorNode[] {
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = 'square';

    // Add some filtering for electric piano character
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.Q.setValueAtTime(1, startTime);

    // Add gain control
    const oscGain = this.audioContext.createGain();
    oscGain.gain.value = 0.4;

    oscillator.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.gainNode);
    oscillator.start(startTime);

    return [oscillator];
  }

  private createSynthSound(frequency: number, startTime: number): OscillatorNode[] {
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

    // Add gain control
    const oscGain = this.audioContext.createGain();
    oscGain.gain.value = 0.3;

    oscillator.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.gainNode);
    oscillator.start(startTime);

    return [oscillator];
  }

  public scheduleStop(stopTime: number, releaseTime: number): void {
    if (!this.isActive || this.isReleasing) {
      return; // Already stopped or stopping
    }


    console.log('PlayingNote scheduling stop:', this.noteKey, 'at time:', stopTime);

    try {
      // Schedule smooth exponential release envelope at the specified time
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime + releaseTime);

      // Schedule oscillator stops after release
      this.oscillators.forEach((oscillator, index) => {
        try {
          oscillator.stop(stopTime + releaseTime + 0.01); // Stop slightly after release completes
        } catch (error) {
          console.warn(`Error scheduling oscillator ${index} stop for note ${this.noteKey}:`, error);
        }
      });

      // Calculate when cleanup should happen and schedule it
      const cleanupDelay = Math.max(0, (stopTime + releaseTime + 0.02 - this.audioContext.currentTime) * 1000);
      this.cleanupTimeout = window.setTimeout(() => {
        this.cleanup();
      }, cleanupDelay);

      // Mark as releasing when the scheduled time arrives
      const releaseDelay = Math.max(0, (stopTime - this.audioContext.currentTime) * 1000);
      setTimeout(() => {
        this.isReleasing = true;
      }, releaseDelay);

    } catch (error) {
      console.error(`Error scheduling stop for note ${this.noteKey}:`, error);
      // Force immediate cleanup on error
      this.cleanup();
    }
  }

  public stop(releaseTime: number): void {
    if (!this.isActive || this.isReleasing) {
      return; // Already stopped or stopping
    }

    this.isReleasing = true;
    const now = this.audioContext.currentTime;

    console.log('PlayingNote stopping:', this.noteKey);

    try {
      // Apply smooth exponential release envelope to prevent clicks
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

      // Stop all oscillators after release
      this.oscillators.forEach((oscillator, index) => {
        try {
          oscillator.stop(now + releaseTime + 0.01); // Stop slightly after release completes
        } catch (error) {
          console.warn(`Error stopping oscillator ${index} for note ${this.noteKey}:`, error);
        }
      });

      // Clean up after release completes
      this.cleanupTimeout = window.setTimeout(() => {
        this.cleanup();
      }, (releaseTime + 0.02) * 1000);

    } catch (error) {
      console.error(`Error stopping note ${this.noteKey}:`, error);
      // Force immediate cleanup on error
      this.cleanup();
    }
  }

  public forceStop(): void {
    if (!this.isActive) {
      return; // Already stopped
    }

    console.log('PlayingNote force stopping:', this.noteKey);

    this.isReleasing = true;
    const now = this.audioContext.currentTime;

    try {
      // Immediately stop gain to silence the note
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);

      // Stop all oscillators immediately
      this.oscillators.forEach((oscillator, index) => {
        try {
          oscillator.stop(now);
        } catch (error) {
          console.warn(`Error force-stopping oscillator ${index} for note ${this.noteKey}:`, error);
        }
      });
    } catch (error) {
      console.error(`Error force-stopping note ${this.noteKey}:`, error);
    } finally {
      // Always clean up immediately on force stop
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (!this.isActive) {
      return; // Already cleaned up
    }

    console.log('PlayingNote cleaning up:', this.noteKey);

    this.isActive = false;

    // Clear any pending cleanup timeout
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = undefined;
    }

    try {
      // Disconnect gain node from compressor
      this.gainNode.disconnect();
    } catch (error) {
      console.warn(`Error disconnecting gain node for note ${this.noteKey}:`, error);
    }

    // Clear references to help with garbage collection
    this.oscillators = [];
  }

  public isPlaying(): boolean {
    return this.isActive && !this.isReleasing;
  }

  public getContext(): NoteContext {
    return this.context;
  }

  public getStartTime(): number {
    return this.startTime;
  }

  public getNoteKey(): string {
    return this.noteKey;
  }
}

export class AudioEngineState {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  // Use PlayingNote instances instead of raw data
  private activeNotes = new Map<string, PlayingNote>();

  // Configurable envelope timing (in seconds)
  public attackTime = 0.03; // 30ms attack
  public releaseTime = 0.03; // 30ms release

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

  // Generate context-aware note key
  private getNoteKey(noteInfo: NoteInfo, context: NoteContext): string {
    return `${context}:${noteInfo.note}${noteInfo.octave}`;
  }

  // Internal method for playing notes with context awareness
  private playNoteWithContext(noteInfo: NoteInfo, velocity: number = 1, context: NoteContext = 'general', startTime?: number) {
    console.log('playNoteWithContext called:', noteInfo.note + noteInfo.octave, 'velocity:', velocity, 'context:', context, 'startTime:', startTime);

    if (!this.audioContext || !this.compressor) {
      console.warn('Audio context or compressor not available');
      return;
    }

    if (this.audioContext.state !== 'running') {
      console.warn('Audio context not running, state:', this.audioContext.state);
      return;
    }

    const noteKey = this.getNoteKey(noteInfo, context);

    // Stop existing note in the same context if playing
    this.stopNoteWithContext(noteInfo, context);

    // Create new PlayingNote instance
    try {
      const playingNote = new PlayingNote(
        this.audioContext,
        this.compressor,
        noteInfo,
        velocity,
        this.instrument(),
        this.attackTime,
        this.releaseTime,
        context,
        noteKey,
        startTime
      );

      // Store active note
      this.activeNotes.set(noteKey, playingNote);

      console.log('Note started:', noteKey, 'Active notes:', this.activeNotes.size);
    } catch (error) {
      console.error('Error creating PlayingNote:', error);
    }
  }

  // Public API method - maintains backward compatibility
  public playNote(noteInfo: NoteInfo, velocity: number = 1) {
    this.playNoteWithContext(noteInfo, velocity, 'general');
  }

  // New method for keyboard-specific notes
  public playKeyboardNote(noteInfo: NoteInfo, velocity: number = 1) {
    this.playNoteWithContext(noteInfo, velocity, 'keyboard');
  }

  // New method for chord-specific notes
  public playChordNote(noteInfo: NoteInfo, velocity: number = 1) {
    this.playNoteWithContext(noteInfo, velocity, 'chord');
  }

  // Internal method for stopping notes with context awareness
  private stopNoteWithContext(noteInfo: NoteInfo, context: NoteContext) {
    const noteKey = this.getNoteKey(noteInfo, context);
    const playingNote = this.activeNotes.get(noteKey);

    console.log('stopNoteWithContext called:', noteKey, 'playingNote exists:', !!playingNote);

    if (playingNote) {
      playingNote.stop(this.releaseTime);
      this.activeNotes.delete(noteKey);
      console.log('Note stopped:', noteKey, 'Remaining active notes:', this.activeNotes.size);
    }
  }

  // Public API method - maintains backward compatibility
  public stopNote(noteInfo: NoteInfo) {
    this.stopNoteWithContext(noteInfo, 'general');
  }

  // New method for stopping keyboard-specific notes
  public stopKeyboardNote(noteInfo: NoteInfo) {
    this.stopNoteWithContext(noteInfo, 'keyboard');
  }

  // New method for stopping chord-specific notes
  public stopChordNote(noteInfo: NoteInfo) {
    this.stopNoteWithContext(noteInfo, 'chord');
  }

  // Enhanced chord playing that doesn't interfere with keyboard notes
  public playChord(noteInfos: NoteInfo[], velocity: number = 1, duration: number = 1.0) {
    console.log('playChord called with', noteInfos.length, 'notes, velocity:', velocity, 'duration:', duration);

    if (!this.audioContext || !this.compressor) {
      console.warn('Audio context or compressor not available');
      return;
    }

    if (this.audioContext.state !== 'running') {
      console.warn('Audio context not running, state:', this.audioContext.state);
      return;
    }

    const now = this.audioContext.currentTime;

    // Play each note in the chord using Web Audio scheduling
    noteInfos.forEach((noteInfo, index) => {
      const noteStartTime = now + (index * 0.01); // 10ms stagger between notes

      // Stop existing note in chord context if playing
      this.stopNoteWithContext(noteInfo, 'chord');

      // Create new PlayingNote instance with scheduled start time
      try {
        const noteKey = this.getNoteKey(noteInfo, 'chord');
        const playingNote = new PlayingNote(
          this.audioContext!,
          this.compressor!,
          noteInfo,
          velocity,
          this.instrument(),
          this.attackTime,
          this.releaseTime,
          'chord',
          noteKey,
          noteStartTime
        );

        // Store active note
        this.activeNotes.set(noteKey, playingNote);

        // Schedule note stop if duration is specified
        if (duration > 0) {
          const stopTime = noteStartTime + duration;
          playingNote.scheduleStop(stopTime, this.releaseTime);
        }

        console.log('Chord note scheduled:', noteKey, 'start:', noteStartTime, 'stop:', duration > 0 ? noteStartTime + duration : 'none');
      } catch (error) {
        console.error('Error creating chord note:', error);
      }
    });
  }

  // Stop notes by context
  public stopAllNotes(context?: NoteContext) {
    console.log('stopAllNotes called, context:', context, 'active notes:', this.activeNotes.size);

    const notesToStop = context
      ? Array.from(this.activeNotes.entries()).filter(([key, note]) => note.getContext() === context)
      : Array.from(this.activeNotes.entries());

    for (const [noteKey, playingNote] of notesToStop) {
      playingNote.forceStop();
      this.activeNotes.delete(noteKey);
    }

    console.log('Notes stopped, remaining active notes:', this.activeNotes.size);
  }

  // Stop only keyboard notes
  public stopAllKeyboardNotes() {
    this.stopAllNotes('keyboard');
  }

  // Stop only chord notes
  public stopAllChordNotes() {
    this.stopAllNotes('chord');
  }

  // Emergency method to force stop everything
  public emergencyStopAll() {
    console.warn('Emergency stop all notes called!');

    // Force stop all tracked notes
    for (const [noteKey, playingNote] of this.activeNotes) {
      playingNote.forceStop();
    }
    this.activeNotes.clear();

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

  // New declarative method to set which keyboard notes should be active
  public setActiveKeyboardNotes(activeNotes: Array<{ noteInfo: NoteInfo; velocity: number }>) {
    console.log('setActiveKeyboardNotes called with', activeNotes.length, 'notes');

    if (!this.audioContext || !this.compressor) {
      console.warn('Audio context or compressor not available');
      return;
    }

    if (this.audioContext.state !== 'running') {
      console.warn('Audio context not running, state:', this.audioContext.state);
      return;
    }

    // Get all currently active keyboard notes
    const currentKeyboardNotes = new Set<string>();
    for (const [noteKey, playingNote] of this.activeNotes) {
      if (playingNote.getContext() === 'keyboard') {
        currentKeyboardNotes.add(noteKey);
      }
    }

    // Get all notes that should be active
    const targetKeyboardNotes = new Set<string>();
    const targetNoteMap = new Map<string, { noteInfo: NoteInfo; velocity: number }>();

    for (const { noteInfo, velocity } of activeNotes) {
      const noteKey = this.getNoteKey(noteInfo, 'keyboard');
      targetKeyboardNotes.add(noteKey);
      targetNoteMap.set(noteKey, { noteInfo, velocity });
    }

    // Stop notes that should no longer be playing
    for (const noteKey of currentKeyboardNotes) {
      if (!targetKeyboardNotes.has(noteKey)) {
        const playingNote = this.activeNotes.get(noteKey);
        if (playingNote) {
          playingNote.stop(this.releaseTime);
          this.activeNotes.delete(noteKey);
        }
      }
    }

    // Start notes that should be playing but aren't
    for (const noteKey of targetKeyboardNotes) {
      if (!currentKeyboardNotes.has(noteKey)) {
        const target = targetNoteMap.get(noteKey);
        if (target) {
          this.playNoteWithContext(target.noteInfo, target.velocity, 'keyboard');
        }
      }
    }

    console.log('Active keyboard notes updated. Playing:', targetKeyboardNotes.size, 'Total active:', this.activeNotes.size);
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

  // Method to configure envelope timing
  public setEnvelopeTiming(attackTimeMs: number, releaseTimeMs: number) {
    this.attackTime = Math.max(0.001, attackTimeMs / 1000); // Convert to seconds, minimum 1ms
    this.releaseTime = Math.max(0.001, releaseTimeMs / 1000); // Convert to seconds, minimum 1ms
    console.log(`Envelope timing updated: attack=${this.attackTime}s, release=${this.releaseTime}s`);
  }

  // Getters for envelope timing
  get currentAttackTime() { return this.attackTime * 1000; } // Return in milliseconds
  get currentReleaseTime() { return this.releaseTime * 1000; } // Return in milliseconds

  // Debug method to get active notes info
  public getActiveNotesInfo() {
    const info: { [context: string]: string[] } = {};
    for (const [key, playingNote] of this.activeNotes) {
      const context = playingNote.getContext();
      if (!info[context]) info[context] = [];
      info[context].push(key);
    }
    return info;
  }

  // Getters for computed values
  get currentVolume() { return this.volume(); }
  get currentInstrument() { return this.instrument(); }
  get currentReverbMix() { return this.reverbMix(); }
  get audioInitialized() { return this.isInitialized(); }

  // Public getter for audio context
  get getAudioContext() { return this.audioContext; }
}

// Export singleton instance
export const audioEngineState = new AudioEngineState();

