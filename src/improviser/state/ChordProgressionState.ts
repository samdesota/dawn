import { createAtom } from "../../state/atom";

export interface ChordInfo {
  root: string;
  quality: string;
  symbol: string;
  notes: string[];
  romanNumeral: string;
}

export interface Song {
  name: string;
  key: string;
  chords: ChordInfo[];
  timeSignature: [number, number];
  defaultTempo: number;
  defaultSwing?: number; // Optional: default swing amount for this song (0.5-0.75)
  defaultRhythm?: string; // Optional: default rhythm pattern name for this song
  defaultKeyboardInstrument?: string; // Optional: default keyboard synth preset
  defaultChordInstrument?: string; // Optional: default chord comping synth preset
}

export class ChordProgressionState {
  // Reactive state atoms
  public currentSong = createAtom<Song | null>(null);
  public currentChordIndex = createAtom(0);
  public currentKey = createAtom("C");
  public isPlaying = createAtom(false);
  public tempo = createAtom(120);

  // Built-in song progressions
  private readonly builtInSongs: Song[] = [
    {
      name: "Pachelbel's Canon",
      key: "C",
      chords: [
        {
          root: "C",
          quality: "major",
          symbol: "C",
          notes: ["C", "E", "G"],
          romanNumeral: "I",
        },
        {
          root: "G",
          quality: "major",
          symbol: "G",
          notes: ["G", "B", "D"],
          romanNumeral: "V",
        },
        {
          root: "A",
          quality: "minor",
          symbol: "Am",
          notes: ["A", "C", "E"],
          romanNumeral: "vi",
        },
        {
          root: "E",
          quality: "minor",
          symbol: "Em",
          notes: ["E", "G", "B"],
          romanNumeral: "iii",
        },
        {
          root: "F",
          quality: "major",
          symbol: "F",
          notes: ["F", "A", "C"],
          romanNumeral: "IV",
        },
        {
          root: "C",
          quality: "major",
          symbol: "C",
          notes: ["C", "E", "G"],
          romanNumeral: "I",
        },
        {
          root: "F",
          quality: "major",
          symbol: "F",
          notes: ["F", "A", "C"],
          romanNumeral: "IV",
        },
        {
          root: "G",
          quality: "major",
          symbol: "G",
          notes: ["G", "B", "D"],
          romanNumeral: "V",
        },
      ],
      timeSignature: [4, 4],
      defaultTempo: 80,
      defaultRhythm: "basic-half", // Simple quarter notes for classical piece
      defaultKeyboardInstrument: "piano", // Acoustic piano for solo
      defaultChordInstrument: "warm-pad", // Warm strings/pad for accompaniment
    },
    {
      name: "12-Bar Blues",
      key: "C",
      chords: [
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "F",
          quality: "dominant7",
          symbol: "F7",
          notes: ["F", "A", "C", "Eb"],
          romanNumeral: "IV7",
        },
        {
          root: "F",
          quality: "dominant7",
          symbol: "F7",
          notes: ["F", "A", "C", "Eb"],
          romanNumeral: "IV7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "G",
          quality: "dominant7",
          symbol: "G7",
          notes: ["G", "B", "D", "F"],
          romanNumeral: "V7",
        },
        {
          root: "F",
          quality: "dominant7",
          symbol: "F7",
          notes: ["F", "A", "C", "Eb"],
          romanNumeral: "IV7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
        {
          root: "C",
          quality: "dominant7",
          symbol: "C7",
          notes: ["C", "E", "G", "Bb"],
          romanNumeral: "I7",
        },
      ],
      timeSignature: [4, 4],
      defaultTempo: 120,
      defaultSwing: 0.67, // Triplet swing feel for blues
      defaultRhythm: "jazz-swing", // Swung rhythm for blues
      defaultKeyboardInstrument: "electric-piano", // Electric piano for blues solo
      defaultChordInstrument: "jazz-organ", // Jazz organ for blues comping
    },
    {
      name: "ii-V-I Jazz",
      key: "C",
      chords: [
        {
          root: "D",
          quality: "minor7",
          symbol: "Dm7",
          notes: ["D", "F", "A", "C"],
          romanNumeral: "ii7",
        },
        {
          root: "G",
          quality: "dominant7",
          symbol: "G7",
          notes: ["G", "B", "D", "F"],
          romanNumeral: "V7",
        },
        {
          root: "C",
          quality: "major7",
          symbol: "CMaj7",
          notes: ["C", "E", "G", "B"],
          romanNumeral: "IMaj7",
        },
        {
          root: "A",
          quality: "minor7",
          symbol: "Am7",
          notes: ["A", "C", "E", "G"],
          romanNumeral: "vi7",
        },
      ],
      timeSignature: [4, 4],
      defaultTempo: 140,
      defaultSwing: 0.67, // Triplet swing feel for jazz
      defaultRhythm: "jazz-swing", // Swung rhythm for jazz
      defaultKeyboardInstrument: "bright-keys", // Bright piano for jazz solo
      defaultChordInstrument: "soft-rhodes", // Soft Rhodes for jazz comping
    },
    {
      name: "Pop Progression",
      key: "C",
      chords: [
        {
          root: "C",
          quality: "major",
          symbol: "C",
          notes: ["C", "E", "G"],
          romanNumeral: "I",
        },
        {
          root: "G",
          quality: "major",
          symbol: "G",
          notes: ["G", "B", "D"],
          romanNumeral: "V",
        },
        {
          root: "A",
          quality: "minor",
          symbol: "Am",
          notes: ["A", "C", "E"],
          romanNumeral: "vi",
        },
        {
          root: "F",
          quality: "major",
          symbol: "F",
          notes: ["F", "A", "C"],
          romanNumeral: "IV",
        },
      ],
      timeSignature: [4, 4],
      defaultTempo: 110,
      defaultRhythm: "basic-quarter", // Simple quarter notes for pop
      defaultKeyboardInstrument: "synthesizer", // Synth lead for pop
      defaultChordInstrument: "mellow-pad", // Mellow pad for pop backing
    },
  ];

