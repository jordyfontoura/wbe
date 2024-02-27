import { get, type Writable } from 'svelte/store';
import type { ICompleteFileInfo, IFileInfo, ISession, IUserConfig } from './types';
import { invoke } from '@tauri-apps/api/tauri';
import { getMatches } from '@tauri-apps/api/cli';

export async function setupConfig(config: Writable<IUserConfig | null>) {
  console.log('Loading config');
  const raw = await fetch('/config.json');
  const newConfig = (await raw.json()) as IUserConfig;

  config.set(newConfig);

  console.log('Config loaded', newConfig);
}

export async function setupSession(session: Writable<ISession | null>) {
  const matches = await getMatches();
  const value = matches.args.directory.value;
  const homedir = value ? value.toString() : await invoke<string>('get_homedir');

  session.set({
    path: homedir,
    history: [],
  });

  console.log('Session', session);
}

export async function setup(config: Writable<IUserConfig | null>, session: Writable<ISession | null>) {
  await setupConfig(config);
  await setupSession(session);
}

function completeFile(config: Writable<IUserConfig | null>, file: IFileInfo): ICompleteFileInfo {
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

export async function listFiles(config: Writable<IUserConfig | null>, session: Writable<ISession | null>, files: Writable<ICompleteFileInfo[]>) {
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

export function useNavigation(session: Writable<ISession | null>) {
  return {
    up,
    back,
    goto,
    tryGoto,
  };

  function up() {
    const $session = get(session);
    if (!$session) return;
  
    session.update((s: ISession | null) => {
      if (!s) return s;
  
      const newPath = s.path.split('/').slice(0, -1).join('/');
      return { ...s, path: newPath, history: [...s.history, s.path] };
    });
  }
  
  function back() {
    const $session = get(session);
    if (!$session) return;
  
    session.update((s: ISession | null) => {
      if (!s) return s;
  
      const newPath = s.history.pop() || s.path;
      return { ...s, path: newPath, history: s.history };
    });
  }
  
  function goto(path: string) {
    session.update((s: ISession | null) => {
      if (!s) return s;
  
      return { ...s, path, history: [...s.history, s.path] };
    });
  
    if (
      document.activeElement != document.body &&
      document.activeElement &&
      document.activeElement instanceof HTMLElement
    ) {
      const element = document.activeElement as HTMLElement;

      if (element.classList.contains('file')){
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