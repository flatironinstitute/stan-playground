import { FunctionComponent, useCallback, useMemo } from "react";
import ScriptEditor from "@SpScripting/ScriptEditor";
import { clearOutputDivs } from "@SpScripting/OutputDivUtils";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useTemplatedFillerText from "@SpScripting/useTemplatedFillerText";
import useDataGenState from "./useDataGenState";

import dataRTemplate from "./data_template.R?raw";
import useWebR from "@SpScripting/webR/useWebR";

type Props = {
  // empty
};

const handleHelp = () =>
  alert(
    'Write a R script to assign data to the "data" variable and then click "Run" to generate data.',
  );

const DataRWindow: FunctionComponent<Props> = () => {
  const { consoleRef, status, onStatus, onData } = useDataGenState();

  const webRArgs = useMemo(
    () => ({ consoleRef, onStatus, onData }),
    [consoleRef, onData, onStatus],
  );

  const { run } = useWebR(webRArgs);
  const handleRun = useCallback(
    async (code: string) => {
      clearOutputDivs(consoleRef);
      await run({ code });
    },
    [consoleRef, run],
  );

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
