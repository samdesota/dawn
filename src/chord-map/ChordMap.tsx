import {
  createSignal,
  createEffect,
  For,
  untrack,
  onCleanup,
  onMount,
} from "solid-js";
import {
  NOTES,
  MODES,
  ARPEGGIO_PATTERNS,
  getChordNames,
  formatChordName,
  getChordNotes,
  getSpecialChordNotes,
  getChordBackgroundColor,
} from "./musicTheory";
import { AudioEngine } from "./audioEngine";
import { Arpeggiator } from "./arpeggiator";

const ChordMap = () => {
  // State
  const [selectedKey, setSelectedKey] = createSignal("C");
  const [selectedModeIndex, setSelectedModeIndex] = createSignal(0);
  const [activeChord, setActiveChord] = createSignal<string | null>(null);
  const [isShiftPressed, setIsShiftPressed] = createSignal(false);

  // Track shift key press state
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    onCleanup(() => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    });
  });

  // Create instances of our audio classes
  const audioEngine = new AudioEngine();
  // Initialize arpeggiator with default pattern and tempo
  const arpeggiator = new Arpeggiator(
    audioEngine,
    ARPEGGIO_PATTERNS[0], // Default to the first pattern
    120, // Default tempo
  );

  // Clean up on component unmount
  onCleanup(() => {
    arpeggiator.cleanup();
    audioEngine.cleanup();
  });

  // Effect to update arpeggiator when active chord changes
  createEffect(() => {
    const activeChordStr = activeChord();

    if (activeChordStr !== null) {
      // Use untrack to prevent recursive reactivity
      untrack(() => {
        let chordNotes: number[] = [];
        let keyIndex = audioEngine.getNoteIndex(selectedKey());

        // Parse the active chord string to get type and degree
        if (activeChordStr.startsWith("special-")) {
          // Handle special chords
          const index = parseInt(activeChordStr.split("-")[1]);

          // If shift is being held, use the basic intervals
          if (isShiftPressed()) {
            const specialChords = getChordNames(0, "sus");
            const chord = specialChords[index];

            // Get the root note based on the chord type
            let rootDegree = 0; // Default to I (tonic)
            if (chord.name.startsWith("IV")) {
              rootDegree = 3; // IV chord (subdominant)
            } else if (chord.name.startsWith("V")) {
              rootDegree = 4; // V chord (dominant)
            }

            const scaleNotes = getScaleNotes();
            const rootNote = scaleNotes[rootDegree];
            chordNotes = chord.intervals.map((interval) => rootNote + interval);
          } else {
            // Normal chord calculation with voice leading
            const specialChords = getChordNames(selectedModeIndex(), "sus");
            const chord = specialChords[index];

            // Get the root note based on the chord type
            let rootDegree = 0; // Default to I (tonic)
            if (chord.name.startsWith("IV")) {
              rootDegree = 3; // IV chord (subdominant)
            } else if (chord.name.startsWith("V")) {
              rootDegree = 4; // V chord (dominant)
            }

            const scaleNotes = getScaleNotes();
            const rootNote = scaleNotes[rootDegree];
            chordNotes = chord.intervals.map((interval) => rootNote + interval);
          }
        } else {
          // Handle regular diatonic chords
          const [extension, degreeStr] = activeChordStr.split("-");
          const degree = parseInt(degreeStr);
          chordNotes = getChordNotesForCurrentMode(
            degree,
            extension as "triad" | "7th" | "9th",
          );
        }

        // Set the chord notes in the arpeggiator
        arpeggiator.setChord(chordNotes, keyIndex);
      });
    }
  });

  // Create the scale notes based on selected key and mode
  const getScaleNotes = () => {
    const keyIndex = audioEngine.getNoteIndex(selectedKey());
    const modePattern = MODES[selectedModeIndex()].pattern;

    return modePattern.map((interval) => (keyIndex + interval) % 12);
  };

  // Track the previous chord notes for voice leading
  const [previousChordNotes, setPreviousChordNotes] = createSignal<number[]>(
    [],
  );

  // Get the chord notes for a specific degree in the scale with proper voice leading
  const getChordNotesForCurrentMode = (
    degree: number,
    extension: "triad" | "7th" | "9th" | "sus" | "aug" = "triad",
  ) => {
    // Use untrack to prevent recursive reactivity when reading and updating signals
    return untrack(() => {
      const scaleNotes = getScaleNotes();

      // If shift is pressed, bypass voice leading and use basic intervals
      if (isShiftPressed()) {
        const keyIndex = audioEngine.getNoteIndex(selectedKey());
        const chords = getChordNames(selectedModeIndex(), extension);
        const chord = chords[degree];
        const rootNote = scaleNotes[degree];

        // Return the basic chord intervals without voice leading
        const chordNotes = chord.intervals.map(
          (interval) => rootNote + interval,
        );
        setPreviousChordNotes(chordNotes);

        return chordNotes;
      }

      // Normal voice leading behavior
      const prevNotes = previousChordNotes();
      const { chordNotes, updatedPreviousNotes } = getChordNotes(
        scaleNotes,
        degree,
        extension,
        prevNotes,
      );

      // Update previous chord notes for next calculation
      setPreviousChordNotes(updatedPreviousNotes);

      return chordNotes;
    });
  };

  // Play a chord
  const playChord = (
    degree: number,
    extension: "triad" | "7th" | "9th" | "sus" | "aug" = "triad",
  ) => {
    // Set active chord with extension type to uniquely identify it
    setActiveChord(`${extension}-${degree}`);

    // Use untrack to prevent recursive reactivity
    untrack(() => {
      // If arpeggiator is enabled, the effect will update the arpeggiator
      // and the arpeggiator will handle the sound
      if (arpeggiator.isEnabled()) {
        return;
      }

      // For normal chord playing (non-arpeggiator mode)
      const chordNotes = getChordNotesForCurrentMode(degree, extension);
      const keyIndex = audioEngine.getNoteIndex(selectedKey());
      const octave = 4; // Middle octave

      // Convert chord notes to MIDI note numbers
      const midiNotes = chordNotes.map((note) => keyIndex + note + octave * 12);

      // Play the chord
      audioEngine.playChord(midiNotes, 2.0);

      // Reset active chord after 2 seconds if arpeggiator is not running
      if (!arpeggiator.isEnabled()) {
        setTimeout(() => setActiveChord(null), 2000);
      }
    });
  };

  // Play special chords (sus, augmented)
  const playSpecialChord = (index: number) => {
    // Set active chord
    setActiveChord(`special-${index}`);

    // Use untrack to prevent recursive reactivity
    untrack(() => {
      // Get scale notes and handle voice leading
      const scaleNotes = getScaleNotes();
      let chordNotes: number[];

      // If shift is pressed, bypass voice leading and use basic intervals
      if (isShiftPressed()) {
        const specialChords = getChordNames(0, "sus");
        const chord = specialChords[index];

        // Get the root note based on the chord type
        let rootDegree = 0; // Default to I (tonic)
        if (chord.name.startsWith("IV")) {
          rootDegree = 3; // IV chord (subdominant)
        } else if (chord.name.startsWith("V")) {
          rootDegree = 4; // V chord (dominant)
        }

        const rootNote = scaleNotes[rootDegree];
        // Return the basic chord intervals without voice leading
        chordNotes = chord.intervals.map((interval) => rootNote + interval);
      } else {
        // Normal voice leading behavior
        const prevNotes = previousChordNotes();
        const result = getSpecialChordNotes(scaleNotes, index, prevNotes);
        chordNotes = result.chordNotes;

        // Update previous chord notes for next calculation
        setPreviousChordNotes(result.updatedPreviousNotes);
      }

      // If arpeggiator is enabled, the effect will update the arpeggiator
      // and the arpeggiator will handle the sound
      if (arpeggiator.isEnabled()) {
        return;
      }

      // Play the chord normally
      const keyIndex = audioEngine.getNoteIndex(selectedKey());
      const octave = 4; // Middle octave

      // Convert chord notes to MIDI note numbers
      const midiNotes = chordNotes.map((note) => keyIndex + note + octave * 12);

      // Play the chord
      audioEngine.playChord(midiNotes, 2.0);

      // Reset active chord after 2 seconds if arpeggiator is not running
      if (!arpeggiator.isEnabled()) {
        setTimeout(() => setActiveChord(null), 2000);
      }
    });
  };

  // Toggle arpeggiator on/off
  const toggleArpeggiator = () => {
    arpeggiator.toggleEnabled();
  };

  // Format chord name with the actual note
  const getFormattedChordName = (
    degree: number,
    extension: "triad" | "7th" | "9th" | "sus" | "aug" = "triad",
  ) => {
    const scaleNotes = getScaleNotes();
    const chordRoot = NOTES[scaleNotes[degree]];
    const chords = getChordNames(selectedModeIndex(), extension);
    const chord = chords[degree];

    return formatChordName(chordRoot, chord);
  };

  // Format special chord name with the actual note
  const getFormattedSpecialChordName = (index: number) => {
    const specialChords = getChordNames(selectedModeIndex(), "sus");
    const chord = specialChords[index];

    // Get the root note based on the chord type
    let rootDegree = 0; // Default to I (tonic)
    if (chord.name.startsWith("IV")) {
      rootDegree = 3; // IV chord (subdominant)
    } else if (chord.name.startsWith("V")) {
      rootDegree = 4; // V chord (dominant)
    }

    const scaleNotes = getScaleNotes();
    const chordRoot = NOTES[scaleNotes[rootDegree]];

    return formatChordName(chordRoot, chord);
  };

  return (
    <div class="p-8 bg-gray-100 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold mb-6 text-center">Diatonic Chord Player</h2>

      <div class="flex flex-col md:flex-row justify-center gap-6 mb-8">
        <div class="w-full md:w-1/2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Key
          </label>
          <select
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedKey()}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <For each={NOTES}>
              {(note) => <option value={note}>{note}</option>}
            </For>
          </select>
        </div>

        <div class="w-full md:w-1/2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Mode
          </label>
          <select
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedModeIndex()}
            onChange={(e) => setSelectedModeIndex(parseInt(e.target.value))}
          >
            <For each={MODES}>
              {(mode, index) => <option value={index()}>{mode.name}</option>}
            </For>
          </select>
        </div>
      </div>

      <div class="mb-8 p-4 bg-gray-200 rounded-lg">
        <div class="flex items-center mb-4">
          <h3 class="text-lg font-bold mr-4">Arpeggiator</h3>
          <div class="flex items-center">
            <label class="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                class="sr-only peer"
                checked={arpeggiator.isEnabled()}
                onChange={toggleArpeggiator}
              />
              <div class="relative w-11 h-6 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span class="ml-3 text-sm font-medium text-gray-700">
                {arpeggiator.isEnabled() ? "On" : "Off"}
              </span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pattern
            </label>
            <select
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => {
                const patternIndex = parseInt(e.target.value);
                arpeggiator.setPattern(ARPEGGIO_PATTERNS[patternIndex]);
              }}
              disabled={!arpeggiator.isEnabled()}
            >
              <For each={ARPEGGIO_PATTERNS}>
                {(pattern, index) => (
                  <option
                    value={index()}
                    selected={
                      arpeggiator.getCurrentPattern()?.name === pattern.name
                    }
                  >
                    {pattern.name}
                  </option>
                )}
              </For>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tempo (BPM)
            </label>
            <div class="flex items-center">
              <input
                type="range"
                class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                min="60"
                max="240"
                step="1"
                value={arpeggiator.getCurrentTempo()}
                onChange={(e) => arpeggiator.setTempo(parseInt(e.target.value))}
                disabled={!arpeggiator.isEnabled()}
              />
              <span class="ml-2 w-12 text-center">
                {arpeggiator.getCurrentTempo()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chord Section */}
      <div class="mb-6">
        <div class="mb-2">
          <h3 class="text-lg font-semibold">Triads</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <For each={[0, 1, 2, 3, 4, 5, 6]}>
            {(degree) => {
              const chords = getChordNames(selectedModeIndex(), "triad");
              return (
                <button
                  class={`${chords[degree].color} text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center h-20 ${activeChord() === `triad-${degree}` ? "ring-4 ring-offset-2 ring-black" : ""}`}
                  onClick={() => playChord(degree, "triad")}
                  style={{
                    "background-color": getChordBackgroundColor(
                      degree,
                      "triad",
                    ),
                  }}
                >
                  <span class="text-lg font-bold">
                    {getFormattedChordName(degree, "triad")}
                  </span>
                </button>
              );
            }}
          </For>
        </div>

        <div class="mb-2">
          <h3 class="text-lg font-semibold">7th Chords</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <For each={[0, 1, 2, 3, 4, 5, 6]}>
            {(degree) => {
              const chords = getChordNames(selectedModeIndex(), "7th");
              return (
                <button
                  class={`${chords[degree].color} text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center h-20 ${activeChord() === `7th-${degree}` ? "ring-4 ring-offset-2 ring-black" : ""}`}
                  onClick={() => playChord(degree, "7th")}
                  style={{
                    "background-color": getChordBackgroundColor(degree, "7th"),
                  }}
                >
                  <span class="text-lg font-bold">
                    {getFormattedChordName(degree, "7th")}
                  </span>
                </button>
              );
            }}
          </For>
        </div>

        <div class="mb-2">
          <h3 class="text-lg font-semibold">9th Chords</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <For each={[0, 1, 2, 3, 4, 5, 6]}>
            {(degree) => {
              const chords = getChordNames(selectedModeIndex(), "9th");
              return (
                <button
                  class={`${chords[degree].color} text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center h-20 ${activeChord() === `9th-${degree}` ? "ring-4 ring-offset-2 ring-black" : ""}`}
                  onClick={() => playChord(degree, "9th")}
                  style={{
                    "background-color": getChordBackgroundColor(degree, "9th"),
                  }}
                >
                  <span class="text-lg font-bold">
                    {getFormattedChordName(degree, "9th")}
                  </span>
                </button>
              );
            }}
          </For>
        </div>

        <div class="mb-2">
          <h3 class="text-lg font-semibold">Special Chords</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <For each={[0, 1, 2]}>
            {(index) => {
              const chords = getChordNames(selectedModeIndex(), "sus");
              return (
                <button
                  class={`${chords[index].color} text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center h-20 ${activeChord() === `special-${index}` ? "ring-4 ring-offset-2 ring-black" : ""}`}
                  onClick={() => playSpecialChord(index)}
                  style={{
                    "background-color": getChordBackgroundColor(
                      0,
                      "special",
                      index,
                    ),
                  }}
                >
                  <span class="text-lg font-bold">
                    {getFormattedSpecialChordName(index)}
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </div>

      <div class="mt-8 text-center text-sm text-gray-600">
        <p>
          Click on a chord button to hear how it sounds in the selected key and
          mode
        </p>
        <p class="mt-2">
          Turn on the arpeggiator to continuously play arpeggios of the selected
          chord as you click between chord buttons
        </p>
      </div>
    </div>
  );
};

export default ChordMap;
