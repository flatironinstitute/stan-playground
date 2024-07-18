import { SmallIconButton } from "@fi-sci/misc";
import { Download } from "@mui/icons-material";
import HistsView from "@SpComponents/HistsView";
import SummaryView from "@SpComponents/SummaryView";
import TabWidget from "@SpComponents/TabWidget";
import TracePlotsView from "@SpComponents/TracePlotsView";
import { SamplingOpts } from "@SpCore/ProjectDataModel";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { triggerDownload } from "@SpUtil/triggerDownload";
import JSZip from "jszip";
import { FunctionComponent, useCallback, useMemo, useState } from "react";

type SamplerOutputViewProps = {
  width: number;
  height: number;
  latestRun: StanRun;
};

const SamplerOutputView: FunctionComponent<SamplerOutputViewProps> = ({
  width,
  height,
  latestRun,
}) => {
  const { draws, paramNames, computeTimeSec, samplingOpts } = latestRun;

  if (!draws || !paramNames || !samplingOpts) return <span />;
  return (
    <DrawsDisplay
      width={width}
      height={height}
      draws={draws}
      paramNames={paramNames}
      computeTimeSec={computeTimeSec}
      samplingOpts={samplingOpts}
    />
  );
};

type DrawsDisplayProps = {
  width: number;
  height: number;
  draws: number[][];
  paramNames: string[];
  computeTimeSec: number | undefined;
  samplingOpts: SamplingOpts;
};

const tabs = [
  {
    id: "summary",
    label: "Summary",
    title: "Summary view",
    closeable: false,
  },
  {
    id: "draws",
    label: "Draws",
    title: "Draws view",
    closeable: false,
  },
  {
    id: "hists",
    label: "Histograms",
    title: "Histograms view",
    closeable: false,
  },
  {
    id: "traceplots",
    label: "Trace Plots",
    title: "Trace Plots view",
    closeable: false,
  },
];

const DrawsDisplay: FunctionComponent<DrawsDisplayProps> = ({
  width,
  height,
  draws,
  paramNames,
  computeTimeSec,
  samplingOpts,
}) => {
  const [currentTabId, setCurrentTabId] = useState("summary");

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
      width={width}
      height={height}
      tabs={tabs}
      currentTabId={currentTabId}
      setCurrentTabId={setCurrentTabId}
    >
      <SummaryView
        width={0}
        height={0}
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
        computeTimeSec={computeTimeSec}
      />
      <DrawsView
        width={0}
        height={0}
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
        drawNumbers={drawNumbers}
        samplingOpts={samplingOpts}
      />
      <HistsView
        width={0}
        height={0}
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
      <TracePlotsView
        width={0}
        height={0}
        draws={draws}
        paramNames={paramNames}
        drawChainIds={drawChainIds}
      />
    </TabWidget>
  );
};

type DrawsViewProps = {
  width: number;
  height: number;
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
  drawNumbers: number[];
  samplingOpts: SamplingOpts; // for including in exported zip
};

