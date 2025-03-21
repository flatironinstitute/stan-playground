import { FunctionComponent, useCallback } from "react";
import { NeedsSamplerState } from "@SpCore/StanSampler/SamplerTypes";
import { FileNames } from "@SpCore/Project/FileMapping";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import PlottingScriptEditor from "@SpComponents/FileEditor/PlottingScriptEditor";
import useTemplatedFillerText from "@SpComponents/FileEditor/useTemplatedFillerText";
import { clearOutputDivs } from "@SpCore/Scripting/OutputDivUtils";
import loadDrawsCode from "@SpCore/Scripting/webR/sp_load_draws.R?raw";

import useWebR from "@SpCore/Scripting/webR/useWebR";

import useAnalysisState from "./useAnalysisState";
import analysisRTemplate from "./code_templates/analysis.R?raw";

const AnalysisRPanel: FunctionComponent<NeedsSamplerState> = ({
  samplerState,
}) => {
  const {
    consoleRef,
    imagesRef,
    spData,
    status,
    onStatus,
    runnable,
    notRunnableReason,
    files,
  } = useAnalysisState(samplerState);

  const { run, cancel } = useWebR({ consoleRef, imagesRef, onStatus });

  const handleRun = useCallback(
    async (userCode: string) => {
      clearOutputDivs(consoleRef, imagesRef);
      const code = loadDrawsCode + userCode;
      await run({ code, spData, files });
    },
    [consoleRef, imagesRef, run, spData, files],
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
      onCancel={cancel}
      runnable={runnable}
      notRunnableReason={notRunnableReason}
      imagesRef={imagesRef}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

export default AnalysisRPanel;
