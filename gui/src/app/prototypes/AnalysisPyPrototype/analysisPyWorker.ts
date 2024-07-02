import { PyodideInterface, loadPyodide } from "pyodide";

let pyodide: PyodideInterface | null = null;
const loadPyodideInstance = async () => {
  if (pyodide === null) {
    const p = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full",
      stdout: (x: string) => {
        sendStdout(x);
      },
      stderr: (x: string) => {
        sendStderr(x);
      },
      packages: ["numpy", "matplotlib"],
    });
    pyodide = p;
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
};

const sendStdout = (data: string) => {
  self.postMessage({ type: "stdout", data });
};

const sendStderr = (data: string) => {
  self.postMessage({ type: "stderr", data });
};

const setStatus = (status: string) => {
  self.postMessage({ type: "setStatus", status });
};

const addImage = (image: any) => {
  self.postMessage({ type: "addImage", image });
};

// see https://github.com/pyodide/matplotlib-pyodide/issues/6#issuecomment-1242747625
// replace show() with a function that base64 encodes the image and then stashes it for us
const MPLPreamble = `
SP_IMAGES = []
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

const run = async (code: string) => {
  setStatus("loading");
  try {
    const pyodide = await loadPyodideInstance();
    setStatus("running");
    // Is the following needed for the message to get posted?
    // await new Promise((resolve) => setTimeout(resolve, 100));

    // here's where we can pass in globals
    const globals = pyodide.toPy({ _sp_example_global: 5 });
    const script = MPLPreamble + "\n" + code;
    let succeeded = false;
    try {
      if (script.includes("arviz")) {
        // If the script has arviz, we need to install it
        setStatus("loading");
        try {
          await pyodide.loadPackage("micropip");
          const microPip = pyodide.pyimport("micropip");
          await microPip.install("arviz<0.18");
        }
        finally {
          setStatus("running");
        }
      }
      pyodide.runPython(script, { globals });
      succeeded = true;
    } catch (e: any) {
      console.error(e);
      sendStderr(e.toString());
    }

    const images = globals.get("SP_IMAGES").toJs();
    if (!isListOfStrings(images)) {
      throw new Error("Expected SP_IMAGES to be a list of strings");
    }

    for (const image of images) {
      addImage(image);
    }
    setStatus(succeeded ? "completed" : "failed");
  } catch (e: any) {
    console.error(e);
    self.postMessage({
      type: "stderr",
      data: "UNEXPECTED ERROR: " + e.toString(),
    });
    setStatus("failed");
  }
};

const isListOfStrings = (x: any): x is string[] => {
  if (!x) return false;
  return Array.isArray(x) && x.every((y) => typeof y === "string");
};
