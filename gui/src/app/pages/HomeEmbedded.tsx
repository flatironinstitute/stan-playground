import SamplerOutputArea from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea";
import SamplerStatusPanel from "@SpAreas/ControlArea/SamplingArea/RunArea/SamplerStatusPanel";
import EmbeddedBottomBar from "@SpAreas/EmbeddedBottomBar";
import DataEditorPanel from "@SpAreas/ModelDataArea/DataEditorPanel";
import ModelEditorPanel from "@SpAreas/ModelDataArea/ModelEditorPanel";
import TabWidget from "@SpComponents/TabWidget";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import useStanSampler from "@SpCore/StanSampler/useStanSampler";
import { FunctionComponent, use, useEffect, useMemo, useState } from "react";

const HomeEmbedded: FunctionComponent = () => {
  const { compiledMainJsUrl } = use(CompileContext);
  const { sampler, samplerState } = useStanSampler(compiledMainJsUrl);
  const [currentTab, setCurrentTab] = useState<number | undefined>(undefined);
  const { data: projectData } = use(ProjectContext);

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

  const outputLabel = useMemo(() => {
    if (samplerState.status === "sampling") {
      return "Output...";
    }
    return "Output";
  }, [samplerState.status]);

  return (
    <div className="HomeEmbedded">
      <div style={{ flex: 1, minHeight: 0 }}>
        <TabWidget
          labels={["Stan", "Data", outputLabel]}
          forcedSelection={currentTab}
        >
          <ModelEditorPanel />
          <DataEditorPanel />
          {samplerState.latestRun ? (
            <SamplerOutputArea latestRun={samplerState.latestRun} />
          ) : (
            <SamplerStatusPanel
              samplerState={samplerState}
              numChains={projectData.samplingOpts.num_chains}
            />
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
