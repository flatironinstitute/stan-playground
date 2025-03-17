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
  if (!latestRun.runResult || !latestRun.samplingOpts) return <span />;
  // this is only written this way due to the prohibition on conditional hooks
  return <SamplerOutputExistsArea latestRun={latestRun} />;
};

const SamplerOutputExistsArea: FunctionComponent<NeedsLatestRun> = ({
  latestRun,
}) => {
  // note, these are guaranteed to exist by the above check
  const samplingOpts = latestRun.samplingOpts!;
  const { draws, paramNames, computeTimeSec, consoleText } =
    latestRun.runResult!;

  const prettyParamNames = useMemo(
    () => paramNames.map(prettifyStanParamName),
    [paramNames],
  );

  // compute a useful re-shaping of the draws which is more convenient for
  // most of the downstream components
  const variables = useMemo(
    () =>
      prettyParamNames.map((name, index) => ({
        name,
        // split the draws into separate chains
        draws: [...new Array(samplingOpts.num_chains)].map((_, chain) =>
          draws[index].filter(
            (_, i) =>
              Math.floor((i / draws[0].length) * samplingOpts.num_chains) ===
              chain,
          ),
        ),
      })),
    [draws, prettyParamNames, samplingOpts.num_chains],
  );

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
      <HistogramsPanel draws={draws} paramNames={prettyParamNames} />
      <ScatterPlotsPanel variables={variables} />
      <TracePlotsPanel variables={variables} />
      <ConsolePanel text={consoleText} />
    </TabWidget>
  );
};

export default SamplerOutputArea;
