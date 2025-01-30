import TabWidget from "@SpComponents/TabWidget";
import { FunctionComponent } from "react";
import AnalysisPyPanel from "./AnalysisArea/AnalysisPyPanel";
import AnalysisRPanel from "./AnalysisArea/AnalysisRPanel";
import { NeedsLatestRun } from "@SpCore/StanSampler/useStanSampler";

const AnalysisArea: FunctionComponent<NeedsLatestRun> = ({ latestRun }) => {
  return (
    <TabWidget labels={["Python", "R"]}>
      <AnalysisPyPanel latestRun={latestRun} />
      <AnalysisRPanel latestRun={latestRun} />
    </TabWidget>
  );
};

export default AnalysisArea;
