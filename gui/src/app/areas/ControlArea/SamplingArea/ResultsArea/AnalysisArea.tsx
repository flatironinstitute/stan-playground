import TabWidget from "@SpComponents/TabWidget";
import { FunctionComponent } from "react";
import AnalysisPyPanel from "./AnalysisArea/AnalysisPyPanel";
import AnalysisRPanel from "./AnalysisArea/AnalysisRPanel";
import { NeedsSamplerState } from "@SpCore/StanSampler/SamplerTypes";

const AnalysisArea: FunctionComponent<NeedsSamplerState> = ({
  samplerState,
}) => {
  return (
    <TabWidget labels={["Python", "R"]}>
      <AnalysisPyPanel samplerState={samplerState} />
      <AnalysisRPanel samplerState={samplerState} />
    </TabWidget>
  );
};

export default AnalysisArea;
