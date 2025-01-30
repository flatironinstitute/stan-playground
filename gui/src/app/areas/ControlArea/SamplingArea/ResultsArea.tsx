import type { NeedsLatestRun } from "@SpCore/StanSampler/useStanSampler";
import type { FunctionComponent } from "react";

import TabWidget from "@SpComponents/TabWidget";
import SamplerOutputArea from "./ResultsArea/SamplerOutputArea";
import AnalysisArea from "./ResultsArea/AnalysisArea";

const ResultsArea: FunctionComponent<NeedsLatestRun> = ({ latestRun }) => {
  return (
    <TabWidget labels={["Output", "Analysis Scripts"]}>
      <SamplerOutputArea latestRun={latestRun} />
      <AnalysisArea latestRun={latestRun} />
    </TabWidget>
  );
};

export default ResultsArea;
