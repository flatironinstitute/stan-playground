import { FunctionComponent, useMemo } from "react";

import TabWidget from "@SpComponents/TabWidget";
import { NeedsLatestRun } from "@SpCore/StanSampler/useStanSampler";

import SummaryPanel from "./SamplerOutputArea/SummaryPanel";
import DrawsTablePanel from "./SamplerOutputArea/DrawsTablePanel";
import HistogramsPanel from "./SamplerOutputArea/HistogramsPanel";
import TracePlotsPanel from "./SamplerOutputArea/TracePlotsPanel";
import ConsolePanel from "./SamplerOutputArea/ConsolePanel";
import ScatterPlotsPanel from "./SamplerOutputArea/ScatterPlotsPanel";
import prettifyStanParamName from "@SpUtil/prettifyStanParamName";

export type StanDraw = {
  name: string;
  // draws is [draw][chain]
  draws: number[][];
};

const SamplerOutputArea: FunctionComponent<NeedsLatestRun> = ({
  latestRun,
}) => {
  // compute a useful re-shaping of the draws which is more convenient for
  // most of the downstream components
  const variables = useMemo(() => {
    if (!latestRun.runResult || !latestRun.samplingOpts) return [];

    const numChains = latestRun.samplingOpts.num_chains;
    const draws = latestRun.runResult.draws;

    return latestRun.runResult.paramNames.map((name, index) => ({
      name: prettifyStanParamName(name),
      // split the draws into separate chains
      draws: [...new Array(numChains)].map((_, chain) => {
        return draws[index].filter(
          (_, i) => Math.floor((i / draws[0].length) * numChains) === chain,
        );
      }),
    }));
  }, [latestRun.runResult, latestRun.samplingOpts]);

  // don't render anything if we don't have a result yet
  if (!latestRun.runResult || !latestRun.samplingOpts) return <span />;

  const samplingOpts = latestRun.samplingOpts;
  const { draws, paramNames, computeTimeSec, consoleText } =
    latestRun.runResult;

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
      <SummaryPanel variables={variables} computeTimeSec={computeTimeSec} />
      <DrawsTablePanel
        draws={draws}
        paramNames={paramNames}
        samplingOpts={samplingOpts}
      />
      <HistogramsPanel variables={variables} />
      <ScatterPlotsPanel variables={variables} />
      <TracePlotsPanel variables={variables} />
      <ConsolePanel text={consoleText} />
    </TabWidget>
  );
};

export default SamplerOutputArea;
