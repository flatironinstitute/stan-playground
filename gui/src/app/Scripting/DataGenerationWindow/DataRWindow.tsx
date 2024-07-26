import { FunctionComponent, useCallback } from "react";
import ScriptEditor from "app/Scripting/ScriptEditor";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import runR from "../webR/runR";
import useDataGenState from "./useDataGenState";
import useTemplatedFillerText from "../useTemplatedFillerText";

import dataRTemplate from "./data_template.R?raw";

type Props = {
  // empty
};

const DataRWindow: FunctionComponent<Props> = () => {
  const { consoleRef, status, onStatus, onData } = useDataGenState();

  const handleRun = useCallback(
    async (code: string) => {
      await runR({ code, consoleRef, onStatus, onData });
    },
    [consoleRef, onData, onStatus],
  );

  const handleHelp = useCallback(() => {
    alert(
      'Write a R script to assign data to the "data" variable and then click "Run" to generate data.',
    );
  }, []);

  const contentOnEmpty = useTemplatedFillerText(
    "Define a list called data to update the data.json. ",
    dataRTemplate,
    ProjectKnownFiles.DATARFILE,
  );

  return (
    <ScriptEditor
      filename={FileNames.DATARFILE}
      dataKey={ProjectKnownFiles.DATARFILE}
      language="r"
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

export default DataRWindow;
