import { RefObject } from "react";
import { RString, WebR } from "webr";
import { InterpreterStatus } from "@SpScripting/InterpreterTypes";
import { writeConsoleOutToDiv } from "@SpScripting/ScriptEditor";

let webR: WebR | null = null;
export const loadWebRInstance = async (
  onStatus: (s: InterpreterStatus) => void,
) => {
  if (webR === null) {
    onStatus("loading");
    await sleep(100); // let the UI update

    const w = new WebR();
    await w.init();

    onStatus("installing");
    await sleep(100); // let the UI update
    await w.installPackages(["jsonlite", "posterior"]);

    webR = w;
    return webR;
  } else {
    return webR;
  }
};

const captureOutputOptions = {
  withAutoprint: true,
  captureStreams: true,
  captureConditions: false,
  captureGraphics: {
    width: 340,
    height: 340,
    bg: "white", // default: transparent
    pointsize: 12,
    capture: true,
  },
} as const;

type RunRProps = {
  code: string;
  consoleRef: RefObject<HTMLDivElement>;
  imagesRef?: RefObject<HTMLDivElement>;
  onStatus: (status: InterpreterStatus) => void;
  onData?: (data: any) => void;
  spData?: Record<string, any>;
};

// todo: consider using something like Console class from webr
const runR = async ({
  code,
  imagesRef,
  consoleRef,
  onStatus,
  onData,
  spData,
}: RunRProps) => {
  try {
    const webR = await loadWebRInstance(onStatus);
    const shelter = await new webR.Shelter();

    onStatus("running");
    await sleep(100); // let the UI update
    let rCode =
      `
# redirect install.packages to webr's version
webr::shim_install()

` + code;

    if (onData) {
      rCode += `
if (typeof(data) != "list") {
stop("[stan-playground] data must be a list")
}
.SP_DATA <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE)
invisible(.SP_DATA)`;
    }
    try {
      const globals: { [key: string]: any } = {
        ".stan_playground": true,
      };
      if (spData) {
        globals[".SP_DATA_IN"] = await new shelter.RList(spData);
      }

      const env = await new shelter.REnvironment(globals);

      const options = { ...captureOutputOptions, env };

      const ret = await shelter.captureR(rCode, options);

      ret.output.forEach(({ type, data }) => {
        if (type === "stdout" || type === "stderr") {
          writeConsoleOutToDiv(consoleRef, data, type);
        }
      });

      ret.images.forEach((img) => {
        if (imagesRef?.current) {
          const canvas = document.createElement("canvas");
          // Set canvas size to image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image onto Canvas
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, img.width, img.height);

          // Append canvas to figure output area
          imagesRef.current.appendChild(canvas);
        }
      });

      if (onData) {
        const result = JSON.parse(await (ret.result as RString).toString());
        onData(result);
      }
    } finally {
      shelter.purge();
    }
    onStatus("completed");
  } catch (e: any) {
    console.error(e);
    writeConsoleOutToDiv(consoleRef, e.toString(), "stderr");
    onStatus("failed");
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default runR;
