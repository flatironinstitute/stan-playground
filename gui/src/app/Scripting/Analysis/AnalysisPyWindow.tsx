import { FunctionComponent, useCallback, useMemo } from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useTemplatedFillerText from "@SpScripting/useTemplatedFillerText";
import { writeConsoleOutToDiv } from "@SpScripting/ScriptEditor";
import usePyodideWorker from "@SpScripting/pyodide/usePyodideWorker";
import PlottingScriptEditor from "@SpScripting/PlottingScriptEditor";
import useAnalysisState from "./useAnalysisState";

import analysisPyTemplate from "./analysis_template.py?raw";

export type GlobalDataForAnalysis = {
  draws: number[][];
  paramNames: string[];
  numChains: number;
};

type AnalysisWindowProps = {
  latestRun: StanRun;
};

const AnalysisPyWindow: FunctionComponent<AnalysisWindowProps> = ({
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

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stderr"),
      onImage: (b64: string) => {
        const imageUrl = `data:image/png;base64,${b64}`;

        const img = document.createElement("img");
        img.style.width = "100%";
        img.src = imageUrl;

        const divElement = document.createElement("div");
        divElement.appendChild(img);
        imagesRef.current?.appendChild(divElement);
      },
      onStatus,
    }),
    [consoleRef, imagesRef, onStatus],
  );

  const { run } = usePyodideWorker(callbacks);

  const handleRun = useCallback(
    (code: string) => {
      if (consoleRef.current) {
        consoleRef.current.innerHTML = "";
      }
      if (imagesRef.current) {
        imagesRef.current.innerHTML = "";
      }
      run(code, spData, {
        loadsDraws: true,
        showsPlots: true,
        producesData: false,
      });
    },
    [consoleRef, imagesRef, run, spData],
  );

  const contentOnEmpty = useTemplatedFillerText(
    "Use the draws object to access the samples. ",
    analysisPyTemplate,
    ProjectKnownFiles.ANALYSISPYFILE,
  );

  return (
    <PlottingScriptEditor
      filename={FileNames.ANALYSISPYFILE}
      dataKey={ProjectKnownFiles.ANALYSISPYFILE}
      language="python"
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

export default AnalysisPyWindow;
