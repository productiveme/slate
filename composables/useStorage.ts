import localforage from 'localforage';

interface SlateFile {
  id: string;
  name: string;
  path: string;
  sha: string;
  createdAt: string;
  updatedAt: string;
}

interface FilesData {
  files: SlateFile[];
  updatedAt: string;
}

interface GitHubFile {
  id: string;
  name: string;
  path: string;
  sha: string;
}

interface StorageInterface {
  saveDocument(id: string, content: string): Promise<void>;
  getDocument(id: string): Promise<string | null>;
  deleteDocument(id: string): Promise<void>;
  saveSetting<T>(key: string, value: T): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  saveFiles(files: SlateFile[]): Promise<void>;
  getFiles(): Promise<SlateFile[]>;
  syncFromGitHub(): Promise<void>;
  commitToGitHub(fileId: string, filePath: string, content: string): Promise<void>;
}

interface StorageReturn {
  storage: StorageInterface;
  isReady: Ref<boolean>;
  isSyncing: Ref<boolean>;
  lastSyncTime: Ref<string | null>;
  initStorage: () => Promise<void>;
}

export function useStorage(): StorageReturn {
  const isReady = ref<boolean>(false);
  const isSyncing = ref<boolean>(false);
  const lastSyncTime = ref<string | null>(null);

  const documentStore = localforage.createInstance({
    name: 'SlateDB',
    storeName: 'documents'
  });

  const settingsStore = localforage.createInstance({
    name: 'SlateDB',
    storeName: 'settings'
  });

  const filesStore = localforage.createInstance({
    name: 'SlateDB',
    storeName: 'files'
  });

  async function initStorage(): Promise<void> {
    try {
      await Promise.all([
        documentStore.ready(),
        settingsStore.ready(),
        filesStore.ready()
      ]);
      isReady.value = true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }

  const storage: StorageInterface = {
    async saveDocument(id: string, content: string): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        if (!id || !content) {
          console.warn('Invalid document data:', { id, content });
          return;
        }
        await documentStore.setItem(id, content);
      } catch (error) {
        console.error('Error saving document:', error);
        throw error;
      }
    },

    async getDocument(id: string): Promise<string | null> {
      if (!isReady.value) await initStorage();
      try {
        const content = await documentStore.getItem<string>(id);
        return content || null;
      } catch (error) {
        console.error('Error getting document:', error);
        throw error;
      }
    },

    async deleteDocument(id: string): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        await documentStore.removeItem(id);
      } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
      }
    },

    async saveSetting<T>(key: string, value: T): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        await settingsStore.setItem(key, value);
      } catch (error) {
        console.error('Error saving setting:', error);
        throw error;
      }
    },

    async getSetting<T>(key: string): Promise<T | null> {
      if (!isReady.value) await initStorage();
      try {
        const value = await settingsStore.getItem<T>(key);
        return value || null;
      } catch (error) {
        console.error('Error getting setting:', error);
        throw error;
      }
    },

    async saveFiles(files: SlateFile[]): Promise<void> {
      if (!isReady.value) await initStorage();
      try {
        const serializableFiles: SlateFile[] = files.map(file => ({
          id: file.id,
          name: file.name,
          path: file.path,
          sha: file.sha,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }));

        const filesData: FilesData = {
          files: serializableFiles,
          updatedAt: new Date().toISOString()
        };

        await filesStore.setItem('files', filesData);
      } catch (error) {
        console.error('Error saving files:', error);
        throw error;
      }
    },

    async getFiles(): Promise<SlateFile[]> {
      if (!isReady.value) await initStorage();
      try {
        const filesData = await filesStore.getItem<FilesData>('files');
        return filesData?.files || [];
      } catch (error) {
        console.error('Error getting files:', error);
        throw error;
      }
    },

    async syncFromGitHub(): Promise<void> {
      if (!isReady.value) await initStorage();
      
      try {
        isSyncing.value = true;

        const response = await $fetch<{ success: boolean; files: GitHubFile[] }>('/api/github/files');
        
        if (!response.success) {
          throw new Error('Failed to fetch files from GitHub');
        }

        const files: SlateFile[] = response.files.map(file => ({
          id: file.sha,
          name: file.name,
          path: file.path,
          sha: file.sha,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        await storage.saveFiles(files);

        for (const file of response.files) {
          const contentResponse = await $fetch<{ success: boolean; content: string }>(`/api/github/file?path=${encodeURIComponent(file.path)}`);
          
          if (contentResponse.success) {
            await documentStore.setItem(file.sha, contentResponse.content);
          }
        }

        lastSyncTime.value = new Date().toISOString();
        await settingsStore.setItem('lastSyncTime', lastSyncTime.value);
      } catch (error: any) {
        console.error('Error syncing from GitHub:', error);
        if (error?.statusCode === 401 || error?.status === 401) {
          throw { statusCode: 401, message: 'GitHub configuration not found' };
        }
        throw error;
      } finally {
        isSyncing.value = false;
      }
    },

    async commitToGitHub(fileId: string, filePath: string, content: string): Promise<void> {
      if (!isReady.value) await initStorage();
      
      try {
        const files = await storage.getFiles();
        const file = files.find(f => f.id === fileId);

        const response = await $fetch('/api/github/commit', {
          method: 'POST',
          body: {
            path: filePath,
            content,
            message: `Update ${filePath}`,
            sha: file?.sha
          }
        });

        if (file) {
          file.sha = (response as any).sha;
          file.updatedAt = new Date().toISOString();
          await storage.saveFiles(files);
        }
      } catch (error) {
        console.error('Error committing to GitHub:', error);
        throw error;
      }
    }
  };

  return {
    storage,
    isReady,
    isSyncing,
    lastSyncTime,
    initStorage
  };
}
