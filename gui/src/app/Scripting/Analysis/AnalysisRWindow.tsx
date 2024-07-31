import { FunctionComponent, useCallback } from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import PlottingScriptEditor from "@SpScripting/PlottingScriptEditor";
import useTemplatedFillerText from "@SpScripting/useTemplatedFillerText";
import { clearOutputDivs } from "@SpScripting/OutputDivUtils";
import loadDrawsCode from "@SpScripting/webR/sp_load_draws.R?raw";
import useAnalysisState from "./useAnalysisState";

import analysisRTemplate from "./analysis_template.R?raw";
import useWebR from "@SpScripting/webR/useWebR";

type AnalysisWindowProps = {
  latestRun: StanRun;
};

const AnalysisRWindow: FunctionComponent<AnalysisWindowProps> = ({
  latestRun,
}) => {
  const {
    consoleRef,
    imagesRef,
    spData,
    status,
    onStatus,
    runnable,
    notRunnableReason,
  } = useAnalysisState(latestRun);

  const { run } = useWebR({ consoleRef, imagesRef, onStatus });
  const handleRun = useCallback(
    async (userCode: string) => {
      clearOutputDivs(consoleRef, imagesRef);
      const code = loadDrawsCode + userCode;
      await run({ code, spData });
    },
    [consoleRef, imagesRef, run, spData],
  );

  const contentOnEmpty = useTemplatedFillerText(
    "Use the draws object (a posterior::draws_array) to access the samples. ",
    analysisRTemplate,
    ProjectKnownFiles.ANALYSISRFILE,
  );

  return (
    <PlottingScriptEditor
      filename={FileNames.ANALYSISRFILE}
      dataKey={ProjectKnownFiles.ANALYSISRFILE}
      language="r"
      status={status}
      onRun={handleRun}
      runnable={runnable}
      notRunnableReason={notRunnableReason}
      imagesRef={imagesRef}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

export default AnalysisRWindow;
