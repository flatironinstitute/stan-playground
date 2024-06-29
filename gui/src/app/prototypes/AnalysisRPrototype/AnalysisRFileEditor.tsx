import { FunctionComponent, useCallback, useMemo, useState } from "react";
import TextEditor, { ToolbarItem } from "../../FileEditor/TextEditor";
import { PlayArrow } from "@mui/icons-material";
import { Shelter, WebR } from "webr";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  width: number;
  height: number;
  outputDiv: HTMLDivElement;
};

let webR: WebR | null = null;
const loadWebRInstance = async () => {
  if (webR === null) {
    const w = new WebR();
    await w.init();
    // w.installPackages(['...'])
    webR = w;
    return webR;
  } else {
    return webR;
  }
};

const AnalysisRFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
  width,
  height,
  outputDiv,
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "completed" | "failed"
  >("idle");
  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    setStatus("loading");
    try {
      const webR = await loadWebRInstance();
      const shelter = await new webR.Shelter();
      setStatus("running");
      const rCode = fileContent;
      await runR(shelter, rCode, outputDiv);
      setStatus("completed");
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  }, [editedFileContent, fileContent, status, outputDiv]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent;
    if (runnable) {
      ret.push({
        type: "button",
        tooltip: "Run R code",
        label: "Run",
        icon: <PlayArrow />,
        onClick: handleRun,
        color: "black",
      });
    }
    let label: string;
    let color: string;
    if (status === "loading") {
      label = "Loading webr...";
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
  }, [fileContent, editedFileContent, handleRun, status]);

  return (
    <TextEditor
      width={width}
      height={height}
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
  outputDiv: HTMLDivElement,
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
    outputDiv.innerHTML = "";

    // Display the console outputs. Note that they will all appear before
    // the graphics regardless of the order in which they were generated. I
    // don't know how to fix this.
    for (const evt of result.output) {
      if (evt.type === "stdout") {
        const textDiv = document.createElement("div");
        textDiv.textContent = evt.data;
        outputDiv.appendChild(textDiv);
      } else if (evt.type === "stderr") {
        const textDiv = document.createElement("div");
        textDiv.textContent = evt.data;
        textDiv.style.color = "red";
        outputDiv.appendChild(textDiv);
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
      outputDiv.appendChild(canvas);
    });
  } finally {
    // Clean up the remaining code
    shelter.purge();
  }
};
////////////////////////////////////////////////////////////////////////////////////////

export default AnalysisRFileEditor;
