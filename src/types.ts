export interface IFileInfo {
  path: string;
  filename: string;
  name: string;
  ext?: string;
  kind: 'file' | 'directory';
}

export interface ICompleteFileInfo extends IFileInfo {
  icon: string;
}

export interface ISession {
  path: string;
  history: string[];
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

export interface ICustomEvent<T = unknown, E extends Event = Event> {
  data: T;
  originalEvent: E;
}

export enum EOrderBy {
  Name = 'Name',
}
