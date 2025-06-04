import { scales, progressions } from './musicData';

// Define interfaces for active notes tracking
interface ActiveNote {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  noteIndex: number;
}

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private baseFreq: number = 261.63; // C4
  private audioInitialized: boolean = false;
  private activeNotes: Map<number, ActiveNote> = new Map(); // Track active notes by noteIndex

  // Initialize audio context
  initAudio() {
    // For iOS Safari, we need to initialize audio on a user interaction
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // On iOS, the context might be suspended by default
    if (this.audioContext.state === 'suspended') {
      // Try to resume the context
      const resumePromise = this.audioContext.resume();
      
      // Handle the promise to ensure we know if it succeeds
      resumePromise.then(() => {
        console.log('AudioContext resumed successfully');
        this.audioInitialized = true;
      }).catch(err => {
        console.error('Failed to resume AudioContext:', err);
      });
    } else {
      this.audioInitialized = true;
    }
    
    return this.audioContext;
  }

  // Start playing a sustained note
  startNote(noteIndex: number) {
    if (!this.audioContext || !this.audioInitialized) {
      // Try to initialize again, in case this is being called from a user interaction
      this.initAudio();
      // If still not initialized, return without playing
      if (!this.audioInitialized) {
        console.warn('Cannot play note: AudioContext not initialized');
        return;
      }
    }
    
    // If note is already playing, stop it first to avoid overlapping
    if (this.activeNotes.has(noteIndex)) {
      this.stopNote(noteIndex);
    }
    
    const frequency = this.getFrequency(noteIndex);
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Set initial gain (volume)
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    
    // Start the oscillator
    oscillator.start(this.audioContext.currentTime);
    
    // Store the active note
    this.activeNotes.set(noteIndex, {
      oscillator,
      gainNode,
      noteIndex
    });
  }

  // Stop a sustained note
  stopNote(noteIndex: number) {
    const activeNote = this.activeNotes.get(noteIndex);
    if (!activeNote) return;
    
    const { gainNode, oscillator } = activeNote;
    
    // Fade out the note (50ms release)
    const releaseTime = 0.05;
    gainNode.gain.setValueAtTime(gainNode.gain.value, this.audioContext!.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + releaseTime);
    
    // Schedule the oscillator to stop after fade out
    setTimeout(() => {
      oscillator.stop();
      // Remove from active notes
      this.activeNotes.delete(noteIndex);
    }, releaseTime * 1000);
  }

  // For backward compatibility - non-sustained notes
  playNote(frequency: number, duration: number = 0.5) {
    if (!this.audioContext || !this.audioInitialized) {
      // Try to initialize again, in case this is being called from a user interaction
      this.initAudio();
      // If still not initialized, return without playing
      if (!this.audioInitialized) {
        console.warn('Cannot play note: AudioContext not initialized');
        return;
      }
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play chord
  playChord(chordNotes: number[], duration: number = 1.5) {
    // Make sure audio is initialized before playing
    if (!this.audioContext || !this.audioInitialized) {
      this.initAudio();
    }
    
    chordNotes.forEach((note, index) => {
      setTimeout(() => this.playNote(note, duration), index * 50);
    });
  }

  // Stop all currently playing notes
  stopAllNotes() {
    for (const noteIndex of this.activeNotes.keys()) {
      this.stopNote(noteIndex);
    }
  }

  // Get frequency from note index
  getFrequency(noteIndex: number) {
    return this.baseFreq * Math.pow(2, noteIndex / 12);
  }

  // Get chord notes based on scale and chord index
  getChordNotes(scale: string, chordRoot: number) {
    const scaleNotes = scales[scale as keyof typeof scales];
    return [
      this.getFrequency(scaleNotes[chordRoot % scaleNotes.length]),
      this.getFrequency(scaleNotes[(chordRoot + 2) % scaleNotes.length]),
      this.getFrequency(scaleNotes[(chordRoot + 4) % scaleNotes.length])
    ];
  }

  // Check if a note is currently playing
  isNotePlaying(noteIndex: number): boolean {
    return this.activeNotes.has(noteIndex);
  }
}

// Create a singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;