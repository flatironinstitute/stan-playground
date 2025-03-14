import { FunctionComponent, useMemo } from "react";

import TabWidget from "@SpComponents/TabWidget";
import { NeedsLatestRun } from "@SpCore/StanSampler/useStanSampler";

import SummaryPanel from "./SamplerOutputArea/SummaryPanel";
import DrawsTablePanel from "./SamplerOutputArea/DrawsTablePanel";
import HistogramsPanel from "./SamplerOutputArea/HistogramsPanel";
import TracePlotsPanel from "./SamplerOutputArea/TracePlotsPanel";
import ConsolePanel from "./SamplerOutputArea/ConsolePanel";
import ScatterPlotsPanel from "./SamplerOutputArea/ScatterPlotsPanel";

const SamplerOutputArea: FunctionComponent<NeedsLatestRun> = ({
  latestRun,
}) => {
  const drawChainIds = useMemo(() => {
    if (!latestRun.runResult || !latestRun.samplingOpts) return [];
    const numChains = latestRun.samplingOpts.num_chains;
    const draws = latestRun.runResult.draws;
    return [...new Array(draws[0].length).keys()].map(
      (i) => 1 + Math.floor((i / draws[0].length) * numChains),
    );
  }, [latestRun.runResult, latestRun.samplingOpts]);

  const drawNumbers: number[] = useMemo(() => {
    if (!latestRun.runResult || !latestRun.samplingOpts) return [];
    const numChains = latestRun.samplingOpts.num_chains;
    const draws = latestRun.runResult.draws;
    const numDrawsPerChain = Math.floor(draws[0].length / numChains);
    return [...new Array(draws[0].length).keys()].map(
      (i) => 1 + (i % numDrawsPerChain),
    );
  }, [latestRun.runResult, latestRun.samplingOpts]);

  // handle case where there is no latest run yet
  if (!latestRun.runResult || !latestRun.samplingOpts) return <span />;

  const {
    samplingOpts,
    runResult: { draws, paramNames, computeTimeSec, consoleText },
  } = latestRun;

  return (
    <TabWidget
      labels={[
        "Summary",
        "Draws",
        "Histograms",
        "Scatter plots",
        "Trace plots",
        "Console",
      ]}
    >
      <SummaryPanel
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
        computeTimeSec={computeTimeSec}
      />
      <DrawsTablePanel
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
        drawNumbers={drawNumbers}
        samplingOpts={samplingOpts}
      />
      <HistogramsPanel
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
      <ScatterPlotsPanel
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
      <TracePlotsPanel
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
      <ConsolePanel text={consoleText} />
    </TabWidget>
  );
};

export default SamplerOutputArea;
