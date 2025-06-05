# Chord Comping Feature

## Overview
The chord comping feature adds automatic chord accompaniment to the Musical Improvisation Assistant. When enabled, it plays the current chord progression with various rhythm patterns, providing a backing track for improvisation practice.

## Features

### Rhythm Patterns
The system includes 8 built-in rhythm patterns:

1. **Quarter Notes** - Basic quarter note comping (4/4 time)
2. **Half Notes** - Simple half note pattern for ballads
3. **Jazz Swing** - Syncopated jazz comping pattern
4. **Latin Montuno** - Latin-style rhythmic pattern
5. **Reggae Skank** - Off-beat reggae comping
6. **Funk 16th** - Funky 16th note pattern
7. **Ballad Whole Notes** - Whole note pattern for slow songs
8. **Bossa Nova** - Brazilian bossa nova rhythm

### Chord Voicings
Three voicing options are available:

- **Close Voicing** - All chord notes in the same octave
- **Open Voicing** - Notes spread across multiple octaves
- **Rootless Voicing** - Chord without the root note (jazz style)

### Controls
- **Start/Stop Comping** - Toggle chord comping on/off
- **Rhythm Pattern Selection** - Choose from available patterns
- **Volume Control** - Adjust comping volume (0-100%)
- **Voicing Selection** - Choose chord voicing style
- **Pattern Visualization** - Visual representation of the rhythm pattern

## Integration

### Transport Controls
The chord comping controls are integrated into the main transport controls panel. The comping system automatically:

- Syncs with the current tempo
- Stops when transport is stopped
- Adapts to tempo changes in real-time
- Works with all built-in chord progressions

### Audio Engine
The comping system uses the existing AudioEngineState with:

- Web Audio API for sound generation
- Multiple instrument types (piano, electric piano, synthesizer)
- Proper audio context management for iOS compatibility
- Dynamic gain control to prevent clipping

## Technical Implementation

### Files Added/Modified
- `src/improviser/state/ChordCompingState.ts` - Main comping logic
- `src/improviser/components/ChordCompingControls.tsx` - UI controls
- `src/improviser/components/TransportControls.tsx` - Integration
- `src/improviser/state/AudioEngineState.ts` - Added playChord method

### Key Classes
- **ChordCompingState** - Manages rhythm patterns, timing, and playback
- **ChordCompingControls** - React component for user interface
- **RhythmPattern** - Interface defining rhythm patterns

### Timing System
- Uses 16th note resolution for precise timing
- Syncs with the main tempo from ChordProgressionState
- Automatic restart when tempo changes
- Proper cleanup when stopping

## Usage

1. **Start the app** and select a chord progression
2. **Enable comping** by clicking "Start Comping" in the Chord Comping section
3. **Choose a rhythm pattern** from the dropdown menu
4. **Adjust volume** using the slider
5. **Select voicing** style (close, open, or rootless)
6. **Start playback** using the main transport controls

The comping will automatically follow the chord progression and tempo changes.

## Future Enhancements

Potential improvements could include:
- Custom rhythm pattern creation
- More sophisticated voicings (drop 2, drop 3, etc.)
- Swing feel adjustment
- Additional instrument sounds
- MIDI export of comping patterns
- User-defined chord substitutions
