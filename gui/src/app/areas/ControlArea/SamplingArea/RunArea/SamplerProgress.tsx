import type { FunctionComponent } from "react";

import LinearProgressWithLabel from "@SpComponents/LinearProgressWithLabel";
import { Progress } from "@SpCore/StanSampler/SamplerTypes";

type SamplingProgressComponentProps = {
  report: Progress | undefined;
  numChains: number;
};

const SamplingProgressComponent: FunctionComponent<
  SamplingProgressComponentProps
> = ({ report, numChains }) => {
  if (!report) return <span />;
  const progress =
    ((report.iteration + (report.chain - 1) * report.totalIterations) /
      (report.totalIterations * numChains)) *
    100;
  return (
    <>
      Sampling
      <div className="SamplingProgress">
        <LinearProgressWithLabel value={progress} />
      </div>
      <div>
        Chain {report.chain} Iteration: {report.iteration} /{" "}
        {report.totalIterations} ({report.warmup ? "Warmup" : "Sampling"})
      </div>
    </>
  );
};

export default SamplingProgressComponent;
