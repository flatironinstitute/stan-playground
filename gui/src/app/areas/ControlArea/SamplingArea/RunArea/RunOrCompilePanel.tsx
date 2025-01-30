import { FunctionComponent, useCallback, use, useMemo } from "react";

import Button from "@mui/material/Button";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import { StanRun } from "@SpCore/StanSampler/useStanSampler";
import RunWithProgressPanel from "./RunWithProgressPanel";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

type RunOrCompileProps = {
  sampler?: StanSampler;
  latestRun: StanRun;
};

const RunOrCompilePanel: FunctionComponent<RunOrCompileProps> = ({
  sampler,
  latestRun,
}) => {
  const { status: runStatus, errorMessage, progress } = latestRun;
  const { data: projectData } = use(ProjectContext);

  const handleRun = useCallback(async () => {
    if (!sampler) return;
    sampler.sample(projectData.dataFileContent, projectData.samplingOpts);
  }, [sampler, projectData.dataFileContent, projectData.samplingOpts]);

  const cancelRun = useCallback(() => {
    if (!sampler) return;
    sampler.cancel();
  }, [sampler]);

  const { compile, compileStatus, validSyntax, isConnected } =
    use(CompileContext);

  const modelIsPresent = useMemo(() => {
    return projectData.stanFileContent.trim();
  }, [projectData.stanFileContent]);

  const modelIsSaved = useMemo(() => {
    return projectData.stanFileContent === projectData.ephemera.stanFileContent;
  }, [projectData.ephemera.stanFileContent, projectData.stanFileContent]);

  const tooltip = useMemo(() => {
    if (!validSyntax) return "Syntax error";
    if (!isConnected) return "Not connected to compilation server";
    if (!modelIsPresent) return "No model to compile";
    if (!modelIsSaved) return "Model has unsaved changes";
    return "";
  }, [isConnected, modelIsPresent, modelIsSaved, validSyntax]);

  const dataIsSaved = useMemo(() => {
    return projectData.dataFileContent === projectData.ephemera.dataFileContent;
  }, [projectData.dataFileContent, projectData.ephemera.dataFileContent]);

  if (!dataIsSaved) {
    return <div className="RunPanelPadded">Data not saved</div>;
  }

  const compileDiv = (
    <div>
      <Tooltip title={tooltip}>
        <span>
          <Button
            variant="contained"
            onClick={compile}
            disabled={tooltip != ""}
          >
            compile model
          </Button>
        </span>
      </Tooltip>
    </div>
  );

  const compilingDiv = (
    <div>
      <CircularProgress />
    </div>
  );

  return (
    <div className="RunPanel">
      <div className="RunPanelPadded">
        {compileStatus === "compiled" ? (
          <RunWithProgressPanel
            handleRun={handleRun}
            cancelRun={cancelRun}
            runStatus={runStatus}
            progress={progress}
            numChains={projectData.samplingOpts.num_chains}
            errorMessage={errorMessage}
          />
        ) : ["preparing", "compiling"].includes(compileStatus) ? (
          compilingDiv
        ) : (
          compileDiv
        )}
      </div>
    </div>
  );
};

export default RunOrCompilePanel;
