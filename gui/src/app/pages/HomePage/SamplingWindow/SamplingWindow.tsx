import {
    FunctionComponent,
    useCallback,
    useContext,
    useMemo
} from "react";
import {
    ProjectContext,
} from "../../../Project/ProjectContextProvider";
import {
    modelHasUnsavedDataFileChanges
} from "../../../Project/ProjectDataModel";
import RunPanel from "../../../RunPanel/RunPanel";
import { SamplingOpts } from "../../../StanSampler/StanSampler";
import useStanSampler, {
    useSamplerStatus,
} from "../../../StanSampler/useStanSampler";
import SamplerOutputView from "../../../SamplerOutputView/SamplerOutputView";
import SamplingOptsPanel from "../../../SamplingOptsPanel/SamplingOptsPanel";

type SamplingWindowProps = {
  width: number;
  height: number;
  compiledMainJsUrl?: string;
};

const SamplingWindow: FunctionComponent<SamplingWindowProps> = ({
  width,
  height,
  compiledMainJsUrl,
}) => {
  const { data, update } = useContext(ProjectContext);
  const parsedData = useMemo(() => {
    try {
      return JSON.parse(data.dataFileContent);
    } catch (e) {
      return undefined;
    }
  }, [data.dataFileContent]);
  const samplingOptsPanelHeight = 160;
  const samplingOptsPanelWidth = Math.min(180, width / 2);

  const setSamplingOpts = useCallback(
    (opts: SamplingOpts) => {
      update({ type: "setSamplingOpts", opts });
    },
    [update],
  );

  const { sampler } = useStanSampler(compiledMainJsUrl);
  const { status: samplerStatus } = useSamplerStatus(sampler);
  const isSampling = samplerStatus === "sampling";
  return (
    <div style={{ position: "absolute", width, height }}>
      <div
        style={{
          position: "absolute",
          width: samplingOptsPanelWidth,
          height: samplingOptsPanelHeight,
        }}
      >
        <SamplingOptsPanel
          samplingOpts={data.samplingOpts}
          setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: samplingOptsPanelWidth,
          width: width - samplingOptsPanelWidth,
          top: 0,
          height: samplingOptsPanelHeight,
        }}
      >
        <RunPanel
          width={width}
          height={samplingOptsPanelHeight}
          sampler={sampler}
          data={parsedData}
          dataIsSaved={!modelHasUnsavedDataFileChanges(data)}
          samplingOpts={data.samplingOpts}
        />
      </div>
      <div
        style={{
          position: "absolute",
          width,
          top: samplingOptsPanelHeight,
          height: height - samplingOptsPanelHeight,
        }}
      >
        {sampler && (
          <SamplerOutputView
            width={width}
            height={height - samplingOptsPanelHeight}
            sampler={sampler}
          />
        )}
      </div>
    </div>
  );
};

export default SamplingWindow;
