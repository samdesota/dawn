import { Component, createEffect, onCleanup, onMount } from 'solid-js';
import { createSignal } from 'solid-js';
import hexImprovState, { HexagonData, CHORD_DURATION, FADE_IN_DURATION, HexImprovTransition } from './hexImprovState';
import audioEngine from './audioEngine';
import { scales, getChordColors, interpolateColor, progressions } from './musicData';

// Canvas properties type
type HexGridProps = {
  width?: number;
  height?: number;
};

// Cube coordinates for hexagonal grid
type CubeCoord = {
  q: number; // x axis
  r: number; // y axis
  s: number; // z axis (q + r + s = 0)
};

const HexGrid: Component<HexGridProps> = (props) => {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = createSignal<CanvasRenderingContext2D | null>(null);
  
  // Use window dimensions for the canvas
  const width = props.width || window.innerWidth - 20;
  const height = props.height || window.innerHeight - 80;
  
  // Animation frame tracking
  let animationFrameId: number | null = null;

  // Convert cube coordinates to pixel positions (pointy-top hexagons)
  function cubeToPixel(cube: CubeCoord, hexSize: number): { x: number; y: number } {
    const x = hexSize * Math.sqrt(3) * (cube.q + cube.r / 2);
    const y = hexSize * 3/2 * cube.r;
    return { x, y };
  }
  
  function getHexCoordinates(row: number, col: number, hexSize: number): { x: number; y: number } {
    // Hex grid with pointy-top orientation
    // Even rows are shifted to create interlocking pattern
    const isEvenRow = row % 2 === 0;
    
    // Calculate x position - offset odd rows by half a hex width to create interlocking pattern
    // For a proper honeycomb, we need to space each column by hexSize * sqrt(3)
    const x = col * (hexSize * Math.sqrt(3)) + (isEvenRow ? 0 : hexSize * Math.sqrt(3) / 2);
    
    // Calculate y position - proper spacing for pointy-top hexagons is 1.5 * hexSize
    const y = row * (hexSize * 1.5);
    
    return { x, y };
  }

  // Setup hexagonal grid using cube coordinates
  function setupHexGrid() {
    const canvasElem = canvas();
    if (!canvasElem) return;
    
    const state = hexImprovState();
    const hexagons: HexagonData[] = [];
    const currentScale = scales[state.scale as keyof typeof scales];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Create a mapping to track which notes we've already added
    // This helps prevent duplicate notes
    const usedNotes = new Set<string>();
    
    // Organize by octave (one row per octave) - top row is highest octave
    const numOctaves = 4;
    const notesInScale = currentScale.length;
    
    // Calculate the optimal hex size to use as much of the canvas as possible
    // We need to account for horizontal and vertical spacing
    // Leave some padding around the edges (5% of canvas size)
    const paddingPercent = 0.05;
    const paddingX = canvasElem.width * paddingPercent;
    const paddingY = canvasElem.height * paddingPercent;
    
    // Calculate maximum available space
    const availableWidth = canvasElem.width - (2 * paddingX);
    const availableHeight = canvasElem.height - (2 * paddingY);
    
    // Calculate optimal hex size based on available space
    // For horizontal spacing: Need width for (notes in scale) columns
    // For vertical spacing: Need height for (numOctaves) rows
    const optimalHexSizeByWidth = availableWidth / (notesInScale * Math.sqrt(3));
    const optimalHexSizeByHeight = availableHeight / (numOctaves * 1.5);
    
    // Use the smaller of the two to ensure grid fits in both dimensions
    const optimalHexSize = Math.min(optimalHexSizeByWidth, optimalHexSizeByHeight);
    
    // Set hex size with a reasonable minimum and maximum
    const minHexSize = 20;
    const maxHexSize = 50;
    const hexSize = Math.max(minHexSize, Math.min(maxHexSize, optimalHexSize));
    
    // Calculate dimensions based on the determined hex size
    const hexWidth = hexSize * Math.sqrt(3);
    const hexHeight = hexSize * 1.5;
    
    // Total grid dimensions
    const gridWidth = currentScale.length * hexWidth;
    const gridHeight = numOctaves * hexHeight;
    
    // Position the grid in the center of the canvas
    const offsetX = (canvasElem.width - gridWidth) / 2 + hexWidth/2;
    const offsetY = (canvasElem.height - gridHeight) / 2 + hexSize;
    
    // Generate grid with one row per octave
    for (let octave = 4; octave >= 1; octave--) {
      const row = 4 - octave; // Row 0 is octave 4, Row 3 is octave 1
      
      // Place each note from the scale in the row
      for (let i = 0; i < currentScale.length; i++) {
        const scaleNote = currentScale[i];
        const noteInOctave = scaleNote % 12;
        
        // Position column based on the index in the scale (not chromatic position)
        // This gives even spacing regardless of intervals between notes
        const col = i;
        
        // Calculate position with proper hex grid spacing
        const position = getHexCoordinates(row, col, hexSize);
        const x = offsetX + position.x;
        const y = offsetY + position.y;
        
        // Skip if position would be outside canvas bounds with padding
        const padding = 5;
        if (x - hexSize < padding || x + hexSize > canvasElem.width - padding || 
            y - hexSize < padding || y + hexSize > canvasElem.height - padding) {
          continue;
        }
        
        // Calculate absolute note index (C1 = 0, C2 = 12, etc.)
        const absoluteNoteIndex = scaleNote + ((octave - 1) * 12);
        
        // Create display note name
        const noteName = noteNames[noteInOctave];
        const displayNote = `${noteName}${octave}`;
        
        // Skip if we already have this exact note
        if (usedNotes.has(displayNote)) {
          continue;
        }
        
        // Add this note to our used notes set
        usedNotes.add(displayNote);
        
        // Add hexagon to the grid
        hexagons.push({
          x: x,
          y: y,
          radius: hexSize,
          noteIndex: absoluteNoteIndex,
          note: noteName,
          octave: octave,
          displayNote: displayNote
        });
      }
    }
    
    return hexagons;
  }
  
  // Draw hexagon
  function drawHexagon(x: number, y: number, radius: number, fillColor: string, strokeColor: string, text: string) {
    const contextRef = ctx();
    if (!contextRef) return;
    
    contextRef.beginPath();
    for (let i = 0; i < 6; i++) {
      // For pointy-top hexagons, start angle is 30 degrees (or PI/6 radians)
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) contextRef.moveTo(hx, hy);
      else contextRef.lineTo(hx, hy);
    }
    contextRef.closePath();
    
    contextRef.fillStyle = fillColor;
    contextRef.fill();
    contextRef.strokeStyle = strokeColor;
    contextRef.lineWidth = 1.5;
    contextRef.stroke();
    
    // Draw text
    contextRef.fillStyle = 'white';
    contextRef.font = 'bold 12px sans-serif';
    contextRef.textAlign = 'center';
    contextRef.textBaseline = 'middle';
    contextRef.fillText(text, x, y);
  }
  
  // Get current and next chord information with transition
  function getChordDisplayInfo(): HexImprovTransition {
    const state = hexImprovState();
    if (!state.isPlaying) return { currentChord: null, nextChord: null, transitionAmount: 0 };
    
    const now = Date.now();
    const timeSinceStart = now - state.chordStartTime;
    const scaleNotes = scales[state.scale as keyof typeof scales];
    const scaleType = state.scale === 'minor' ? 'minor' : 'major';
    
    // Get progression
    const progressionKey = state.progression as keyof typeof progressions;
    const chordIndices = progressions[progressionKey];
    
    // Current chord info
    const currentChordRoot = chordIndices[state.currentChordIndex];
    const currentChordNotes = [
      scaleNotes[currentChordRoot % scaleNotes.length],
      scaleNotes[(currentChordRoot + 2) % scaleNotes.length],
      scaleNotes[(currentChordRoot + 4) % scaleNotes.length]
    ];
    const currentColors = getChordColors(currentChordRoot, scaleType as 'major' | 'minor');
    
    // Next chord info
    const nextChordIndex = (state.currentChordIndex + 1) % chordIndices.length;
    const nextChordRoot = chordIndices[nextChordIndex];
    const nextChordNotes = [
      scaleNotes[nextChordRoot % scaleNotes.length],
      scaleNotes[(nextChordRoot + 2) % scaleNotes.length],
      scaleNotes[(nextChordRoot + 4) % scaleNotes.length]
    ];
    const nextColors = getChordColors(nextChordRoot, scaleType as 'major' | 'minor');
    
    // Calculate transition amount - only fade in during last 500ms
    const fadeStartTime = CHORD_DURATION - FADE_IN_DURATION; // 1500ms mark
    let transitionAmount = 0;
    
    if (timeSinceStart >= fadeStartTime && timeSinceStart < CHORD_DURATION) {
      // We're in the fade-in period
      transitionAmount = (timeSinceStart - fadeStartTime) / FADE_IN_DURATION;
      transitionAmount = Math.max(0, Math.min(1, transitionAmount));
    }
    
    return {
      currentChord: { notes: currentChordNotes, colors: currentColors },
      nextChord: { notes: nextChordNotes, colors: nextColors },
      transitionAmount: transitionAmount
    };
  }
  
  // Check if point is inside hexagon
  function isPointInHexagon(x: number, y: number, hexX: number, hexY: number, radius: number) {
    const dx = x - hexX;
    const dy = y - hexY;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  }
  
  // Render canvas
  function render() {
    const contextRef = ctx();
    const canvasElem = canvas();
    if (!contextRef || !canvasElem) return;
    
    contextRef.clearRect(0, 0, canvasElem.width, canvasElem.height);
    
    const chordInfo = getChordDisplayInfo();
    const state = hexImprovState();
    
    state.hexagons.forEach(hex => {
      // Get the note index within the octave (C=0, C#=1, etc.)
      const noteInOctave = ((hex.noteIndex % 12) + 12) % 12;
      let fillColor = 'rgba(100, 150, 255, 0.6)'; // Default color
      let strokeColor = '#64a2ff';
      
      // Check if note is in current chord
      let isCurrentChordNote = false;
      let currentNoteRole: 'root' | 'third' | 'fifth' | null = null;
      if (chordInfo.currentChord) {
        const currentNotes = chordInfo.currentChord.notes;
        // Compare this note with the current chord notes (accounting for octave differences)
        if (noteInOctave === (currentNotes[0] % 12)) {
          isCurrentChordNote = true;
          currentNoteRole = 'root';
        } else if (noteInOctave === (currentNotes[1] % 12)) {
          isCurrentChordNote = true;
          currentNoteRole = 'third';
        } else if (noteInOctave === (currentNotes[2] % 12)) {
          isCurrentChordNote = true;
          currentNoteRole = 'fifth';
        }
      }
      
      // Check if note is in next chord (only during transition)
      let isNextChordNote = false;
      let nextNoteRole: 'root' | 'third' | 'fifth' | null = null;
      if (chordInfo.nextChord && chordInfo.transitionAmount > 0) {
        const nextNotes = chordInfo.nextChord.notes;
        // Compare this note with the next chord notes
        if (noteInOctave === (nextNotes[0] % 12)) {
          isNextChordNote = true;
          nextNoteRole = 'root';
        } else if (noteInOctave === (nextNotes[1] % 12)) {
          isNextChordNote = true;
          nextNoteRole = 'third';
        } else if (noteInOctave === (nextNotes[2] % 12)) {
          isNextChordNote = true;
          nextNoteRole = 'fifth';
        }
      }
      
      // Apply colors based on chord membership
      if (isCurrentChordNote && isNextChordNote && currentNoteRole && nextNoteRole) {
        // Note is in both chords - interpolate between them
        const currentColor = chordInfo.currentChord?.colors[currentNoteRole];
        const nextColor = chordInfo.nextChord?.colors[nextNoteRole];
        if (currentColor && nextColor) {
          fillColor = interpolateColor(currentColor, nextColor, chordInfo.transitionAmount);
          strokeColor = fillColor.replace(/[\d\.]+\)$/, '1.0)');
        }
      } else if (isCurrentChordNote && currentNoteRole) {
        // Note is only in current chord
        const currentColor = chordInfo.currentChord?.colors[currentNoteRole];
        if (currentColor) {
          fillColor = currentColor;
          strokeColor = currentColor.replace(/[\d\.]+\)$/, '1.0)');
        }
      } else if (isNextChordNote && nextNoteRole) {
        // Note is only in next chord - fade in from default
        const defaultColor = 'rgba(100, 150, 255, 0.6)';
        const nextColor = chordInfo.nextChord?.colors[nextNoteRole];
        if (nextColor) {
          fillColor = interpolateColor(defaultColor, nextColor, chordInfo.transitionAmount);
          const fullNextColor = nextColor.replace(/[\d\.]+\)$/, '1.0)');
          strokeColor = interpolateColor('#64a2ff', fullNextColor, chordInfo.transitionAmount);
        }
      }
      
      drawHexagon(hex.x, hex.y, hex.radius, fillColor, strokeColor, hex.displayNote || hex.note);
    });
    
    // Continue animation if playing
    if (state.isPlaying) {
      animationFrameId = requestAnimationFrame(render);
    }
  }
  
  // Track active touches to handle multi-touch and prevent duplicates
  const activeTouches = new Map<number, number>(); // touchId -> noteIndex
  let activeMouseNote: number | null = null;

  // Handle mouse down for sustained notes
  function handleCanvasMouseDown(event: MouseEvent) {
    const canvasElem = canvas();
    if (!canvasElem) return;
    
    const rect = canvasElem.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const state = hexImprovState();
    for (const hex of state.hexagons) {
      if (isPointInHexagon(x, y, hex.x, hex.y, hex.radius)) {
        try {
          // Initialize with force to ensure it's unlocked
          const ctx = audioEngine.initAudio();
          // Make sure audio is truly unlocked on iOS
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              audioEngine.startNote(hex.noteIndex);
              activeMouseNote = hex.noteIndex;
            });
          } else {
            audioEngine.startNote(hex.noteIndex);
            activeMouseNote = hex.noteIndex;
          }
        } catch (err) {
          console.error('Error playing note on mouse down:', err);
        }
        break; // Only play one note at a time with mouse
      }
    }
  }

  // Handle mouse up to release notes
  function handleCanvasMouseUp() {
    if (activeMouseNote !== null) {
      audioEngine.stopNote(activeMouseNote);
      activeMouseNote = null;
    }
  }

  // Handle mouse leave to release notes if cursor leaves canvas
  function handleCanvasMouseLeave() {
    if (activeMouseNote !== null) {
      audioEngine.stopNote(activeMouseNote);
      activeMouseNote = null;
    }
  }

  // Handle legacy click for backward compatibility
  function handleCanvasClick(event: MouseEvent) {
    // This is now just a fallback for devices without proper mouse events
    const canvasElem = canvas();
    if (!canvasElem) return;
    
    // If we're already handling mouse events, skip this
    if (activeMouseNote !== null) return;
    
    const rect = canvasElem.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const state = hexImprovState();
    state.hexagons.forEach(hex => {
      if (isPointInHexagon(x, y, hex.x, hex.y, hex.radius)) {
        try {
          // Initialize with force to ensure it's unlocked
          const ctx = audioEngine.initAudio();
          // Make sure audio is truly unlocked on iOS
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              audioEngine.playNote(audioEngine.getFrequency(hex.noteIndex));
            });
          } else {
            audioEngine.playNote(audioEngine.getFrequency(hex.noteIndex));
          }
        } catch (err) {
          console.error('Error playing note on click:', err);
        }
      }
    });
  }
  
  // Handle touch start for sustained notes
  function handleCanvasTouchStart(event: TouchEvent) {
    event.preventDefault();
    const canvasElem = canvas();
    if (!canvasElem) return;
    
    const rect = canvasElem.getBoundingClientRect();
    const state = hexImprovState();
    
    // Handle all touches
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Skip if this touch is already playing a note
      if (activeTouches.has(touch.identifier)) continue;
      
      for (const hex of state.hexagons) {
        if (isPointInHexagon(x, y, hex.x, hex.y, hex.radius)) {
          try {
            // Initialize with force to ensure it's unlocked
            const ctx = audioEngine.initAudio();
            // Make sure audio is truly unlocked on iOS
            if (ctx.state === 'suspended') {
              ctx.resume().then(() => {
                audioEngine.startNote(hex.noteIndex);
                activeTouches.set(touch.identifier, hex.noteIndex);
              });
            } else {
              audioEngine.startNote(hex.noteIndex);
              activeTouches.set(touch.identifier, hex.noteIndex);
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
  function handleCanvasTouchEnd(event: TouchEvent) {
    event.preventDefault();
    
    // Stop notes for each ended touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const noteIndex = activeTouches.get(touch.identifier);
      
      if (noteIndex !== undefined) {
        audioEngine.stopNote(noteIndex);
        activeTouches.delete(touch.identifier);
      }
    }
  }
  
  // Handle touch cancel to stop all notes
  function handleCanvasTouchCancel(event: TouchEvent) {
    event.preventDefault();
    
    // Stop notes for each canceled touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const noteIndex = activeTouches.get(touch.identifier);
      
      if (noteIndex !== undefined) {
        audioEngine.stopNote(noteIndex);
        activeTouches.delete(touch.identifier);
      }
    }
  }
  
  // Listen for stopPlayback event
  const handleStopPlayback = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };
  
  // Initialize hex grid and event listeners
  onMount(() => {
    const canvasElem = canvas();
    if (!canvasElem) return;
    
    const contextRef = canvasElem.getContext('2d');
    if (!contextRef) return;
    
    setCtx(contextRef);
    
    // Set up hexagons
    const hexagons = setupHexGrid();
    if (hexagons) {
      hexImprovState.produce(state => {
        state.hexagons = hexagons;
      });
    }
    
    // Start rendering
    render();
    
    // Set up event listeners for sustained notes
    canvasElem.addEventListener('mousedown', handleCanvasMouseDown);
    canvasElem.addEventListener('mouseup', handleCanvasMouseUp);
    canvasElem.addEventListener('mouseleave', handleCanvasMouseLeave);
    canvasElem.addEventListener('click', handleCanvasClick); // Fallback for backward compatibility
    
    // Touch events for mobile
    canvasElem.addEventListener('touchstart', handleCanvasTouchStart);
    canvasElem.addEventListener('touchend', handleCanvasTouchEnd);
    canvasElem.addEventListener('touchcancel', handleCanvasTouchCancel);
    
    window.addEventListener('stopPlayback', handleStopPlayback);
    
    // Handle window resize
    const handleResize = () => {
      canvasElem.width = window.innerWidth - 20;
      canvasElem.height = window.innerHeight - 80;
      
      const hexagons = setupHexGrid();
      if (hexagons) {
        hexImprovState.produce(state => {
          state.hexagons = hexagons;
        });
      }
      render();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
    
    // Clean up event listeners on unmount
    onCleanup(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Clean up mouse events
      canvasElem.removeEventListener('mousedown', handleCanvasMouseDown);
      canvasElem.removeEventListener('mouseup', handleCanvasMouseUp);
      canvasElem.removeEventListener('mouseleave', handleCanvasMouseLeave);
      canvasElem.removeEventListener('click', handleCanvasClick);
      
      // Clean up touch events
      canvasElem.removeEventListener('touchstart', handleCanvasTouchStart);
      canvasElem.removeEventListener('touchend', handleCanvasTouchEnd);
      canvasElem.removeEventListener('touchcancel', handleCanvasTouchCancel);
      
      // Clean up window events
      window.removeEventListener('stopPlayback', handleStopPlayback);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      // Stop any playing notes
      audioEngine.stopAllNotes();
    });
  });
  
  // Effect to continuously render when playing
  createEffect(() => {
    const state = hexImprovState();
    if (state.isPlaying && !animationFrameId) {
      animationFrameId = requestAnimationFrame(render);
    }
  });
  
  return (
    <div class="flex justify-center items-center h-full w-full">
      <canvas 
        ref={setCanvas} 
        width={width} 
        height={height} 
        class="w-full h-full rounded-xl bg-white/10 backdrop-blur-md border border-white/20 touch-none cursor-pointer"
      />
    </div>
  );
};

export default HexGrid;