import type { Writable } from "svelte/store";

export interface IFileInfo {
  path: string;
  filename: string;
  name: string;
  ext?: string;
  kind: 'file' | 'folder';
}

export interface ICompleteFileInfo extends IFileInfo {
  icon: string;
}

export interface ISession {
  id: number;
  current: boolean;
  path: string;
  history: string[];
}

export interface ISessionCollection {
  sessions: ISession[];
}

export interface INavigation {
  goto(path: string): void;
  back(): void;
  up(): void;
}

export interface IUserConfig {
  icons: {
    files: {
      default: string;
      folders: string[];
      associations: {
        [key: string]: string[];
      };
    };
    folders: {
      default: string;
      folders: string[];
      associations: {
        [key: string]: string[];
      };
    };
  };
}


export enum EOrderBy {
  Name = 'Name'
}