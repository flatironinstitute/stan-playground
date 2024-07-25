import { FunctionComponent, useCallback, useContext, useMemo } from "react";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { FileNames } from "@SpCore/FileMapping";
import PlottingScriptEditor from "app/Scripting/PlottingScriptEditor";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import useAnalysisState from "./useAnalysisState";
import runR from "../runR";

type AnalysisWindowProps = {
  latestRun: StanRun;
};

const AnalysisRWindow: FunctionComponent<AnalysisWindowProps> = ({
  latestRun,
}) => {
  const { consoleRef, imagesRef, spData, status, setStatus } =
    useAnalysisState(latestRun);

  const handleRun = useCallback(
    async (code: string) => {
      await runR({ code, imagesRef, consoleRef, setStatus });
    },
    [consoleRef, imagesRef, setStatus],
  );

  const runnable = useMemo(() => {
    return spData !== undefined && status !== "running";
  }, [spData, status]);

  const { update } = useContext(ProjectContext);
  const contentOnEmpty = useMemo(() => {
    const spanElement = document.createElement("span");
    const t1 = document.createTextNode(
      "Use the draws object to access the samples. ",
    );
    const a1 = document.createElement("a");
    a1.onclick = () => {
      update({
        type: "editFile",
        filename: ProjectKnownFiles.ANALYSISRFILE,
        content: analysisRTemplate,
      });
    };
    a1.textContent = "Click here to generate an example";
    spanElement.appendChild(t1);
    spanElement.appendChild(a1);
    return spanElement;
  }, [update]);

  return (
    <PlottingScriptEditor
      filename={FileNames.ANALYSISRFILE}
      dataKey={ProjectKnownFiles.ANALYSISRFILE}
      language="r"
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

const analysisRTemplate = `
TODO
`;

export default AnalysisRWindow;
