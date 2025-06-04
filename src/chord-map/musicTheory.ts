// Constants and types for music theory

export type Note = string;
export type Interval = number;

export const NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface Mode {
  name: string;
  pattern: Interval[];
}

export const MODES: Mode[] = [
  { name: 'Ionian (Major)', pattern: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Dorian', pattern: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', pattern: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', pattern: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', pattern: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Aeolian (Minor)', pattern: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Locrian', pattern: [0, 1, 3, 5, 6, 8, 10] },
];

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'dominant7' | 'major7' | 'minor7' | 'halfDiminished7' | 'diminished7' | 'dominant9' | 'major9' | 'minor9' | 'sus2' | 'sus4' | 'augmented';

export interface ChordType {
  name: string;
  type: ChordQuality;
  intervals: Interval[];
  color: string;
  extension?: 'triad' | '7th' | '9th' | 'sus' | 'aug';
}

// Base triads
export const CHORD_TYPES: ChordType[] = [
  { name: 'I', type: 'major', intervals: [0, 4, 7], color: 'bg-blue-500 hover:bg-blue-600', extension: 'triad' },
  { name: 'ii', type: 'minor', intervals: [0, 3, 7], color: 'bg-green-500 hover:bg-green-600', extension: 'triad' },
  { name: 'iii', type: 'minor', intervals: [0, 3, 7], color: 'bg-yellow-500 hover:bg-yellow-600', extension: 'triad' },
  { name: 'IV', type: 'major', intervals: [0, 4, 7], color: 'bg-red-500 hover:bg-red-600', extension: 'triad' },
  { name: 'V', type: 'major', intervals: [0, 4, 7], color: 'bg-purple-500 hover:bg-purple-600', extension: 'triad' },
  { name: 'vi', type: 'minor', intervals: [0, 3, 7], color: 'bg-indigo-500 hover:bg-indigo-600', extension: 'triad' },
  { name: 'vii°', type: 'diminished', intervals: [0, 3, 6], color: 'bg-pink-500 hover:bg-pink-600', extension: 'triad' },
];

// 7th chords
export const SEVENTH_CHORD_TYPES: ChordType[] = [
  { name: 'Imaj7', type: 'major7', intervals: [0, 4, 7, 11], color: 'bg-blue-700 hover:bg-blue-800', extension: '7th' },
  { name: 'iim7', type: 'minor7', intervals: [0, 3, 7, 10], color: 'bg-green-700 hover:bg-green-800', extension: '7th' },
  { name: 'iiim7', type: 'minor7', intervals: [0, 3, 7, 10], color: 'bg-yellow-700 hover:bg-yellow-800', extension: '7th' },
  { name: 'IVmaj7', type: 'major7', intervals: [0, 4, 7, 11], color: 'bg-red-700 hover:bg-red-800', extension: '7th' },
  { name: 'V7', type: 'dominant7', intervals: [0, 4, 7, 10], color: 'bg-purple-700 hover:bg-purple-800', extension: '7th' },
  { name: 'vim7', type: 'minor7', intervals: [0, 3, 7, 10], color: 'bg-indigo-700 hover:bg-indigo-800', extension: '7th' },
  { name: 'vii∅7', type: 'halfDiminished7', intervals: [0, 3, 6, 10], color: 'bg-pink-700 hover:bg-pink-800', extension: '7th' },
];

// 9th chords
export const NINTH_CHORD_TYPES: ChordType[] = [
  { name: 'Imaj9', type: 'major9', intervals: [0, 4, 7, 11, 14], color: 'bg-blue-900 hover:bg-blue-950', extension: '9th' },
  { name: 'iim9', type: 'minor9', intervals: [0, 3, 7, 10, 14], color: 'bg-green-900 hover:bg-green-950', extension: '9th' },
  { name: 'iiim9', type: 'minor9', intervals: [0, 3, 7, 10, 14], color: 'bg-yellow-900 hover:bg-yellow-950', extension: '9th' },
  { name: 'IVmaj9', type: 'major9', intervals: [0, 4, 7, 11, 14], color: 'bg-red-900 hover:bg-red-950', extension: '9th' },
  { name: 'V9', type: 'dominant9', intervals: [0, 4, 7, 10, 14], color: 'bg-purple-900 hover:bg-purple-950', extension: '9th' },
  { name: 'vim9', type: 'minor9', intervals: [0, 3, 7, 10, 14], color: 'bg-indigo-900 hover:bg-indigo-950', extension: '9th' },
  { name: 'vii∅9', type: 'halfDiminished7', intervals: [0, 3, 6, 10, 14], color: 'bg-pink-900 hover:bg-pink-950', extension: '9th' },
];

