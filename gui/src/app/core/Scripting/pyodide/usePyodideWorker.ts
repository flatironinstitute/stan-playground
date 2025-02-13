import { useCallback, useEffect, useState } from "react";
import { InterpreterStatus } from "@SpCore/Scripting/InterpreterTypes";

// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import pyodideWorkerURL from "./pyodideWorker?worker&url";
import {
  MessageToPyodideWorker,
  isMessageFromPyodideWorker,
  PyodideRunSettings,
} from "./pyodideWorkerTypes";

type PyodideWorkerCallbacks = {
  onStdout: (data: string) => void;
  onStderr: (data: string) => void;
  onStatus: (status: InterpreterStatus) => void;
  onData?: (data: any) => void;
  onImage?: (image: string) => void;
};

type RunPyProps = {
  code: string;
  spData?: Record<string, any>;
  spRunSettings: PyodideRunSettings;
  files?: Record<string, string>;
};

class PyodideWorkerInterface {
  #worker: Worker | undefined;
  #interruptBuffer: Uint8Array | undefined;

  private constructor(private callbacks: PyodideWorkerCallbacks) {
    // do not call this directly, use create() instead
    this.#initialize();
  }

  #initialize() {
    this.#worker = new Worker(pyodideWorkerURL, {
      name: "pyodideWorker",
      type: "module",
    });

    if (window.crossOriginIsolated) {
      this.#interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
    } else {
      console.warn(
        "SharedArrayBuffer is not available, interrupting the Pyodide worker will not work",
      );
      this.#interruptBuffer = undefined;
    }

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

  run({ code, spData, spRunSettings, files }: RunPyProps) {
    const msg: MessageToPyodideWorker = {
      type: "run",
      code,
      spData,
      spRunSettings,
      files,
      interruptBuffer: this.#interruptBuffer,
    };
    if (this.#worker) {
      if (this.#interruptBuffer) {
        // clear in case previous run was interrupted
        this.#interruptBuffer[0] = 0;
      }
      this.#worker.postMessage(msg);
    } else {
      throw new Error("pyodide worker is not defined");
    }
  }

  cancel() {
    if (this.#interruptBuffer && this.#interruptBuffer[0] === 0) {
      // SIGINT
      this.#interruptBuffer[0] = 2;
    } else {
      // if the interrupt buffer doesn't exist, or has already been set
      // (and the user is requesting cancellation still)
      // we can just terminate the worker
      this.#worker?.terminate();
      this.callbacks.onStatus("failed");
      this.callbacks.onStderr("Python execution cancelled by user");
      this.#initialize();
    }
  }
}

const usePyodideWorker = (callbacks: {
  onStdout: (data: string) => void;
  onStderr: (data: string) => void;
  onStatus: (status: InterpreterStatus) => void;
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
    (p: RunPyProps) => {
      if (worker) {
        worker.run(p);
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
