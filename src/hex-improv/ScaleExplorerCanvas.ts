import { Accessor, Setter } from 'solid-js';
import audioEngine from './audioEngine';
import { scales } from './musicData';

// Hexagon data structure
export interface HexagonData {
  x: number;
  y: number;
  radius: number;
  noteIndex: number;
  note: string;
  octave: number;
  displayNote: string;
  scaleIndex: number; // Position in scale (0-6 for major scale)
}

export interface CanvasState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  hexagons: HexagonData[];
  selectedNote: number | null;
  activeTouches: Map<number, number>; // touchId -> noteIndex
  activeMouseNote: number | null;
  animationFrameId: number | null;
}

export class ScaleExplorerCanvas {
  private state: CanvasState;
  private selectedScale: Accessor<string>;
  private setSelectedNote: Setter<number | null>;

  constructor(
    selectedScale: Accessor<string>,
    setSelectedNote: Setter<number | null>
  ) {
    this.selectedScale = selectedScale;
    this.setSelectedNote = setSelectedNote;
    this.state = {
      canvas: null,
      ctx: null,
      hexagons: [],
      selectedNote: null,
      activeTouches: new Map(),
      activeMouseNote: null,
      animationFrameId: null
    };
  }

  // Get hex coordinates for honeycomb layout
  private getHexCoordinates(row: number, col: number, hexSize: number): { x: number; y: number } {
    const isEvenRow = row % 2 === 0;
    const x = col * (hexSize * Math.sqrt(3)) + (isEvenRow ? 0 : hexSize * Math.sqrt(3) / 2);
    const y = row * (hexSize * 1.5);
    return { x, y };
  }

  // Setup hexagonal grid
  setupHexGrid(): HexagonData[] {
    if (!this.state.canvas) return [];

    const currentScale = scales[this.selectedScale() as keyof typeof scales];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const hexagons: HexagonData[] = [];

    // 6 octaves: 2, 3, 4, 5, 6, 7 (more practical range similar to piano)
    const numOctaves = 6;
    const startOctave = 2;
    const endOctave = 7;
    const notesInScale = currentScale.length;

    // Calculate optimal hex size
    const paddingPercent = 0.05;
    const paddingX = this.state.canvas.width * paddingPercent;
    const paddingY = this.state.canvas.height * paddingPercent;
    const availableWidth = this.state.canvas.width - (2 * paddingX);
    const availableHeight = this.state.canvas.height - (2 * paddingY);

    const optimalHexSizeByWidth = availableWidth / (notesInScale * Math.sqrt(3));
    const optimalHexSizeByHeight = availableHeight / (numOctaves * 1.5);
    const optimalHexSize = Math.min(optimalHexSizeByWidth, optimalHexSizeByHeight);

    const minHexSize = 20;
    const maxHexSize = 50;
    const hexSize = Math.max(minHexSize, Math.min(maxHexSize, optimalHexSize));

    // Calculate grid dimensions and centering
    const hexWidth = hexSize * Math.sqrt(3);
    const hexHeight = hexSize * 1.5;
    const gridWidth = currentScale.length * hexWidth;
    const gridHeight = numOctaves * hexHeight;
    const offsetX = (this.state.canvas.width - gridWidth) / 2 + hexWidth/2;
    const offsetY = (this.state.canvas.height - gridHeight) / 2 + hexSize;

    // Generate grid - one row per octave (top = octave 7, bottom = octave 2)
    for (let octave = endOctave; octave >= startOctave; octave--) {
      const row = endOctave - octave; // Row 0 = octave 7, Row 5 = octave 2

      for (let scaleIndex = 0; scaleIndex < currentScale.length; scaleIndex++) {
        const scaleNote = currentScale[scaleIndex];
        const noteInOctave = scaleNote % 12;
        const col = scaleIndex;

        const position = this.getHexCoordinates(row, col, hexSize);
        const x = offsetX + position.x;
        const y = offsetY + position.y;

        // Skip if outside canvas bounds
        const padding = 10;
        if (x - hexSize < padding || x + hexSize > this.state.canvas.width - padding ||
            y - hexSize < padding || y + hexSize > this.state.canvas.height - padding) {
          continue;
        }

        // Calculate absolute note index (C0 = 0, C1 = 12, etc.)
        const absoluteNoteIndex = scaleNote + (octave * 12);
        const noteName = noteNames[noteInOctave];
        const displayNote = `${noteName}${octave}`;

        hexagons.push({
          x: x,
          y: y,
          radius: hexSize,
          noteIndex: absoluteNoteIndex,
          note: noteName,
          octave: octave,
          displayNote: displayNote,
          scaleIndex: scaleIndex
        });
      }
    }

    this.state.hexagons = hexagons;
    return hexagons;
  }

