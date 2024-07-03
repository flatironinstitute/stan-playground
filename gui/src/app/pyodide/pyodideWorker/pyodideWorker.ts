import { PyodideInterface, loadPyodide } from "pyodide";
import {
  MessageFromPyodideWorker,
  isMessageToPyodideWorker,
  PyodideWorkerMode,
  PydodideWorkerStatus,
} from "./pyodideWorkerTypes";

let pyodideWorkerMode: PyodideWorkerMode | undefined = undefined;

let pyodide: PyodideInterface | null = null;
const loadPyodideInstance = async () => {
  if (pyodide === null) {
    if (!pyodideWorkerMode) {
      throw Error("pyodideWorkerMode is not defined");
    }
    const packages =
      pyodideWorkerMode === "data.py"
        ? ["numpy", "micropip"]
        : pyodideWorkerMode === "analysis.py"
          ? ["numpy", "matplotlib"]
          : [];
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full",
      stdout: (x: string) => {
        sendStdout(x);
      },
      stderr: (x: string) => {
        sendStderr(x);
      },
      packages,
    });
    if (pyodideWorkerMode === "data.py") {
      const micropip = pyodide.pyimport("micropip");
      await micropip.install("stanio");
    }
    return pyodide;
  } else {
    return pyodide;
  }
};

self.onmessage = (e) => {
  const message = e.data;
  if (!isMessageToPyodideWorker(message)) {
    console.error("Invalid message from main", message);
    return;
  }
  if (message.type === "setPyodideWorkerMode") {
    if (pyodideWorkerMode !== undefined) {
      throw Error("pyodideWorkerMode is already defined");
    }
    if (!["data.py", "analysis.py"].includes(message.mode)) {
      throw Error("Invalid pyodideWorkerMode");
    }
    pyodideWorkerMode = message.mode;
  } else if (message.type === "run") {
    run(message.code);
  }
};

const sendMessageToMain = (message: MessageFromPyodideWorker) => {
  self.postMessage(message);
};

const sendStdout = (data: string) => {
  sendMessageToMain({ type: "stdout", data });
};

const sendStderr = (data: string) => {
  sendMessageToMain({ type: "stderr", data });
};

const setStatus = (status: PydodideWorkerStatus) => {
  sendMessageToMain({ type: "setStatus", status });
};

const setData = (data: any) => {
  if (pyodideWorkerMode !== "data.py") {
    throw Error("setData is only supported in data.py mode");
  }
  sendMessageToMain({ type: "setData", data });
};

const addImage = (image: any) => {
  if (pyodideWorkerMode !== "analysis.py") {
    throw Error("addImage is only supported in analysis.py mode");
  }
  sendMessageToMain({ type: "addImage", image });
};

const run = async (code: string) => {
  if (!pyodideWorkerMode) {
    throw Error("pyodideWorkerMode is not defined");
  }
  setStatus("loading");
  try {
    const pyodide = await loadPyodideInstance();
    setStatus("running");

    const scriptPreamble = getScriptPreable(pyodideWorkerMode);

    // here's where we can pass in globals
    const globals = pyodide.toPy({ _stan_playground: true });
    let script = scriptPreamble + "\n" + code;

    if (pyodideWorkerMode === "data.py") {
      // We serialize the data object to json string in the python script
      script += "\n";
      script += "import stanio\n";
      script += "import json\n";
      script += "data = stanio.dump_stan_json(data)\n";
    }

    let succeeded = false;
    try {
      if (script.includes("arviz")) {
        // If the script has arviz, we need to install it
        setStatus("loading");
        try {
          await pyodide.loadPackage("micropip");
          const microPip = pyodide.pyimport("micropip");
          await microPip.install("arviz<0.18");
        } finally {
          setStatus("running");
        }
      }
      pyodide.runPython(script, { globals });
      succeeded = true;
    } catch (e: any) {
      console.error(e);
      sendStderr(e.toString());
    }

    if (pyodideWorkerMode === "analysis.py") {
      const images = globals.get("SP_IMAGES").toJs();
      if (!isListOfStrings(images)) {
        throw new Error("Expected SP_IMAGES to be a list of strings");
      }
      for (const image of images) {
        addImage(image);
      }
    } else if (pyodideWorkerMode === "data.py") {
      // get the data object from the python script
      const data = JSON.parse(globals.get("data"));
      setData(resultToData(data));
    }
    setStatus(succeeded ? "completed" : "failed");
  } catch (e: any) {
    console.error(e);
    sendStderr("UNEXPECTED ERROR: " + e.toString());
    setStatus("failed");
  }
};

const resultToData = (result: any): any => {
  if (pyodideWorkerMode !== "data.py") {
    throw Error("resultToData is only supported in data.py mode");
  }
  if (result === null || result === undefined) {
    return result;
  }
  if (typeof result !== "object") {
    return result;
  }
  if (result instanceof Map) {
    const ret: { [key: string]: any } = {};
    for (const k of result.keys()) {
      ret[k] = resultToData(result.get(k));
    }
    return ret;
  } else if (
    result instanceof Int16Array ||
    result instanceof Int32Array ||
    result instanceof Int8Array ||
    result instanceof Uint16Array ||
    result instanceof Uint32Array ||
    result instanceof Uint8Array ||
    result instanceof Uint8ClampedArray ||
    result instanceof Float32Array ||
    result instanceof Float64Array
  ) {
    return Array.from(result);
  } else if (result instanceof Array) {
    return result.map(resultToData);
  } else {
    const ret: { [key: string]: any } = {};
    for (const k of Object.keys(result)) {
      ret[k] = resultToData(result[k]);
    }
    return ret;
  }
};

const getScriptPreable = (mode: PyodideWorkerMode): string => {
  if (mode === "analysis.py") {
    // see https://github.com/pyodide/matplotlib-pyodide/issues/6#issuecomment-1242747625
    // replace show() with a function that base64 encodes the image and then stashes it for us

    return `SP_IMAGES = []
def patch_matplotlib(SP_IMAGES):
  import os
  os.environ['MPLBACKEND'] = 'AGG'
  import base64
  from io import BytesIO
  import matplotlib.pyplot
  _old_show = matplotlib.pyplot.show
  def show():
    buf = BytesIO()
    matplotlib.pyplot.savefig(buf, format='png')
    buf.seek(0)
    # encode to a base64 str
    SP_IMAGES.append(base64.b64encode(buf.read()).decode('utf-8'))
    matplotlib.pyplot.clf()
  matplotlib.pyplot.show = show
patch_matplotlib(SP_IMAGES)
`;
  } else {
    return "";
  }
};

const isListOfStrings = (x: any): x is string[] => {
  if (!x) return false;
  return Array.isArray(x) && x.every((y) => typeof y === "string");
};
