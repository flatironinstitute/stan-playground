import { FunctionComponent, useMemo } from "react";

import DrawsTablePanel from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea/DrawsTablePanel";
import HistogramsPanel from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea/HistogramsPanel";
import SummaryPanel from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea/SummaryPanel";
import TabWidget from "@SpComponents/TabWidget";
import TracePlotsPanel from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea/TracePlotsPanel";
import ConsolePanel from "@SpAreas/ControlArea/SamplingArea/ResultsArea/SamplerOutputArea/ConsolePanel";
import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import { NeedsLatestRun } from "@SpCore/StanSampler/useStanSampler";

const SamplerOutputArea: FunctionComponent<NeedsLatestRun> = ({
  latestRun,
}) => {
  // handle case where there is no latest run yet
  if (!latestRun.runResult || !latestRun.samplingOpts) return <span />;

  const {
    samplingOpts,
    runResult: { draws, paramNames, computeTimeSec, consoleText },
  } = latestRun;

  return (
    <SamplerOutputInnerArea
      draws={draws}
      paramNames={paramNames}
      computeTimeSec={computeTimeSec}
      samplingOpts={samplingOpts}
      consoleText={consoleText}
    />
  );
};

type InnerProps = {
  draws: number[][];
  paramNames: string[];
  computeTimeSec: number | undefined;
  samplingOpts: SamplingOpts;
  consoleText: string;
};

const SamplerOutputInnerArea: FunctionComponent<InnerProps> = ({
  draws,
  paramNames,
  computeTimeSec,
  samplingOpts,
  consoleText,
}) => {
  const numChains = samplingOpts.num_chains;

  const drawChainIds = useMemo(() => {
    return [...new Array(draws[0].length).keys()].map(
      (i) => 1 + Math.floor((i / draws[0].length) * numChains),
    );
  }, [draws, numChains]);

  const drawNumbers: number[] = useMemo(() => {
    const numDrawsPerChain = Math.floor(draws[0].length / numChains);
    return [...new Array(draws[0].length).keys()].map(
      (i) => 1 + (i % numDrawsPerChain),
    );
  }, [draws, numChains]);

  return (
    <TabWidget
      labels={["Summary", "Draws", "Histograms", "Trace plots", "Console"]}
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
