import { Component, createEffect, createSignal, For } from "solid-js";
import { midiInput } from "../midi/MidiPicker";
import { createAtom } from "../state/atom";

export const DisplayMidi: Component = () => {
  const midiEvents = createAtom<string[]>([]);

  createEffect(() => {
    const input = midiInput();
    if (input) {
      console.log("MIDI input connected");
      const handleMidiMessage = (event: MIDIMessageEvent) => {
        const { data } = event;
        const eventString = `MIDI Event: ${data[0]} ${data[1]} ${data[2]}`;
        midiEvents.produce((prev) => [...prev, eventString]);
      };

      input.addEventListener("midimessage", handleMidiMessage);

      return () => {
        input.removeEventListener("midimessage", handleMidiMessage);
      };
    }
  });

  return (
    <div>
      <h3>MIDI Events</h3>
      <ul>
        <For each={midiEvents()}>{(event, index) => <li>{event}</li>}</For>
      </ul>
    </div>
  );
};
