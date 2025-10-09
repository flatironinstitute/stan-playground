import { FunctionComponent, use, useCallback } from "react";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";

import Grid from "@mui/material/Grid2";
import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";

import SamplingOptsPanel from "./RunArea/SamplingOptsPanel";
import RunOrCompilePanel from "./RunArea/RunOrCompilePanel";

const SAMPLING_CONFIG = {
  num_chains: { min: 1, max: 8, type: "int" },
  num_warmup: { min: 0, type: "int" },
  num_samples: { min: 1, type: "int" },
  init_radius: { min: 0, type: "float" },
  seed: { min: 0, type: "intOrUndefined" },
} as const;

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
    // reverse and flex-end mean that the buttons are on the top when stacked
    <Grid container direction="row-reverse" justifyContent="flex-end">
      <Grid size={{ xs: 12, md: 9 }}>
        <RunOrCompilePanel sampler={sampler} samplerState={samplerState} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <div className="SamplingOptsWrapper">
          <SamplingOptsPanel
            samplingOpts={data.samplingOpts}
            setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
            config={SAMPLING_CONFIG}
          />
        </div>
      </Grid>
    </Grid>
  );
};

export default RunArea;
