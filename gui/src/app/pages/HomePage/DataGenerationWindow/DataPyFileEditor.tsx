import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";
import { writeConsoleOutToDiv } from "app/pyodide/AnalysisPyFileEditor";
import { PyodideWorkerStatus } from "app/pyodide/pyodideWorker/pyodideWorkerTypes";
import usePyodideWorker from "app/pyodide/pyodideWorker/usePyodideWorker";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import getDataGenerationToolbarItems from "./getDataGenerationToolbarItems";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  readOnly: boolean;
  setData?: (data: any) => void;
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
  outputDiv,
}) => {
  const [status, setStatus] = useState<PyodideWorkerStatus>("idle");

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(outputDiv, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(outputDiv, x, "stderr"),
      onStatus: (status: PyodideWorkerStatus) => {
        setStatus(status);
      },
      onData: setData,
    }),
    [outputDiv, setData],
  );

  const { run } = usePyodideWorker(callbacks);

  const handleRun = useCallback(async () => {
    if (status === "running") {
      return;
    }
    if (editedFileContent !== fileContent) {
      throw new Error("Cannot run edited code");
    }
    if (outputDiv) {
      outputDiv.innerHTML = "";
    }
    run(
      fileContent,
      {},
      {
        loadsDraws: false,
        showsPlots: false,
        producesData: true,
      },
    );
  }, [editedFileContent, fileContent, status, run, outputDiv]);

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
