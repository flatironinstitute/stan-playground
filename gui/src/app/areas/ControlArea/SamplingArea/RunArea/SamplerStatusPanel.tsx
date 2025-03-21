import { FunctionComponent } from "react";

import SamplingProgressComponent from "./SamplerProgress";
import type { SamplerState } from "@SpCore/StanSampler/SamplerTypes";
import Loading from "@SpComponents/Loading";

type StatusProps = {
  samplerState: SamplerState;
  numChains: number;
};
const SamplerStatusPanel: FunctionComponent<StatusProps> = ({
  samplerState,
  numChains,
}) => {
  const { status: runStatus, progress, errorMessage, latestRun } = samplerState;

  switch (runStatus) {
    case "loading":
      return <Loading name="compiled Stan model" />;
    case "sampling":
      return (
        <SamplingProgressComponent report={progress} numChains={numChains} />
      );
    case "completed":
      return (
        <span>
          Sampling completed in{" "}
          {(latestRun?.computeTimeSec ?? 0).toPrecision(2)} seconds!
        </span>
      );
    case "failed":
      return (
        <div>
          Sampling failed!
          <pre className="SamplerError">{errorMessage}</pre>
          <span className="details">
            (see browser console for more details)
          </span>
        </div>
      );

    default:
      return <></>;
  }
};

export default SamplerStatusPanel;
