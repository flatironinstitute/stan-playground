// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import pyodideWorkerURL from "./pyodideWorker?worker&url";
import {
  MessageToPyodideWorker,
  PydodideWorkerStatus,
  PyodideWorkerMode,
  isMessageFromPyodideWorker,
} from "./pyodideWorkerTypes";

class PyodideWorkerInterface {
  constructor(
    private _worker: Worker,
    private _mode: PyodideWorkerMode,
  ) {
    // do not call this directly, use create() instead
  }
  static create(
    mode: PyodideWorkerMode,
    callbacks: {
      onStdout: (data: string) => void;
      onStderr: (data: string) => void;
      onStatus: (status: PydodideWorkerStatus) => void;
      onData?: (data: any) => void;
      onImage?: (image: string) => void;
    },
  ) {
    const worker = new Worker(pyodideWorkerURL, {
      name: "pyodideWorker_" + mode,
      type: "module",
    });
    const msg: MessageToPyodideWorker = {
      type: "setPyodideWorkerMode",
      mode,
    };
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
        if (mode !== "data.py") {
          console.error("setData is only supported in data.py mode");
          return;
        }
        if (!callbacks.onData) {
          console.error("onData callback is required for data.py mode");
          return;
        }
        callbacks.onData(msg.data);
      } else if (msg.type === "addImage") {
        if (mode !== "analysis.py") {
          console.error("addImage is only supported in analysis.py mode");
          return;
        }
        if (!callbacks.onImage) {
          console.error("onImage callback is required for analysis.py mode");
          return;
        }
        callbacks.onImage(msg.image);
      }
    };
    worker.postMessage(msg);
    return new PyodideWorkerInterface(worker, mode);
  }
  run(code: string, globalData: { [key: string]: any }) {
    const msg: MessageToPyodideWorker = {
      type: "run",
      code,
      globalData,
    };
    this._worker.postMessage(msg);
  }

  destroy() {
    console.log(`terminating ${this._mode} worker`);
    this._worker.terminate();
  }
}

export default PyodideWorkerInterface;
