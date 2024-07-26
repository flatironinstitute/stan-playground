import { FunctionComponent, useCallback } from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import PlottingScriptEditor from "@SpScripting/PlottingScriptEditor";
import runR from "@SpScripting/webR/runR";
import useTemplatedFillerText from "@SpScripting/useTemplatedFillerText";
import loadDrawsCode from "@SpScripting/webR/sp_load_draws.R?raw";
import useAnalysisState from "./useAnalysisState";

import analysisRTemplate from "./analysis_template.R?raw";

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

  const handleRun = useCallback(
    async (userCode: string) => {
      if (consoleRef.current) {
        consoleRef.current.innerHTML = "";
      }
      if (imagesRef.current) {
        imagesRef.current.innerHTML = "";
      }
      const code = loadDrawsCode + userCode;
      await runR({
        code,
        imagesRef,
        consoleRef,
        onStatus,
        spData,
      });
    },
    [consoleRef, imagesRef, onStatus, spData],
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
