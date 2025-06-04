import { createAtom } from '../state/atom';
import { progressions, scales, chordNames } from './musicData';

// Define types for hex improv state
export type HexagonData = {
  x: number;
  y: number;
  radius: number;
  noteIndex: number;
  note: string;
  octave: number;
  displayNote: string;
};

export type ChordInfo = {
  notes: number[];
  colors: { root: string; third: string; fifth: string };
};

export type HexImprovState = {
  isPlaying: boolean;
  currentChordIndex: number;
  chordStartTime: number;
  scale: string;
  progression: string;
  hexagons: HexagonData[];
  chordDisplay: string;
};

export type HexImprovTransition = {
  currentChord: ChordInfo | null;
  nextChord: ChordInfo | null;
  transitionAmount: number;
};

// Constants
export const CHORD_DURATION = 2000; // 2 seconds per chord
export const FADE_IN_DURATION = 500; // 0.5 second fade-in for next chord

// Create the state atom
const hexImprovState = createAtom<HexImprovState>({
  isPlaying: false,
  currentChordIndex: 0,
  chordStartTime: 0,
  scale: 'major',
  progression: 'I-V-vi-IV',
  hexagons: [],
  chordDisplay: 'Ready to play'
});

// Helper functions to update state
export function startProgression() {
  const now = Date.now();
  hexImprovState.produce(state => {
    state.isPlaying = true;
    state.currentChordIndex = 0;
    state.chordStartTime = now;
    state.chordDisplay = getCurrentChordName();
  });
}

export function stopProgression() {
  hexImprovState.produce(state => {
    state.isPlaying = false;
    state.chordDisplay = 'Ready to play';
  });
}

export function advanceChord() {
  const now = Date.now();
  hexImprovState.produce(state => {
    state.currentChordIndex = (state.currentChordIndex + 1) % progressions[state.progression as keyof typeof progressions].length;
    state.chordStartTime = now;
    state.chordDisplay = getCurrentChordName();
  });
}

export function setScale(scale: string) {
  hexImprovState.produce(state => {
    state.scale = scale;
  });
}

export function setProgression(progression: string) {
  hexImprovState.produce(state => {
    state.progression = progression;
  });
}

export function setHexagons(hexagons: HexagonData[]) {
  hexImprovState.produce(state => {
    state.hexagons = hexagons;
  });
}

// Get current chord name
export function getCurrentChordName() {
  const state = hexImprovState();
  const chordIndices = progressions[state.progression as keyof typeof progressions];
  const currentChordRoot = chordIndices[state.currentChordIndex];
  const scaleType = state.scale === 'minor' ? 'minor' : 'major';
  
  return chordNames[scaleType as keyof typeof chordNames][currentChordRoot];
}

export default hexImprovState;