// Additional sus and augmented chords
export const ADDITIONAL_CHORD_TYPES: ChordType[] = [
  { name: 'Isus4', type: 'sus4', intervals: [0, 5, 7], color: 'bg-sky-500 hover:bg-sky-600', extension: 'sus' },
  { name: 'IVsus2', type: 'sus2', intervals: [0, 2, 7], color: 'bg-amber-500 hover:bg-amber-600', extension: 'sus' },
  { name: 'V+', type: 'augmented', intervals: [0, 4, 8], color: 'bg-fuchsia-500 hover:bg-fuchsia-600', extension: 'aug' },
];

export interface ArpeggioPattern {
  name: string;
  pattern: number[];
  generatePattern: (noteCount: number) => number[];
}

// Pattern generator functions
const generateUpPattern = (noteCount: number): number[] => {
  const pattern: number[] = [];
  for (let i = 0; i < noteCount; i++) {
    pattern.push(i);
  }
  return pattern;
};

const generateDownPattern = (noteCount: number): number[] => {
  const pattern: number[] = [];
  for (let i = noteCount - 1; i >= 0; i--) {
    pattern.push(i);
  }
  return pattern;
};

const generateUpDownPattern = (noteCount: number): number[] => {
  const pattern: number[] = [];
  // Ascending
  for (let i = 0; i < noteCount; i++) {
    pattern.push(i);
  }
  // Descending (excluding first and last to avoid repetition)
  for (let i = noteCount - 2; i > 0; i--) {
    pattern.push(i);
  }
  return pattern;
};

const generateDownUpPattern = (noteCount: number): number[] => {
  const pattern: number[] = [];
  // Descending
  for (let i = noteCount - 1; i >= 0; i--) {
    pattern.push(i);
  }
  // Ascending (excluding first and last to avoid repetition)
  for (let i = 1; i < noteCount - 1; i++) {
    pattern.push(i);
  }
  return pattern;
};

const generateCascadePattern = (noteCount: number): number[] => {
  if (noteCount <= 2) return generateUpDownPattern(noteCount);
  
  const pattern: number[] = [];
  let step = 0;
  while (pattern.length < noteCount * 2) {
    // Add root
    if (step % 3 === 0 && !pattern.includes(0)) {
      pattern.push(0);
    }
    // Add top note
    else if (step % 4 === 0 && !pattern.includes(noteCount - 1)) {
      pattern.push(noteCount - 1);
    }
    // Add middle notes in alternating fashion
    else {
      const middleIndex = (step % (noteCount - 2)) + 1;
      if (!pattern.includes(middleIndex)) {
        pattern.push(middleIndex);
      }
    }
    step++;
    
    // Prevent infinite loop
    if (step > 20) break;
  }
  
  // Ensure we have at least noteCount elements
  return pattern.slice(0, Math.max(noteCount * 2, 8));
};

const generateSpreadPattern = (noteCount: number): number[] => {
  if (noteCount <= 2) return generateUpPattern(noteCount);
  
  const pattern: number[] = [];
  
  // Always start with the root
  pattern.push(0);
  
  // For triads
  if (noteCount === 3) {
    return [0, 2, 1, 0, 1, 2];
  }
  
  // For 4-note chords (7ths)
  if (noteCount === 4) {
    return [0, 3, 1, 2, 0, 2, 1, 3];
  }
  
  // For 5-note chords (9ths)
  if (noteCount === 5) {
    return [0, 4, 1, 3, 2, 0, 3, 1, 4, 2];
  }
  
  // Default fallback
  for (let i = 0; i < noteCount; i++) {
    pattern.push(i);
  }
  
  return pattern;
};

export const ARPEGGIO_PATTERNS: ArpeggioPattern[] = [
  { 
    name: 'Up', 
    pattern: [0, 1, 2, 3, 4],
    generatePattern: generateUpPattern
  },
  { 
    name: 'Down', 
    pattern: [4, 3, 2, 1, 0],
    generatePattern: generateDownPattern
  },
  { 
    name: 'Up-Down', 
    pattern: [0, 1, 2, 3, 4, 3, 2, 1],
    generatePattern: generateUpDownPattern
  },
  { 
    name: 'Down-Up', 
    pattern: [4, 3, 2, 1, 0, 1, 2, 3],
    generatePattern: generateDownUpPattern
  },
  { 
    name: 'Cascade', 
    pattern: [0, 2, 1, 3, 2, 4, 3, 1],
    generatePattern: generateCascadePattern
  },
  { 
    name: 'Spread', 
    pattern: [0, 4, 1, 3, 2],
    generatePattern: generateSpreadPattern
  },
  { 
    name: 'Random', 
    pattern: [],
    generatePattern: () => [] // Random uses empty pattern as a signal
  }
];

