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
  public keyWidth = createAtom(60); // Base key width in pixels
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
        return { width: baseWidth * 1.2, height: baseHeight }; // 100% height, thickest
      case 'pentatonic':
        return { width: baseWidth * 1.0, height: baseHeight * 0.8 }; // 80% height
      case 'scale':
        return { width: baseWidth * 0.8, height: baseHeight * 0.6 }; // 60% height
      case 'chromatic':
        return { width: baseWidth * 0.6, height: baseHeight * 0.4 }; // 40% height
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
    // Sort keys by hierarchy: triads first, then pentatonic, scale, chromatic
    const hierarchyOrder = { triad: 0, pentatonic: 1, scale: 2, chromatic: 3 };
    const sortedKeys = [...octaveKeys].sort((a, b) => {
      const aOrder = hierarchyOrder[a.noteType];
      const bOrder = hierarchyOrder[b.noteType];
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Within same hierarchy, sort by chromatic order
      return this.chromaticNotes.indexOf(a.note) - this.chromaticNotes.indexOf(b.note);
    });

    let currentPos = startPosition;

    // Phase 1: Place triad notes at primary positions
    const triadKeys = sortedKeys.filter(k => k.noteType === 'triad');
    triadKeys.forEach(key => {
      key.position = currentPos;
      currentPos += key.width + 2; // Small gap between keys
    });

    // Phase 2: Insert pentatonic notes between triads where they don't overlap
    const pentatonicKeys = sortedKeys.filter(k => k.noteType === 'pentatonic');
    pentatonicKeys.forEach(key => {
      key.position = this.findBestPosition(key, triadKeys);
    });

    // Phase 3: Fill remaining diatonic scale notes
    const scaleKeys = sortedKeys.filter(k => k.noteType === 'scale');
    const placedKeys = [...triadKeys, ...pentatonicKeys];
    scaleKeys.forEach(key => {
      key.position = this.findBestPosition(key, placedKeys);
    });

    // Phase 4: Add chromatic notes in remaining spaces
    const chromaticKeys = sortedKeys.filter(k => k.noteType === 'chromatic');
    const allPlacedKeys = [...triadKeys, ...pentatonicKeys, ...scaleKeys];
    chromaticKeys.forEach(key => {
      key.position = this.findBestPosition(key, allPlacedKeys);
    });

    // Return the end position of this octave
    const maxPosition = Math.max(...octaveKeys.map(k => k.position + k.width));
    return maxPosition + 10; // Gap between octaves
  }

  private findBestPosition(key: KeyInfo, existingKeys: KeyInfo[]): number {
    if (existingKeys.length === 0) return 0;

    // Sort existing keys by position
    const sortedExisting = [...existingKeys].sort((a, b) => a.position - b.position);

    // Try to find a space between existing keys
    for (let i = 0; i < sortedExisting.length - 1; i++) {
      const current = sortedExisting[i];
      const next = sortedExisting[i + 1];
      const spaceStart = current.position + current.width + 2;
      const spaceEnd = next.position - 2;

      if (spaceEnd - spaceStart >= key.width) {
        return spaceStart;
      }
    }

    // If no space found, place at the end
    const lastKey = sortedExisting[sortedExisting.length - 1];
    return lastKey.position + lastKey.width + 2;
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
