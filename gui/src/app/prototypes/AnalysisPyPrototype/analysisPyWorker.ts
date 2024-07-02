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
      },
    });
    pyodide = p;
    await pyodide.loadPackage(["numpy", "matplotlib"]);
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

const setStatus = (status: string) => {
  self.postMessage({ type: "setStatus", status });
};

const addImage = (image: any) => {
  self.postMessage({ type: "addImage", image });
};

// see https://github.com/pyodide/matplotlib-pyodide/issues/6#issuecomment-1242747625
// replace show() with a function that base64 encodes the image and then stashes it for us
const MPLPreample = `
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
    // the runPython call is going to be blocking, so we want to give
    // react a chance to update the status in the UI.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // here's where we can pass in globals
    const globals = pyodide.toPy({ _sp_example_global: 5 });
    const script = MPLPreample + '\n' + code + '\nprint("-----x", len(SP_IMAGES))';
    let succeeded = false;
    try {
      await pyodide.runPython(script, { globals });
      succeeded = false;
    }
    catch (e) {
      console.error(e);
    }

    const images = globals.toJs().get("SP_IMAGES");

    for (const image of images) {
      addImage(image);
    }
    setStatus(succeeded ? "completed" : "failed");
  } catch (e) {
    console.error(e);
    setStatus("failed");
  }
};
