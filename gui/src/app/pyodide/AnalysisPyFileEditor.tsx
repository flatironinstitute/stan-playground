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
  consoleOutputDiv
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
        const divElement = document.createElement("div");
        divElement.style.color = "blue";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = x;
        consoleOutputDiv?.appendChild(divElement);
      },
      onStderr: (x) => {
        console.error(x);
        const divElement = document.createElement("div");
        divElement.style.color = "red";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = x;
        consoleOutputDiv?.appendChild(divElement);
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
    analysisPyWorker.run(fileContent);
  }, [editedFileContent, fileContent, status, analysisPyWorker, consoleOutputDiv, imageOutputDiv]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent && imageOutputDiv;
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

export default AnalysisPyFileEditor;
