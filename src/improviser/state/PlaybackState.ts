import { createAtom } from '../../state/atom';
import { chordProgressionState } from './ChordProgressionState';
import { keyboardState } from './KeyboardState';

export type PlaybackMode = 'stopped' | 'playing' | 'paused';

export class PlaybackState {
  // Reactive state atoms
  public mode = createAtom<PlaybackMode>('stopped');
  public currentBeat = createAtom(0);
  public beatsPerChord = createAtom(4); // Number of beats per chord
  public isMetronomeEnabled = createAtom(false);
  public isAutoAdvance = createAtom(true); // Auto-advance chords

  // Timing control
  private intervalId: number | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;

  constructor() {
    // Initialize timing
  }

  public play() {
    if (this.mode() === 'paused') {
      // Resume from pause
      this.resume();
    } else {
      // Start from beginning or current position
      this.start();
    }
  }

  public pause() {
    if (this.mode() === 'playing') {
      this.mode.set('paused');
      this.pausedTime = Date.now() - this.startTime;
      this.stopTimer();
    }
  }

  public stop() {
    this.mode.set('stopped');
    this.currentBeat.set(0);
    this.pausedTime = 0;
    this.stopTimer();

    // Reset chord progression to beginning
    chordProgressionState.currentChordIndex.set(0);
    keyboardState.updateHighlighting();
  }

  private start() {
    this.mode.set('playing');
    this.startTime = Date.now() - this.pausedTime;
    this.startTimer();
  }

  private resume() {
    this.mode.set('playing');
    this.startTime = Date.now() - this.pausedTime;
    this.startTimer();
  }

  private startTimer() {
    this.stopTimer(); // Clear any existing timer

    const bpm = chordProgressionState.tempoValue;
    const beatInterval = (60 / bpm) * 1000; // Convert BPM to milliseconds per beat

    this.intervalId = window.setInterval(() => {
      this.onBeat();
    }, beatInterval);
  }

  private stopTimer() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private onBeat() {
    const currentBeat = this.currentBeat();
    const nextBeat = currentBeat + 1;

    // Update beat counter
    this.currentBeat.set(nextBeat);

    // Check if we should advance to next chord
    if (this.isAutoAdvance() && nextBeat % this.beatsPerChord() === 0) {
      this.advanceChord();
    }

    // Play metronome if enabled
    if (this.isMetronomeEnabled()) {
      this.playMetronomeClick(nextBeat % this.beatsPerChord() === 1);
    }
  }

  private advanceChord() {
    chordProgressionState.nextChord();
    keyboardState.updateHighlighting();
  }

  private playMetronomeClick(isDownbeat: boolean) {
    // Create a simple metronome click using Web Audio API
    // This is a basic implementation - could be enhanced with better sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for downbeat vs regular beat
      oscillator.frequency.setValueAtTime(isDownbeat ? 800 : 400, audioContext.currentTime);
      oscillator.type = 'square';

      // Short click envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if audio context isn't available
      console.warn('Metronome click failed:', error);
    }
  }

  public togglePlayPause() {
    switch (this.mode()) {
      case 'stopped':
      case 'paused':
        this.play();
        break;
      case 'playing':
        this.pause();
        break;
    }
  }

  public setTempo(bpm: number) {
    chordProgressionState.setTempo(bpm);

    // Restart timer with new tempo if playing
    if (this.mode() === 'playing') {
      this.startTimer();
    }
  }

  public setBeatsPerChord(beats: number) {
    this.beatsPerChord.set(Math.max(1, Math.min(8, beats)));
  }

  public toggleMetronome() {
    this.isMetronomeEnabled.set(!this.isMetronomeEnabled());
  }

  public toggleAutoAdvance() {
    this.isAutoAdvance.set(!this.isAutoAdvance());
  }

  public skipToNextChord() {
    chordProgressionState.nextChord();
    keyboardState.updateHighlighting();
    this.currentBeat.set(0); // Reset beat counter
  }

  public skipToPreviousChord() {
    chordProgressionState.previousChord();
    keyboardState.updateHighlighting();
    this.currentBeat.set(0); // Reset beat counter
  }

  public getCurrentBeatInMeasure(): number {
    return (this.currentBeat() % this.beatsPerChord()) + 1;
  }

  public getCurrentMeasure(): number {
    return Math.floor(this.currentBeat() / this.beatsPerChord()) + 1;
  }

  public getProgressInCurrentChord(): number {
    const beatInChord = this.currentBeat() % this.beatsPerChord();
    return beatInChord / this.beatsPerChord();
  }

  public getOverallProgress(): number {
    const song = chordProgressionState.currentSongValue;
    if (!song) return 0;

    const totalBeats = song.chords.length * this.beatsPerChord();
    const currentTotalBeat =
      chordProgressionState.currentChordIndexValue * this.beatsPerChord() +
      (this.currentBeat() % this.beatsPerChord());

    return currentTotalBeat / totalBeats;
  }

  // Manual chord navigation (affects timing)
  public jumpToChord(index: number) {
    const song = chordProgressionState.currentSongValue;
    if (!song || index < 0 || index >= song.chords.length) return;

    chordProgressionState.currentChordIndex.set(index);
    keyboardState.updateHighlighting();

    // Reset beat to beginning of chord
    this.currentBeat.set(index * this.beatsPerChord());
  }

  // Getters for computed values
  get isPlaying() { return this.mode() === 'playing'; }
  get isPaused() { return this.mode() === 'paused'; }
  get isStopped() { return this.mode() === 'stopped'; }
  get currentTempo() { return chordProgressionState.tempoValue; }

  // Getters for reactive values
  get modeValue() { return this.mode(); }
  get currentBeatValue() { return this.currentBeat(); }
  get beatsPerChordValue() { return this.beatsPerChord(); }
  get isMetronomeEnabledValue() { return this.isMetronomeEnabled(); }
  get isAutoAdvanceValue() { return this.isAutoAdvance(); }
}

// Export singleton instance
export const playbackState = new PlaybackState();
