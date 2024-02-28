export function useShortcuts() {
  const shortcuts: Map<string[], () => void | Promise<void>> = new Map();
  const pressedKeys: Map<string, boolean> = new Map();

  document.addEventListener('keydown', keydownListener);
  document.addEventListener('keyup', keyupListener);
  document.addEventListener('blur', clearKeysListener);
  document.addEventListener('visibilitychange', visibilitychangeListener);

  window.addEventListener('beforeunload', clearKeysListener);
  window.addEventListener('unload', clearKeysListener);

  return { subscribe, unsubscribe, unsubscribeAll };

  function keydownListener(event: KeyboardEvent) {
    pressedKeys.set(event.key, true);
    console.log('pressedKeys', pressedKeys);

    for (const [shortcut, callback] of shortcuts.entries()) {
      if (shortcut.every((key) => pressedKeys.get(key))) {
        event.preventDefault();
        callback();
        break;
      }
    }
  }

  function keyupListener(event: KeyboardEvent) {
    pressedKeys.delete(event.key);
  }

  function visibilitychangeListener() {
    if (document.hidden) {
      pressedKeys.clear();
    }
  }

  function clearKeysListener() {
    pressedKeys.clear();
  }

  function subscribe(shortcut: string[], callback: () => void | Promise<void>) {
    shortcuts.set(shortcut, callback);
  }

  function unsubscribe(shortcut: string[]) {
    shortcuts.delete(shortcut);
  }

  function unsubscribeAll() {
    shortcuts.clear();

    document.removeEventListener('keydown', keydownListener);
    document.removeEventListener('keyup', keyupListener);
    document.removeEventListener('blur', clearKeysListener);
    document.removeEventListener('visibilitychange', visibilitychangeListener);

    window.removeEventListener('beforeunload', clearKeysListener);
    window.removeEventListener('unload', clearKeysListener);
  }
}
