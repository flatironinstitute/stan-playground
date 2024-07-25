import { RefObject } from "react";
import { RString, WebR } from "webr";
import { InterpreterStatus } from "./InterpreterTypes";
import { writeConsoleOutToDiv } from "./ScriptEditor";

let webR: WebR | null = null;
export const loadWebRInstance = async () => {
  if (webR === null) {
    const w = new WebR();
    await w.init();
    w.installPackages(["jsonlite"]);
    webR = w;
    return webR;
  } else {
    return webR;
  }
};

type RunRProps = {
  code: string;
  consoleRef: RefObject<HTMLDivElement>;
  imagesRef?: RefObject<HTMLDivElement>;
  setStatus: (status: InterpreterStatus) => void;
  setData?: (data: any) => void;
};

const runR = async ({
  code,
  imagesRef,
  consoleRef,
  setStatus,
  setData,
}: RunRProps) => {
  const captureOutputOptions: any = {
    withAutoprint: true,
    captureStreams: true,
    captureConditions: false,
    env: {},
    captureGraphics: {
      width: 340,
      height: 340,
      bg: "white", // default: transparent
      pointsize: 12,
      capture: true,
    },
  };

  try {
    setStatus("loading");
    await sleep(100); // let the UI update
    const webR = await loadWebRInstance();

    const shelter = await new webR.Shelter();

    setStatus("running");
    await sleep(100); // let the UI update
    let rCode =
      `
# redirect install.packages to webr's version
webr::shim_install()

` + code;

    if (setData) {
      rCode += `
if (typeof(data) != "list") {
stop("[stan-playground] data must be a list")
}
.SP_DATA <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE)
.SP_DATA`;
    }
    try {
      const ret = await shelter.captureR(rCode, captureOutputOptions);
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

      if (setData) {
        const result = JSON.parse(await (ret.result as RString).toString());
        setData(result);
      }
    } finally {
      shelter.purge();
    }
    setStatus("completed");
  } catch (e: any) {
    console.error(e);
    writeConsoleOutToDiv(consoleRef, e.toString(), "stderr");
    setStatus("failed");
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default runR;
