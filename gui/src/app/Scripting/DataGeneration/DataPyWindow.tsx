import { FunctionComponent, useCallback, useMemo } from "react";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useTemplatedFillerText from "@SpScripting/useTemplatedFillerText";
import ScriptEditor from "@SpScripting/ScriptEditor";
import {
  clearOutputDivs,
  writeConsoleOutToDiv,
} from "@SpScripting/OutputDivUtils";
import usePyodideWorker from "@SpScripting/pyodide/usePyodideWorker";
import useDataGenState from "./useDataGenState";

import dataPyTemplate from "./data_template.py?raw";

type Props = {
  // empty
};

const handleHelp = () =>
  alert(
    'Write a Python script to assign data to the "data" variable and then click "Run" to generate data.',
  );

const DataPyWindow: FunctionComponent<Props> = () => {
  const { consoleRef, status, onStatus, onData } = useDataGenState("python");

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stderr"),
      onStatus,
      onData,
    }),
    [consoleRef, onData, onStatus],
  );

  const { run } = usePyodideWorker(callbacks);

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
      });
    },
    [consoleRef, run],
  );

  const contentOnEmpty = useTemplatedFillerText(
    "Define a dictionary called data to update the data.json. ",
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
      runnable={true}
      notRunnableReason=""
      onHelp={handleHelp}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

export default DataPyWindow;
