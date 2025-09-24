import type { FunctionComponent } from "react";
import CircularProgress from "@mui/material/CircularProgress";

import { Progress } from "@SpCore/StanSampler/SamplerTypes";

type SamplingProgressCircularProps = {
  report: Progress | undefined;
  numChains: number;
  size?: number;
};

const SamplingProgressCircular: FunctionComponent<
  SamplingProgressCircularProps
> = ({ report, numChains, size = 24 }) => {
  if (!report) return null;

  const progress =
    ((report.iteration + (report.chain - 1) * report.totalIterations) /
      (report.totalIterations * numChains)) *
    100;

  return (
    <CircularProgress
      variant="determinate"
      value={progress}
      size={size}
      thickness={4}
    />
  );
};

export default SamplingProgressCircular;
