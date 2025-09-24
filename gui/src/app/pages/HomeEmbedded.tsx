import SamplerOutputArea from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea";
import DataEditorPanel from "@SpAreas/ModelDataArea/DataEditorPanel";
import ModelEditorPanel from "@SpAreas/ModelDataArea/ModelEditorPanel";
import TabWidget from "@SpComponents/TabWidget";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import useStanSampler from "@SpCore/StanSampler/useStanSampler";
import EmbeddedBottomBar from "@SpPages/EmbeddedBottomBar";
import { FunctionComponent, use, useEffect, useState } from "react";

const HomeEmbedded: FunctionComponent = () => {
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
    <div className="HomeEmbedded">
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
            <div>No output available. Run sampling first.</div>
          )}
        </TabWidget>
      </div>
      <div className="EmbeddedBottomBarContainer">
        <EmbeddedBottomBar sampler={sampler} samplerState={samplerState} />
      </div>
    </div>
  );
};

export default HomeEmbedded;
