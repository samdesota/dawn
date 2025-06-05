
# Layered Musical Instrument for iPad

Build a touch-responsive musical instrument web application optimized for iPad that features a revolutionary 4-level keyboard design combining rhythm and melody capabilities.

## Core Concept
Create a piano-like instrument with 4 hierarchical note levels instead of the traditional 2-level (white/black keys) design:
1. **Triads** (thickest keys) - Root, third, fifth of current chord
2. **Pentatonics** (medium-thick keys) - Pentatonic scale notes between triads
3. **Scale notes** (medium-thin keys) - Diatonic scale notes between pentatonics
4. **Chromatic notes** (thinnest keys) - All remaining chromatic notes

## Technical Requirements

### Layout & Visual Design
- **Responsive iPad Layout**: Optimized for landscape orientation, touch-friendly spacing
- **Key Hierarchy**: Visual thickness/height representing note importance:
  - Triads: Tallest and thickest (100% height, primary color)
  - Pentatonics: 80% height, secondary color
  - Scale notes: 60% height, tertiary color
  - Chromatic notes: 40% height, muted color
- **Dynamic Highlighting**: Current chord arpeggio notes glow/pulse during playback
- **Key Labels**: Note names displayed on keys, with enharmonic equivalents

### Audio Engine
- **Web Audio API**: Low-latency audio synthesis
- **Polyphonic Support**: Multiple simultaneous notes
- **Touch Velocity**: Pressure-sensitive volume control
- **Instrument Sounds**: Piano, electric piano, and synthesizer options
- **Audio Context**: Proper iOS audio context handling for touch activation

### Song/Chord Progression System
- **Song Selection**: Dropdown menu with popular chord progressions:
  - "Pachelbel's Canon" (I-V-vi-iii-IV-I-IV-V)
  - "12-Bar Blues" (I-I-I-I-IV-IV-I-I-V-IV-I-I)
  - "ii-V-I Jazz" (ii-V-I-vi)
  - "Pop Progression" (I-V-vi-IV)
  - Custom chord input capability
- **Tempo Control**: BPM slider (60-180 BPM)
- **Play/Pause/Stop**: Transport controls
- **Chord Display**: Current chord name prominently displayed
- **Progress Indicator**: Visual timeline showing current position

### Key Layout Algorithm
```
For each octave (C to B):
  1. Place triad notes at primary positions
  2. Insert pentatonic notes between triads where they don't overlap
  3. Fill remaining diatonic scale notes between existing keys
  4. Add chromatic notes in remaining spaces
  5. Adjust spacing to maintain proportional relationships
```

### Interactive Features
- **Touch Gestures**:
  - Tap: Play note
  - Hold: Sustain note
  - Slide: Glissando between notes
  - Multi-touch: Chords and harmonies
- **Key Transposition**: Automatic key changes following chord progression
- **Chord Highlighting**: Real-time arpeggio emphasis during playback
- **Recording**: Capture and playback user performance

### State Management
- **Current Key**: Track active key signature
- **Chord Progression**: Store and iterate through chord sequences
- **Playback State**: Current position, playing/paused status
- **User Settings**: Instrument choice, volume, tempo preferences

### Architecture & Code Organization

**Component Structure**:
Break the application into small, focused components with minimal logic:
- `KeyboardLayout.tsx` - Main keyboard container
- `KeyButton.tsx` - Individual key component (receives props, handles touch events)
- `ChordDisplay.tsx` - Current chord name and progression display
- `TransportControls.tsx` - Play/pause/stop buttons
- `SongSelector.tsx` - Dropdown for chord progressions
- `SettingsPanel.tsx` - Instrument selection and preferences
- `ProgressIndicator.tsx` - Timeline showing current position
- `RecordingControls.tsx` - Record/playback functionality

**State Management Architecture**:
Use SolidJS signals through custom classes, avoiding complex logic in components:

**IMPORTANT**: Import createAtom from `src/state/atom.ts` instead of using regular SolidJS createSignal:
```javascript
import { createAtom } from '../state/atom';
```

**State Classes**:
- `AudioEngineState` - Manages Web Audio API, synthesis, and sound generation
- `ChordProgressionState` - Handles chord sequences, current position, and progression logic
- `KeyboardState` - Manages key layout, current key signature, and note calculations
- `PlaybackState` - Controls transport (play/pause/stop), tempo, and timing
- `UIState` - Handles settings, current instrument, and user preferences

Each state class should:
1. Use `createAtom()` for all reactive values
2. Expose computed values as getters
3. Provide methods for state mutations
4. Keep all business logic encapsulated
5. Export singleton instances for component consumption

**Component Guidelines**:
- Components should be purely presentational
- Accept props for data and callbacks for actions
- Use state class methods for user interactions
- Avoid direct signal manipulation in components
- Focus on rendering and event handling only

### Technical Implementation Details
- **Framework**: SolidJS with signals for reactive state management
- **Styling**: Tailwind CSS for utility-first styling and responsive design
- **Audio**: Web Audio API with gain nodes for volume control
- **Touch Events**: Optimized touch handling for iOS Safari
- **Performance**: RequestAnimationFrame for smooth visual updates
- **Accessibility**: ARIA labels and keyboard navigation support

### Visual Specifications
- **Color Scheme**:
  - Background: Deep black (#0a0a0a)
  - Triads: Dark charcoal (#1c1c1c)
  - Pentatonics: Slightly lighter charcoal (#2a2a2a)
  - Scale notes: Medium dark gray (#333333)
  - Chromatic: Lighter gray (#404040)
  - **Highlighted chord tones with intensity hierarchy**:
    - Root note: Bright saturated gold (#fbbf24) with strong pulsing animation
    - Third: Medium gold (#f59e0b) with moderate pulsing
    - Fifth: Muted gold (#d97706) with subtle pulsing
    - Seventh/Extensions: Pale gold (#92400e) with gentle glow
- **Typography**: Clean, readable font for note names
- **Spacing**: Minimum 44px touch targets for accessibility
- **Layout**: Horizontal scrolling for extended range if needed

### Audio Implementation
- **Sample-based synthesis** with high-quality piano samples
- **ADSR envelope** for realistic note attack/decay
- **Reverb effect** with adjustable wet/dry mix
- **Dynamic range compression** for consistent volume
- **Chord recognition** for intelligent harmony suggestions

## Success Criteria
- Smooth, responsive touch interaction on iPad
- Visually clear hierarchy of note importance
- Accurate chord progression following with real-time highlighting
- Low-latency audio playback
- Intuitive user interface requiring minimal learning curve
- Professional audio quality suitable for musical performance

Build this as a single-page application that works offline once loaded, with all audio processing happening client-side for optimal performance.

---

## Getting Started
Begin building this application in the `src/improviser` directory. Create the component and state architecture as outlined above, starting with the core state classes and then building the UI components that consume them.
