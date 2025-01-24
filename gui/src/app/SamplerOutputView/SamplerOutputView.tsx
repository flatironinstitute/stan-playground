import { FunctionComponent, useMemo } from "react";

import DrawsView from "@SpComponents/DrawsView";
import HistsView from "@SpComponents/HistsView";
import SummaryView from "@SpComponents/SummaryView";
import TabWidget from "@SpComponents/TabWidget";
import TracePlotsView from "@SpComponents/TracePlotsView";
import ConsoleOutput from "@SpComponents/ConsoleOutput";
import { SamplingOpts } from "@SpCore/ProjectDataModel";
import { StanRun } from "@SpStanSampler/useStanSampler";

type SamplerOutputViewProps = {
  latestRun: StanRun;
};

const SamplerOutputView: FunctionComponent<SamplerOutputViewProps> = ({
  latestRun,
}) => {
  if (!latestRun.runResult || !latestRun.samplingOpts) return <span />;

  const {
    samplingOpts,
    runResult: { draws, paramNames, computeTimeSec, consoleText },
  } = latestRun;

  return (
    <DrawsDisplay
      draws={draws}
      paramNames={paramNames}
      computeTimeSec={computeTimeSec}
      samplingOpts={samplingOpts}
      consoleText={consoleText}
    />
  );
};

type DrawsDisplayProps = {
  draws: number[][];
  paramNames: string[];
  computeTimeSec: number | undefined;
  samplingOpts: SamplingOpts;
  consoleText: string;
};

const DrawsDisplay: FunctionComponent<DrawsDisplayProps> = ({
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
      <SummaryView
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
        computeTimeSec={computeTimeSec}
      />
      <DrawsView
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
        drawNumbers={drawNumbers}
        samplingOpts={samplingOpts}
      />
      <HistsView
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
      <TracePlotsView
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
      <ConsoleOutput text={consoleText} />
    </TabWidget>
  );
};

export default SamplerOutputView;