const DrawsView: FunctionComponent<DrawsViewProps> = ({
  width,
  height,
  draws,
  paramNames,
  drawChainIds,
  drawNumbers,
  samplingOpts,
}) => {
  const [abbreviatedToNumRows, setAbbreviatedToNumRows] = useState<
    number | undefined
  >(300);
  const draws2 = useMemo(() => {
    if (abbreviatedToNumRows === undefined) return draws;
    return draws.map((draw) => draw.slice(0, abbreviatedToNumRows));
  }, [draws, abbreviatedToNumRows]);
  const handleExportToCsv = useCallback(() => {
    const csvText = prepareCsvText(
      draws,
      paramNames,
      drawChainIds,
      drawNumbers,
    );
    downloadTextFile(csvText, "draws.csv");
  }, [draws, paramNames, drawChainIds, drawNumbers]);
  const handleExportToMultipleCsvs = useCallback(async () => {
    const uniqueChainIds = Array.from(new Set(drawChainIds));
    const csvTexts = prepareMultipleCsvsText(
      draws,
      paramNames,
      drawChainIds,
      uniqueChainIds,
    );
    const blob = await createZipBlobForMultipleCsvs(
      csvTexts,
      uniqueChainIds,
      samplingOpts,
    );
    const fileName = "SP-draws.zip";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [draws, paramNames, drawChainIds, samplingOpts]);
  return (
    <div className="DrawsTable" style={{ width, height }}>
      <div>
        <SmallIconButton
          icon={<Download />}
          label="Export to single .csv"
          onClick={handleExportToCsv}
        />
        &nbsp;
        <SmallIconButton
          icon={<Download />}
          label="Export to multiple .csv"
          onClick={handleExportToMultipleCsvs}
        />
      </div>
      <table className="draws-table">
        <thead>
          <tr>
            <th key="chain">Chain</th>
            <th key="draw">Draw</th>
            {paramNames.map((name, i) => (
              <th key={i}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {draws2[0].map((_, i) => (
            <tr key={i}>
              <td>{drawChainIds[i]}</td>
              <td>{drawNumbers[i]}</td>
              {draws.map((draw, j) => (
                <td key={j}>{draw[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {abbreviatedToNumRows !== undefined &&
        abbreviatedToNumRows < draws[0].length && (
          <div className="DrawAbbreviationToggle">
            <button
              onClick={() => {
                setAbbreviatedToNumRows((x) => (x || 0) + 300);
              }}
            >
              Show more
            </button>
          </div>
        )}
    </div>
  );
};

const prepareCsvText = (
  draws: number[][],
  paramNames: string[],
  drawChainIds: number[],
  drawNumbers: number[],
) => {
  // draws: Each element of draws is a column corresponding to a parameter, across all chains
  // paramNames: The paramNames array contains the names of the parameters in the same order that they appear in the draws array
  // drawChainIds: The drawChainIds array contains the chain id for each row in the draws array
  // uniqueChainIds: The uniqueChainIds array contains the unique chain ids
  const lines = draws[0].map((_, i) => {
    return [
      `${drawChainIds[i]}`,
      `${drawNumbers[i]}`,
      ...paramNames.map((_, j) => draws[j][i]),
    ].join(",");
  });
  return [["Chain", "Draw", ...paramNames].join(","), ...lines].join("\n");
};

const prepareMultipleCsvsText = (
  draws: number[][],
  paramNames: string[],
  drawChainIds: number[],
  uniqueChainIds: number[],
) => {
  // See the comments in prepareCsvText for the meaning of the arguments.
  // Whereas prepareCsvText returns a CSV that represents a long-form table,
  // this function returns multiple CSVs, one for each chain.
  return uniqueChainIds.map((chainId) => {
    const drawIndicesForChain = drawChainIds
      .map((id, i) => (id === chainId ? i : -1))
      .filter((i) => i >= 0);
    const lines = drawIndicesForChain.map((i) => {
      return paramNames.map((_, j) => draws[j][i]).join(",");
    });

    return [paramNames.join(","), ...lines].join("\n");
  });
};

const createZipBlobForMultipleCsvs = async (
  csvTexts: string[],
  uniqueChainIds: number[],
  samplingOpts: SamplingOpts,
) => {
  const zip = new JSZip();
  // put them all in a folder called 'draws'
  const folder = zip.folder("draws");
  if (!folder) throw new Error("Failed to create folder");
  csvTexts.forEach((text, i) => {
    folder.file(`chain_${uniqueChainIds[i]}.csv`, text);
  });
  const samplingOptsText = JSON.stringify(samplingOpts, null, 2);
  folder.file("sampling_opts.json", samplingOptsText);
  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
};

const downloadTextFile = (text: string, filename: string) => {
  const blob = new Blob([text], { type: "text/plain" });
  triggerDownload(blob, filename, () => {});
};

export default SamplerOutputView;
