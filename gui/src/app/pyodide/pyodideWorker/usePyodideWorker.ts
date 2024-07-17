// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import pyodideWorkerURL from "./pyodideWorker?worker&url";
import { useCallback, useEffect, useState } from "react";
import {
  MessageToPyodideWorker,
  PyodideWorkerStatus,
  isMessageFromPyodideWorker,
  PyodideRunSettings,
} from "./pyodideWorkerTypes";

type PyodideWorkerCallbacks = {
  onStdout: (data: string) => void;
  onStderr: (data: string) => void;
  onStatus: (status: PyodideWorkerStatus) => void;
  onData?: (data: any) => void;
  onImage?: (image: string) => void;
};

class PyodideWorkerInterface {
  #worker: Worker | undefined;

  private constructor(private callbacks: PyodideWorkerCallbacks) {
    // do not call this directly, use create() instead
    this.#initialize();
  }

  #initialize() {
    this.#worker = new Worker(pyodideWorkerURL, {
      name: "pyodideWorker",
      type: "module",
    });

    this.#worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!isMessageFromPyodideWorker(msg)) {
        console.error("invalid message from worker", msg);
        return;
      } else if (msg.type === "setStatus") {
        this.callbacks.onStatus(msg.status);
      } else if (msg.type === "stdout") {
        this.callbacks.onStdout(msg.data);
      } else if (msg.type === "stderr") {
        this.callbacks.onStderr(msg.data);
      } else if (msg.type === "setData") {
        if (!this.callbacks.onData) {
          console.error("onData callback is required for data production");
          return;
        }
        this.callbacks.onData(msg.data);
      } else if (msg.type === "addImage") {
        if (!this.callbacks.onImage) {
          console.error("onImage callback is required for plotting");
          return;
        }
        this.callbacks.onImage(msg.image);
      }
    };
  }

  static create(callbacks: PyodideWorkerCallbacks) {
    const worker = new PyodideWorkerInterface(callbacks);

    const cleanup = () => {
      console.log("terminating pyodide worker");
      worker.#worker?.terminate();
      worker.#worker = undefined;
    };

    return { worker, cleanup };
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
    if (this.#worker) {
      this.#worker.postMessage(msg);
    } else {
      throw new Error("pyodide worker is not defined");
    }
  }

  cancel() {
    this.#worker?.terminate();
    this.#initialize();
  }
}

const usePyodideWorker = (callbacks: {
  onStdout: (data: string) => void;
  onStderr: (data: string) => void;
  onStatus: (status: PyodideWorkerStatus) => void;
  onData?: (data: any) => void;
  onImage?: (image: string) => void;
}) => {
  const [worker, setWorker] = useState<PyodideWorkerInterface | undefined>(
    undefined,
  );

  useEffect(() => {
    const { worker: pyWorker, cleanup } =
      PyodideWorkerInterface.create(callbacks);
    setWorker(pyWorker);
    return cleanup;
  }, [callbacks]);

  const run = useCallback(
    (
      code: string,
      spData: Record<string, any> | undefined,
      spRunSettings: PyodideRunSettings,
    ) => {
      if (worker) {
        worker.run(code, spData, spRunSettings);
      } else {
        throw new Error("pyodide worker is not defined");
      }
    },
    [worker],
  );

  const cancel = useCallback(() => {
    worker?.cancel();
  }, [worker]);

  return { run, cancel };
};

export default usePyodideWorker;
