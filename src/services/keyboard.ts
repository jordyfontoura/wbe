import { get, writable } from 'svelte/store';

export enum EInputValue {
  Released = 0,
  Pressed = 1,
}

export function useKeyboard() {
  const input = writable(new Map<string, EInputValue>());
  const observers = new Map<string, () => void>();

  function onKeyDown(event: KeyboardEvent) {
    console.log('onKeyDown', event.key);
    input.update((prev) => {
      prev.set(event.key, EInputValue.Pressed);
      return prev;
    });

    for (const [combination, callback] of observers.entries()) {
      const keys = combination.split('+');
      const lastKey = keys.pop();

      if (keys.every((key) => isPressed(key)) && event.key === lastKey) {
        callback();
      }
      console.log('combination', combination, keys, lastKey);

    }
  }

  function onKeyUp(event: KeyboardEvent) {
    input.update((prev) => {
      prev.set(event.key, EInputValue.Released);
      return prev;
    });
  }

  function isPressed(key: string) {
    const value = get(input).get(key);

    return value === EInputValue.Pressed;
  }

  function subscribeShortcut(combination: string, callback: () => void) {
    observers.set(combination, callback);
  }

  return {
    input,
    isPressed,
    subscribeShortcut,
    onKeyDown,
    onKeyUp,
  };
}
