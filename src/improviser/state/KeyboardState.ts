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
  public containerDimensions= createAtom({ width: window.innerWidth, height: window.innerHeight });
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

  onResize(width: number, height: number) {
    console.log('Keyboard state resized', width, height);
    this.containerDimensions.set({ width, height });
    this.generateKeyboard()
  }

  private generateKeyboard() {
    const keyWidth = (this.containerDimensions().width - (9 * 4)) / 10;
    const baseHeight = this.containerDimensions().height;

    const keys: KeyInfo[] = [];
    const [startOctave, endOctave] = this.octaveRange();

    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (let i = 0; i < this.chromaticNotes.length; i++) {
        const note = this.chromaticNotes[i];
        const noteInfo = this.createNoteInfo(note, octave);
        const keyInfo = this.createKeyInfo(noteInfo, keyWidth, baseHeight);
        keys.push(keyInfo);
      }
    }

    // Add a final key returning to the root note
    const rootNote = this.chromaticNotes[0];
    const rootKeyInfo = this.createKeyInfo(this.createNoteInfo(rootNote, endOctave + 1), keyWidth, baseHeight);
    keys.push(rootKeyInfo);


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

  private createKeyInfo(noteInfo: NoteInfo, baseWidth: number, baseHeight: number): KeyInfo {
    const noteType = chordProgressionState.getNoteType(noteInfo.note);
    const chordRole = chordProgressionState.getChordToneRole(noteInfo.note);
    const isHighlighted = chordProgressionState.isNoteInCurrentChord(noteInfo.note);

    // Determine key dimensions based on note type hierarchy
    const dimensions = this.getKeyDimensions(noteType, baseWidth, baseHeight);

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

  private getKeyDimensions(noteType: 'triad' | 'pentatonic' | 'scale' | 'chromatic', baseWidth: number, baseHeight: number) {
    switch (noteType) {
      case 'triad':
        return { width: baseWidth, height: baseHeight }; // Full height, base layer
      case 'pentatonic':
        return { width: baseWidth * 0.4, height: baseHeight * 0.8 }; // 75% height, narrower
      case 'scale':
        return { width: baseWidth * 0.4, height: baseHeight * 0.6 }; // 60% height, narrower
      case 'chromatic':
        return { width: baseWidth * 0.4, height: baseHeight * 0.3 }; // 45% height, narrowest
      default:
        return { width: baseWidth, height: baseHeight };
    }
  }

  private applyLayeredLayout(keys: KeyInfo[]) {
    // Sort all keys by octave and chromatic order for consistent positioning
    const sortedKeys = [...keys].sort((a, b) => {
      if (a.octave !== b.octave) {
        return a.octave - b.octave;
      }
      return this.chromaticNotes.indexOf(a.note) - this.chromaticNotes.indexOf(b.note);
    });

    // Phase 1: Place all triad notes as the base layer
    const triadKeys = sortedKeys.filter(k => k.noteType === 'triad');
    let currentPos = 0;

    triadKeys.forEach(key => {
      key.position = currentPos;
      currentPos += key.width + 4; // Small gap between triad keys
    });

    // Phase 2: Group non-triad keys by the triad intervals they fall between
    const nonTriadKeys = sortedKeys.filter(k => k.noteType !== 'triad');
    const groupedNonTriadKeys = this.groupNonTriadKeysByTriadIntervals(nonTriadKeys, triadKeys);

    // Phase 3: Position each group of non-triad keys
    groupedNonTriadKeys.forEach(group => {
      this.positionNonTriadGroup(group);
    });
  }

  private groupNonTriadKeysByTriadIntervals(nonTriadKeys: KeyInfo[], triadKeys: KeyInfo[]): Array<{
    keys: KeyInfo[];
    leftTriad: KeyInfo | null;
    rightTriad: KeyInfo | null;
  }> {
    if (triadKeys.length === 0) {
      return [{ keys: nonTriadKeys, leftTriad: null, rightTriad: null }];
    }

    // Sort triad keys by their global chromatic position (octave * 12 + note index)
    const sortedTriadKeys = [...triadKeys].sort((a, b) => {
      const aPos = a.octave * 12 + this.chromaticNotes.indexOf(a.note);
      const bPos = b.octave * 12 + this.chromaticNotes.indexOf(b.note);
      return aPos - bPos;
    });

    const groups: Array<{
      keys: KeyInfo[];
      leftTriad: KeyInfo | null;
      rightTriad: KeyInfo | null;
    }> = [];

    // Helper function to get global chromatic position
    const getGlobalPosition = (key: KeyInfo) =>
      key.octave * 12 + this.chromaticNotes.indexOf(key.note);

    // Group keys that fall before the first triad
    const firstTriadPos = getGlobalPosition(sortedTriadKeys[0]);
    const beforeFirstTriad = nonTriadKeys.filter(key =>
      getGlobalPosition(key) < firstTriadPos
    );
    if (beforeFirstTriad.length > 0) {
      groups.push({
        keys: beforeFirstTriad,
        leftTriad: null,
        rightTriad: sortedTriadKeys[0]
      });
    }

    // Group keys that fall between triad keys
    for (let i = 0; i < sortedTriadKeys.length - 1; i++) {
      const leftTriad = sortedTriadKeys[i];
      const rightTriad = sortedTriadKeys[i + 1];
      const leftPos = getGlobalPosition(leftTriad);
      const rightPos = getGlobalPosition(rightTriad);

      const betweenTriads = nonTriadKeys.filter(key => {
        const keyPos = getGlobalPosition(key);
        return keyPos > leftPos && keyPos < rightPos;
      });

      if (betweenTriads.length > 0) {
        groups.push({
          keys: betweenTriads,
          leftTriad: leftTriad,
          rightTriad: rightTriad
        });
      }
    }

    // Group keys that fall after the last triad
    const lastTriadPos = getGlobalPosition(sortedTriadKeys[sortedTriadKeys.length - 1]);
    const afterLastTriad = nonTriadKeys.filter(key =>
      getGlobalPosition(key) > lastTriadPos
    );
    if (afterLastTriad.length > 0) {
      groups.push({
        keys: afterLastTriad,
        leftTriad: sortedTriadKeys[sortedTriadKeys.length - 1],
        rightTriad: null
      });
    }

    return groups;
  }

  private positionNonTriadGroup(group: {
    keys: KeyInfo[];
    leftTriad: KeyInfo | null;
    rightTriad: KeyInfo | null;
  }) {
    if (group.keys.length === 0) return;

    // Sort keys within the group by global chromatic position
    const sortedKeys = [...group.keys].sort((a, b) => {
      const aPos = a.octave * 12 + this.chromaticNotes.indexOf(a.note);
      const bPos = b.octave * 12 + this.chromaticNotes.indexOf(b.note);
      return aPos - bPos;
    });

    // Calculate total width of the group with overlapping for chromatic notes
    let totalGroupWidth = 0;
    sortedKeys.forEach((key, index) => {
      if (index === 0) {
        // First key takes full width
        totalGroupWidth += key.width;
      } else {
        // Subsequent keys: check if current or previous key is chromatic for overlap
        const prevKey = sortedKeys[index - 1];
        const shouldOverlap = key.noteType === 'chromatic' || prevKey.noteType === 'chromatic';

        if (shouldOverlap) {
          // 20% overlap means we only add 80% of the current key's width
          totalGroupWidth += key.width * 0.8;
        } else {
          // Non-chromatic keys get small gap
          totalGroupWidth += key.width + 1;
        }
      }
    });

    // Determine the center point where the group should be positioned
    let centerPoint: number;

    if (group.leftTriad && group.rightTriad) {
      // Center between two triad keys
      const leftEnd = group.leftTriad.position + group.leftTriad.width;
      const rightStart = group.rightTriad.position;
      centerPoint = (leftEnd + rightStart) / 2;
    } else if (group.leftTriad && !group.rightTriad) {
      // After the last triad - position to the right of it
      centerPoint = group.leftTriad.position + group.leftTriad.width + totalGroupWidth / 2 + 4;
    } else if (!group.leftTriad && group.rightTriad) {
      // Before the first triad - position to the left of it
      centerPoint = group.rightTriad.position - totalGroupWidth / 2 - 4;
    } else {
      // No triad keys (shouldn't happen in normal use)
      centerPoint = totalGroupWidth / 2;
    }

    // Position keys starting from the left edge of the centered group
    let currentPosition = centerPoint - totalGroupWidth / 2;

    sortedKeys.forEach((key, index) => {
      key.position = currentPosition;

      if (index < sortedKeys.length - 1) {
        // Calculate spacing to next key
        const nextKey = sortedKeys[index + 1];
        const shouldOverlap = key.noteType === 'chromatic' || nextKey.noteType === 'chromatic';

        if (shouldOverlap) {
          // 20% overlap: move by 80% of current key's width
          currentPosition += key.width * 0.55;
        } else {
          // Non-chromatic keys get small gap
          currentPosition += key.width + 1;
        }
      }
    });
  }

  public updateHighlighting() {
    const keys = this.keyboardKeys();
    let hasChanges = false;

    const updatedKeys = keys.map(key => {
      const newNoteType = chordProgressionState.getNoteType(key.note);
      const newChordRole = chordProgressionState.getChordToneRole(key.note);
      const newIsHighlighted = chordProgressionState.isNoteInCurrentChord(key.note);

      // Only create a new object if something actually changed
      if (key.noteType !== newNoteType ||
          key.chordRole !== newChordRole ||
          key.isHighlighted !== newIsHighlighted) {
        hasChanges = true;
        return {
          ...key,
          noteType: newNoteType,
          chordRole: newChordRole,
          isHighlighted: newIsHighlighted
        };
      }

      // Return the same object if nothing changed
      return key;
    });

    // Only update the atom if there were actual changes
    if (hasChanges) {
      console.log('updatedKeys', updatedKeys);
      this.keyboardKeys.set(updatedKeys);
    }
  }

  public findKeyByNote(note: string, octave: number): KeyInfo | undefined {
    return this.keyboardKeys().find(k => k.note === note && k.octave === octave);
  }

  public getKeyAtPosition(x: number): KeyInfo | undefined {
    const candidateKeys = this.keyboardKeys().filter(key =>
      x >= key.position && x <= key.position + key.width
    );

    // If multiple keys overlap, return the one with highest z-index (chromatic > scale > pentatonic > triad)
    if (candidateKeys.length > 1) {
      return candidateKeys.reduce((highest, current) => {
        const currentZIndex = this.getZIndexForNoteType(current.noteType);
        const highestZIndex = this.getZIndexForNoteType(highest.noteType);
        return currentZIndex > highestZIndex ? current : highest;
      });
    }

    return candidateKeys[0];
  }

  public getKeyAtCoordinates(x: number, y: number): KeyInfo | undefined {
    const candidateKeys = this.keyboardKeys().filter(key => {
      const withinX = x >= key.position && x <= key.position + key.width;
      const withinY = y >= 0 && y <= key.height; // Assuming keys start at y=0
      return withinX && withinY;
    });

    // If multiple keys overlap, return the one with highest z-index (chromatic > scale > pentatonic > triad)
    if (candidateKeys.length > 1) {
      return candidateKeys.reduce((highest, current) => {
        const currentZIndex = this.getZIndexForNoteType(current.noteType);
        const highestZIndex = this.getZIndexForNoteType(highest.noteType);
        return currentZIndex > highestZIndex ? current : highest;
      });
    }

    return candidateKeys[0];
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

  // Helper method to get z-index value for note type (matches KeyButton.tsx logic)
  private getZIndexForNoteType(noteType: 'triad' | 'pentatonic' | 'scale' | 'chromatic'): number {
    switch (noteType) {
      case 'chromatic': return 40; // Highest layer
      case 'scale': return 30;
      case 'pentatonic': return 20;
      case 'triad': return 10; // Base layer
      default: return 10;
    }
  }

  // Getters for reactive values
  get keys() { return this.keyboardKeys(); }
  get octaveRangeValue() { return this.octaveRange(); }
  get keyWidthValue() { return this.keyWidth(); }
}

// Export singleton instance
export const keyboardState = new KeyboardState();
