import { FunctionComponent, useCallback, useMemo } from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import PlottingScriptEditor from "app/Scripting/PlottingScriptEditor";
import { writeConsoleOutToDiv } from "app/Scripting/ScriptEditor";
import usePyodideWorker from "app/Scripting/pyodide/usePyodideWorker";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useAnalysisState from "./useAnalysisState";
import useTemplatedFillerText from "../useTemplatedFillerText";

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
  const { consoleRef, imagesRef, spData, status, onStatus } =
    useAnalysisState(latestRun);

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

  const runnable = useMemo(() => {
    return spData !== undefined && status !== "running";
  }, [spData, status]);

  const handleRun = useCallback(
    (code: string) => {
      if (status === "running") {
        return;
      }

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
    [status, consoleRef, imagesRef, run, spData],
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
      notRunnableReason=""
      onHelp={() => {}}
      imagesRef={imagesRef}
      consoleRef={consoleRef}
      contentOnEmpty={contentOnEmpty}
    />
  );
};

const analysisPyTemplate = `import matplotlib.pyplot as plt

# Print the draws object
print(draws)

# Print parameter names
print(draws.parameter_names)

# plot the lp parameter
samples = draws.get("lp__")
print(samples.shape)
plt.hist(samples.ravel(), bins=30)
plt.title("lp__")
plt.show()
`;

export default AnalysisPyWindow;
