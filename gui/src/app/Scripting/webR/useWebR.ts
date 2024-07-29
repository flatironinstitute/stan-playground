import { RefObject, useCallback, useEffect, useState } from "react";
import { WebR } from "webr";
import { InterpreterStatus } from "@SpScripting/InterpreterTypes";
import { writeConsoleOutToDiv } from "@SpScripting/OutputDivUtils";

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
    if (webR) outputLoop(webR, consoleRef, imagesRef);

    return () => {
      if (webR) {
        console.log("closing webR!");
        webR.close();
        setWebR(null);
      }
    };
  }, [consoleRef, imagesRef, webR]);

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
          await webR.evalRVoid(
            `webr::shim_install()
webr::canvas()`,
            options,
          );
          await webR.evalRVoid(code, options);

          if (onData) {
            const result = JSON.parse(
              await webR.evalRString(
                `if (typeof(data) != "list") {
stop("[stan-playground] data must be a list")
}
.SP_DATA <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE)
invisible(.SP_DATA)`,
                options,
              ),
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

  return { run };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const outputLoop = async (
  webR: WebR,
  consoleRef: RefObject<HTMLDivElement>,
  imagesRef?: RefObject<HTMLDivElement>,
) => {
  for (;;) {
    // ignore startup messages

    const output = await webR.read();
    if (output.type === "prompt") {
      break;
    }
    if (output.type === "closed") {
      return;
    }
  }

  let canvas;

  for (;;) {
    const output = await webR.read();

    switch (output.type) {
      case "stdout":
        writeConsoleOutToDiv(consoleRef, output.data, "stdout");
        break;
      case "stderr":
        writeConsoleOutToDiv(consoleRef, output.data, "stderr");
        break;
      case "canvas":
        if (imagesRef?.current && output.data.event === "canvasNewPage") {
          canvas = document.createElement("canvas");
          canvas.setAttribute("width", "1008");
          canvas.setAttribute("height", "1008");
          canvas.style.width = "100%";
          canvas.style.display = "inline-block";
          // Append canvas to figure output area
          imagesRef.current.appendChild(canvas);
        } else if (
          canvas !== undefined &&
          output.data.event === "canvasImage"
        ) {
          canvas.getContext("2d")?.drawImage(output.data.image, 0, 0);
        }
        break;
      case "closed":
        return;
      default:
        console.log(output);
    }
  }
};

export default useWebR;
