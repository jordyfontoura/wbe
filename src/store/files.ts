import { invoke } from '@tauri-apps/api';
import { get, type Readable } from 'svelte/store';
import type {
  IUserConfig,
  ICompleteFileInfo,
  IFileInfo,
  ISession,
} from '../types';

export async function searchFiles(
  config: Readable<IUserConfig | null>,
  session: Readable<ISession>
): Promise<ICompleteFileInfo[]> {
  const $session = get(session);
  const $config = get(config);

  if (!$config) throw new Error('Config not loaded');
  if (!$session) throw new Error('Session not loaded');

  console.log('Listing files!', $session);

  const response = await invoke<IFileInfo[]>('list_files', {
    path: $session.path,
    orderBy: 'Name',
  });

  return response.map((file) => completeFile(config, file));
}

function completeFile(
  config: Readable<IUserConfig | null>,
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
