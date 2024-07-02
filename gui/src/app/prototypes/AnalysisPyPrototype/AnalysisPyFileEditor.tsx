import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PlayArrow } from "@mui/icons-material";
import TextEditor, { ToolbarItem } from "../../FileEditor/TextEditor";
// https://vitejs.dev/guide/assets#importing-script-as-a-worker
// https://vitejs.dev/guide/assets#importing-asset-as-url
import analysisPyWorkerURL from "./analysisPyWorker?worker&url";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  width: number;
  height: number;
  outputDiv?: HTMLDivElement | null;
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
  outputDiv,
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "completed" | "failed"
  >("idle");

  const [analysisPyWorker, setAnalysisPyWorker] = useState<Worker | undefined>(
    undefined,
  );

  // worker creation
  useEffect(() => {
    const worker = new Worker(analysisPyWorkerURL, {
      name: "dataPyWorker",
      type: "module",
    });
    setAnalysisPyWorker(worker);
    return () => {
      console.log("terminating dataPy worker");
      worker.terminate();
    };
  }, []);

  // message handling
  useEffect(() => {
    if (!analysisPyWorker) return;

    analysisPyWorker.onmessage = (e: MessageEvent) => {
      const dd = e.data;
      if (dd.type === "setStatus") {
        setStatus(dd.status);
      } else if (dd.type === "addImage") {
        const b64 = dd.image;
        const imageUrl = `data:image/png;base64,${b64}`;

        const img = document.createElement("img");
        img.src = imageUrl;

        const divElement = document.createElement("div");
        divElement.appendChild(img);
        outputDiv?.appendChild(divElement);
      } else if (dd.type === "stdout") {
        console.log(dd.data);
        const divElement = document.createElement("div");
        divElement.style.color = "blue";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = dd.data;
        outputDiv?.appendChild(divElement);
      } else if (dd.type === "stderr") {
        console.error(dd.data);
        const divElement = document.createElement("div");
        divElement.style.color = "red";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = dd.data;
        outputDiv?.appendChild(divElement);
      }
    };
  }, [analysisPyWorker, outputDiv]);

  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    if (outputDiv) outputDiv.innerHTML = "";
    analysisPyWorker?.postMessage({
      type: "run",
      code: fileContent,
    });
  }, [editedFileContent, fileContent, status, analysisPyWorker, outputDiv]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent && outputDiv;
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
    if (!outputDiv) {
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
  }, [fileContent, editedFileContent, handleRun, status, outputDiv]);

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
