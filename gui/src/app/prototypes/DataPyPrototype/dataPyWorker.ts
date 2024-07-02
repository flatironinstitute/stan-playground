import { PyodideInterface, loadPyodide } from "pyodide";

let pyodide: PyodideInterface | null = null;
const loadPyodideInstance = async () => {
  if (pyodide === null) {
    const p = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full",
      stdout: (x: string) => {
        self.postMessage({ type: "stdout", data: x });
      },
      stderr: (x: string) => {
        self.postMessage({ type: "stderr", data: x });
      }
    });
    pyodide = p;
    await pyodide.loadPackage(["numpy", "micropip"]);
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("stanio");
    return pyodide;
  } else {
    return pyodide;
  }
};

self.onmessage = (e) => {
    const dd = e.data;
    if (dd.type === "run") {
        run(dd.code);
    }
}

const setStatus = (status: string) => {
    self.postMessage({ type: "setStatus", status });
}

const setData = (data: any) => {
    self.postMessage({ type: "setData", data });
}

const run = async (code: string) => {
  setStatus("loading");
  try {
    const pyodide = await loadPyodideInstance();
    setStatus("running");
    // the runPython call is going to be blocking, so we want to give
    // react a chance to update the status in the UI.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // here's where we can pass in globals
    const globals = pyodide.toPy({ _sp_example_global: 5 });
    let script = code;

    // We serialize the data object to json string in the python script
    script += "\n";
    script += "import stanio\n";
    script += "import json\n";
    script += "data = stanio.dump_stan_json(data)\n";
    pyodide.runPython(script, { globals });

    // get the data object from the python script
    const data = JSON.parse(globals.get("data"));
    setData(resultToData(data));
    setStatus("completed");
  } catch (e) {
    console.error(e);
    setStatus("failed");
  }
};

const resultToData = (result: any): any => {
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