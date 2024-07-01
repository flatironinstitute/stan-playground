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
import dataPyWorkerURL from "./dataPyWorker?worker&url";

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
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "completed" | "failed"
  >("idle");

  const [dataPyWorker, setDataPyWorker] = useState<Worker | undefined>(
    undefined,
  );

  // worker creation
  useEffect(() => {
    const worker = new Worker(dataPyWorkerURL, {
      name: "dataPyWorker",
      type: "module",
    });
    setDataPyWorker(worker);
    return () => {
      console.log("terminating dataPy worker");
      worker.terminate();
    };
  }, []);

  // message handling
  useEffect(() => {
    if (!dataPyWorker) return;

    dataPyWorker.onmessage = (e: MessageEvent) => {
      const dd = e.data;
      if (dd.type === "setStatus") {
        setStatus(dd.status);
      } else if (dd.type === "setData") {
        setData && setData(dd.data);
      } else if (dd.type === "stdout") {
        console.log(dd.data);
      } else if (dd.type === "stderr") {
        console.error(dd.data);
      }
    };
  }, [dataPyWorker, setData]);

  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    dataPyWorker?.postMessage({
      type: "run",
      code: fileContent,
    });
  }, [editedFileContent, fileContent, status, dataPyWorker]);
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];
    const runnable = fileContent === editedFileContent;
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
