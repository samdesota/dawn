import { createAtom } from "../../state/atom";
import { chordProgressionState } from "./ChordProgressionState";
import { audioEngineState, NoteInfo } from "./AudioEngineState";
import * as Tone from "tone";

export interface RhythmPattern {
  name: string;
  description: string;
  pattern: boolean[]; // true = play chord, false = rest (per 16th note)
  velocity: number[]; // velocity for each hit (0-1)
}

export class ChordCompingState {
  // Reactive state atoms
  public isEnabled = createAtom(false);
  public selectedRhythm = createAtom<string>("basic-quarter");
  public volume = createAtom(0.6);
  public voicing = createAtom<"close" | "open" | "rootless">("close");
  public swingAmount = createAtom(0.5); // 0.5 = straight (50/50), 0.67 = triplet swing (67/33)

  // Built-in rhythm patterns (16th note resolution)
  private readonly rhythmPatterns: RhythmPattern[] = [
    {
      name: "basic-quarter",
      description: "Quarter Notes",
      pattern: [
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
      ],
      velocity: [0.8, 0, 0, 0, 0.8, 0, 0, 0, 0.8, 0, 0, 0, 0.8, 0, 0, 0],
    },
    {
      name: "basic-whole",
      description: "Whole Notes",
      pattern: [
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
      velocity: [0.8, 0, 0, 0, 0.8, 0, 0, 0, 0.8, 0, 0, 0, 0.8, 0, 0, 0],
    },
    {
      name: "basic-half",
      description: "Half Notes",
      pattern: [
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
      velocity: [0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: "jazz-swing",
      description: "Jazz Swing",
      pattern: [
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        false,
      ],
      velocity: [0.8, 0, 0, 0.6, 0, 0, 0.7, 0, 0, 0.6, 0, 0, 0.8, 0, 0, 0],
    },
    {
      name: "latin-montuno",
      description: "Latin Montuno",
      pattern: [
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
      ],
      velocity: [
        0.8, 0, 0.6, 0, 0, 0.7, 0, 0.6, 0.8, 0, 0.6, 0, 0, 0.7, 0, 0.6,
      ],
    },
    {
      name: "reggae-skank",
      description: "Reggae Skank",
      pattern: [
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
      ],
      velocity: [0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0],
    },
    {
      name: "funk-16th",
      description: "Funk 16th",
      pattern: [
        true,
        false,
        true,
        true,
        false,
        true,
        false,
        true,
        true,
        false,
        true,
        true,
        false,
        true,
        false,
        true,
      ],
      velocity: [
        0.9, 0, 0.6, 0.7, 0, 0.6, 0, 0.7, 0.9, 0, 0.6, 0.7, 0, 0.6, 0, 0.7,
      ],
    },
    {
      name: "ballad-whole",
      description: "Ballad Whole Notes",
      pattern: [
        true,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
      velocity: [1.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      name: "bossa-nova",
      description: "Bossa Nova",
      pattern: [
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        false,
      ],
      velocity: [0.7, 0, 0, 0.5, 0, 0.6, 0, 0, 0.7, 0, 0, 0.5, 0, 0.6, 0, 0],
    },
  ];

  // Tone.Transport event ID for cleanup
  private compingEventId: number | null = null;
  private currentStep = 0;

  constructor() {
    // Initialize with basic quarter note pattern

    // Register callback to listen for song changes that include default settings
    chordProgressionState.setCompingSettingsCallback(
      (settings: { swing?: number; rhythm?: string }) => {
        if (settings.swing !== undefined) {
          this.setSwingAmount(settings.swing);
        }
        if (settings.rhythm !== undefined) {
          this.setRhythm(settings.rhythm);
        }
      }
    );
  }

  public enable() {
    this.isEnabled.set(true);
    // Ensure audio context is ready
    audioEngineState.resumeContext();
    this.startComping();
  }

  public disable() {
    this.isEnabled.set(false);
    this.stopComping();
  }

  public pause() {
    // Pause comping without resetting the step position
    if (this.compingEventId !== null) {
      Tone.getTransport().clear(this.compingEventId);
      this.compingEventId = null;
    }
    // Stop chord notes but keep currentStep intact
    audioEngineState.stopAllChordNotes();
  }

  public resume() {
    // Resume comping from current step position
    if (this.compingEventId !== null) {
      return; // Already running
    }

    // Ensure audio context is ready
    audioEngineState.resumeContext();

    // Schedule repeating 16th note event without resetting currentStep
    this.compingEventId = Tone.getTransport().scheduleRepeat((time) => {
      this.onStep(time);
    }, "16n"); // 16th note timing

    // Start transport if not already running
    if (Tone.getTransport().state !== "started") {
      Tone.getTransport().start();
    }

    console.log("Chord comping resumed at step:", this.currentStep);
  }

  public toggle() {
    if (this.isEnabled()) {
      this.disable();
    } else {
      this.enable();
    }
  }

  public setRhythm(rhythmName: string) {
    const pattern = this.rhythmPatterns.find((p) => p.name === rhythmName);
    if (pattern) {
      this.selectedRhythm.set(rhythmName);

      // Restart comping if currently enabled
      if (this.isEnabled()) {
        this.stopComping();
        this.startComping();
      }
    }
  }

  public setVolume(volume: number) {
    this.volume.set(Math.max(0, Math.min(1, volume)));
  }

  public setVoicing(voicing: "close" | "open" | "rootless") {
    this.voicing.set(voicing);
  }

  public setSwingAmount(amount: number) {
    // Clamp between 0.5 (straight) and 0.75 (heavy swing)
    this.swingAmount.set(Math.max(0.5, Math.min(0.75, amount)));
  }

  private startComping() {
    this.stopComping(); // Clear any existing event

    // Set transport BPM
    Tone.getTransport().bpm.value = chordProgressionState.tempoValue;

    this.currentStep = 0;

    // Schedule repeating 16th note event
    // We schedule at 16th notes but apply swing timing offset in onStep
    this.compingEventId = Tone.getTransport().scheduleRepeat((time) => {
      this.onStep(time);
    }, "16n"); // 16th note timing

    // Start transport if not already running
    if (Tone.getTransport().state !== "started") {
      Tone.getTransport().start();
    }

    console.log(
      "Chord comping started with Tone.Transport at BPM:",
      Tone.getTransport().bpm.value,
      "Swing:",
      this.swingAmount()
    );
  }

  private stopComping() {
    if (this.compingEventId !== null) {
      Tone.getTransport().clear(this.compingEventId);
      this.compingEventId = null;
    }
    // Only stop chord notes when actually disabling comping
    audioEngineState.stopAllChordNotes();
  }

  private onStep(time: number) {
    const pattern = this.getCurrentPattern();
    if (!pattern) return;

    const stepIndex = this.currentStep % pattern.pattern.length;
    const shouldPlay = pattern.pattern[stepIndex];
    const velocity = pattern.velocity[stepIndex];

    if (shouldPlay && velocity > 0) {
      // Calculate swing timing offset
      // Swing affects the off-beats (2nd and 4th of each pair of 8th notes)
      const swingOffset = this.calculateSwingOffset(stepIndex);
      this.playCurrentChord(velocity, time + swingOffset);
    }

    this.currentStep++;
  }

  private calculateSwingOffset(stepIndex: number): number {
    // Only apply swing to off-beat 8th notes (steps 2, 6, 10, 14 in 16th note grid)
    // These are the "and" beats in 8th note swing
    const isOffBeatEighth = stepIndex % 4 === 2;

    if (!isOffBeatEighth || this.swingAmount() === 0.5) {
      return 0; // No offset for on-beats or when swing is off
    }

    const bpm = chordProgressionState.tempoValue;
    const sixteenthNoteDuration = 60 / bpm / 4; // Duration of one 16th note in seconds

    // Swing ratio determines how much to delay the off-beat
    // 0.5 = straight (no delay)
    // 0.67 = triplet swing (delay by 1/3 of an 8th note)
    // The delay is: (swingAmount - 0.5) * 2 * sixteenthNoteDuration
    // This shifts the off-beat later in time
    const swingDelay = (this.swingAmount() - 0.5) * 2 * sixteenthNoteDuration;

    return swingDelay;
  }

  private playCurrentChord(velocity: number, time: number) {
    const currentChord = chordProgressionState.getCurrentChord();
    if (!currentChord) return;

    // Get chord voicing
    const chordNotes = this.getChordVoicing(currentChord.notes);

    // Calculate note duration based on rhythm pattern
    const bpm = chordProgressionState.tempoValue;
    const sixteenthNoteDuration = 60 / bpm / 4; // Duration of one 16th note in seconds

    // Set chord note duration - make it slightly longer than the beat to allow natural overlap
    const noteDuration = sixteenthNoteDuration * 4.2; // Slightly longer than a quarter note

    // Apply comping volume
    const adjustedVelocity = velocity * this.volume();

    // Use scheduled time from Tone.Transport for precise timing
    audioEngineState.playChord(
      chordNotes,
      adjustedVelocity,
      noteDuration,
      time
    );
  }

  private getChordVoicing(chordNotes: string[]): NoteInfo[] {
    const voicing = this.voicing();
    const octave = 4; // Middle octave

    switch (voicing) {
      case "close":
        // Close voicing - all notes in same octave
        return chordNotes.map((note, index) => ({
          note,
          frequency: audioEngineState.noteToFrequency(note, octave),
          octave,
          midiNumber: this.noteToMidi(note, octave),
        }));

      case "open":
        // Open voicing - spread notes across octaves
        return chordNotes.map((note, index) => {
          const noteOctave = octave + Math.floor(index / 2);
          return {
            note,
            frequency: audioEngineState.noteToFrequency(note, noteOctave),
            octave: noteOctave,
            midiNumber: this.noteToMidi(note, noteOctave),
          };
        });

      case "rootless":
        // Rootless voicing - skip the root note
        const rootlessNotes = chordNotes.slice(1); // Remove first note (root)
        return rootlessNotes.map((note, index) => ({
          note,
          frequency: audioEngineState.noteToFrequency(note, octave),
          octave,
          midiNumber: this.noteToMidi(note, octave),
        }));

      default:
        return [];
    }
  }

  private noteToMidi(note: string, octave: number): number {
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

    const noteNumber = noteMap[note] || 0;
    return (octave + 1) * 12 + noteNumber;
  }

  // Public getters
  public getAvailableRhythms(): RhythmPattern[] {
    return [...this.rhythmPatterns];
  }

  public getCurrentRhythmName(): string {
    return this.selectedRhythm();
  }

  public getCurrentRhythmDescription(): string {
    const pattern = this.getCurrentPattern();
    return pattern ? pattern.description : "";
  }

  public getCurrentPattern(): RhythmPattern | null {
    return (
      this.rhythmPatterns.find((p) => p.name === this.selectedRhythm()) || null
    );
  }

  public syncWithTempo() {
    // Update Tone.Transport BPM
    Tone.getTransport().bpm.value = chordProgressionState.tempoValue;

    // Restart comping with current tempo if enabled
    // Note: With Tone.Transport, tempo changes are handled automatically
    // but we may want to restart to reset the pattern phase
    if (this.isEnabled()) {
      this.stopComping();
      this.startComping();
    }
  }

  // Reactive getters
  get isEnabledValue() {
    return this.isEnabled();
  }
  get selectedRhythmValue() {
    return this.selectedRhythm();
  }
  get volumeValue() {
    return this.volume();
  }
  get voicingValue() {
    return this.voicing();
  }
  get swingAmountValue() {
    return this.swingAmount();
  }
}

// Export singleton instance
export const chordCompingState = new ChordCompingState();
