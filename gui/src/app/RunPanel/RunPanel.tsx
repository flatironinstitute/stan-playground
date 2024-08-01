/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, useCallback, useContext } from "react";

import Button from "@mui/material/Button";
import { CompileContext } from "@SpCompileContext/CompileContext";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import {
  ProjectDataModel,
  SamplingOpts,
  modelHasUnsavedChanges,
} from "@SpCore/ProjectDataModel";
import StanSampler from "@SpStanSampler/StanSampler";
import { StanRun } from "@SpStanSampler/useStanSampler";
import CompiledRunPanel from "./CompiledRunPanel";

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

  const { compile, compileMessage, compileStatus, validSyntax } =
    useContext(CompileContext);

  const { data: projectData } = useContext(ProjectContext);

  if (!dataIsSaved) {
    return <div className="RunPanelPadded">Data not saved</div>;
  }

  const compileDiv = (
    <div>
      <Button
        variant="contained"
        onClick={compile}
        disabled={isCompileModelDisabled(projectData, validSyntax)}
      >
        compile model
      </Button>
    </div>
  );

  const compilingDiv = <div>{compileMessage}</div>;

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

const isCompileModelDisabled = (
  projectData: ProjectDataModel,
  validSyntax: boolean,
) => {
  if (!validSyntax) return true;
  if (!projectData.stanFileContent.trim()) return true;
  if (modelHasUnsavedChanges(projectData)) return true;
  return false;
};

export default RunPanel;
