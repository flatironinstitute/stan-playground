import SamplerOutputArea from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea";
import DataEditorPanel from "@SpAreas/ModelDataArea/DataEditorPanel";
import ModelEditorPanel from "@SpAreas/ModelDataArea/ModelEditorPanel";
import TabWidget from "@SpComponents/TabWidget";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import useStanSampler from "@SpCore/StanSampler/useStanSampler";
import EmbeddedBottomBar from "@SpPages/EmbeddedBottomBar";
import SettingsWindow from "@SpWindows/SettingsWindow";
import { FunctionComponent, use, useEffect } from "react";

const HomeEmbedded: FunctionComponent = () => {
  const { compiledMainJsUrl } = use(CompileContext);
  const { sampler, samplerState } = useStanSampler(compiledMainJsUrl);

  const forcedTab =
    samplerState.status === "completed" || samplerState.status === "failed"
      ? 2 // Switch to output tab (third tab)
      : undefined;

  useEffect(() => {
    document.title = "Stan Playground Embedded";
  }, []);

  return (
    <div className="HomeEmbedded">
      <div style={{ flex: 1, minHeight: 0 }}>
        <TabWidget
          labels={["Stan", "Data", "Output"]}
          forcedSelection={forcedTab}
        >
          <ModelEditorPanel />
          <DataEditorPanel />
          {samplerState.status === "failed" ? (
            <div>
              Sampling failed!
              <pre className="SamplerError">{samplerState.errorMessage}</pre>
              <span className="details">
                (see browser console for more details)
              </span>
            </div>
          ) : samplerState.latestRun ? (
            <SamplerOutputArea latestRun={samplerState.latestRun} />
          ) : (
            <div>No output available. Run sampling first.</div>
          )}
        </TabWidget>
      </div>
      <EmbeddedBottomBar sampler={sampler} samplerState={samplerState} />
      <SettingsWindow />
    </div>
  );
};

export default HomeEmbedded;
