import { Download } from "@mui/icons-material";
import HistsView from "@SpComponents/HistsView";
import SummaryView from "@SpComponents/SummaryView";
import TabWidget from "@SpComponents/TabWidget";
import { SamplingOpts } from "@SpCore/ProjectDataModel";
import { StanRun } from "@SpStanSampler/useStanSampler";
import { triggerDownload } from "@SpUtil/triggerDownload";
import JSZip from "jszip";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import TracePlotsView from "./TracePlotsView";
import Button from "@mui/material/Button";
import { IconButton } from "@mui/material";

type SamplerOutputViewProps = {
  latestRun: StanRun;
};

const SamplerOutputView: FunctionComponent<SamplerOutputViewProps> = ({
  latestRun,
}) => {
  const { draws, paramNames, computeTimeSec, samplingOpts } = latestRun;

  if (!draws || !paramNames || !samplingOpts) return <span />;
  return (
    <DrawsDisplay
      draws={draws}
      paramNames={paramNames}
      computeTimeSec={computeTimeSec}
      samplingOpts={samplingOpts}
    />
  );
};

type DrawsDisplayProps = {
  draws: number[][];
  paramNames: string[];
  computeTimeSec: number | undefined;
  samplingOpts: SamplingOpts;
};

const DrawsDisplay: FunctionComponent<DrawsDisplayProps> = ({
  draws,
  paramNames,
  computeTimeSec,
  samplingOpts,
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
    <TabWidget labels={["Summary", "Draws", "Histograms", "Trace plots"]}>
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
    </TabWidget>
  );
};

type DrawsViewProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
  drawNumbers: number[];
  samplingOpts: SamplingOpts; // for including in exported zip
};

const DrawsView: FunctionComponent<DrawsViewProps> = ({
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
    return draws.map((draw) =>
      formatDraws(draw.slice(0, abbreviatedToNumRows)),
    );
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
    <div className="DrawsTable">
      <div>
        <IconButton size="small" title="Download" onClick={handleExportToCsv}>
          <Download fontSize="inherit" />
          &nbsp;Export to single .csv
        </IconButton>
        &nbsp;
        <IconButton
          size="small"
          title="Download"
          onClick={handleExportToMultipleCsvs}
        >
          <Download fontSize="inherit" />
          &nbsp;Export to multiple .csv
        </IconButton>
      </div>
      <br />
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
              {draws2.map((draw, j) => (
                <td key={j}>{draw[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {abbreviatedToNumRows !== undefined &&
        abbreviatedToNumRows < draws[0].length && (
          <div className="DrawAbbreviationToggle">
            <Button
              onClick={() => {
                setAbbreviatedToNumRows((x) => (x || 0) + 300);
              }}
            >
              Show more
            </Button>
          </div>
        )}
    </div>
  );
};

const formatDraws = (draws: number[]) => {
  if (draws.every((x) => Number.isInteger(x))) return draws;
  return draws.map((x) => x.toPrecision(6));
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
