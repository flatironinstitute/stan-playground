import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";
import { writeConsoleOutToDiv } from "app/pyodide/AnalysisPyFileEditor";
import PyodideWorkerInterface from "app/pyodide/pyodideWorker/pyodideWorkerInterface";
import { PyodideWorkerStatus } from "app/pyodide/pyodideWorker/pyodideWorkerTypes";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import getDataGenerationToolbarItems from "./getDataGenerationToolbarItems";

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
  const [status, setStatus] = useState<PyodideWorkerStatus>("idle");

  const [dataPyWorker, setDataPyWorker] = useState<
    PyodideWorkerInterface | undefined
  >(undefined);

  // worker creation
  useEffect(() => {
    const worker = PyodideWorkerInterface.create({
      onStdout: (x) => {
        writeConsoleOutToDiv(outputDiv, x, "stdout");
      },
      onStderr: (x) => {
        console.error(x);
        writeConsoleOutToDiv(outputDiv, x, "stderr");
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
    dataPyWorker.run(
      fileContent,
      {},
      {
        loadsDraws: false,
        showsPlots: false,
        producesData: true,
      },
    );
  }, [editedFileContent, fileContent, status, dataPyWorker, outputDiv]);

  const handleHelp = useCallback(() => {
    alert(
      'Write a Python script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

  const toolbarItems: ToolbarItem[] = useMemo(
    () =>
      getDataGenerationToolbarItems({
        status,
        runnable: fileContent === editedFileContent,
        onRun: handleRun,
        onHelp: handleHelp,
      }),
    [fileContent, editedFileContent, handleRun, status, handleHelp],
  );

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
