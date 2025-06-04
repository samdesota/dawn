import { createSignal } from 'solid-js';
import type { Sample } from '../fileSystemUtils';

/**
 * A Solid.js hook for audio playback functionality
 */
export function createAudioPlayer() {
  const [currentlyPlaying, setCurrentlyPlaying] = createSignal<string | null>(null);
  const [audioContext, setAudioContext] = createSignal<AudioContext | null>(null);
  const [audioSource, setAudioSource] = createSignal<AudioBufferSourceNode | null>(null);

  // Create audio context if needed
  const getAudioContext = (): AudioContext => {
    if (!audioContext()) {
      setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)());
    }
    return audioContext()!;
  };

  // Stop current playback
  const stopPlayback = () => {
    if (audioSource()) {
      audioSource()?.stop();
      setAudioSource(null);
      setCurrentlyPlaying(null);
    }
  };

  // Load and decode an audio file
  const loadAudioBuffer = async (file: File): Promise<AudioBuffer> => {
    try {
      const ctx = getAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      return await ctx.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading audio:", error);
      throw new Error(`Failed to load audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Play a sample
  const playSample = async (sample: Sample): Promise<void> => {
    try {
      // Stop current playback if exists
      stopPlayback();

      // Get the audio context
      const ctx = getAudioContext();

      // Get the file
      const file = await sample.handle.getFile();

      // Load and decode audio
      const audioBuffer = await loadAudioBuffer(file);
      
      // Create and configure source
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Start playback
      source.start();
      setAudioSource(source);
      setCurrentlyPlaying(sample.name);

      // Reset when playback ends
      source.onended = () => {
        setCurrentlyPlaying(null);
        setAudioSource(null);
      };
    } catch (err) {
      console.error("Error playing sample:", err);
      throw new Error("Failed to play sample");
    }
  };

  return {
    currentlyPlaying,
    playSample,
    stopPlayback,
    isPlaying: (sampleName: string) => currentlyPlaying() === sampleName
  };
}