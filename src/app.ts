import { get, type Readable, type Writable } from 'svelte/store';
import type {
  ICompleteFileInfo,
  IFileInfo,
  ISession,
  ISessionCollection,
  IUserConfig,
} from './types';
import { invoke } from '@tauri-apps/api/tauri';
import { getMatches } from '@tauri-apps/api/cli';

export async function setupConfig(config: Writable<IUserConfig | null>) {
  console.log('Loading config');
  const raw = await fetch('/config.json');
  const newConfig = (await raw.json()) as IUserConfig;

  const matches = await getMatches();
  const pathCommandArgument = matches.args.directory.value;

  const homedirResponse = await invoke<string>('get_homedir');

  newConfig.defaultPath = homedirResponse;

  if (pathCommandArgument)
    newConfig.defaultPath = pathCommandArgument.toString();

  config.set(newConfig);

  console.log('Config loaded', newConfig);
}

export async function setupSessions(sessions: Writable<ISessionCollection>) {
  // const matches = await getMatches();
  // const value = matches.args.directory.value;
  // const homedir = value
  //   ? value.toString()
  //   : await invoke<string>('get_homedir');

  // const session = {
  //   id: 0,
  //   current: true,
  //   path: homedir,
  //   history: [],
  // };

  // sessions.set({
  //   sessions: [session],
  // });

  // curSession.set(session);

  // curSession.subscribe((s) => {
  //   if (!s) return;

  //   sessions.update((collection) => {
  //     const index = collection.sessions.findIndex((x) => s.id === x.id);
  //     if (index !== -1) collection.sessions[index] = s;
  //     return collection;
  //   });
  // });

  console.log('Current Session', sessions);
}

export async function setup(
  config: Writable<IUserConfig | null>,
  sessions: Writable<ISessionCollection>
) {
  await setupConfig(config);
  await setupSessions(sessions);
}

function completeFile(
  config: Writable<IUserConfig | null>,
  file: IFileInfo
): ICompleteFileInfo {
  const $config = get(config);
  if (!$config) throw new Error('Config not loaded');

  let icon: string =
    file.kind === 'file'
      ? $config.icons.files.default
      : $config.icons.folders.default;

  const associations =
    file.kind === 'file'
      ? $config.icons.files.associations
      : $config.icons.folders.associations;
  for (const [iconName, patterns] of Object.entries(associations)) {
    if (
      patterns.some((pattern) => new RegExp(pattern, 'i').test(file.filename))
    ) {
      icon = iconName;
      break;
    }
  }

  return {
    ...file,
    icon: `/icons/${icon}.svg`,
  };
}

export async function listFiles(
  config: Writable<IUserConfig | null>,
  session: Writable<ISession | null>,
  files: Writable<ICompleteFileInfo[]>
) {
  const $session = get(session);
  const $config = get(config);

  if (!$config) return;

  console.log('Listing files!', $session);

  const response = await invoke<IFileInfo[]>('list_files', {
    path: $session?.path || '..',
    orderBy: 'Name',
  });

  files.set(response.map((file) => completeFile(config, file)));
}

export function useTabNavigation(
  session: Writable<ISession | null>,
  sessions: Writable<ISessionCollection>
) {
  return {
    create,
    close,
    navigate,
  };

  async function create(dir: string | null) {
    const $sessions = get(sessions);
    if (!$sessions) return;

    const path = !dir ? await invoke<string>('get_homedir') : dir;

    const newSession = {
      id:0,
      current: false,
      path,
      history: [],
    };

    sessions.update((s) => ({
      ...s,
      sessions: [...s.sessions, newSession],
    }));

    console.log('New session created');
    console.log('Sessions: ' + $sessions.sessions);
  }

  function navigate(tabId: number) {
    console.log('Navigating to tab', tabId);
    const $sessions = get(sessions);
    const $session = get(session);
    if (!$sessions || !$session) return;

    const target = null;
    session.set(target);
    sessions.update((s) => ({
      ...s,
      sessions: s.sessions.map((session) => ({
        ...session,
        current: false,
      })),
    }));
  }

  function close(sessionId: number) {
    const $sessions = get(sessions);
    if (!$sessions) return;

    sessions.update((s) => {
      s.sessions.splice(sessionId, 1);
      return s;
    });
  }
}

export function useNavigation(session: Readable<Writable<ISession>>) {
  return {
    up,
    back,
    goto,
    tryGoto,
  };

  function up() {
    const $session = get(session);
    if (!$session) throw new Error('Session not loaded');

    $session.update(($$session: ISession) => {
      if (!$$session) return $$session;

      const newPath = $$session.path.split('/').slice(0, -1).join('/');
      return {
        ...$$session,
        path: newPath,
        history: [...$$session.history, $$session.path],
      };
    });
  }

  function back() {
    const $session = get(session);
    if (!$session) throw new Error('Session not loaded');

    $session.update(($$session: ISession) => {
      if (!$$session) return $$session;

      const newPath = $$session.history.pop() || $$session.path;
      return { ...$$session, path: newPath, history: $$session.history };
    });
  }

  function goto(path: string) {
    const $session = get(session);
    if (!$session) throw new Error('Session not loaded');

    $session.update(($$session: ISession) => {
      if (!$$session) return $$session;

      return {
        ...$$session,
        path,
        history: [...$$session.history, $$session.path],
      };
    });

    if (
      document.activeElement != document.body &&
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      const element = document.activeElement as HTMLElement;

      if (element.classList.contains('file')) {
        document.activeElement.blur();
      }
    }
  }

  async function tryGoto(path: string) {
    const response = await invoke<boolean>('is_folder', { path });
    if (response) goto(path);

    console.log('Not a directory');
  }
}
