import type { FunctionComponent } from "react";

import { NeedsSamplerState } from "@SpCore/StanSampler/SamplerTypes";
import TabWidget from "@SpComponents/TabWidget";
import SamplerOutputArea from "./ResultsArea/SamplerOutputArea";
import AnalysisArea from "./ResultsArea/AnalysisArea";

const ResultsArea: FunctionComponent<NeedsSamplerState> = ({
  samplerState,
}) => {
  return (
    <TabWidget labels={["Output", "Analysis Scripts"]}>
      {samplerState.latestRun !== undefined ? (
        <SamplerOutputArea latestRun={samplerState.latestRun} />
      ) : (
        <span />
      )}
      <AnalysisArea samplerState={samplerState} />
    </TabWidget>
  );
};

export default ResultsArea;
