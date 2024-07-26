import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import PlottingScriptEditor from "app/Scripting/PlottingScriptEditor";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useAnalysisState from "./useAnalysisState";
import runR from "../webR/runR";
import useTemplatedFillerText from "../useTemplatedFillerText";

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
    async (code: string) => {
      await runR({ code, imagesRef, consoleRef, onStatus });
    },
    [consoleRef, imagesRef, onStatus],
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

const analysisRTemplate = `
TODO
`;

export default AnalysisRWindow;
