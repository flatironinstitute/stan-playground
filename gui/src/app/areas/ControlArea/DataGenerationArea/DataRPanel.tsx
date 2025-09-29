import { FunctionComponent, useCallback } from "react";
import ScriptEditor from "@SpComponents/FileEditor/ScriptEditor";
import { clearOutputDivs } from "@SpCore/Scripting/OutputDivUtils";
import { FileNames } from "@SpCore/Project/FileMapping";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import useTemplatedFillerText from "@SpComponents/FileEditor/useTemplatedFillerText";

import useWebR from "@SpCore/Scripting/webR/useWebR";

import useDataGenState from "./useDataGenState";
import dataRTemplate from "./code_templates/data.R?raw";

const handleHelp = () =>
  alert(
    'Write a R script to assign data to the "data" variable and then click "Run" to generate data. \
You can also use the "sp_brm" function to generate the Stan code and data from a brms formula.',
  );

const DataRPanel: FunctionComponent = () => {
  const { consoleRef, status, onStatus, onData, onStanCode } =
    useDataGenState("r");

  const { run, cancel } = useWebR({ consoleRef, onStatus, onData, onStanCode });

  const handleRun = useCallback(
    async (code: string) => {
      clearOutputDivs(consoleRef);
      await run({ code });
    },
    [consoleRef, run],
  );

  const contentOnEmpty = useTemplatedFillerText(
    'Define a list called "data" or call sp_brm with a brms formula to update the data.json. ',
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
      onCancel={cancel}
      runnable={true}
      notRunnableReason=""
      onHelp={handleHelp}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

export default DataRPanel;
