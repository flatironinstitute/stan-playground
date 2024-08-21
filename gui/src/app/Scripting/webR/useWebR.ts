import { RefObject, useCallback, useEffect, useState } from "react";
import { WebR } from "webr";
import { InterpreterStatus } from "@SpScripting/InterpreterTypes";
import { writeConsoleOutToDiv } from "@SpScripting/OutputDivUtils";

import webRPreamble from "./webR_preamble.R?raw";
import dataPostamble from "./data_postamble.R?raw";

const captureOutputOptions = {
  withAutoprint: true,
  captureStreams: false,
  captureConditions: false,
  captureGraphics: false,
} as const;

type useWebRProps = {
  consoleRef: RefObject<HTMLDivElement>;
  imagesRef?: RefObject<HTMLDivElement>;
  onStatus: (status: InterpreterStatus) => void;
  onData?: (data: any) => void;
};

type RunRProps = {
  code: string;
  spData?: Record<string, any>;
};

const useWebR = ({ imagesRef, consoleRef, onStatus, onData }: useWebRProps) => {
  const [webR, setWebR] = useState<WebR | null>(null);

  const loadWebRInstance = useCallback(async () => {
    if (webR) {
      return webR;
    }

    onStatus("loading");
    await sleep(100); // let the UI update

    const w = new WebR();
    await w.init();

    onStatus("installing");
    await sleep(100); // let the UI update
    await w.installPackages(["jsonlite", "posterior"]);

    setWebR(w);
    return w;
  }, [onStatus, webR]);

  useEffect(() => {
    const closedHandle = { closed: false };
    if (webR) outputLoop(webR, consoleRef, imagesRef, closedHandle);

    return () => {
      if (webR) {
        console.log("closing webR!");
        webR.close();
        setWebR(null);
        onStatus("idle");
      }
      closedHandle.closed = true;
    };
  }, [consoleRef, imagesRef, onStatus, webR]);

  const run = useCallback(
    async ({ code, spData }: RunRProps) => {
      try {
        const webR = await loadWebRInstance();
        const shelter = await new webR.Shelter();
        onStatus("running");
        await sleep(100); // let the UI update

        try {
          const globals: { [key: string]: any } = {
            ".stan_playground": true,
          };
          if (spData) {
            const spDataR = {
              ...spData,
              draws: await new shelter.RDouble(spData.draws.flat()),
            };
            globals[".SP_DATA_IN"] = await new shelter.RList(spDataR);
          }

          const env = await new shelter.REnvironment(globals);

          const options = { ...captureOutputOptions, env };

          // setup
          await webR.evalRVoid(webRPreamble, options);
          await webR.evalRVoid(code, options);

          if (onData) {
            const result = JSON.parse(
              await webR.evalRString(dataPostamble, options),
            );
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
    },
    [consoleRef, loadWebRInstance, onData, onStatus],
  );

  const cancel = useCallback(() => {
    if (webR) {
      // NOTE: only works if COORS is set to allow shared worker usage
      webR.interrupt();
    }
  }, [webR]);

  return { run, cancel };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Similar to examples at
// https://docs.r-wasm.org/webr/latest/communication.html#handling-messages
//
const outputLoop = async (
  webR: WebR,
  consoleRef: RefObject<HTMLDivElement>,
  imagesRef: RefObject<HTMLDivElement> | undefined,
  closedHandle: { closed: boolean },
) => {
  // ignore startup messages from R repl
  while (!closedHandle.closed) {
    const output = await webR.read();
    if (output.type === "prompt") {
      break; // no more startup messages
    }
    if (output.type === "closed") {
      return; // killed early
    }
  }

  let canvas = undefined;

  while (!closedHandle.closed) {
    const output = await webR.read();
    if (closedHandle.closed) return;

    switch (output.type) {
      case "closed":
        console.log("webR closed, terminating output loop");
        return; // end loop
      case "stdout":
      case "stderr":
        writeConsoleOutToDiv(consoleRef, output.data, output.type);
        break;
      case "canvas":
        if (imagesRef?.current && output.data.event === "canvasNewPage") {
          // Starting a new plot
          canvas = document.createElement("canvas");
          canvas.setAttribute("width", "1008");
          canvas.setAttribute("height", "1008");
          canvas.style.width = "100%";
          canvas.style.backgroundColor = "white";
          canvas.style.display = "inline-block";
          // Append canvas to figure output area
          imagesRef.current.appendChild(canvas);
          break;
        }
        if (canvas !== undefined && output.data.event === "canvasImage") {
          // Add layer to the existing plot
          canvas.getContext("2d")?.drawImage(output.data.image, 0, 0);
        }
        break;
      default:
        console.log("unexpected webR message: ", output);
    }
  }
};

export default useWebR;
