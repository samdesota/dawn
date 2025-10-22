import { createAtom } from "../../state/atom";
import * as Tone from "tone";

export interface NoteInfo {
  note: string;
  frequency: number;
  octave: number;
  midiNumber: number;
}

export type InstrumentType =
  | "piano"
  | "electric-piano"
  | "synthesizer"
  | "warm-pad"
  | "bright-keys"
  | "jazz-organ"
  | "soft-rhodes"
  | "mellow-pad";
export type NoteContext = "keyboard" | "chord" | "general";

export class AudioEngineState {
  // Tone.js instruments - separate synths for different contexts
  private keyboardSynth: Tone.PolySynth | null = null;
  private chordSynth: Tone.PolySynth | null = null;
  private generalSynth: Tone.PolySynth | null = null;

  // Effects chain
  private reverb: Tone.Reverb | null = null;
  private compressor: Tone.Compressor | null = null;
  private masterVolume: Tone.Volume | null = null;

  // Individual volume controls for each context
  private keyboardVolume: Tone.Volume | null = null;
  private chordVolume: Tone.Volume | null = null;
  private generalVolume: Tone.Volume | null = null;

  // Track active notes for declarative management
  private activeKeyboardNotes = new Map<
    string,
    { noteInfo: NoteInfo; velocity: number; startTime: number }
  >();

  // Configurable envelope timing (in seconds)
  public attackTime = 0.01; // 10ms attack
  public releaseTime = 0.03; // 30ms release
  public minimumSustainTime = 0.15; // 150ms minimum sustain time for taps

  // Reactive state atoms
  public volume = createAtom(0.5);
  public instrument = createAtom<InstrumentType>("piano"); // Legacy - now use keyboardInstrument
  public keyboardInstrument = createAtom<InstrumentType>("piano");
  public chordInstrument = createAtom<InstrumentType>("warm-pad");
  public reverbMix = createAtom(0.3);
  public isInitialized = createAtom(false);

  constructor() {
    this.initializeAudio();
    this.setupCallbacks();
  }

  private setupCallbacks() {
    // This will be called after imports are resolved
    // We'll import chordProgressionState dynamically to avoid circular dependency
    setTimeout(() => {
      import("./ChordProgressionState").then(({ chordProgressionState }) => {
        chordProgressionState.setInstrumentChangeCallback((settings) => {
          if (settings.keyboardInstrument) {
            this.setKeyboardInstrument(
              settings.keyboardInstrument as InstrumentType
            );
          }
          if (settings.chordInstrument) {
            this.setChordInstrument(settings.chordInstrument as InstrumentType);
          }
        });
      });
    }, 0);
  }

