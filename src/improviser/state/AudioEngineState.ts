import { createAtom } from '../../state/atom';
import * as Tone from 'tone';

export interface NoteInfo {
  note: string;
  frequency: number;
  octave: number;
  midiNumber: number;
}

export type InstrumentType = 'piano' | 'electric-piano' | 'synthesizer';
export type NoteContext = 'keyboard' | 'chord' | 'general';

export class AudioEngineState {
  // Tone.js instruments - separate synths for different contexts
  private keyboardSynth: Tone.PolySynth | null = null;
  private chordSynth: Tone.PolySynth | null = null;
  private generalSynth: Tone.PolySynth | null = null;

  // Effects chain
  private reverb: Tone.Reverb | null = null;
  private compressor: Tone.Compressor | null = null;
  private masterVolume: Tone.Volume | null = null;

  // Track active notes for declarative management
  private activeKeyboardNotes = new Map<string, { noteInfo: NoteInfo; velocity: number }>();

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
      console.log('Initializing Tone.js audio engine...');

      // Create effects chain
      this.compressor = new Tone.Compressor({
        threshold: -24,
        ratio: 12,
        attack: 0.003,
        release: 0.25,
      });

      this.reverb = new Tone.Reverb({
        decay: 2,
        wet: this.reverbMix(),
      });

      this.masterVolume = new Tone.Volume(
        Tone.gainToDb(this.volume())
      );

      // Connect effects chain: reverb -> compressor -> volume -> destination
      this.reverb.connect(this.compressor);
      this.compressor.connect(this.masterVolume);
      this.masterVolume.toDestination();

      // Create instruments for different contexts
      this.keyboardSynth = this.createSynthForInstrument(this.instrument());
      this.chordSynth = this.createSynthForInstrument(this.instrument());
      this.generalSynth = this.createSynthForInstrument(this.instrument());

      // Connect all synths to reverb (which connects to the chain)
      this.keyboardSynth.connect(this.reverb);
      this.chordSynth.connect(this.reverb);
      this.generalSynth.connect(this.reverb);

      console.log('Tone.js audio engine initialized successfully');
      console.log('Audio context state:', Tone.getContext().state);
      
