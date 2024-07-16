import { PyodideInterface, loadPyodide } from "pyodide";
import {
  MessageFromPyodideWorker,
  PyodideWorkerStatus,
  PyodideRunSettings,
} from "./pyodideWorkerTypes";
import spDrawsScript from "./sp_load_draws.py?raw";
import spMPLScript from "./sp_patch_matplotlib.py?raw";

let pyodide: PyodideInterface | null = null;

const loadPyodideInstance = async () => {
  if (pyodide === null) {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full",
      stdout: (x: string) => {
        sendStdout(x);
      },
      stderr: (x: string) => {
        sendStderr(x);
      },
      packages: ["numpy", "micropip", "pandas"],
    });
    setStatus("installing");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("stanio");

    pyodide.FS.writeFile("sp_load_draws.py", spDrawsScript, {
      encoding: "utf-8",
    });
    pyodide.FS.writeFile("sp_patch_matplotlib.py", spMPLScript, {
      encoding: "utf-8",
    });

    return pyodide;
  } else {
    return pyodide;
  }
};

self.onmessage = async (e) => {
  const message = e.data;
  await run(message.code, message.spData, message.spRunSettings);
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

const setStatus = (status: PyodideWorkerStatus) => {
  sendMessageToMain({ type: "setStatus", status });
};

const setData = (data: any) => {
  sendMessageToMain({ type: "setData", data });
};

const addImage = (image: any) => {
  sendMessageToMain({ type: "addImage", image });
};

const run = async (
  code: string,
  spData: Record<string, any> | undefined,
  spPySettings: PyodideRunSettings,
) => {
  setStatus("loading");
  try {
    const pyodide = await loadPyodideInstance();

    const [scriptPreamble, scriptPostamble] = getScriptParts(
      spPySettings,
      spData,
    );

    const globals = pyodide.toPy({
      _stan_playground: true,
      _SP_DATA_IN: spData,
    });

    const script = scriptPreamble + "\n" + code + "\n" + scriptPostamble;

    let succeeded = false;
    try {
      if (script.includes("arviz")) {
        await pyodide.loadPackage("micropip");
        const microPip = pyodide.pyimport("micropip");
        await microPip.install("arviz<0.18");
      }
      await pyodide.loadPackagesFromImports(script);

      setStatus("running");
      pyodide.runPython(script, { globals });
      succeeded = true;
    } catch (e: any) {
      console.error(e);
      sendStderr(e.toString());
    }

    if (spPySettings.showsPlots) {
      const images = globals.get("_SP_IMAGES").toJs();
      if (!isListOfStrings(images)) {
        throw new Error("Expected SP_IMAGES to be a list of strings");
      }
      for (const image of images) {
        addImage(image);
      }
    }
    if (spPySettings.producesData) {
      const data = JSON.parse(globals.get("_SP_DATA").toJs());
      setData(data);
    }

    setStatus(succeeded ? "completed" : "failed");
  } catch (e: any) {
    console.error(e);
    sendStderr("UNEXPECTED ERROR: " + e.toString());
    setStatus("failed");
  }
};

const getScriptParts = (
  spPySettings: PyodideRunSettings,
  spData: any,
): string[] => {
  let preamble = "";
  let postamble = "";

  if (spPySettings.showsPlots) {
    preamble += `
from sp_patch_matplotlib import patch_matplotlib
_SP_IMAGES = []
patch_matplotlib(_SP_IMAGES)
`;
  }

  if (spData) {
    preamble += `
from sp_load_draws import sp_load_draws
draws = sp_load_draws(_SP_DATA_IN)
del _SP_DATA_IN
`;
  }

  if (spPySettings.producesData) {
    postamble += `
if "data" not in globals():
    raise ValueError("data is not defined")

import stanio
_SP_DATA = stanio.dump_stan_json(data)
`;
  }

  return [preamble, postamble];
};

const isListOfStrings = (x: any): x is string[] => {
  if (!x) return false;
  return Array.isArray(x) && x.every((y) => typeof y === "string");
};
