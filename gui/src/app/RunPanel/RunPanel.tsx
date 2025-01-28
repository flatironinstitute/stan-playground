import { FunctionComponent, useCallback, use, useMemo } from "react";

import Button from "@mui/material/Button";
import { CompileContext } from "@SpCompilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { SamplingOpts } from "@SpCore/ProjectDataModel";
import StanSampler from "@SpStanSampler/StanSampler";
import { StanRun } from "@SpStanSampler/useStanSampler";
import CompiledRunPanel from "./CompiledRunPanel";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

type RunPanelProps = {
  sampler?: StanSampler;
  latestRun: StanRun;
  samplingOpts: SamplingOpts;
};

const RunPanel: FunctionComponent<RunPanelProps> = ({
  sampler,
  latestRun,
  samplingOpts,
}) => {
  const { status: runStatus, errorMessage, progress } = latestRun;
  const { data: projectData } = use(ProjectContext);

  const handleRun = useCallback(async () => {
    if (!sampler) return;
    sampler.sample(projectData.dataFileContent, samplingOpts);
  }, [sampler, projectData.dataFileContent, samplingOpts]);

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
          <CompiledRunPanel
            handleRun={handleRun}
            cancelRun={cancelRun}
            runStatus={runStatus}
            progress={progress}
            samplingOpts={samplingOpts}
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

export default RunPanel;