  constructor() {
    // Set default song
    const defaultSong = this.builtInSongs[0];
    this.currentSong.set(defaultSong);
    this.tempo.set(defaultSong.defaultTempo);

    // Apply defaults after a short delay to ensure other states are initialized
    setTimeout(() => {
      this.applyCurrentSongDefaults();
    }, 100);
  }

  private applyCurrentSongDefaults() {
    const song = this.currentSong();
    if (!song) return;

    // Apply default swing if specified
    if (song.defaultSwing !== undefined) {
      this.notifyCompingSettingsChange({
        swing: song.defaultSwing,
      });
    }

    // Apply default rhythm if specified
    if (song.defaultRhythm !== undefined) {
      this.notifyCompingSettingsChange({
        rhythm: song.defaultRhythm,
      });
    }

    // Apply default instruments if specified
    if (song.defaultKeyboardInstrument !== undefined) {
      this.notifyInstrumentChange({
        keyboardInstrument: song.defaultKeyboardInstrument,
      });
    }

    if (song.defaultChordInstrument !== undefined) {
      this.notifyInstrumentChange({
        chordInstrument: song.defaultChordInstrument,
      });
    }
  }

  public getSongInfo(songName: string) {
    const song = this.builtInSongs.find((s) => s.name === songName);
    if (song) {
      return song;
    }
    return null;
  }

  public selectSong(songName: string) {
    const song = this.builtInSongs.find((s) => s.name === songName);
    if (song) {
      this.currentSong.set(song);
      this.currentKey.set(song.key);
      this.tempo.set(song.defaultTempo);
      this.currentChordIndex.set(0);

      // Apply all default settings for this song
      this.applyCurrentSongDefaults();
    }
  }

  // Callback for notifying other states about comping settings changes
  private compingSettingsCallback:
    | ((settings: { swing?: number; rhythm?: string }) => void)
    | null = null;

  public setCompingSettingsCallback(
    callback: (settings: { swing?: number; rhythm?: string }) => void
  ) {
    this.compingSettingsCallback = callback;
  }

  private notifyCompingSettingsChange(settings: {
    swing?: number;
    rhythm?: string;
  }) {
    if (this.compingSettingsCallback) {
      this.compingSettingsCallback(settings);
    }
  }

  // Callback for notifying audio engine about instrument changes
  private instrumentChangeCallback:
    | ((settings: {
        keyboardInstrument?: string;
        chordInstrument?: string;
      }) => void)
    | null = null;

