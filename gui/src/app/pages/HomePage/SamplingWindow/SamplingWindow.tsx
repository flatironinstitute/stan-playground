import { FunctionComponent, useCallback, useContext } from "react";

import { Split } from "@geoffcox/react-splitter";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { CompileContext } from "app/Compile/CompileContextProvider";
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
import AnalysisRWindow from "@SpScripting/Analysis/AnalysisRWindow";
import useStanSampler, { StanRun } from "@SpStanSampler/useStanSampler";

type SamplingWindowProps = {
  // none
};

const SamplingWindow: FunctionComponent<SamplingWindowProps> = () => {
  const { data, update } = useContext(ProjectContext);

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
    <Split horizontal initialPrimarySize="30%" minSecondarySize="10%">
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
            data={data.dataFileContent}
            dataIsSaved={!modelHasUnsavedDataFileChanges(data)}
            samplingOpts={data.samplingOpts}
          />
        </Grid>
      </Grid>
      <Box height="100%" display="flex" flexDirection="column">
        <Box flex="1" overflow="hidden">
          <SamplingResultsArea latestRun={latestRun} />
        </Box>
      </Box>
    </Split>
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
