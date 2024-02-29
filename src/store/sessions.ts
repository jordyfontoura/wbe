import { get, writable, type Writable, derived, type Readable } from 'svelte/store';
import type { ISession } from '../types';


export function useSessions(defaultPath: Readable<string>) {
  const sessions = writable<Writable<ISession>[]>([]);
  const currentIndex = writable<number>(0);
  const currentSession = derived(
    [sessions, currentIndex],
    ([$sessions, $currentIndex]) => {
      return $sessions[$currentIndex];
    }
  );

  return {
    sessions,
    currentIndex,
    currentSession,
    add,
    remove,
    setCurrent,
    setup
  };

  function setup() {
    add();
  }

  function add() {
    const $defaultPath = get(defaultPath);

    const session = writable<ISession>({
      path: $defaultPath,
      history: [],
    });

    sessions.update((prevSessions) => [...prevSessions, session]);

    currentIndex.set(get(sessions).length - 1);
  }

  function remove(index?: number) {
    const $sessions = get(sessions);
    if ($sessions.length <= 1) {
      console.warn('Cannot remove last session');
      return;
    }

    if (index === undefined) index = get(currentIndex);
    if (index > $sessions.length - 1) {
      console.warn('Index out of bounds');
      return;
    }

    if (index === get(currentIndex)) {
      const nextIndex = index === 0 ? 0 : index - 1;
      console.log('Setting current index to', nextIndex);
      currentIndex.set(nextIndex);
    }

    console.log('Removing session at index', index);
    $sessions.splice(index, 1);
    sessions.set($sessions);
  }

  function setCurrent(index: number) {
    currentIndex.set(index);
  }
}