  private async initializeAudio() {
    try {
      console.log("Initializing Tone.js audio engine...");

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

      this.masterVolume = new Tone.Volume(Tone.gainToDb(this.volume()));

      // Create individual volume controls for each context
      this.keyboardVolume = new Tone.Volume(0);
      this.chordVolume = new Tone.Volume(0);
      this.generalVolume = new Tone.Volume(0);

      // Connect effects chain: reverb -> compressor -> master volume -> destination
      this.reverb.connect(this.compressor);
      this.compressor.connect(this.masterVolume);
      this.masterVolume.toDestination();

      // Create instruments for different contexts
      this.keyboardSynth = this.createSynthForInstrument(
        this.keyboardInstrument()
      );
      this.chordSynth = this.createSynthForInstrument(this.chordInstrument());
      this.generalSynth = this.createSynthForInstrument(this.instrument());

      // Connect synths through their individual volume controls, then to reverb
      this.keyboardSynth.connect(this.keyboardVolume);
      this.keyboardVolume.connect(this.reverb);

      this.chordSynth.connect(this.chordVolume);
      this.chordVolume.connect(this.reverb);

      this.generalSynth.connect(this.generalVolume);
      this.generalVolume.connect(this.reverb);

      console.log("Tone.js audio engine initialized successfully");
      console.log("Audio context state:", Tone.getContext().state);

      this.isInitialized.set(true);
    } catch (error) {
      console.error("Failed to initialize Tone.js audio engine:", error);
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
      case "piano":
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
            type: "sine",
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0.2,
            release: 0.1,
          },
          volume: -8,
        });

      case "electric-piano":
        return new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 2,
          oscillator: {
            type: "sine",
          },
          envelope: {
            ...envelope,
            decay: 0.2,
            sustain: 0.1,
          },
          modulation: {
            type: "triangle",
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.2,
            release: 0.1,
          },
          volume: -6,
        });

      case "synthesizer":
        // Sawtooth synth for classic synth sound
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "sawtooth",
          },
          envelope: {
            ...envelope,
            decay: 0.2,
            sustain: 0.5,
          },
          volume: -8,
        });

      case "warm-pad":
        // Warm pad sound with multiple oscillators
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "triangle8",
          },
          envelope: {
            attack: 0.3,
            decay: 0.2,
            sustain: 0.8,
            release: 1.5,
          },
          volume: -10,
        });

      case "bright-keys":
        // Bright, bell-like keys
        return new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 8,
          modulationIndex: 12,
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.1,
            release: 0.3,
          },
          modulation: {
            type: "sine",
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.1,
            release: 0.2,
          },
          volume: -6,
        });

      case "jazz-organ":
        // Jazz organ with drawbar-like sound
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "sine6",
          },
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.9,
            release: 0.2,
          },
          volume: -8,
        });

      case "soft-rhodes":
        // Soft Rhodes electric piano
        return new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 3,
          envelope: {
            attack: 0.02,
            decay: 0.3,
            sustain: 0.4,
            release: 0.8,
          },
          modulation: {
            type: "sine",
          },
          modulationEnvelope: {
            attack: 0.02,
            decay: 0.4,
            sustain: 0.3,
            release: 0.5,
          },
          volume: -8,
        });

      case "mellow-pad":
        // Mellow, sustained pad
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "sine",
          },
          envelope: {
            attack: 0.5,
            decay: 0.3,
            sustain: 0.3,
            release: 0.8,
          },
          volume: -8,
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
      console.log("Tone.js context started:", Tone.getContext().state);
    } catch (error) {
      console.error("Failed to start Tone.js context:", error);
    }
  }

  public noteToFrequency(note: string, octave: number = 4): number {
    const noteMap: { [key: string]: number } = {
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
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
      case "keyboard":
        return this.keyboardSynth;
      case "chord":
        return this.chordSynth;
      case "general":
        return this.generalSynth;
      default:
        return this.generalSynth;
    }
  }

  // Internal method for playing notes with context awareness
  private playNoteWithContext(
    noteInfo: NoteInfo,
    velocity: number = 1,
    context: NoteContext = "general",
    startTime?: number,
    duration?: number
  ) {
    console.log(
      "playNoteWithContext called:",
      noteInfo.note + noteInfo.octave,
      "velocity:",
      velocity,
      "context:",
      context,
      "startTime:",
      startTime
    );

    const synth = this.getSynthForContext(context);
    if (!synth) {
      console.warn("Synth not available for context:", context);
      return;
    }

    if (Tone.getContext().state !== "running") {
      console.warn(
        "Tone.js context not running, state:",
        Tone.getContext().state
      );
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
        const time =
          startTime !== undefined ? `+${startTime - Tone.now()}` : undefined;
        synth.triggerAttackRelease(toneNote, duration, time, toneVelocity);
        console.log(
          "Note triggered with duration:",
          noteKey,
          "duration:",
          duration
        );
      } else {
        // Play note indefinitely (until released)
        const time =
          startTime !== undefined ? `+${startTime - Tone.now()}` : undefined;
        synth.triggerAttack(toneNote, time, toneVelocity);
        console.log("Note triggered:", noteKey);
      }
    } catch (error) {
      console.error("Error playing note:", error);
    }
  }

  // Public API method - maintains backward compatibility
  public playNote(noteInfo: NoteInfo, velocity: number = 1) {
    this.playNoteWithContext(noteInfo, velocity, "general");
  }

  // New method for keyboard-specific notes
  public playKeyboardNote(noteInfo: NoteInfo, velocity: number = 1) {
    this.playNoteWithContext(noteInfo, velocity, "keyboard");
  }

  // New method for chord-specific notes
  public playChordNote(noteInfo: NoteInfo, velocity: number = 1) {
    this.playNoteWithContext(noteInfo, velocity, "chord");
  }

  // Internal method for stopping notes with context awareness
  private stopNoteWithContext(noteInfo: NoteInfo, context: NoteContext) {
    const noteKey = this.getNoteKey(noteInfo, context);
    const synth = this.getSynthForContext(context);
    const toneNote = this.noteInfoToToneNote(noteInfo);

    if (synth) {
      try {
        synth.triggerRelease(toneNote);
        console.log("Note released:", noteKey);
      } catch (error) {
        console.warn("Error releasing note:", error);
      }
    }
  }

  // Public API method - maintains backward compatibility
  public stopNote(noteInfo: NoteInfo) {
    this.stopNoteWithContext(noteInfo, "general");
  }

  // New method for stopping keyboard-specific notes
  public stopKeyboardNote(noteInfo: NoteInfo) {
    this.stopNoteWithContext(noteInfo, "keyboard");
  }

  // New method for stopping chord-specific notes
  public stopChordNote(noteInfo: NoteInfo) {
    this.stopNoteWithContext(noteInfo, "chord");
  }

  // Enhanced chord playing that doesn't interfere with keyboard notes
  public playChord(
    noteInfos: NoteInfo[],
    velocity: number = 1,
    duration: number = 1.0,
    scheduledTime?: number
  ) {
    console.log(
      "playChord called with",
      noteInfos.length,
      "notes, velocity:",
      velocity,
      "duration:",
      duration
    );

    const synth = this.getSynthForContext("chord");
    if (!synth) {
      console.warn("Chord synth not available");
      return;
    }

    if (Tone.getContext().state !== "running") {
      console.warn(
        "Tone.js context not running, state:",
        Tone.getContext().state
      );
      return;
    }

    try {
      const now = scheduledTime !== undefined ? scheduledTime : Tone.now();
      const toneVelocity = Math.max(0, Math.min(1, velocity));

      // Play each note in the chord with slight stagger (10ms)
      noteInfos.forEach((noteInfo, index) => {
        const toneNote = this.noteInfoToToneNote(noteInfo);
        const noteStartTime = now + index * 0.01; // 10ms stagger
        const timeString = `+${noteStartTime - Tone.now()}`;

        // Use triggerAttackRelease for automatic note off
        synth.triggerAttackRelease(
          toneNote,
          duration,
          timeString,
          toneVelocity
        );

        console.log("Chord note scheduled:", toneNote, "at:", noteStartTime);
      });
    } catch (error) {
      console.error("Error playing chord:", error);
    }
  }

  // Stop notes by context
  public stopAllNotes(context?: NoteContext) {
    console.log("stopAllNotes called, context:", context);

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

    if (context === "keyboard") {
      this.activeKeyboardNotes.clear();
    }

    console.log("Notes stopped");
  }

  // Stop only keyboard notes
  public stopAllKeyboardNotes() {
    this.stopAllNotes("keyboard");
  }

  // Stop only chord notes
  public stopAllChordNotes() {
    this.stopAllNotes("chord");
  }

  // Emergency method to force stop everything
  public emergencyStopAll() {
    console.warn("Emergency stop all notes called!");

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

      console.log("Audio engine reset complete");
    } catch (error) {
      console.error("Error in emergency stop:", error);
    }
  }

  // New declarative method to set which keyboard notes should be active
  public setActiveKeyboardNotes(
    activeNotes: Array<{ noteInfo: NoteInfo; velocity: number }>
  ) {
    console.log(
      "setActiveKeyboardNotes called with",
      activeNotes.length,
      "notes"
    );

    const synth = this.keyboardSynth;
    if (!synth) {
      console.warn("Keyboard synth not available");
      return;
    }

    if (Tone.getContext().state !== "running") {
      console.warn(
        "Tone.js context not running, state:",
        Tone.getContext().state
      );
      return;
    }

    const now = Tone.now();

    // Get current active keyboard notes
    const currentKeyboardNotes = new Set<string>();
    for (const [noteKey] of this.activeKeyboardNotes) {
      currentKeyboardNotes.add(noteKey);
    }

    // Get target notes that should be active
    const targetKeyboardNotes = new Set<string>();
    const targetNoteMap = new Map<
      string,
      { noteInfo: NoteInfo; velocity: number }
    >();

    for (const { noteInfo, velocity } of activeNotes) {
      const noteKey = this.getNoteKey(noteInfo, "keyboard");
      targetKeyboardNotes.add(noteKey);
      targetNoteMap.set(noteKey, { noteInfo, velocity });
    }

    // Stop notes that should no longer be playing (with minimum sustain check)
    for (const noteKey of currentKeyboardNotes) {
      if (!targetKeyboardNotes.has(noteKey)) {
        const data = this.activeKeyboardNotes.get(noteKey);
        if (data) {
          const timeElapsed = now - data.startTime;
          const remainingTime = this.minimumSustainTime - timeElapsed;

          if (remainingTime > 0) {
            // Mark note for deletion but keep it in the map temporarily
            // Schedule the note release after minimum sustain time
            const noteInfo = data.noteInfo;
            setTimeout(() => {
              // Check if the note is still in the map and hasn't been restarted
              const currentData = this.activeKeyboardNotes.get(noteKey);
              if (currentData && currentData.startTime === data.startTime) {
                this.stopKeyboardNote(noteInfo);
                this.activeKeyboardNotes.delete(noteKey);
              }
            }, remainingTime * 1000);
          } else {
            // Minimum sustain time has passed, stop immediately
            this.stopKeyboardNote(data.noteInfo);
            this.activeKeyboardNotes.delete(noteKey);
          }
        }
      }
    }

    // Start notes that should be playing but aren't
    for (const noteKey of targetKeyboardNotes) {
      if (!currentKeyboardNotes.has(noteKey)) {
        const target = targetNoteMap.get(noteKey);
        if (target) {
          this.playKeyboardNote(target.noteInfo, target.velocity);
          this.activeKeyboardNotes.set(noteKey, {
            ...target,
            startTime: now,
          });
        }
      }
    }

    console.log(
      "Active keyboard notes updated. Playing:",
      targetKeyboardNotes.size
    );
  }

  public setVolume(volume: number) {
    this.volume.set(Math.max(0, Math.min(1, volume)));
    if (this.masterVolume) {
      this.masterVolume.volume.value = Tone.gainToDb(this.volume());
    }
  }

  public setInstrument(instrument: InstrumentType) {
    this.instrument.set(instrument);
    this.keyboardInstrument.set(instrument); // Also update keyboard by default

    // Stop all notes before switching instruments
    this.emergencyStopAll();
  }

  public setKeyboardInstrument(instrument: InstrumentType) {
    this.keyboardInstrument.set(instrument);

    // Recreate keyboard synth
    this.stopAllKeyboardNotes();
    this.keyboardSynth?.dispose();
    this.keyboardSynth = this.createSynthForInstrument(instrument);

    // Reconnect through volume control to reverb
    if (this.keyboardVolume && this.reverb) {
      this.keyboardSynth.connect(this.keyboardVolume);
      this.keyboardVolume.connect(this.reverb);
    }

    console.log("Keyboard instrument changed to:", instrument);
  }

  public setChordInstrument(instrument: InstrumentType) {
    this.chordInstrument.set(instrument);

    // Recreate chord synth
    this.stopAllChordNotes();
    this.chordSynth?.dispose();
    this.chordSynth = this.createSynthForInstrument(instrument);

    // Reconnect through volume control to reverb
    if (this.chordVolume && this.reverb) {
      this.chordSynth.connect(this.chordVolume);
      this.chordVolume.connect(this.reverb);
    }

    console.log("Chord instrument changed to:", instrument);
  }

  public setChordSynthVolume(volumeDb: number) {
    if (this.chordVolume) {
      this.chordVolume.volume.value = volumeDb;
      console.log("Chord synth volume set to:", volumeDb, "dB");
    }
  }

  public setKeyboardSynthVolume(volumeDb: number) {
    if (this.keyboardVolume) {
      this.keyboardVolume.volume.value = volumeDb;
      console.log("Keyboard synth volume set to:", volumeDb, "dB");
    }
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
          },
        });
      }
    };

    updateEnvelope(this.keyboardSynth);
    updateEnvelope(this.chordSynth);
    updateEnvelope(this.generalSynth);

    console.log(
      `Envelope timing updated: attack=${this.attackTime}s, release=${this.releaseTime}s`
    );
  }

  // Method to configure minimum sustain time
  public setMinimumSustainTime(timeMs: number) {
    this.minimumSustainTime = Math.max(0, timeMs / 1000); // Convert to seconds, minimum 0ms
    console.log(`Minimum sustain time updated: ${this.minimumSustainTime}s`);
  }

  // New method to set ADSR envelope
  public setEnvelope(
    attack: number,
    decay: number,
    sustain: number,
    release: number
  ) {
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

    console.log("Envelope updated:", envelope);
  }

  // New method to set reverb decay
  public setReverbDecay(seconds: number) {
    if (this.reverb) {
      this.reverb.decay = Math.max(0.1, Math.min(10, seconds));
      console.log("Reverb decay set to:", this.reverb.decay);
    }
  }

  // Getters for envelope timing
  get currentAttackTime() {
    return this.attackTime * 1000;
  } // Return in milliseconds
  get currentReleaseTime() {
    return this.releaseTime * 1000;
  } // Return in milliseconds
  get currentMinimumSustainTime() {
    return this.minimumSustainTime * 1000;
  } // Return in milliseconds

  // Debug method to get active notes info
  public getActiveNotesInfo() {
    const info: { [context: string]: string[] } = {
      keyboard: Array.from(this.activeKeyboardNotes.keys()),
    };
    return info;
  }

  // Getters for computed values
  get currentVolume() {
    return this.volume();
  }
  get currentInstrument() {
    return this.instrument();
  }
  get currentKeyboardInstrument() {
    return this.keyboardInstrument();
  }
  get currentChordInstrument() {
    return this.chordInstrument();
  }
  get currentReverbMix() {
    return this.reverbMix();
  }
  get audioInitialized() {
    return this.isInitialized();
  }

  // Public getter for audio context (now returns Tone.js context)
  get getAudioContext() {
    return Tone.getContext().rawContext;
  }

  // Cleanup method
  public dispose() {
    console.log("Disposing audio engine...");

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

    console.log("Audio engine disposed");
  }
}

// Export singleton instance
export const audioEngineState = new AudioEngineState();
