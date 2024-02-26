interface IFileInfo {
  path: string;
  filename: string;
  name: string;
  ext?: string;
  kind: 'file' | 'folder';
}

interface ICompleteFileInfo extends IFileInfo {
  icon: string;
}

interface ISession {
  path: string;
  history: string[];
}

interface INavigation {
  goto(path: string): void;
  back(): void;
  up(): void;
}

interface IUserConfig {
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
