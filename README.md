# Musical Improvisation Assistant

A touch-responsive musical instrument web application optimized for iPad that features a revolutionary 4-level keyboard design combining rhythm and melody capabilities.

## 🎵 Features

### Revolutionary 4-Level Keyboard Design
- **Triads** (thickest keys) - Root, third, fifth of current chord
- **Pentatonics** (medium-thick keys) - Pentatonic scale notes between triads
- **Scale notes** (medium-thin keys) - Diatonic scale notes between pentatonics
- **Chromatic notes** (thinnest keys) - All remaining chromatic notes

### Audio Engine
- **Web Audio API** with low-latency synthesis
- **Polyphonic Support** for multiple simultaneous notes
- **Touch Velocity** sensitivity for expressive playing
- **Multiple Instruments**: Piano, Electric Piano, and Synthesizer
- **ADSR Envelope** for realistic note attack/decay
- **Reverb Effects** with adjustable mix

### Song/Chord Progression System
- **Pre-loaded Progressions**:
  - Pachelbel's Canon (I-V-vi-iii-IV-I-IV-V)
  - 12-Bar Blues (I-I-I-I-IV-IV-I-I-V-IV-I-I)
  - ii-V-I Jazz (ii-V-I-vi)
  - Pop Progression (I-V-vi-IV)
- **Transport Controls**: Play, Pause, Stop, Skip
- **Tempo Control**: 60-180 BPM with real-time adjustment
- **Metronome** with downbeat emphasis
- **Auto-advance** chord progression

### Interactive Features
- **Touch Gestures**:
  - Tap: Play note
  - Hold: Sustain note
  - Slide: Glissando between notes
  - Multi-touch: Chords and harmonies
- **Real-time Chord Highlighting** with intensity hierarchy
- **Visual Feedback** for current chord tones
- **Recording Capability** for performance capture

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm, pnpm, or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd musical-improvisation-assistant

# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### Development

```bash
# Start development server
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Building for Production

```bash
# Build for production
npm run build
# or
pnpm build
# or
yarn build
```

The build output will be in the `dist` folder, ready for deployment to any static hosting provider.

## 🏗️ Architecture

### Tech Stack
- **Frontend Framework**: SolidJS with reactive signals
- **Styling**: Tailwind CSS (via UnoCSS) + Custom CSS
- **Audio**: Web Audio API
- **Build Tool**: Vite
- **Type Safety**: TypeScript

### Project Structure
```
src/
├── improviser/
│   ├── components/           # UI Components
│   │   ├── KeyboardLayout.tsx
│   │   ├── KeyButton.tsx
│   │   ├── ChordDisplay.tsx
│   │   ├── TransportControls.tsx
│   │   └── SongSelector.tsx
│   ├── state/                # State Management
│   │   ├── AudioEngineState.ts
│   │   ├── ChordProgressionState.ts
│   │   ├── KeyboardState.ts
│   │   ├── PlaybackState.ts
│   │   └── UIState.ts
│   └── design.md             # Design specifications
├── styles/
│   └── custom.css           # Custom styles
├── state/
│   └── atom.ts              # Reactive atom utilities
├── App.tsx                  # Main application component
└── index.tsx                # Application entry point
```

### State Management Architecture

The application uses a reactive state management system with dedicated classes:

- **AudioEngineState**: Web Audio API management, synthesis, and sound generation
- **ChordProgressionState**: Chord sequences, current position, and progression logic
- **KeyboardState**: Key layout, current key signature, and note calculations
- **PlaybackState**: Transport controls (play/pause/stop), tempo, and timing
- **UIState**: Settings, current instrument, and user preferences

Each state class:
- Uses `createAtom()` for reactive values
- Exposes computed values as getters
- Provides methods for state mutations
- Keeps business logic encapsulated
- Exports singleton instances for component consumption

## 🎹 Usage

### Basic Operation
1. **Select a Song**: Choose from the dropdown menu of chord progressions
2. **Adjust Tempo**: Use the tempo slider (60-180 BPM)
3. **Play Music**:
   - Touch keys to play notes
   - Hold for sustained notes
   - Slide between keys for glissando effects
4. **Control Playback**: Use transport controls to play/pause/stop the chord progression

### Key Hierarchy
- **Gold keys**: Current chord tones (root, third, fifth)
- **Larger keys**: More important notes in the current scale
- **Smaller keys**: Chromatic passing tones
- **Pulsing animation**: Indicates chord tone importance

### Settings
- **Theme**: Toggle between light and dark modes
- **Chord Roles**: Show/hide chord tone indicators on keys
- **Progress Bar**: Display playback progress
- **Metronome**: Enable click track with downbeat emphasis
- **Touch Sensitivity**: Adjust velocity response

## 📱 iPad Optimization

### Touch Interface
- Optimized for landscape orientation
- Touch-friendly spacing (minimum 44px targets)
- Pressure-sensitive velocity control
- Multi-touch support for chords
- Gesture prevention for smooth playing

### Performance
- Low-latency audio processing
- Smooth 60fps animations
- Efficient touch event handling
- RequestAnimationFrame for visual updates

## 🎯 Accessibility

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus indicators** for all interactive elements
- **Reduced motion** support for users who prefer it
- **High contrast** options for better visibility

## 🔧 Configuration

### Audio Settings
- Instrument selection (Piano/Electric Piano/Synthesizer)
- Volume control
- Reverb mix adjustment
- Touch sensitivity calibration

### Visual Settings
- Theme selection (light/dark)
- Animation preferences
- Panel visibility toggles
- Progress indicators

## 🚀 Deployment

The application can be deployed to any static hosting provider:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Upload build files
- **AWS S3**: Static website hosting
- **Firebase Hosting**: Deploy with Firebase CLI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by traditional piano design and modern music theory
- Built with SolidJS for reactive performance
- Web Audio API for professional-grade sound synthesis
- Tailwind CSS for modern, responsive design

---

**Note**: This application works best on iPad in landscape orientation with touch support. While it functions on desktop with mouse input, the full experience is optimized for touch interfaces.
