import { FunctionComponent, RefObject, useCallback, useMemo } from "react";
import { NeedsSamplerState } from "@SpCore/StanSampler/SamplerTypes";
import { FileNames } from "@SpCore/Project/FileMapping";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import useTemplatedFillerText from "@SpComponents/FileEditor/useTemplatedFillerText";
import {
  clearOutputDivs,
  writeConsoleOutToDiv,
} from "@SpCore/Scripting/OutputDivUtils";
import PlottingScriptEditor from "@SpComponents/FileEditor/PlottingScriptEditor";

import usePyodideWorker from "@SpCore/Scripting/pyodide/usePyodideWorker";

import useAnalysisState from "./useAnalysisState";
import analysisPyTemplate from "./code_templates/analysis.py?raw";

const AnalysisPyPanel: FunctionComponent<NeedsSamplerState> = ({
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

  const callbacks = useMemo(
    () => ({
      onStdout: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stdout"),
      onStderr: (x: string) => writeConsoleOutToDiv(consoleRef, x, "stderr"),
      onImage: (b64: string) => addImageToDiv(imagesRef, b64),
      onStatus,
    }),
    [consoleRef, imagesRef, onStatus],
  );

  const { run, cancel } = usePyodideWorker(callbacks);

  const handleRun = useCallback(
    (code: string) => {
      clearOutputDivs(consoleRef, imagesRef);
      run({
        code,
        spData,
        spRunSettings: {
          loadsDraws: true,
          showsPlots: true,
          producesData: false,
          filenameForErrors: FileNames.ANALYSISPYFILE,
        },
        files,
      });
    },
    [consoleRef, imagesRef, run, spData, files],
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
      onCancel={cancel}
      runnable={runnable}
      notRunnableReason={notRunnableReason}
      imagesRef={imagesRef}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

const addImageToDiv = (
  imagesRef: RefObject<HTMLDivElement | null>,
  b64: string,
) => {
  const imageUrl = `data:image/png;base64,${b64}`;

  const img = document.createElement("img");
  img.style.width = "100%";
  img.src = imageUrl;

  const divElement = document.createElement("div");
  divElement.appendChild(img);
  imagesRef.current?.appendChild(divElement);
};

export default AnalysisPyPanel;
