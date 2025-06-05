import { createAtom } from '../../state/atom';
import { chordProgressionState } from './ChordProgressionState';
import type { NoteInfo } from './AudioEngineState';

export interface KeyInfo extends NoteInfo {
  noteType: 'triad' | 'pentatonic' | 'scale' | 'chromatic';
  chordRole?: 'root' | 'third' | 'fifth' | 'seventh' | 'extension';
  isHighlighted: boolean;
  width: number;
  height: number;
  position: number;
}

export class KeyboardState {
  // Reactive state atoms
  public octaveRange = createAtom([3, 5] as [number, number]); // Start with 3 octaves
  public keyWidth = createAtom(150); // Base key width in pixels
  public keyboardKeys = createAtom<KeyInfo[]>([]);

  // Note names including enharmonic equivalents
  private readonly chromaticNotes = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  private readonly enharmonicMap: { [key: string]: string } = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
  };

  constructor() {
    this.generateKeyboard();

    // Regenerate keyboard when chord changes
    // Note: In a real implementation, you'd want to use createEffect or similar
    // For now, we'll manually call updateHighlighting when needed
  }

  private generateKeyboard() {
    const keys: KeyInfo[] = [];
    const [startOctave, endOctave] = this.octaveRange();

    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (let i = 0; i < this.chromaticNotes.length; i++) {
        const note = this.chromaticNotes[i];
        const noteInfo = this.createNoteInfo(note, octave);
        const keyInfo = this.createKeyInfo(noteInfo);
        keys.push(keyInfo);
      }
    }

    // Apply the layered layout algorithm
    this.applyLayeredLayout(keys);
    this.keyboardKeys.set(keys);
  }

  private createNoteInfo(note: string, octave: number): NoteInfo {
    const frequency = this.noteToFrequency(note, octave);
    const midiNumber = this.noteToMIDI(note, octave);

    return {
      note,
      frequency,
      octave,
      midiNumber
    };
  }

  private createKeyInfo(noteInfo: NoteInfo): KeyInfo {
    const noteType = chordProgressionState.getNoteType(noteInfo.note);
    const chordRole = chordProgressionState.getChordToneRole(noteInfo.note);
    const isHighlighted = chordProgressionState.isNoteInCurrentChord(noteInfo.note);

    // Determine key dimensions based on note type hierarchy
    const dimensions = this.getKeyDimensions(noteType);

    return {
      ...noteInfo,
      noteType,
      chordRole,
      isHighlighted,
      width: dimensions.width,
      height: dimensions.height,
      position: 0 // Will be calculated in layout algorithm
    };
  }

  private getKeyDimensions(noteType: 'triad' | 'pentatonic' | 'scale' | 'chromatic') {
    const baseWidth = this.keyWidth();
    const baseHeight = 200; // Base height in pixels

    switch (noteType) {
      case 'triad':
        return { width: baseWidth, height: baseHeight }; // Full height, base layer
      case 'pentatonic':
        return { width: baseWidth * 0.8, height: baseHeight * 0.75 }; // 75% height, narrower
      case 'scale':
        return { width: baseWidth * 0.7, height: baseHeight * 0.6 }; // 60% height, narrower
      case 'chromatic':
        return { width: baseWidth * 0.6, height: baseHeight * 0.45 }; // 45% height, narrowest
      default:
        return { width: baseWidth, height: baseHeight };
    }
  }

  private applyLayeredLayout(keys: KeyInfo[]) {
    let currentPosition = 0;
    const groupedByOctave = this.groupKeysByOctave(keys);

    for (const octaveKeys of groupedByOctave) {
      currentPosition = this.layoutOctave(octaveKeys, currentPosition);
    }
  }

  private groupKeysByOctave(keys: KeyInfo[]): KeyInfo[][] {
    const groups: { [octave: number]: KeyInfo[] } = {};

    keys.forEach(key => {
      if (!groups[key.octave]) {
        groups[key.octave] = [];
      }
      groups[key.octave].push(key);
    });

    return Object.values(groups);
  }

  private layoutOctave(octaveKeys: KeyInfo[], startPosition: number): number {
    // Sort keys by chromatic order for consistent positioning
    const sortedKeys = [...octaveKeys].sort((a, b) =>
      this.chromaticNotes.indexOf(a.note) - this.chromaticNotes.indexOf(b.note)
    );

    // Phase 1: Place triad notes as the base layer
    const triadKeys = sortedKeys.filter(k => k.noteType === 'triad');
    let currentPos = startPosition;

    triadKeys.forEach(key => {
      key.position = currentPos;
      currentPos += key.width + 4; // Small gap between triad keys
    });

    // Phase 2: Position non-triad keys between triad keys, overlapping and centered
    const nonTriadKeys = sortedKeys.filter(k => k.noteType !== 'triad');

    nonTriadKeys.forEach(key => {
      key.position = this.findCenteredPosition(key, triadKeys, sortedKeys);
    });

    // Return the end position of this octave
    const maxTriadPosition = triadKeys.length > 0
      ? Math.max(...triadKeys.map(k => k.position + k.width))
      : startPosition;
    return maxTriadPosition + 10; // Gap between octaves
  }

  private findCenteredPosition(key: KeyInfo, triadKeys: KeyInfo[], allKeys: KeyInfo[]): number {
    if (triadKeys.length === 0) return 0;

    // Find the chromatic position of this key
    const keyIndex = this.chromaticNotes.indexOf(key.note);

    // Find the triad keys that this key should be positioned between
    const triadIndices = triadKeys.map(tk => ({
      key: tk,
      index: this.chromaticNotes.indexOf(tk.note)
    })).sort((a, b) => a.index - b.index);

    // Find the appropriate triad keys to center between
    let leftTriad: KeyInfo | null = null;
    let rightTriad: KeyInfo | null = null;

    for (let i = 0; i < triadIndices.length - 1; i++) {
      const current = triadIndices[i];
      const next = triadIndices[i + 1];

      if (keyIndex > current.index && keyIndex < next.index) {
        leftTriad = current.key;
        rightTriad = next.key;
        break;
      }
    }

    // Handle edge cases
    if (!leftTriad && !rightTriad) {
      // Key is outside the range of triad keys
      if (keyIndex < triadIndices[0].index) {
        // Before first triad - position to the left
        const firstTriad = triadIndices[0].key;
        return firstTriad.position - key.width - 2;
      } else {
        // After last triad - position to the right
        const lastTriad = triadIndices[triadIndices.length - 1].key;
        return lastTriad.position + lastTriad.width + 2;
      }
    }

    if (leftTriad && rightTriad) {
      // Center between two triad keys
      const leftEnd = leftTriad.position + leftTriad.width;
      const rightStart = rightTriad.position;
      const centerPoint = (leftEnd + rightStart) / 2;
      return centerPoint - (key.width / 2);
    }

    // Fallback: position at the end
    const lastTriad = triadKeys[triadKeys.length - 1];
    return lastTriad.position + lastTriad.width + 2;
  }

  public updateHighlighting() {
    const keys = this.keyboardKeys();
    const updatedKeys = keys.map(key => ({
      ...key,
      noteType: chordProgressionState.getNoteType(key.note),
      chordRole: chordProgressionState.getChordToneRole(key.note),
      isHighlighted: chordProgressionState.isNoteInCurrentChord(key.note)
    }));

    this.keyboardKeys.set(updatedKeys);
  }

  public findKeyByNote(note: string, octave: number): KeyInfo | undefined {
    return this.keyboardKeys().find(k => k.note === note && k.octave === octave);
  }

  public getKeyAtPosition(x: number): KeyInfo | undefined {
    return this.keyboardKeys().find(key =>
      x >= key.position && x <= key.position + key.width
    );
  }

  public setOctaveRange(start: number, end: number) {
    this.octaveRange.set([start, end]);
    this.generateKeyboard();
  }

  public setKeyWidth(width: number) {
    this.keyWidth.set(width);
    this.generateKeyboard();
  }

  // Helper methods
  private noteToFrequency(note: string, octave: number): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
      'A#': 10, 'Bb': 10, 'B': 11
    };

    const noteNumber = noteMap[note];
    if (noteNumber === undefined) return 440;

    return 440 * Math.pow(2, ((octave - 4) * 12 + noteNumber - 9) / 12);
  }

  private noteToMIDI(note: string, octave: number): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
      'A#': 10, 'Bb': 10, 'B': 11
    };

    const noteNumber = noteMap[note];
    if (noteNumber === undefined) return 60; // Middle C default

    return (octave + 1) * 12 + noteNumber;
  }

  public getDisplayNoteName(note: string): string {
    // Return enharmonic equivalent for sharp notes in certain contexts
    return this.enharmonicMap[note] || note;
  }

  // Getters for reactive values
  get keys() { return this.keyboardKeys(); }
  get octaveRangeValue() { return this.octaveRange(); }
  get keyWidthValue() { return this.keyWidth(); }
}

// Export singleton instance
export const keyboardState = new KeyboardState();
