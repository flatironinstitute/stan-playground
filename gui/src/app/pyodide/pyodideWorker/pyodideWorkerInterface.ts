// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import pyodideWorkerURL from "./pyodideWorker?worker&url";
import {
  MessageToPyodideWorker,
  PyodideWorkerStatus,
  isMessageFromPyodideWorker,
  PyodideRunSettings,
} from "./pyodideWorkerTypes";

// todo make custom hook
class PyodideWorkerInterface {
  constructor(private _worker: Worker) {
    // do not call this directly, use create() instead
  }
  static create(callbacks: {
    onStdout: (data: string) => void;
    onStderr: (data: string) => void;
    onStatus: (status: PyodideWorkerStatus) => void;
    onData?: (data: any) => void;
    onImage?: (image: string) => void;
  }) {
    const worker = new Worker(pyodideWorkerURL, {
      name: "pyodideWorker",
      type: "module",
    });

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!isMessageFromPyodideWorker(msg)) {
        console.error("invalid message from worker", msg);
        return;
      } else if (msg.type === "setStatus") {
        callbacks.onStatus(msg.status);
      } else if (msg.type === "stdout") {
        callbacks.onStdout(msg.data);
      } else if (msg.type === "stderr") {
        callbacks.onStderr(msg.data);
      } else if (msg.type === "setData") {
        if (!callbacks.onData) {
          console.error("onData callback is required for data.py mode");
          return;
        }
        callbacks.onData(msg.data);
      } else if (msg.type === "addImage") {
        if (!callbacks.onImage) {
          console.error("onImage callback is required for analysis.py mode");
          return;
        }
        callbacks.onImage(msg.image);
      }
    };
    return new PyodideWorkerInterface(worker);
  }
  run(
    code: string,
    spData: Record<string, any> | undefined,
    spRunSettings: PyodideRunSettings,
  ) {
    const msg: MessageToPyodideWorker = {
      type: "run",
      code,
      spData,
      spRunSettings,
    };
    this._worker.postMessage(msg);
  }

  destroy() {
    console.log(`terminating pyodide worker`);
    this._worker.terminate();
  }
}

export default PyodideWorkerInterface;
