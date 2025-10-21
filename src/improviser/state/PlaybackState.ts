import { createAtom } from '../../state/atom';
import { chordProgressionState } from './ChordProgressionState';
import { keyboardState } from './KeyboardState';
import * as Tone from 'tone';

export type PlaybackMode = 'stopped' | 'playing' | 'paused';

export class PlaybackState {
  // Reactive state atoms
  public mode = createAtom<PlaybackMode>('stopped');
  public currentBeat = createAtom(0);
  public beatsPerChord = createAtom(4); // Number of beats per chord
  public isMetronomeEnabled = createAtom(false);
  public isAutoAdvance = createAtom(true); // Auto-advance chords

  // Tone.js metronome synth
  private metronome: Tone.MembraneSynth | null = null;

  // Tone.Transport event IDs for cleanup
  private beatEventId: number | null = null;

  // Timing control
  private pausedBeat: number = 0;

  constructor() {
    // Create metronome synth
    this.metronome = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
      volume: -10,
    }).toDestination();
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
      this.pausedBeat = this.currentBeat();
      this.stopTimer();
      
      // Pause Tone.Transport
      Tone.getTransport().pause();
    }
  }

  public stop() {
    this.mode.set('stopped');
    this.currentBeat.set(0);
    this.pausedBeat = 0;
    this.stopTimer();

    // Stop and reset Tone.Transport
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Reset chord progression to beginning
    chordProgressionState.currentChordIndex.set(0);
    keyboardState.updateHighlighting();
  }

  private start() {
    this.mode.set('playing');
    
    // Set transport BPM
    Tone.getTransport().bpm.value = chordProgressionState.tempoValue;
    
    // If starting from paused state, restore beat counter
    if (this.pausedBeat > 0) {
      this.currentBeat.set(this.pausedBeat);
    }
    
    this.startTimer();
  }

  private resume() {
    this.mode.set('playing');
    
    // Resume Tone.Transport
    Tone.getTransport().start();
  }

  private startTimer() {
    this.stopTimer(); // Clear any existing timer

    // Set transport BPM
    Tone.getTransport().bpm.value = chordProgressionState.tempoValue;

    // Schedule repeating quarter note (beat) event
    this.beatEventId = Tone.getTransport().scheduleRepeat((time) => {
      this.onBeat(time);
    }, "4n"); // Quarter notes

    // Start transport if not already running
    if (Tone.getTransport().state !== "started") {
      Tone.getTransport().start();
    }

    console.log('Playback started with Tone.Transport at BPM:', Tone.getTransport().bpm.value);
  }

  private stopTimer() {
    if (this.beatEventId !== null) {
      Tone.getTransport().clear(this.beatEventId);
      this.beatEventId = null;
    }
  }

  private onBeat(time: number) {
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
      this.playMetronomeClick(nextBeat % this.beatsPerChord() === 1, time);
    }
  }

  private advanceChord() {
    chordProgressionState.nextChord();
    keyboardState.updateHighlighting();
  }

  private playMetronomeClick(isDownbeat: boolean, time: number) {
    if (!this.metronome) return;

    try {
      // Different frequencies for downbeat vs regular beat
      const frequency = isDownbeat ? "C5" : "C4"; // 800Hz vs 400Hz approximately
      const velocity = isDownbeat ? 1.0 : 0.7;

      // Trigger the metronome synth at the scheduled time
      this.metronome.triggerAttackRelease(frequency, "32n", time, velocity);
    } catch (error) {
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

    // Update Tone.Transport BPM
    Tone.getTransport().bpm.value = bpm;

    // Restart timer with new tempo if playing
    // Note: Tone.Transport handles tempo changes automatically,
    // but we restart to ensure synchronization
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

  // Cleanup method
  public dispose() {
    this.stopTimer();
    this.metronome?.dispose();
    this.metronome = null;
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
