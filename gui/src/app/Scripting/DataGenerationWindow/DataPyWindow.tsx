import { FunctionComponent, useCallback, useMemo } from "react";
import usePyodideWorker from "app/Scripting/pyodide/usePyodideWorker";
import ScriptEditor, { writeConsoleOutToDiv } from "app/Scripting/ScriptEditor";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useDataGenState from "./useDataGenState";
import useTemplatedFillerText from "../useTemplatedFillerText";

type Props = {
  // empty
};

const DataPyWindow: FunctionComponent<Props> = () => {
  const { consoleRef, status, onStatus, onData } = useDataGenState();

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
      run(
        code,
        {},
        {
          loadsDraws: false,
          showsPlots: false,
          producesData: true,
        },
      );
    },
    [run],
  );

  const handleHelp = useCallback(() => {
    alert(
      'Write a Python script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

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

const dataPyTemplate = `data = {
  "a": [1, 2, 3]
}`;

export default DataPyWindow;
