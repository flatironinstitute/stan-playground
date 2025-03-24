import { Download } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import {
  SuccessBorderedTableRow,
  SuccessColoredTableHead,
} from "@SpComponents/StyledTables";
import { SamplingOpts } from "@SpCore/Project/ProjectDataModel";
import { triggerDownload } from "@SpUtil/triggerDownload";
import JSZip from "jszip";
import { FunctionComponent, useCallback, useMemo, useState } from "react";

type DrawsTableProps = {
  draws: number[][];
  paramNames: string[];
  samplingOpts: SamplingOpts; // for including in exported zip
};

const DrawsTablePanel: FunctionComponent<DrawsTableProps> = ({
  draws,
  paramNames,
  samplingOpts,
}) => {
  const numChains = samplingOpts.num_chains;
  const totalDraws = draws[0].length;

  const [abbreviatedToNumRows, setAbbreviatedToNumRows] = useState<
    number | undefined
  >(300);

  const formattedDraws = useMemo(() => {
    if (abbreviatedToNumRows === undefined) return draws;
    return draws.map((draw) =>
      formatDraws(draw.slice(0, abbreviatedToNumRows)),
    );
  }, [draws, abbreviatedToNumRows]);

  const handleExportToCsv = useCallback(() => {
    const csvText = prepareCsvText(draws, paramNames, numChains);
    downloadTextFile(csvText, "draws.csv");
  }, [draws, paramNames, numChains]);

  const handleExportToMultipleCsvs = useCallback(async () => {
    const csvTexts = prepareMultipleCsvsText(draws, paramNames, numChains);
    const blob = await createZipBlobForMultipleCsvs(csvTexts, samplingOpts);
    const fileName = "SP-draws.zip";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [draws, paramNames, numChains, samplingOpts]);

  return (
    <Box display="flex" height="100%" width="100%" flexDirection="column">
      <Box flex="0" marginBottom="0.75rem">
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
      </Box>
      <TableContainer sx={{ flex: "0 1 auto", overflow: "auto" }}>
        <Table stickyHeader size="small" padding="none">
          <SuccessColoredTableHead>
            <TableRow>
              <TableCell key="chain">Chain</TableCell>
              <TableCell key="draw">Draw</TableCell>
              {paramNames.map((name, i) => (
                <TableCell padding="checkbox" key={i}>
                  {name}
                </TableCell>
              ))}
            </TableRow>
          </SuccessColoredTableHead>
          <TableBody>
            {formattedDraws[0].map((_, i) => (
              <SuccessBorderedTableRow key={i} hover>
                <TableCell>
                  {computeChainId(i, numChains, totalDraws)}
                </TableCell>
                <TableCell>
                  {computeDrawNumber(i, numChains, totalDraws)}
                </TableCell>
                {formattedDraws.map((draw, j) => (
                  <TableCell padding="checkbox" key={j}>
                    {draw[i]}
                  </TableCell>
                ))}
              </SuccessBorderedTableRow>
            ))}
          </TableBody>
        </Table>
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
      </TableContainer>
    </Box>
  );
};

const formatDraws = (draws: number[]) => {
  if (draws.every((x) => Number.isInteger(x))) return draws;
  return draws.map((x) => x.toPrecision(6));
};

const prepareCsvText = (
  draws: number[][],
  paramNames: string[],
  numChains: number,
) => {
  const totalDraws = draws[0].length;
  const lines = draws[0].map((_, i) => {
    return [
      `${computeChainId(i, numChains, totalDraws)}`,
      `${computeDrawNumber(i, numChains, totalDraws)}`,
      ...paramNames.map((_, j) => draws[j][i]),
    ].join(",");
  });
  return [["Chain", "Draw", ...paramNames].join(","), ...lines].join("\n");
};

const prepareMultipleCsvsText = (
  draws: number[][],
  paramNames: string[],
  numChains: number,
) => {
  // Whereas prepareCsvText returns a CSV that represents a long-form table,
  // this function returns multiple CSVs, one for each chain.
  const totalDraws = draws[0].length;
  const csvs = [...new Array(numChains)].map(() => [paramNames.join(",")]);
  for (let i = 0; i < totalDraws; i++) {
    const chainId = computeChainId(i, numChains, totalDraws);
    console.log("chainId", chainId);
    csvs[chainId - 1].push(paramNames.map((_, j) => draws[j][i]).join(","));
  }
  return csvs.map((csv) => csv.join("\n"));
};

const createZipBlobForMultipleCsvs = async (
  csvTexts: string[],
  samplingOpts: SamplingOpts,
) => {
  const zip = new JSZip();
  // put them all in a folder called 'draws'
  const folder = zip.folder("draws");
  if (!folder) throw new Error("Failed to create folder");
  csvTexts.forEach((text, i) => {
    folder.file(`chain_${i + 1}.csv`, text);
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

const computeChainId = (i: number, numChains: number, totalDraws: number) =>
  1 + Math.floor((i / totalDraws) * numChains);

const computeDrawNumber = (
  i: number,
  numChains: number,
  totalDraws: number,
) => {
  const numDrawsPerChain = Math.floor(totalDraws / numChains);
  return 1 + (i % numDrawsPerChain);
};

export default DrawsTablePanel;
