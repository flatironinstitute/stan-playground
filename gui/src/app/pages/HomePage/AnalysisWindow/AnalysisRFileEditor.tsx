import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";
import { GlobalDataForAnalysis } from "@SpPages/AnalysisWindow/AnalysisWindow";
import { loadWebRInstance } from "@SpPages/DataGenerationWindow/DataRFileEditor";
import { writeConsoleOutToDiv } from "@SpPyodide/AnalysisPyFileEditor";
import { PlayArrow } from "@mui/icons-material";
import {
  FunctionComponent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Shelter } from "webr";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  imagesRef: RefObject<HTMLDivElement>;
  consoleRef: RefObject<HTMLDivElement>;
  spData: GlobalDataForAnalysis | undefined;
  scriptHeader?: string;
};

type RunStatus = "idle" | "loading" | "running" | "completed" | "failed";

const AnalysisRFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
  imagesRef,
  consoleRef,
  spData,
}) => {
  const [status, setStatus] = useState<RunStatus>("idle");

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stderr"),
    }),
    [consoleRef],
  );

  const hasData = useMemo(() => {
    return spData !== undefined;
  }, [spData]);

  useEffect(() => {
    setStatus("idle");
  }, [spData, fileContent]);

  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }

    if (consoleRef.current) {
      consoleRef.current.innerHTML = "";
    }
    if (imagesRef.current) {
      imagesRef.current.innerHTML = "";
    }
    try {
      setStatus("loading");
      await sleep(100); // let the UI update
      const webR = await loadWebRInstance();
      const shelter = await new webR.Shelter();
      setStatus("running");
      await sleep(100); // let the UI update
      const rCode = fileContent;
      await runR(
        shelter,
        rCode,
        imagesRef.current,
        callbacks.onStdout,
        callbacks.onStderr,
      );
      setStatus("completed");
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  }, [
    status,
    editedFileContent,
    fileContent,
    consoleRef,
    imagesRef,
    setStatus,
    callbacks,
  ]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable =
      fileContent === editedFileContent && imagesRef.current && hasData;
    if (runnable) {
      ret.push({
        type: "button",
        tooltip: "Run script",
        label: "Run",
        icon: <PlayArrow />,
        onClick: handleRun,
        color: "black",
      });
    }
    if (!hasData) {
      ret.push({
        type: "text",
        label: "Run sampler first",
        color: "red",
      });
    }
    if (!imagesRef.current) {
      ret.push({
        type: "text",
        label: "No output window",
        color: "red",
      });
    }
    let label: string;
    let color: string;
    if (status === "loading") {
      label = "Loading webR...";
      color = "blue";
    } else if (status === "running") {
      label = "Running...";
      color = "blue";
    } else if (status === "completed") {
      label = "Completed";
      color = "green";
    } else if (status === "failed") {
      label = "Failed";
      color = "red";
    } else {
      label = "";
      color = "black";
    }

    if (label) {
      ret.push({
        type: "text",
        label,
        color,
      });
    }
    return ret;
  }, [fileContent, editedFileContent, imagesRef, hasData, status, handleRun]);

  return (
    <TextEditor
      language="r"
      label={fileName}
      text={fileContent}
      onSaveText={onSaveContent}
      editedText={editedFileContent}
      onSetEditedText={setEditedFileContent}
      readOnly={readOnly}
      toolbarItems={toolbarItems}
    />
  );
};

////////////////////////////////////////////////////////////////////////////////////////
// Adapted from https://stackblitz.com/edit/vitejs-vite-6wuedv?file=src%2FApp.tsx
const runR = async (
  shelter: Shelter,
  code: string,
  imageOutputDiv: HTMLDivElement | null,
  onStdout: (x: string) => void,
  onStderr: (x: string) => void,
) => {
  const captureOutputOptions: any = {
    withAutoprint: true,
    captureStreams: true,
    captureConditions: false,
    // env: webR.objs.emptyEnv, // maintain a global environment for webR v0.2.0
    captureGraphics: {
      width: 340,
      height: 340,
      bg: "white", // default: transparent
      pointsize: 12,
      capture: true,
    },
  };
  const result = await shelter.captureR(code, captureOutputOptions);

  try {
    // Clear the output div
    if (imageOutputDiv) {
      imageOutputDiv.innerHTML = "";
    }

    // Display the console outputs. Note that they will all appear before
    // the graphics regardless of the order in which they were generated. I
    // don't know how to fix this.
    for (const evt of result.output) {
      if (evt.type === "stdout") {
        console.log(evt.data);
        onStdout(evt.data);
      } else if (evt.type === "stderr") {
        console.error(evt.data);
        onStderr(evt.data);
      }
    }

    // Display the graphics
    result.images.forEach((img) => {
      const canvas = document.createElement("canvas");
      // Set canvas size to image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image onto Canvas
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, img.width, img.height);

      // Append canvas to figure output area
      if (imageOutputDiv) {
        imageOutputDiv.appendChild(canvas);
      }
    });
  } finally {
    // Clean up the remaining code
    shelter.purge();
  }
};
////////////////////////////////////////////////////////////////////////////////////////

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default AnalysisRFileEditor;
