import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PlayArrow } from "@mui/icons-material";
import TextEditor, { ToolbarItem } from "../FileEditor/TextEditor";
import { PydodideWorkerStatus } from "./pyodideWorker/pyodideWorkerTypes";
import PyodideWorkerInterface from "./pyodideWorker/pyodideWorkerInterface";
import { GlobalDataForAnalysisPy } from "../pages/HomePage/AnalysisPyWindow/AnalysisPyWindow";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  width: number;
  height: number;
  imageOutputDiv?: HTMLDivElement | null;
  consoleOutputDiv?: HTMLDivElement | null;
  spData: GlobalDataForAnalysisPy
  scriptHeader?: string;
};

const AnalysisPyFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
  width,
  height,
  imageOutputDiv,
  consoleOutputDiv,
  spData,
  scriptHeader,
}) => {
  const [status, setStatus] = useState<PydodideWorkerStatus>("idle");

  const [analysisPyWorker, setAnalysisPyWorker] = useState<
    PyodideWorkerInterface | undefined
  >(undefined);

  // worker creation
  useEffect(() => {
    const worker = PyodideWorkerInterface.create("analysis.py", {
      onStdout: (x) => {
        console.log(x);
        writeConsoleOutToDiv(consoleOutputDiv, x, "stdout");
      },
      onStderr: (x) => {
        console.error(x);
        writeConsoleOutToDiv(consoleOutputDiv, x, "stderr");
      },
      onStatus: (status) => {
        setStatus(status);
      },
      onImage: (image) => {
        const b64 = image;
        const imageUrl = `data:image/png;base64,${b64}`;

        const img = document.createElement("img");
        img.src = imageUrl;

        const divElement = document.createElement("div");
        divElement.appendChild(img);
        imageOutputDiv?.appendChild(divElement);
      },
    });
    setAnalysisPyWorker(worker);
    return () => {
      worker.destroy();
    };
  }, [consoleOutputDiv, imageOutputDiv]);

  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    if (!analysisPyWorker) {
      throw new Error("analysisPyWorker is not defined");
    }
    if (consoleOutputDiv) {
      consoleOutputDiv.innerHTML = "";
    }
    if (imageOutputDiv) {
      imageOutputDiv.innerHTML = "";
    }
    const script = scriptHeader
      ? scriptHeader + "\n" + fileContent
      : fileContent;
    analysisPyWorker.run(script, spData || {});
  }, [
    editedFileContent,
    fileContent,
    status,
    analysisPyWorker,
    consoleOutputDiv,
    imageOutputDiv,
    spData,
    scriptHeader,
  ]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent && imageOutputDiv && spData.sampling
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
    if (!spData.sampling) {
      ret.push({
        type: "text",
        label: "Run sampler first",
        color: "red",
      });
    }
    if (!imageOutputDiv) {
      ret.push({
        type: "text",
        label: "No output window",
        color: "red",
      });
    }
    let label: string;
    let color: string;
    if (status === "loading") {
      label = "Loading pyodide...";
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
  }, [fileContent, editedFileContent, handleRun, status, imageOutputDiv]);

  return (
    <TextEditor
      width={width}
      height={height}
      language="python"
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

type ConsoleOutType = "stdout" | "stderr";

const writeConsoleOutToDiv = (
  parentDiv: HTMLDivElement | null | undefined,
  x: string,
  type: ConsoleOutType,
) => {
  if (x === "") return;
  if (parentDiv === null || parentDiv === undefined) return;
  const styleClass = type === "stdout" ? "WorkerStdout" : "WorkerStderr";
  const preElement = document.createElement("pre");
  preElement.textContent = x;
  const divElement = document.createElement("div");
  divElement.className = styleClass;
  divElement.appendChild(preElement);
  parentDiv.appendChild(divElement);
};

export default AnalysisPyFileEditor;
