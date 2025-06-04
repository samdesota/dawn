import type { Component } from "solid-js";
import { PickMidi } from "./midi/MidiPicker";
import { DisplayMidi } from "./midi/DisplayMidi";
import ListSamples from "./samples/ListSamples";
import DrumPad from "./midi/pads/DrumPad";
import ChordMap from "./chord-map/ChordMap";
import HexImprov from "./hex-improv/HexImprov";

const App: Component = () => {
  return (
    <p>
      <HexImprov />
    </p>
  );
};

export default App;
