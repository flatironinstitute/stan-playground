import { FunctionComponent, useMemo } from "react";

import TabWidget from "@SpComponents/TabWidget";
import { StanRun } from "@SpCore/StanSampler/SamplerTypes";

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

const SamplerOutputArea: FunctionComponent<{ latestRun: StanRun }> = ({
  latestRun,
}) => {
  const { draws, paramNames, computeTimeSec, consoleText, sampleConfig } =
    latestRun;

  // compute a useful re-shaping of the draws which is more convenient for
  // most of the downstream components
  const variables = useMemo(() => {
    const numChains = sampleConfig.num_chains;

    return paramNames.map((name, index) => ({
      name: prettifyStanParamName(name),
      // split the draws into separate chains
      draws: [...new Array(numChains)].map((_, chain) => {
        return draws[index].filter(
          (_, i) => Math.floor((i / draws[0].length) * numChains) === chain,
        );
      }),
    }));
  }, [draws, paramNames, sampleConfig.num_chains]);

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
        sampleConfig={sampleConfig}
      />
      <HistogramsPanel variables={variables} />
      <ScatterPlotsPanel variables={variables} />
      <TracePlotsPanel variables={variables} />
      <ConsolePanel text={consoleText} />
    </TabWidget>
  );
};

export default SamplerOutputArea;
