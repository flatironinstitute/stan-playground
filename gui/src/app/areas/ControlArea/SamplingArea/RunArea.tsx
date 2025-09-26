import { FunctionComponent, use, useCallback } from "react";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";

import Grid from "@mui/material/Grid2";
import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";

import SamplingOptsPanel from "./RunArea/SamplingOptsPanel";
import RunOrCompilePanel from "./RunArea/RunOrCompilePanel";

const OPTIONS = {
  num_chains: { min: 1, max: 8 },
  num_warmup: { min: 0 },
  num_samples: { min: 1 },
  init_radius: { min: 0 },
  seed: { min: 0 },
};

type RunAreaProps = {
  sampler: StanSampler | undefined;
  samplerState: SamplerState;
};
const RunArea: FunctionComponent<RunAreaProps> = ({
  sampler,
  samplerState,
}) => {
  const { data, update } = use(ProjectContext);

  const setSamplingOpts = useCallback(
    (opts: SamplingOpts) => {
      update({ type: "setSamplingOpts", opts });
    },
    [update],
  );

  const isSampling = samplerState.status === "sampling";

  return (
    <Grid container>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <div className="SamplingOptsWrapper">
          <SamplingOptsPanel
            samplingOpts={data.samplingOpts}
            setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
            options={OPTIONS}
          />
        </div>
      </Grid>
      <Grid size={{ xs: 8, md: 4 }}>
        <RunOrCompilePanel sampler={sampler} samplerState={samplerState} />
      </Grid>
    </Grid>
  );
};

export default RunArea;
