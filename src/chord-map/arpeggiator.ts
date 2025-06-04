import { createEffect } from "solid-js";
import { createAtom } from "../state/atom";
import { AudioEngine } from "./audioEngine";
import { ArpeggioPattern } from "./musicTheory";

export class Arpeggiator {
  private audioEngine: AudioEngine;
  private intervalId: number | null = null;
  private currentStep: number = 0;
  private octave: number = 4;

  // Atoms for arpeggiator state
  private enabled = createAtom(false);
  private pattern = createAtom<ArpeggioPattern | null>(null);
  private tempo = createAtom(120); // BPM
  private currentChord = createAtom<number[]>([]);
  private keyIndex = createAtom(0);

  constructor(
    audioEngine: AudioEngine,
    initialPattern: ArpeggioPattern,
    initialTempo: number = 120,
  ) {
    this.audioEngine = audioEngine;
    this.pattern.set(initialPattern);
    this.tempo.set(initialTempo);

    // Effect to handle start/stop based on enabled state and chord availability
    createEffect(() => {
      const isEnabled = this.enabled();
      const chord = this.currentChord();

      if (isEnabled && chord.length > 0) {
        this.startArpeggiator();
      } else if (!isEnabled && this.intervalId !== null) {
        this.stopArpeggiator();
      }
    });
  }

  // Public API methods
  public isEnabled(): boolean {
    return this.enabled();
  }

  public toggleEnabled(): void {
    this.enabled.set(!this.enabled());
  }

  public getCurrentPattern(): ArpeggioPattern | null {
    return this.pattern();
  }

  public setPattern(newPattern: ArpeggioPattern): void {
    this.pattern.set(newPattern);
  }

  public getCurrentTempo(): number {
    return this.tempo();
  }

  public setTempo(newTempo: number): void {
    this.tempo.set(newTempo);

    // If arpeggiator is running, update the interval timing
    if (this.enabled() && this.intervalId !== null) {
      this.stopArpeggiator();
      this.startArpeggiator();
    }
  }

  public setChord(
    notes: number[],
    noteKeyIndex: number,
    octave: number = 4,
  ): void {
    console.log(notes);
    this.currentChord.set(notes);
    this.keyIndex.set(noteKeyIndex);
    this.octave = octave;
  }

  public getCurrentChord(): number[] {
    return this.currentChord();
  }

  public cleanup(): void {
    this.stopArpeggiator();
  }

  // Private implementation methods
  private startArpeggiator(): void {
    const chordNotes = this.currentChord();
    if (chordNotes.length === 0) return;

    this.stopArpeggiator(); // Clear any existing interval

    const currentPattern = this.pattern();
    if (!currentPattern) return;

    const isRandom = currentPattern.pattern.length === 0;
    const intervalTime = 60000 / this.tempo() / 4; // 16th notes

    // Generate a pattern based on the number of notes in the chord
    let effectivePattern: number[] = [];
    if (isRandom) {
      // Random pattern will be created on each step
      effectivePattern = [];
    } else {
      // Use the pattern generator to create a pattern specific to this chord's note count
      effectivePattern = currentPattern.generatePattern(chordNotes.length);

      // Safety check - if pattern is empty, create a simple up pattern
      if (effectivePattern.length === 0) {
        for (let i = 0; i < chordNotes.length; i++) {
          effectivePattern.push(i);
        }
      }
    }

    this.currentStep = 0;
    this.intervalId = window.setInterval(() => {
      const currentChordNotes = this.currentChord();
      if (!this.enabled() || currentChordNotes.length === 0) {
        this.stopArpeggiator();
        return;
      }

      let noteIndex;
      if (isRandom) {
        noteIndex = Math.floor(Math.random() * currentChordNotes.length);
      } else {
        noteIndex =
          effectivePattern[this.currentStep % effectivePattern.length];
      }

      this.playArpeggioNote(noteIndex);
      this.currentStep++;
    }, intervalTime) as unknown as number;
  }

  private stopArpeggiator(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private playArpeggioNote(noteIndex: number): void {
    if (!this.audioEngine.getContext()) return;

    const currentChordNotes = this.currentChord();
    const currentKeyIndex = this.keyIndex();

    // Handle case where noteIndex is out of bounds
    if (noteIndex >= currentChordNotes.length) {
      // If the pattern index is too large for the chord, skip this note
      // This can happen when using a pattern for 9th chords with a triad
      return;
    }

    // Calculate the actual MIDI note number
    const midiNote =
      currentKeyIndex + currentChordNotes[noteIndex] + this.octave * 12;

    // Play the note with a short duration
    const noteDuration = (60 / this.tempo()) * 0.8; // 80% of beat duration
    this.audioEngine.playNote(midiNote, noteDuration, 0.2, "sine");
  }
}
