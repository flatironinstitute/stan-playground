/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useContext, useMemo } from "react";

import Button from "@mui/material/Button";
import { CompileContext } from "@SpCompilation/CompileContext";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { SamplingOpts, modelHasUnsavedChanges } from "@SpCore/ProjectDataModel";
import StanSampler from "@SpStanSampler/StanSampler";
import { StanRun } from "@SpStanSampler/useStanSampler";
import CompiledRunPanel from "./CompiledRunPanel";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

type RunPanelProps = {
  sampler?: StanSampler;
  latestRun: StanRun;
  data: any | undefined;
  dataIsSaved: boolean;
  samplingOpts: SamplingOpts;
};

const RunPanel: FunctionComponent<RunPanelProps> = ({
  sampler,
  latestRun,
  data,
  dataIsSaved,
  samplingOpts,
}) => {
  const { status: runStatus, errorMessage, progress } = latestRun;

  const handleRun = useCallback(async () => {
    if (!sampler) return;
    sampler.sample(data, samplingOpts);
  }, [sampler, data, samplingOpts]);

  const cancelRun = useCallback(() => {
    if (!sampler) return;
    sampler.cancel();
  }, [sampler]);

  const { compile, compileStatus, validSyntax, isConnected } =
    useContext(CompileContext);

  const { data: projectData } = useContext(ProjectContext);

  const tooltip = useMemo(() => {
    if (!validSyntax) return "Syntax error";
    if (!isConnected) return "Not connected to compilation server";
    if (!projectData.stanFileContent.trim()) return "No model to compile";
    if (modelHasUnsavedChanges(projectData)) return "Model has unsaved changes";
    return "";
  }, [isConnected, projectData, validSyntax]);

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
