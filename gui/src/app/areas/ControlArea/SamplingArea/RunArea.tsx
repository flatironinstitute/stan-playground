import { FunctionComponent, use, useCallback } from "react";
import type { StanRun } from "@SpCore/StanSampler/useStanSampler";

import Grid from "@mui/material/Grid2";
import RunOrCompilePanel from "@SpAreas/ControlArea/SamplingArea/RunArea/RunOrCompilePanel";
import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import StanSampler from "@SpCore/StanSampler/StanSampler";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";

import SamplingOptsPanel from "./RunArea/SamplingOptsPanel";

type RunAreaProps = {
  sampler: StanSampler | undefined;
  latestRun: StanRun;
};
const RunArea: FunctionComponent<RunAreaProps> = ({ sampler, latestRun }) => {
  const { data, update } = use(ProjectContext);

  const setSamplingOpts = useCallback(
    (opts: SamplingOpts) => {
      update({ type: "setSamplingOpts", opts });
    },
    [update],
  );

  const isSampling = latestRun.status === "sampling";

  return (
    <Grid container>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SamplingOptsPanel
          samplingOpts={data.samplingOpts}
          setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <RunOrCompilePanel sampler={sampler} latestRun={latestRun} />
      </Grid>
    </Grid>
  );
};

export default RunArea;
