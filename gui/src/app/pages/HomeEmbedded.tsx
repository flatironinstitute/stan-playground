import SamplerOutputArea from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea";
import CompileOrRunCompact from "@SpAreas/ControlArea/SamplingArea/RunArea/CompileOrRunCompact";
import DataEditorPanel from "@SpAreas/ModelDataArea/DataEditorPanel";
import ModelEditorPanel from "@SpAreas/ModelDataArea/ModelEditorPanel";
import TabWidget from "@SpComponents/TabWidget";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import useStanSampler from "@SpCore/StanSampler/useStanSampler";
import { FunctionComponent, use, useEffect, useState } from "react";

const HomeEmbedded: FunctionComponent = () => {
  // const { data } = use(ProjectContext);
  const { compiledMainJsUrl } = use(CompileContext);
  const { sampler, samplerState } = useStanSampler(compiledMainJsUrl);
  const [currentTab, setCurrentTab] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (samplerState.status === "completed") {
      setCurrentTab(2); // Switch to output tab (third tab)
    } else {
      setCurrentTab(undefined);
    }
  }, [samplerState.status]);

  useEffect(() => {
    document.title = "Stan Playground Embedded";
  }, []);

  return (
    <div
      style={{
        margin: "0 auto",
        maxWidth: "1000px",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <TabWidget
          labels={["Stan", "Data", "Output"]}
          forcedSelection={currentTab}
        >
          <ModelEditorPanel />
          <DataEditorPanel />
          {samplerState.latestRun ? (
            <SamplerOutputArea latestRun={samplerState.latestRun} />
          ) : (
            <div>Run the sampler to see output.</div>
          )}
        </TabWidget>
      </div>
      <div style={{ height: "110px", width: "100%", maxWidth: "1000px" }}>
        <CompileOrRunCompact sampler={sampler} samplerState={samplerState} />
      </div>
    </div>
  );
};

export default HomeEmbedded;