  public setInstrumentChangeCallback(
    callback: (settings: {
      keyboardInstrument?: string;
      chordInstrument?: string;
    }) => void
  ) {
    this.instrumentChangeCallback = callback;
  }

  private notifyInstrumentChange(settings: {
    keyboardInstrument?: string;
    chordInstrument?: string;
  }) {
    if (this.instrumentChangeCallback) {
      this.instrumentChangeCallback(settings);
    }
  }

  public nextChord() {
    const song = this.currentSong();
    if (song) {
      const nextIndex = (this.currentChordIndex() + 1) % song.chords.length;
      this.currentChordIndex.set(nextIndex);
    }
  }

  public previousChord() {
    const song = this.currentSong();
    if (song) {
      const prevIndex =
        this.currentChordIndex() === 0
          ? song.chords.length - 1
          : this.currentChordIndex() - 1;
      this.currentChordIndex.set(prevIndex);
    }
  }

  public setTempo(bpm: number) {
    this.tempo.set(Math.max(60, Math.min(180, bpm)));
  }

  public setPlaying(playing: boolean) {
    this.isPlaying.set(playing);
  }

  // Music theory helper methods
  public getNoteType(
    note: string
  ): "triad" | "pentatonic" | "scale" | "chromatic" {
    // Determine note type based on the song's key, not the current chord
    const key = this.currentKey();
    const keyTriadNotes = this.getKeyTriadNotes(key); // I, iii, V chords of the key
    const pentatonicNotes = this.getPentatonicNotes(key);
    const scaleNotes = this.getScaleNotes(key);

    if (keyTriadNotes.includes(note)) return "triad";
    if (pentatonicNotes.includes(note)) return "pentatonic";
    if (scaleNotes.includes(note)) return "scale";
    return "chromatic";
  }

  private getKeyTriadNotes(key: string): string[] {
    // Get the I, iii, V chord tones of the key (major triad of the key)
    const majorTriadPattern = [0, 4, 7]; // Root, major third, perfect fifth
    return this.generateNotesFromPattern(key, majorTriadPattern);
  }

  public getPentatonicNotes(key: string): string[] {
    const pentatonicPattern = [0, 2, 4, 7, 9]; // Major pentatonic intervals
    return this.generateNotesFromPattern(key, pentatonicPattern);
  }

  public getScaleNotes(key: string): string[] {
    const majorScalePattern = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
    return this.generateNotesFromPattern(key, majorScalePattern);
  }

  private generateNotesFromPattern(root: string, pattern: number[]): string[] {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const rootIndex = notes.indexOf(root);
    if (rootIndex === -1) return [];

    return pattern.map((interval) => notes[(rootIndex + interval) % 12]);
  }

  public isNoteInCurrentChord(note: string): boolean {
    const currentChord = this.getCurrentChord();
    return currentChord ? currentChord.notes.includes(note) : false;
  }

  public getChordToneRole(
    note: string
  ): "root" | "third" | "fifth" | "seventh" | "extension" | null {
    const currentChord = this.getCurrentChord();
    if (!currentChord || !currentChord.notes.includes(note)) return null;

    const noteIndex = currentChord.notes.indexOf(note);
    const roles = ["root", "third", "fifth", "seventh", "extension"] as const;
    return roles[noteIndex] || "extension";
  }

  // Getters for computed values
  public getCurrentChord(): ChordInfo | null {
    const song = this.currentSong();
    if (!song) return null;
    return song.chords[this.currentChordIndex()] || null;
  }

  public getCurrentChordSymbol(): string {
    const chord = this.getCurrentChord();
    return chord ? chord.symbol : "";
  }

  public getAvailableSongs(): string[] {
    return this.builtInSongs.map((song) => song.name);
  }

  public getProgressPosition(): number {
    const song = this.currentSong();
    if (!song) return 0;
    return this.currentChordIndex() / song.chords.length;
  }

  // Getters for reactive values
  get currentSongValue() {
    return this.currentSong();
  }
  get currentChordIndexValue() {
    return this.currentChordIndex();
  }
  get currentKeyValue() {
    return this.currentKey();
  }
  get isPlayingValue() {
    return this.isPlaying();
  }
  get tempoValue() {
    return this.tempo();
  }
}

// Export singleton instance
export const chordProgressionState = new ChordProgressionState();
