import { FunctionComponent, useCallback, useContext, useMemo } from "react";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import RunPanel from "@SpComponents/RunPanel";
import SamplerOutputView from "@SpComponents/SamplerOutputView";
import SamplingOptsPanel from "@SpComponents/SamplingOptsPanel";
import TabWidget from "@SpComponents/TabWidget";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import {
  modelHasUnsavedDataFileChanges,
  SamplingOpts,
} from "@SpCore/ProjectDataModel";
import AnalysisPyWindow from "@SpScripting/Analysis/AnalysisPyWindow";
import useStanSampler, { StanRun } from "@SpStanSampler/useStanSampler";
import AnalysisRWindow from "@SpScripting/Analysis/AnalysisRWindow";
import { CompileContext } from "@SpCompilation/CompileContext";

type SamplingWindowProps = {
  // none
};

const SamplingWindow: FunctionComponent<SamplingWindowProps> = () => {
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

  const { compiledMainJsUrl } = useContext(CompileContext);

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
    <TabWidget labels={["Output", "Analysis Scripts"]}>
      <SamplerOutputView latestRun={latestRun} />
      <TabWidget labels={["Python", "R"]}>
        <AnalysisPyWindow latestRun={latestRun} />
        <AnalysisRWindow latestRun={latestRun} />
      </TabWidget>
    </TabWidget>
  );
};

export default SamplingWindow;
