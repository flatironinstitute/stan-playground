import {
  FunctionComponent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import {
  SamplingOpts,
  modelHasUnsavedDataFileChanges,
} from "../../../Project/ProjectDataModel";
import RunPanel from "../../../RunPanel/RunPanel";
import SamplerOutputView from "../../../SamplerOutputView/SamplerOutputView";
import SamplingOptsPanel from "../../../SamplingOptsPanel/SamplingOptsPanel";
import StanSampler from "../../../StanSampler/StanSampler";
import useStanSampler from "../../../StanSampler/useStanSampler";
import AnalysisPyWindow from "../AnalysisPyWindow/AnalysisPyWindow";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

type SamplingWindowProps = {
  compiledMainJsUrl?: string;
};

const SamplingWindow: FunctionComponent<SamplingWindowProps> = ({
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

  const setSamplingOpts = useCallback(
    (opts: SamplingOpts) => {
      update({ type: "setSamplingOpts", opts });
    },
    [update],
  );

  const { sampler, latestRun } = useStanSampler(compiledMainJsUrl);
  const isSampling = latestRun.status === "sampling";
  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Grid container>
        <Grid item xs={12} sm={4}>
          <SamplingOptsPanel
            samplingOpts={data.samplingOpts}
            setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
          />
        </Grid>
        <Grid item xs={12} sm>
          <RunPanel
            sampler={sampler}
            latestRun={latestRun}
            data={parsedData}
            dataIsSaved={!modelHasUnsavedDataFileChanges(data)}
            samplingOpts={data.samplingOpts}
          />
        </Grid>
      </Grid>
      <Divider />
      <Box flex="1" overflow="hidden">
        <SamplerOutputView latestRun={latestRun} />
      </Box>
    </Box>
  );
};

const samplingResultsTabs = [
  {
    id: "output",
    label: "Output",
    title: "View the output of the sampler",
    closeable: false,
  },
  {
    id: "analysis.py",
    label: "Analysis (Py)",
    title: "Python analysis",
    closeable: false,
  },
  {
    id: "analysis.r",
    label: "Analysis (R)",
    title: "R analysis",
    closeable: false,
  },
];

type SamplingResultsAreaProps = {
  width: number;
  height: number;
  sampler: StanSampler | undefined;
};

const SamplingResultsArea: FunctionComponent<SamplingResultsAreaProps> = ({
  width,
  height,
  sampler,
}) => {
  const [currentTabId, setCurrentTabId] = useState("output");
  return (
    <TabWidget
      width={width}
      height={height}
      tabs={samplingResultsTabs}
      currentTabId={currentTabId}
      setCurrentTabId={setCurrentTabId}
    >
      <SamplerOutputView width={width} height={height} sampler={sampler} />
      <AnalysisPyWindow
        width={width}
        height={height}
        stanSampler={sampler || null}
      />
      <div>
        <div style={{ padding: 5 }}>R analysis not yet implemented</div>
      </div>
    </TabWidget>
  );
};

export default SamplingWindow;
