import { FunctionComponent, useCallback, use, useMemo } from "react";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";
import RunPanel from "./RunPanel";
import SamplerStatusPanel from "./SamplerStatusPanel";

type RunOrCompileProps = {
  sampler?: StanSampler;
  samplerState: SamplerState;
};

const RunOrCompilePanel: FunctionComponent<RunOrCompileProps> = ({
  sampler,
  samplerState,
}) => {
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
          <>
            <RunPanel
              handleRun={handleRun}
              cancelRun={cancelRun}
              runStatus={samplerState.status}
            />
            <hr />
            <SamplerStatusPanel
              samplerState={samplerState}
              numChains={projectData.samplingOpts.num_chains}
            />
          </>
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
