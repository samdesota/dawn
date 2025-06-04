import { NOTES } from './musicTheory';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];

  public initAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  public getContext(): AudioContext | null {
    return this.audioContext;
  }

  public cleanup(): void {
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  public stopAllSounds(): void {
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore errors if oscillator already stopped
      }
    });
    this.activeOscillators = [];
    this.activeGainNodes = [];
  }

  // Get the note index for a given note name
  public getNoteIndex(noteName: string): number {
    return NOTES.indexOf(noteName);
  }

  // Get the frequency for a given note
  public getFrequency(note: number): number {
    // A4 is 440Hz at index 9 + 12*4 = 57
    const a4 = 440;
    return a4 * Math.pow(2, (note - 57) / 12);
  }

  // Play a single note with the given parameters
  public playNote(
    noteNumber: number, 
    duration: number, 
    gain: number = 0.2, 
    type: OscillatorType = 'sine'
  ): void {
    const ctx = this.initAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = this.getFrequency(noteNumber);
    
    gainNode.gain.value = gain;
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start();
    this.activeOscillators.push(oscillator);
    this.activeGainNodes.push(gainNode);
    
    // Add decay
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    // Stop the oscillator after the duration
    setTimeout(() => {
      try {
        oscillator.stop();
        
        // Remove from active oscillators
        const index = this.activeOscillators.indexOf(oscillator);
        if (index > -1) {
          this.activeOscillators.splice(index, 1);
          this.activeGainNodes.splice(index, 1);
        }
      } catch (e) {
        // Ignore errors if oscillator already stopped
      }
    }, duration * 1000);
  }

  // Play multiple notes as a chord
  public playChord(
    noteNumbers: number[], 
    duration: number, 
    baseGain: number = 0.2, 
    type: OscillatorType = 'sine'
  ): void {
    noteNumbers.forEach((noteNumber, i) => {
      // Stagger the gains slightly for a more pleasing sound
      const gain = baseGain - (i * 0.03);
      this.playNote(noteNumber, duration, gain, type);
    });
  }
}