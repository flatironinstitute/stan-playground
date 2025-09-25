import { FunctionComponent, useCallback, use, useMemo } from "react";

import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";
import RunPanel from "./RunPanel";
import SamplerStatusPanel from "./SamplerStatusPanel";
import CompileButton from "./CompileButton";

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

  const { compileStatus } = use(CompileContext);

  const dataIsSaved = useMemo(() => {
    return projectData.dataFileContent === projectData.ephemera.dataFileContent;
  }, [projectData.dataFileContent, projectData.ephemera.dataFileContent]);

  if (!dataIsSaved) {
    return <div className="RunPanelPadded">Data not saved</div>;
  }

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
        ) : (
          <CompileButton />
        )}
      </div>
    </div>
  );
};

export default RunOrCompilePanel;