// Helper functions for music theory calculations
export function getChordNames(modeIndex: number, extension: 'triad' | '7th' | '9th' | 'sus' | 'aug' = 'triad'): ChordType[] {
  let baseChords: ChordType[] = [];
  
  // Select the appropriate chord types based on the extension
  if (extension === 'triad') {
    baseChords = [...CHORD_TYPES];
  } else if (extension === '7th') {
    baseChords = [...SEVENTH_CHORD_TYPES];
  } else if (extension === '9th') {
    baseChords = [...NINTH_CHORD_TYPES];
  } else if (extension === 'sus' || extension === 'aug') {
    // For sus and aug, we don't rotate based on mode
    return [...ADDITIONAL_CHORD_TYPES];
  }
  
  // Rotate the chord types based on the mode
  for (let i = 0; i < modeIndex; i++) {
    const first = baseChords.shift();
    if (first) baseChords.push(first);
  }
  
  return baseChords;
}

export function formatChordName(chordRoot: Note, chordType: ChordType): string {
  let suffix = '';
  
  // Handle different chord types
  switch (chordType.type) {
    case 'minor':
      suffix = 'm';
      break;
    case 'diminished':
      suffix = '°';
      break;
    case 'major7':
      suffix = 'maj7';
      break;
    case 'minor7':
      suffix = 'm7';
      break;
    case 'dominant7':
      suffix = '7';
      break;
    case 'halfDiminished7':
      suffix = 'ø7';
      break;
    case 'diminished7':
      suffix = '°7';
      break;
    case 'major9':
      suffix = 'maj9';
      break;
    case 'minor9':
      suffix = 'm9';
      break;
    case 'dominant9':
      suffix = '9';
      break;
    case 'sus2':
      suffix = 'sus2';
      break;
    case 'sus4':
      suffix = 'sus4';
      break;
    case 'augmented':
      suffix = '+';
      break;
  }
  
  return `${chordRoot}${suffix} (${chordType.name})`;
}

// Get the chord notes for a specific degree in the scale with proper voice leading
export function getChordNotes(
  scaleNotes: number[],
  degree: number,
  extension: "triad" | "7th" | "9th" | "sus" | "aug" = "triad",
  previousChordNotes: number[] = []
): { chordNotes: number[], updatedPreviousNotes: number[] } {
  const chords = getChordNames(0, extension);
  const chord = chords[degree];
  
  // Calculate basic chord notes (without inversions)
  const rootNote = scaleNotes[degree];
  const basicChordNotes = chord.intervals.map(interval => {
    return rootNote + interval;
  });
  
  // If we don't have previous chord notes, just return the basic chord
  if (previousChordNotes.length === 0) {
    return { 
      chordNotes: basicChordNotes, 
      updatedPreviousNotes: basicChordNotes 
    };
  }
  
  // Determine the best inversion by finding the one with the minimal movement from previous chord
  
  // Generate all possible inversions
  const inversions: number[][] = [];
  
  // Add the basic chord (root position)
  inversions.push([...basicChordNotes]);
  
  // Add all inversions
  for (let i = 1; i < basicChordNotes.length; i++) {
    const inversion = [...basicChordNotes];
    for (let j = 0; j < i; j++) {
      // Move the first note up an octave
      inversion[j] = inversion[j] + 12;
    }
    inversions.push(inversion);
  }
  
  // Generate downward octave variations as well
  const downInversions: number[][] = [];
  for (const inv of inversions) {
    const downInv = inv.map(note => note - 12);
    downInversions.push(downInv);
  }
  
  // Combine all inversions
  const allInversions = [...inversions, ...downInversions];
  
  // Calculate the "distance" of each inversion from the previous chord
  let bestInversion = inversions[0];
  let minDistance = Number.MAX_SAFE_INTEGER;
  
  for (const inversion of allInversions) {
    let distance = 0;
    for (let i = 0; i < Math.min(inversion.length, previousChordNotes.length); i++) {
      // Calculate the actual distance between notes (not modulo 12)
      const diff = Math.abs(inversion[i] - previousChordNotes[i]);
      distance += diff;
    }
    
    if (distance < minDistance) {
      minDistance = distance;
      bestInversion = inversion;
    }
  }
  
  return {
    chordNotes: bestInversion,
    updatedPreviousNotes: bestInversion
  };
}

