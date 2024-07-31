import baseObjectCheck from "@SpUtil/baseObjectCheck";

export type BrowserProject = {
  title: string;
  timestamp: number;
  fileManifest: { [name: string]: string };
};

const isBrowserProject = (value: any): value is BrowserProject => {
  if (!baseObjectCheck(value)) return false;
  if (typeof value.timestamp !== "number") return false;
  if (!baseObjectCheck(value.fileManifest)) return false;
  for (const key in value.fileManifest) {
    if (typeof key !== "string") return false;
    if (typeof value.fileManifest[key] !== "string") return false;
  }
  return true;
};

export class BrowserProjectsInterface {
  constructor(
    private dbName: string = "stan-playground",
    private dbVersion: number = 2,
    private storeName: string = "browser-projects",
  ) {}
  async loadBrowserProject(title: string) {
    const objectStore = await this.openObjectStore("readonly");
    const filename = `${title}.json`;
    const content = await this.getTextFile(objectStore, filename);
    if (!content) return null;
    const bp = JSON.parse(content);
    if (!isBrowserProject(bp)) {
      console.warn(`Invalid browser project: ${title}`);
      return null;
    }
    return bp;
  }
  async saveBrowserProject(title: string, browserProject: BrowserProject) {
    const objectStore = await this.openObjectStore("readwrite");
    const filename = `${title}.json`;
    return await this.setTextFile(
      objectStore,
      filename,
      JSON.stringify(browserProject, null, 2),
    );
  }
  async getAllBrowserProjects() {
    const titles = await this.getAllProjectTitles();
    const browserProjects = [];
    for (const title of titles) {
      const browserProject = await this.loadBrowserProject(title);
      if (browserProject) {
        browserProjects.push(browserProject);
      }
    }
    return browserProjects;
  }
  async deleteProject(title: string) {
    const objectStore = await this.openObjectStore("readwrite");
    const filename = `${title}.json`;
    await this.deleteTextFile(objectStore, filename);
  }
  private async openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
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
  private async openObjectStore(mode: IDBTransactionMode) {
    const db = await this.openDatabase();
    const transaction = db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }
  private async getAllProjectTitles(): Promise<string[]> {
    const objectStore = await this.openObjectStore("readonly");
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
