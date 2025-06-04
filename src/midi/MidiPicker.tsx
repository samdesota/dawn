import { createAtom } from "../state/atom";
import { createEffect, For } from "solid-js";

export const midiInput = createAtom<MIDIInput | null>(null);

export function PickMidi() {
  const inputs = createAtom<Array<MIDIInput>>([]);

  createEffect(() => {
    navigator.requestMIDIAccess().then((midiAccess) => {
      inputs.set(Array.from(midiAccess.inputs.values()));
    });
  });

  return (
    <div>
      <label>MIDI Input:</label>

      <ul>
        <For each={inputs()}>
          {(input) => (
            <li>
              <label>
                <input
                  type="radio"
                  name="midiInput"
                  value={input.name}
                  checked={midiInput()?.name === input.name}
                  onChange={() => midiInput.set(input)}
                />
                {input.name}
              </label>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