      this.isInitialized.set(true);
    } catch (error) {
      console.error('Failed to initialize Tone.js audio engine:', error);
      this.isInitialized.set(false);
    }
  }

  private createSynthForInstrument(instrument: InstrumentType): Tone.PolySynth {
    const envelope = {
      attack: this.attackTime,
      decay: 0.1,
      sustain: 0.3,
      release: this.releaseTime,
    };

    switch (instrument) {
      case 'piano':
        // FM synthesis creates bell-like, piano-ish tones
        return new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 3,
          modulationIndex: 10,
          envelope: {
            ...envelope,
            decay: 0.3,
            sustain: 0.1,
          },
          modulation: {
            type: 'sine',
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0.2,
            release: 0.1,
          },
          volume: -8,
        });

      case 'electric-piano':
        // AM synthesis for electric piano character
        return new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 2,
          envelope: {
            ...envelope,
            decay: 0.2,
            sustain: 0.3,
          },
          modulation: {
            type: 'square',
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.2,
            release: 0.1,
          },
          volume: -6,
        });

      case 'synthesizer':
        // Sawtooth synth for classic synth sound
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sawtooth',
          },
          envelope: {
            ...envelope,
            decay: 0.2,
            sustain: 0.5,
          },
          volume: -6,
        });

      default:
        return new Tone.PolySynth(Tone.Synth, {
          envelope,
        });
    }
  }

  public async resumeContext() {
    try {
      await Tone.start();
      console.log('Tone.js context started:', Tone.getContext().state);
    } catch (error) {
      console.error('Failed to start Tone.js context:', error);
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

  // Convert NoteInfo to Tone.js note format (e.g., "C4", "A#3")
  private noteInfoToToneNote(noteInfo: NoteInfo): string {
    return `${noteInfo.note}${noteInfo.octave}`;
  }

  // Get the appropriate synth for the context
  private getSynthForContext(context: NoteContext): Tone.PolySynth | null {
    switch (context) {
      case 'keyboard':
        return this.keyboardSynth;
      case 'chord':
        return this.chordSynth;
      case 'general':
        return this.generalSynth;
      default:
        return this.generalSynth;
    }
  }

  // Internal method for playing notes with context awareness
  private playNoteWithContext(
    noteInfo: NoteInfo,
    velocity: number = 1,
    context: NoteContext = 'general',
    startTime?: number,
    duration?: number
  ) {
    console.log('playNoteWithContext called:', noteInfo.note + noteInfo.octave, 'velocity:', velocity, 'context:', context, 'startTime:', startTime);

    const synth = this.getSynthForContext(context);
    if (!synth) {
      console.warn('Synth not available for context:', context);
      return;
    }

    if (Tone.getContext().state !== 'running') {
      console.warn('Tone.js context not running, state:', Tone.getContext().state);
      return;
    }

    const noteKey = this.getNoteKey(noteInfo, context);
    const toneNote = this.noteInfoToToneNote(noteInfo);

    // Stop existing note in the same context if playing
    this.stopNoteWithContext(noteInfo, context);

    try {
      // Convert velocity to Tone.js velocity (0-1 range)
      const toneVelocity = Math.max(0, Math.min(1, velocity));

      if (duration !== undefined) {
        // Play note with specified duration
        const time = startTime !== undefined ? `+${startTime - Tone.now()}` : undefined;
        synth.triggerAttackRelease(toneNote, duration, time, toneVelocity);
        console.log('Note triggered with duration:', noteKey, 'duration:', duration);
      } else {
        // Play note indefinitely (until released)
        const time = startTime !== undefined ? `+${startTime - Tone.now()}` : undefined;
        synth.triggerAttack(toneNote, time, toneVelocity);
        console.log('Note triggered:', noteKey);
      }
    } catch (error) {
      console.error('Error playing note:', error);
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
    const synth = this.getSynthForContext(context);
    const toneNote = this.noteInfoToToneNote(noteInfo);

    console.log('stopNoteWithContext called:', noteKey);

    if (synth) {
      try {
        synth.triggerRelease(toneNote);
        console.log('Note released:', noteKey);
      } catch (error) {
        console.warn('Error releasing note:', error);
      }
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
  public playChord(
    noteInfos: NoteInfo[],
    velocity: number = 1,
    duration: number = 1.0,
    scheduledTime?: number
  ) {
    console.log('playChord called with', noteInfos.length, 'notes, velocity:', velocity, 'duration:', duration);

    const synth = this.getSynthForContext('chord');
    if (!synth) {
      console.warn('Chord synth not available');
      return;
    }

    if (Tone.getContext().state !== 'running') {
      console.warn('Tone.js context not running, state:', Tone.getContext().state);
      return;
    }

    try {
      const now = scheduledTime !== undefined ? scheduledTime : Tone.now();
      const toneVelocity = Math.max(0, Math.min(1, velocity));

      // Play each note in the chord with slight stagger (10ms)
      noteInfos.forEach((noteInfo, index) => {
        const toneNote = this.noteInfoToToneNote(noteInfo);
        const noteStartTime = now + (index * 0.01); // 10ms stagger
        const timeString = `+${noteStartTime - Tone.now()}`;

        // Use triggerAttackRelease for automatic note off
        synth.triggerAttackRelease(toneNote, duration, timeString, toneVelocity);
        
        console.log('Chord note scheduled:', toneNote, 'at:', noteStartTime);
      });
    } catch (error) {
      console.error('Error playing chord:', error);
    }
  }

  // Stop notes by context
  public stopAllNotes(context?: NoteContext) {
    console.log('stopAllNotes called, context:', context);

    if (context) {
      const synth = this.getSynthForContext(context);
      if (synth) {
        synth.releaseAll();
      }
    } else {
      // Stop all synths
      this.keyboardSynth?.releaseAll();
      this.chordSynth?.releaseAll();
      this.generalSynth?.releaseAll();
    }

    console.log('Notes stopped');
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

    try {
      // Force release all notes on all synths
      this.keyboardSynth?.releaseAll();
      this.chordSynth?.releaseAll();
      this.generalSynth?.releaseAll();

      // Dispose and recreate synths for complete reset
      this.keyboardSynth?.dispose();
      this.chordSynth?.dispose();
      this.generalSynth?.dispose();

      // Recreate synths
      const currentInstrument = this.instrument();
      this.keyboardSynth = this.createSynthForInstrument(currentInstrument);
      this.chordSynth = this.createSynthForInstrument(currentInstrument);
      this.generalSynth = this.createSynthForInstrument(currentInstrument);

      // Reconnect to effects chain
      if (this.reverb) {
        this.keyboardSynth.connect(this.reverb);
        this.chordSynth.connect(this.reverb);
        this.generalSynth.connect(this.reverb);
      }

      console.log('Audio engine reset complete');
    } catch (error) {
      console.error('Error in emergency stop:', error);
    }
  }

  // New declarative method to set which keyboard notes should be active
  public setActiveKeyboardNotes(activeNotes: Array<{ noteInfo: NoteInfo; velocity: number }>) {
    console.log('setActiveKeyboardNotes called with', activeNotes.length, 'notes');

    const synth = this.keyboardSynth;
    if (!synth) {
      console.warn('Keyboard synth not available');
      return;
    }

    if (Tone.getContext().state !== 'running') {
      console.warn('Tone.js context not running, state:', Tone.getContext().state);
      return;
    }

    // Get current active keyboard notes
    const currentKeyboardNotes = new Set<string>();
    for (const [noteKey] of this.activeKeyboardNotes) {
      currentKeyboardNotes.add(noteKey);
    }

    // Get target notes that should be active
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
        const data = this.activeKeyboardNotes.get(noteKey);
        if (data) {
          this.stopKeyboardNote(data.noteInfo);
          this.activeKeyboardNotes.delete(noteKey);
        }
      }
    }

    // Start notes that should be playing but aren't
    for (const noteKey of targetKeyboardNotes) {
      if (!currentKeyboardNotes.has(noteKey)) {
        const target = targetNoteMap.get(noteKey);
        if (target) {
          this.playKeyboardNote(target.noteInfo, target.velocity);
          this.activeKeyboardNotes.set(noteKey, target);
        }
      }
    }

    console.log('Active keyboard notes updated. Playing:', targetKeyboardNotes.size);
  }

  public setVolume(volume: number) {
    this.volume.set(Math.max(0, Math.min(1, volume)));
    if (this.masterVolume) {
      this.masterVolume.volume.value = Tone.gainToDb(this.volume());
    }
  }

  public setInstrument(instrument: InstrumentType) {
    this.instrument.set(instrument);
    
    // Stop all notes before switching instruments
    this.emergencyStopAll();
  }

  public setReverbMix(mix: number) {
    this.reverbMix.set(Math.max(0, Math.min(1, mix)));
    if (this.reverb) {
      this.reverb.wet.value = this.reverbMix();
    }
  }

  // Method to configure envelope timing
  public setEnvelopeTiming(attackTimeMs: number, releaseTimeMs: number) {
    this.attackTime = Math.max(0.001, attackTimeMs / 1000); // Convert to seconds, minimum 1ms
    this.releaseTime = Math.max(0.001, releaseTimeMs / 1000); // Convert to seconds, minimum 1ms
    
    // Update envelope on all synths
    const updateEnvelope = (synth: Tone.PolySynth | null) => {
      if (synth) {
        synth.set({
          envelope: {
            attack: this.attackTime,
            release: this.releaseTime,
          }
        });
      }
    };

    updateEnvelope(this.keyboardSynth);
    updateEnvelope(this.chordSynth);
    updateEnvelope(this.generalSynth);

    console.log(`Envelope timing updated: attack=${this.attackTime}s, release=${this.releaseTime}s`);
  }

  // New method to set ADSR envelope
  public setEnvelope(attack: number, decay: number, sustain: number, release: number) {
    const envelope = {
      attack: Math.max(0.001, attack),
      decay: Math.max(0.001, decay),
      sustain: Math.max(0, Math.min(1, sustain)),
      release: Math.max(0.001, release),
    };

    // Update envelope on all synths
    const updateEnvelope = (synth: Tone.PolySynth | null) => {
      if (synth) {
        synth.set({ envelope });
      }
    };

    updateEnvelope(this.keyboardSynth);
    updateEnvelope(this.chordSynth);
    updateEnvelope(this.generalSynth);

    // Update our stored values
    this.attackTime = envelope.attack;
    this.releaseTime = envelope.release;

    console.log('Envelope updated:', envelope);
  }

  // New method to set reverb decay
  public setReverbDecay(seconds: number) {
    if (this.reverb) {
      this.reverb.decay = Math.max(0.1, Math.min(10, seconds));
      console.log('Reverb decay set to:', this.reverb.decay);
    }
  }

  // Getters for envelope timing
  get currentAttackTime() { return this.attackTime * 1000; } // Return in milliseconds
  get currentReleaseTime() { return this.releaseTime * 1000; } // Return in milliseconds

  // Debug method to get active notes info
  public getActiveNotesInfo() {
    const info: { [context: string]: string[] } = {
      keyboard: Array.from(this.activeKeyboardNotes.keys()),
    };
    return info;
  }

  // Getters for computed values
  get currentVolume() { return this.volume(); }
  get currentInstrument() { return this.instrument(); }
  get currentReverbMix() { return this.reverbMix(); }
  get audioInitialized() { return this.isInitialized(); }

  // Public getter for audio context (now returns Tone.js context)
  get getAudioContext() { return Tone.getContext().rawContext; }

  // Cleanup method
  public dispose() {
    console.log('Disposing audio engine...');
    
    this.keyboardSynth?.dispose();
    this.chordSynth?.dispose();
    this.generalSynth?.dispose();
    this.reverb?.dispose();
    this.compressor?.dispose();
    this.masterVolume?.dispose();

    this.keyboardSynth = null;
    this.chordSynth = null;
    this.generalSynth = null;
    this.reverb = null;
    this.compressor = null;
    this.masterVolume = null;

    console.log('Audio engine disposed');
  }
}

// Export singleton instance
export const audioEngineState = new AudioEngineState();
