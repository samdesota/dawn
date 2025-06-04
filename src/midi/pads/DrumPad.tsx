import { Component, createSignal, For } from "solid-js";

interface DrumPadProps {
  // We can add props later like pad colors, labels, etc.
}

const DrumPad: Component<DrumPadProps> = (props) => {
  // Create a 4x4 grid of pads
  const rows = 4;
  const cols = 4;

  // Create array of pad indexes
  const pads = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div class="flex flex-col items-center justify-center gap-2">
      <div class="grid grid-cols-4 gap-2">
        <For each={pads}>
          {(padIndex) => (
            <div
              class="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center cursor-pointer
                    hover:bg-gray-600 active:bg-gray-500 transition-colors"
              // Click handler will be added later
            >
              <span class="text-xs text-gray-400">{padIndex + 1}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default DrumPad;
