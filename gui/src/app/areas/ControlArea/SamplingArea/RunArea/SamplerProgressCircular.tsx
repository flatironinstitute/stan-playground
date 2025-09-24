import type { FunctionComponent } from "react";

import FilledCircularProgress from "@SpComponents/FilledCircularProgress";
import { Progress } from "@SpCore/StanSampler/SamplerTypes";

type SamplingProgressCircularProps = {
  report: Progress | undefined;
  numChains: number;
  size?: number;
};

const SamplingProgressCircular: FunctionComponent<
  SamplingProgressCircularProps
> = ({ report, numChains, size = 24 }) => {
  // This differs from the other progress report in that we still want it to render before starting
  const progress = !report
    ? 0
    : ((report.iteration + (report.chain - 1) * report.totalIterations) /
        (report.totalIterations * numChains)) *
      100;

  return (
    <FilledCircularProgress
      variant="determinate"
      value={progress}
      size={size}
      thickness={4}
    />
  );
};

export default SamplingProgressCircular;
