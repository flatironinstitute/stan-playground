import { FunctionComponent, useCallback, useContext, useMemo } from "react";
import { ProjectContext } from "../../../Project/ProjectContextProvider";
import {
  SamplingOpts,
  modelHasUnsavedDataFileChanges,
} from "../../../Project/ProjectDataModel";
import RunPanel from "../../../RunPanel/RunPanel";
import SamplerOutputView from "../../../SamplerOutputView/SamplerOutputView";
import SamplingOptsPanel from "../../../SamplingOptsPanel/SamplingOptsPanel";
import useStanSampler, { StanRun } from "../../../StanSampler/useStanSampler";
import AnalysisPyWindow from "../AnalysisPyWindow/AnalysisPyWindow";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import TabWidget from "@SpComponents/TabWidget";

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
        <SamplingResultsArea latestRun={latestRun} />
      </Box>
    </Box>
  );
};

type SamplingResultsAreaProps = {
  latestRun: StanRun;
};

const SamplingResultsArea: FunctionComponent<SamplingResultsAreaProps> = ({
  latestRun,
}) => {
  return (
    <TabWidget labels={["Output", "Analysis (Py)", "Analysis (R)"]}>
      <SamplerOutputView latestRun={latestRun} />

      <AnalysisPyWindow latestRun={latestRun} />
      <div>
        <div style={{ padding: 5 }}>R analysis not yet implemented</div>
      </div>
    </TabWidget>
  );
};

export default SamplingWindow;
