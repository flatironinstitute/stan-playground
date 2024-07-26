import { FunctionComponent, useCallback } from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import PlottingScriptEditor from "app/Scripting/PlottingScriptEditor";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useAnalysisState from "./useAnalysisState";
import runR from "../webR/runR";
import useTemplatedFillerText from "../useTemplatedFillerText";

import loadDrawsCode from "../webR/sp_load_draws.R?raw";
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
    "Use the draws object to access the samples. ",
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
      onHelp={() => {}}
      imagesRef={imagesRef}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

export default AnalysisRWindow;
