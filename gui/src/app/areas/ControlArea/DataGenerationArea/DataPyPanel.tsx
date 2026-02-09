import { FunctionComponent, useCallback, useMemo } from "react";
import { FileNames } from "@SpCore/Project/FileMapping";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import useTemplatedFillerText from "@SpComponents/FileEditor/useTemplatedFillerText";
import ScriptEditor from "@SpComponents/FileEditor/ScriptEditor";
import {
  clearOutputDivs,
  writeConsoleOutToDiv,
} from "@SpCore/Scripting/OutputDivUtils";

import usePyodideWorker from "@SpCore/Scripting/pyodide/usePyodideWorker";

import useDataGenState from "./useDataGenState";
import dataPyTemplate from "./code_templates/data.py?raw";

const handleHelp = () =>
  alert(
    'Write a Python script to assign data to the "data" variable and then click "Run" to generate data.',
  );

const DataPyPanel: FunctionComponent = () => {
  const { consoleRef, status, onStatus, onData, files } =
    useDataGenState("python");

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stderr"),
      onStatus,
      onData,
    }),
    [consoleRef, onData, onStatus],
  );

  const { run, cancel } = usePyodideWorker(callbacks);

  const handleRun = useCallback(
    (code: string) => {
      clearOutputDivs(consoleRef);
      run({
        code,
        spRunSettings: {
          loadsDraws: false,
          showsPlots: false,
          producesData: true,
          filenameForErrors: FileNames.DATAPYFILE,
        },
        files,
      });
    },
    [consoleRef, files, run],
  );

  const contentOnEmpty = useTemplatedFillerText(
    "Define a dictionary called data to update the data.json.",
    dataPyTemplate,
    ProjectKnownFiles.DATAPYFILE,
  );

  return (
    <ScriptEditor
      filename={FileNames.DATAPYFILE}
      dataKey={ProjectKnownFiles.DATAPYFILE}
      language="python"
      status={status}
      onRun={handleRun}
      onCancel={cancel}
      runnable={true}
      notRunnableReason=""
      onHelp={handleHelp}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

export default DataPyPanel;