// Get special chord notes with voice leading
export function getSpecialChordNotes(
  scaleNotes: number[],
  index: number,
  previousChordNotes: number[] = []
): { chordNotes: number[], updatedPreviousNotes: number[] } {
  const specialChords = getChordNames(0, "sus");
  const chord = specialChords[index];

  // Get the root note based on the chord type
  let rootDegree = 0; // Default to I (tonic)
  if (chord.name.startsWith("IV")) {
    rootDegree = 3; // IV chord (subdominant)
  } else if (chord.name.startsWith("V")) {
    rootDegree = 4; // V chord (dominant)
  }

  const rootNote = scaleNotes[rootDegree];
  
  // Generate basic chord notes
  const basicChordNotes = chord.intervals.map(interval => rootNote + interval);
  
  // If we don't have previous chord notes, just use the basic chord
  if (previousChordNotes.length === 0) {
    return {
      chordNotes: basicChordNotes,
      updatedPreviousNotes: basicChordNotes
    };
  }
  
  // Generate inversions and find the best one
  const inversions: number[][] = [];
  
  // Add root position
  inversions.push([...basicChordNotes]);
  
  // Add inversions
  for (let i = 1; i < basicChordNotes.length; i++) {
    const inversion = [...basicChordNotes];
    for (let j = 0; j < i; j++) {
      inversion[j] = inversion[j] + 12;
    }
    inversions.push(inversion);
  }
  
  // Generate downward octave variations
  const downInversions: number[][] = [];
  for (const inv of inversions) {
    const downInv = inv.map(note => note - 12);
    downInversions.push(downInv);
  }
  
  // Combine all inversions
  const allInversions = [...inversions, ...downInversions];
  
  // Find best inversion
  let bestInversion = inversions[0];
  let minDistance = Number.MAX_SAFE_INTEGER;
  
  for (const inversion of allInversions) {
    let distance = 0;
    for (let i = 0; i < Math.min(inversion.length, previousChordNotes.length); i++) {
      // Calculate actual distance between notes
      const diff = Math.abs(inversion[i] - previousChordNotes[i]);
      distance += diff;
    }
    
    if (distance < minDistance) {
      minDistance = distance;
      bestInversion = inversion;
    }
  }
  
  return {
    chordNotes: bestInversion,
    updatedPreviousNotes: bestInversion
  };
}

// Get background color for chord buttons
export function getChordBackgroundColor(degree: number, extension: 'triad' | '7th' | '9th' | 'special' = 'triad', index?: number): string {
  // Colors for each degree (Tailwind-like colors)
  const colors = {
    triad: [
      '#3b82f6', // blue-500 (I)
      '#22c55e', // green-500 (ii)
      '#eab308', // yellow-500 (iii)
      '#ef4444', // red-500 (IV)
      '#a855f7', // purple-500 (V)
      '#6366f1', // indigo-500 (vi)
      '#ec4899', // pink-500 (vii°)
    ],
    '7th': [
      '#2563eb', // blue-600 (Imaj7)
      '#16a34a', // green-600 (iim7)
      '#ca8a04', // yellow-600 (iiim7)
      '#dc2626', // red-600 (IVmaj7)
      '#9333ea', // purple-600 (V7)
      '#4f46e5', // indigo-600 (vim7)
      '#db2777', // pink-600 (vii∅7)
    ],
    '9th': [
      '#1d4ed8', // blue-700 (Imaj9)
      '#15803d', // green-700 (iim9)
      '#a16207', // yellow-700 (iiim9)
      '#b91c1c', // red-700 (IVmaj9)
      '#7e22ce', // purple-700 (V9)
      '#4338ca', // indigo-700 (vim9)
      '#be185d', // pink-700 (vii∅9)
    ],
    'special': [
      '#0ea5e9', // sky-500 (Isus4)
      '#f59e0b', // amber-500 (IVsus2)
      '#d946ef', // fuchsia-500 (V+)
    ]
  };
  
  if (extension === 'special' && typeof index === 'number') {
    return colors.special[index];
  }
  
  return colors[extension][degree];
}