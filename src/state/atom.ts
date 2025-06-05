import { produce, enableMapSet } from "immer";
import { createSignal } from "solid-js";

// Enable Immer Map/Set plugin for proper Map and Set support
enableMapSet();

type Atom<T> = (() => T) & {
  set: (newValue: T) => void;
  produce: (updater: (draft: T) => void) => void;
};

export const createAtom = <T>(initialValue: T) => {
  const [signal, setSignal] = createSignal(initialValue);

  return Object.assign(signal, {
    set: (newValue: T) => setSignal(() => newValue),
    produce: (updater: (draft: T) => void) =>
      setSignal(() => produce(signal(), updater)),
  }) as Atom<T>;
};
