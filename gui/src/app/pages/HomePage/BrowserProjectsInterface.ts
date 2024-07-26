export class BrowserProjectsInterface {
  constructor(
    private dbName: string = "stan-playground",
    private storeName: string = "projects",
  ) {}
  async loadProject(title: string) {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, "readonly");
    const objectStore = transaction.objectStore(this.storeName);
    const filename = `${title}.json`;
    const content = await this.getTextFile(objectStore, filename);
    if (!content) return null;
    return JSON.parse(content);
  }
  async saveProject(title: string, fileManifest: { [name: string]: string }) {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, "readwrite");
    const objectStore = transaction.objectStore(this.storeName);
    const filename = `${title}.json`;
    return await this.setTextFile(
      objectStore,
      filename,
      JSON.stringify(fileManifest, null, 2),
    );
  }
  async listProjects(): Promise<string[]> {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, "readonly");
    const objectStore = transaction.objectStore(this.storeName);
    return new Promise<string[]>((resolve, reject) => {
      const request = objectStore.getAllKeys();
      request.onsuccess = () => {
        resolve(
          request.result.map((key) => {
            return key.toString().replace(/\.json$/, "");
          }),
        );
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  async deleteProject(title: string) {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, "readwrite");
    const objectStore = transaction.objectStore(this.storeName);
    const filename = `${title}.json`;
    await this.deleteTextFile(objectStore, filename);
  }
  private async openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "name" });
        }
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  private async getTextFile(objectStore: IDBObjectStore, filename: string) {
    return new Promise<string | null>((resolve, reject) => {
      const getRequest = objectStore.get(filename);
      getRequest.onsuccess = () => {
        resolve(getRequest.result?.content || null);
      };
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }
  private async setTextFile(
    objectStore: IDBObjectStore,
    filename: string,
    content: string,
  ) {
    return new Promise<void>((resolve, reject) => {
      const file = { name: filename, content: content };
      const putRequest = objectStore.put(file);
      putRequest.onsuccess = () => {
        resolve();
      };
      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    });
  }
  private async deleteTextFile(objectStore: IDBObjectStore, filename: string) {
    return new Promise<void>((resolve, reject) => {
      const deleteRequest = objectStore.delete(filename);
      deleteRequest.onsuccess = () => {
        resolve();
      };
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    });
  }
}

export default BrowserProjectsInterface;
