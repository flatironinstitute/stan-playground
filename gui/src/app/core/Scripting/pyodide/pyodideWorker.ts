import { PyodideInterface, loadPyodide } from "pyodide";
import { isMonacoWorkerNoise } from "@SpUtil/isMonacoWorkerNoise";
import { InterpreterStatus } from "@SpCore/Scripting/InterpreterTypes";
import {
  MessageFromPyodideWorker,
  MessageToPyodideWorker,
  PyodideRunSettings,
} from "./pyodideWorkerTypes";
import spDrawsScript from "./sp_load_draws.py?raw";
import spMPLScript from "./sp_patch_matplotlib.py?raw";

const loadPyodideInstance = async () => {
  const pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full",
    stdout: (x: string) => {
      sendStdout(x);
    },
    stderr: (x: string) => {
      sendStderr(x);
    },
    packages: ["numpy", "micropip", "pandas"],
  });
  console.log("pyodide loaded");

  pyodide.FS.writeFile("sp_load_draws.py", spDrawsScript);
  pyodide.FS.writeFile("sp_patch_matplotlib.py", spMPLScript);

  return pyodide;
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

const setStatus = (status: InterpreterStatus) => {
  sendMessageToMain({ type: "setStatus", status });
};

const setData = (data: any) => {
  sendMessageToMain({ type: "setData", data });
};

const addImage = (image: any) => {
  sendMessageToMain({ type: "addImage", image });
};

self.onmessage = async (e: MessageEvent<MessageToPyodideWorker>) => {
  if (isMonacoWorkerNoise(e.data)) {
    return;
  }
  const message = e.data;
  await run(
    message.code,
    message.spData,
    message.spRunSettings,
    message.files,
    message.interruptBuffer,
  );
};
console.log("pyodide worker initialized");

console.log("opportunistically loading pyodide");
const pyodidePromise: Promise<PyodideInterface> = loadPyodideInstance();

const run = async (
  code: string,
  spData: Record<string, any> | undefined,
  spPySettings: PyodideRunSettings,
  files: Record<string, string> | undefined,
  interruptBuffer: Uint8Array | undefined,
) => {
  setStatus("loading");
  try {
    const pyodide = await pyodidePromise;
    if (interruptBuffer) {
      pyodide.setInterruptBuffer(interruptBuffer);
    }
    setStatus("installing");

    const [scriptPreamble, scriptPostamble] = getScriptParts(spPySettings);

    const globalsJS: { [key: string]: any } = {
      _stan_playground: true,
    };
    if (spData) {
      globalsJS._SP_DATA_IN = spData;
    }
    if (spPySettings.showsPlots) {
      globalsJS._SP_ADD_IMAGE = addImage;
    }

    const globals = pyodide.toPy(globalsJS);

    const script = scriptPreamble + "\n" + code + "\n" + scriptPostamble;

    let succeeded = false;
    try {
      const packageFutures = [];
      let patch_http = false;
      const micropip = pyodide.pyimport("micropip");

      if (spPySettings.showsPlots) {
        packageFutures.push(pyodide.loadPackage("matplotlib"));

        if (script.includes("arviz")) {
          packageFutures.push(micropip.install("arviz"));
        }
      }
      if (script.includes("requests") || script.includes("https://")) {
        patch_http = true;
        packageFutures.push(
          micropip.install(["requests", "lzma", "pyodide-http"]),
        );
      }
      packageFutures.push(micropip.install("stanio"));
      packageFutures.push(pyodide.loadPackagesFromImports(script));
      await Promise.all(packageFutures);
      if (patch_http) {
        await pyodide.runPythonAsync(`
        from pyodide_http import patch_all
        patch_all()
        `);
      }

      if (files) {
        const encoder = new TextEncoder();
        for (const [filename, content] of Object.entries(files)) {
          await pyodide.FS.writeFile(filename, encoder.encode(content + "\n"));
        }
      }

      setStatus("running");
      await pyodide.runPythonAsync(script, {
        globals,
        filename: spPySettings.filenameForErrors,
      });
      succeeded = true;
    } catch (e: any) {
      console.error(e);
      sendStderr(e.toString());
    } finally {
      if (files) {
        for (const filename of Object.keys(files)) {
          await pyodide.FS.unlink(filename);
        }
      }
    }

    if (spPySettings.producesData) {
      const spDataGlobal = globals.get("_SP_DATA");
      if (spDataGlobal) {
        const data = JSON.parse(spDataGlobal);
        setData(data);
      } else {
        console.warn("Not setting data because _SP_DATA is not defined");
      }
    }

    setStatus(succeeded ? "completed" : "failed");
  } catch (e: any) {
    console.error(e);
    sendStderr("UNEXPECTED ERROR: " + e.toString());
    setStatus("failed");
  }
};

const getScriptParts = (spPySettings: PyodideRunSettings): string[] => {
  let preamble = "";
  let postamble = "";

  if (spPySettings.showsPlots) {
    preamble += `
from sp_patch_matplotlib import patch_matplotlib
patch_matplotlib(_SP_ADD_IMAGE)
`;

    postamble += `
import matplotlib.pyplot as plt
if len(plt.gcf().get_children()) > 1:
    plt.show()

plt.close('all')
`;
  }

  if (spPySettings.loadsDraws) {
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
