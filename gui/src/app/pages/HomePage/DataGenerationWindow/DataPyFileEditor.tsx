import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Help, PlayArrow } from "@mui/icons-material";
import { PydodideWorkerStatus } from "../../../pyodide/pyodideWorker/pyodideWorkerTypes";
import PyodideWorkerInterface from "../../../pyodide/pyodideWorker/pyodideWorkerInterface";
import TextEditor, { ToolbarItem } from "../../../FileEditor/TextEditor";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  setData?: (data: any) => void;
  width: number;
  height: number;
  outputDiv?: HTMLDivElement | null;
};

const DataPyFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  setData,
  readOnly,
  width,
  height,
  outputDiv,
}) => {
  const [status, setStatus] = useState<PydodideWorkerStatus>("idle");

  const [dataPyWorker, setDataPyWorker] = useState<
    PyodideWorkerInterface | undefined
  >(undefined);

  // worker creation
  useEffect(() => {
    const worker = PyodideWorkerInterface.create("data.py", {
      onStdout: (x) => {
        console.log(x);
        const divElement = document.createElement("div");
        divElement.style.color = "blue";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = x;
        outputDiv?.appendChild(divElement);
      },
      onStderr: (x) => {
        console.error(x);
        const divElement = document.createElement("div");
        divElement.style.color = "red";
        const preElement = document.createElement("pre");
        divElement.appendChild(preElement);
        preElement.textContent = x;
        outputDiv?.appendChild(divElement);
      },
      onStatus: (status) => {
        setStatus(status);
      },
      onData: setData,
    });
    setDataPyWorker(worker);
    return () => {
      worker.destroy();
    };
  }, [setData, outputDiv]);

  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    if (!dataPyWorker) {
      throw new Error("dataPyWorker is not defined");
    }
    if (outputDiv) {
      outputDiv.innerHTML = "";
    }
    dataPyWorker.run(fileContent, {});
  }, [editedFileContent, fileContent, status, dataPyWorker, outputDiv]);

  const handleHelp = useCallback(() => {
    alert(
      'Write a Python script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent;
    ret.push({
      type: "button",
      tooltip: "Help",
      icon: <Help />,
      onClick: handleHelp,
    });
    if (runnable) {
      ret.push({
        type: "button",
        tooltip: "Run code to generate data",
        label: "Run",
        icon: <PlayArrow />,
        onClick: handleRun,
        color: "black",
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
  }, [fileContent, editedFileContent, handleRun, status]);

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

export default DataPyFileEditor;