  // Draw hexagon
  private drawHexagon(hex: HexagonData, fillColor: string, strokeColor: string = '#444') {
    if (!this.state.ctx) return;

    const { x, y, radius } = hex;

    this.state.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) this.state.ctx.moveTo(hx, hy);
      else this.state.ctx.lineTo(hx, hy);
    }
    this.state.ctx.closePath();

    this.state.ctx.fillStyle = fillColor;
    this.state.ctx.fill();
    this.state.ctx.strokeStyle = strokeColor;
    this.state.ctx.lineWidth = 2;
    this.state.ctx.stroke();

    // Draw text
    this.state.ctx.fillStyle = 'white';
    this.state.ctx.font = 'bold 14px sans-serif';
    this.state.ctx.textAlign = 'center';
    this.state.ctx.textBaseline = 'middle';
    this.state.ctx.fillText(hex.displayNote, x, y);
  }

  // Get interval color based on consonance/resonance with all currently playing notes
  private getIntervalColor(hex: HexagonData): string {
    // Get all currently playing notes
    const playingNotes: number[] = [];

    // Add mouse note if active
    if (this.state.activeMouseNote !== null) {
      // Find the hex with this noteIndex to get its scaleIndex
      const mouseHex = this.state.hexagons.find(h => h.noteIndex === this.state.activeMouseNote);
      if (mouseHex) {
        playingNotes.push(mouseHex.scaleIndex);
      }
    }

    // Add all touch notes
    for (const noteIndex of this.state.activeTouches.values()) {
      // Find the hex with this noteIndex to get its scaleIndex
      const touchHex = this.state.hexagons.find(h => h.noteIndex === noteIndex);
      if (touchHex) {
        playingNotes.push(touchHex.scaleIndex);
      }
    }

    // If no notes are playing, fall back to selectedNote
    if (playingNotes.length === 0) {
      if (this.state.selectedNote === null) return 'rgba(100, 100, 100, 0.8)';
      playingNotes.push(this.state.selectedNote);
    }

    // Calculate consonance with all playing notes
    let maxConsonance = 0;

    for (const playingScaleIndex of playingNotes) {
      const interval = (hex.scaleIndex - playingScaleIndex + 7) % 7;

      // Consonance values based on music theory (higher = more consonant/resonant)
      const consonanceValues = {
        0: 1.0,   // unison - perfect consonance
        4: 0.9,   // fifth - very consonant
        3: 0.75,  // fourth - consonant
        2: 0.6,   // third - moderately consonant
        5: 0.5,   // sixth - moderately consonant
        1: 0.3,   // second - dissonant
        6: 0.25,  // seventh - very dissonant
      };

      const consonance = consonanceValues[interval as keyof typeof consonanceValues] || 0.3;
      maxConsonance = Math.max(maxConsonance, consonance);
    }

    // Use a single blue color with varying intensity
    const baseColor = [70, 130, 255]; // RGB for blue
    const alpha = 0.3 + (maxConsonance * 0.7); // Alpha from 0.3 to 1.0

    return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
  }

  // Check if point is inside hexagon
  private isPointInHexagon(px: number, py: number, hex: HexagonData): boolean {
    const dx = px - hex.x;
    const dy = py - hex.y;
    return Math.sqrt(dx * dx + dy * dy) <= hex.radius;
  }

  // Render the canvas
  render = () => {
    if (!this.state.ctx || !this.state.canvas) return;

    // Clear canvas
    this.state.ctx.clearRect(0, 0, this.state.canvas.width, this.state.canvas.height);

    // Draw hexagons
    this.state.hexagons.forEach(hex => {
      const fillColor = this.getIntervalColor(hex);

      // Check if this hex is currently being played
      let isPlaying = false;

      // Check mouse note
      if (this.state.activeMouseNote !== null && hex.noteIndex === this.state.activeMouseNote) {
        isPlaying = true;
      }

      // Check touch notes
      for (const noteIndex of this.state.activeTouches.values()) {
        if (hex.noteIndex === noteIndex) {
          isPlaying = true;
          break;
        }
      }

      // If no notes are playing, fall back to selectedNote
      if (!isPlaying && this.state.activeTouches.size === 0 && this.state.activeMouseNote === null) {
        isPlaying = this.state.selectedNote === hex.scaleIndex;
      }

      const strokeColor = isPlaying ? '#fff' : '#444';

      this.drawHexagon(hex, fillColor, strokeColor);
    });

    this.state.animationFrameId = requestAnimationFrame(this.render);
  }

  // Handle mouse down for sustained notes
  handleCanvasMouseDown = (event: MouseEvent) => {
    if (!this.state.canvas) return;

    const rect = this.state.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (const hex of this.state.hexagons) {
      if (this.isPointInHexagon(x, y, hex)) {
        try {
          // Initialize with force to ensure it's unlocked
          const ctx = audioEngine.initAudio();
          const frequency = audioEngine.getFrequency(hex.noteIndex);
          console.log(`🎵 Playing note: ${hex.displayNote} (noteIndex: ${hex.noteIndex}, frequency: ${frequency.toFixed(2)}Hz)`);

          // Make sure audio is truly unlocked on iOS
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              audioEngine.startNote(hex.noteIndex);
              this.state.activeMouseNote = hex.noteIndex;
              this.setSelectedNote(hex.scaleIndex);
            });
          } else {
            audioEngine.startNote(hex.noteIndex);
            this.state.activeMouseNote = hex.noteIndex;
            this.setSelectedNote(hex.scaleIndex);
          }
        } catch (err) {
          console.error('Error playing note on mouse down:', err);
        }
        break; // Only play one note at a time with mouse
      }
    }
  }

  // Handle mouse up to release notes
  handleCanvasMouseUp = () => {
    if (this.state.activeMouseNote !== null) {
      const hex = this.state.hexagons.find(h => h.noteIndex === this.state.activeMouseNote);
      if (hex) {
        console.log(`🔇 Stopping note: ${hex.displayNote} (noteIndex: ${this.state.activeMouseNote})`);
      }
      audioEngine.stopNote(this.state.activeMouseNote);
      this.state.activeMouseNote = null;
    }
  }

  // Handle mouse leave to release notes if cursor leaves canvas
  handleCanvasMouseLeave = () => {
    if (this.state.activeMouseNote !== null) {
      const hex = this.state.hexagons.find(h => h.noteIndex === this.state.activeMouseNote);
      if (hex) {
        console.log(`🔇 Stopping note (mouse leave): ${hex.displayNote} (noteIndex: ${this.state.activeMouseNote})`);
      }
      audioEngine.stopNote(this.state.activeMouseNote);
      this.state.activeMouseNote = null;
    }
  }

  // Handle legacy click for backward compatibility
  handleCanvasClick = (event: MouseEvent) => {
    // This is now just a fallback for devices without proper mouse events
    if (!this.state.canvas) return;

    // If we're already handling mouse events, skip this
    if (this.state.activeMouseNote !== null) return;

    const rect = this.state.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (const hex of this.state.hexagons) {
      if (this.isPointInHexagon(x, y, hex)) {
        try {
          // Initialize with force to ensure it's unlocked
          const ctx = audioEngine.initAudio();
          const frequency = audioEngine.getFrequency(hex.noteIndex);
          console.log(`🎵 Playing note (click): ${hex.displayNote} (noteIndex: ${hex.noteIndex}, frequency: ${frequency.toFixed(2)}Hz)`);

          // Make sure audio is truly unlocked on iOS
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              audioEngine.playNote(frequency);
              this.setSelectedNote(hex.scaleIndex);
            });
          } else {
            audioEngine.playNote(frequency);
            this.setSelectedNote(hex.scaleIndex);
          }
        } catch (err) {
          console.error('Error playing note on click:', err);
        }
        break;
      }
    }
  }

  // Handle touch start for sustained notes
  handleCanvasTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    if (!this.state.canvas) return;

    const rect = this.state.canvas.getBoundingClientRect();

    // Handle all touches
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Skip if this touch is already playing a note
      if (this.state.activeTouches.has(touch.identifier)) continue;

      for (const hex of this.state.hexagons) {
        if (this.isPointInHexagon(x, y, hex)) {
          try {
            // Initialize with force to ensure it's unlocked
            const ctx = audioEngine.initAudio();
            const frequency = audioEngine.getFrequency(hex.noteIndex);
            console.log(`🎵 Playing note (touch): ${hex.displayNote} (noteIndex: ${hex.noteIndex}, frequency: ${frequency.toFixed(2)}Hz, touchId: ${touch.identifier})`);

            // Make sure audio is truly unlocked on iOS
            if (ctx.state === 'suspended') {
              ctx.resume().then(() => {
                audioEngine.startNote(hex.noteIndex);
                this.state.activeTouches.set(touch.identifier, hex.noteIndex);
                this.setSelectedNote(hex.scaleIndex);
              });
            } else {
              audioEngine.startNote(hex.noteIndex);
              this.state.activeTouches.set(touch.identifier, hex.noteIndex);
              this.setSelectedNote(hex.scaleIndex);
            }
          } catch (err) {
            console.error('Error playing note on touch start:', err);
          }
          break; // Only one note per touch
        }
      }
    }
  }

  // Handle touch end to stop notes
  handleCanvasTouchEnd = (event: TouchEvent) => {
    event.preventDefault();

    // Stop notes for each ended touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const noteIndex = this.state.activeTouches.get(touch.identifier);

      if (noteIndex !== undefined) {
        const hex = this.state.hexagons.find(h => h.noteIndex === noteIndex);
        if (hex) {
          console.log(`🔇 Stopping note (touch end): ${hex.displayNote} (noteIndex: ${noteIndex}, touchId: ${touch.identifier})`);
        }
        audioEngine.stopNote(noteIndex);
        this.state.activeTouches.delete(touch.identifier);
      }
    }
  }

  // Handle touch cancel to stop all notes
  handleCanvasTouchCancel = (event: TouchEvent) => {
    event.preventDefault();

    // Stop notes for each canceled touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const noteIndex = this.state.activeTouches.get(touch.identifier);

      if (noteIndex !== undefined) {
        const hex = this.state.hexagons.find(h => h.noteIndex === noteIndex);
        if (hex) {
          console.log(`🔇 Stopping note (touch cancel): ${hex.displayNote} (noteIndex: ${noteIndex}, touchId: ${touch.identifier})`);
        }
        audioEngine.stopNote(noteIndex);
        this.state.activeTouches.delete(touch.identifier);
      }
    }
  }

  // Initialize canvas
  initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.state.canvas = canvas;
    this.state.ctx = ctx;

    // Set canvas size
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight - 200; // Leave space for controls

    // Setup initial hexagons and start rendering
    this.setupHexGrid();
    this.render();

    // Add event listeners for sustained notes
    canvas.addEventListener('mousedown', this.handleCanvasMouseDown);
    canvas.addEventListener('mouseup', this.handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', this.handleCanvasMouseLeave);
    canvas.addEventListener('click', this.handleCanvasClick); // Fallback for backward compatibility

    // Touch events for mobile
    canvas.addEventListener('touchstart', this.handleCanvasTouchStart);
    canvas.addEventListener('touchend', this.handleCanvasTouchEnd);
    canvas.addEventListener('touchcancel', this.handleCanvasTouchCancel);
  }

  // Update selected note
  updateSelectedNote(selectedNote: number | null) {
    this.state.selectedNote = selectedNote;
  }

  // Update hexagons when scale changes
  updateScale() {
    if (this.state.canvas) {
      this.setupHexGrid();
    }
  }

  // Get current hexagons
  getHexagons(): HexagonData[] {
    return this.state.hexagons;
  }

  // Get active touches and mouse note for external access
  getActiveNotes() {
    return {
      activeTouches: this.state.activeTouches,
      activeMouseNote: this.state.activeMouseNote
    };
  }

  // Cleanup
  cleanup() {
    if (this.state.animationFrameId) {
      cancelAnimationFrame(this.state.animationFrameId);
    }

    if (this.state.canvas) {
      // Clean up mouse events
      this.state.canvas.removeEventListener('mousedown', this.handleCanvasMouseDown);
      this.state.canvas.removeEventListener('mouseup', this.handleCanvasMouseUp);
      this.state.canvas.removeEventListener('mouseleave', this.handleCanvasMouseLeave);
      this.state.canvas.removeEventListener('click', this.handleCanvasClick);

      // Clean up touch events
      this.state.canvas.removeEventListener('touchstart', this.handleCanvasTouchStart);
      this.state.canvas.removeEventListener('touchend', this.handleCanvasTouchEnd);
      this.state.canvas.removeEventListener('touchcancel', this.handleCanvasTouchCancel);
    }

    // Stop any playing notes
    audioEngine.stopAllNotes();
    this.state.activeTouches.clear();
    this.state.activeMouseNote = null;
  }
}
