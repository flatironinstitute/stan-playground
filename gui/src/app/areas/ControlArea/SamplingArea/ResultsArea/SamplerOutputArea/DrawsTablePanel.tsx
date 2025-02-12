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
  drawChainIds: number[];
  drawNumbers: number[];
  samplingOpts: SamplingOpts; // for including in exported zip
};

const DrawsTablePanel: FunctionComponent<DrawsTableProps> = ({
  draws,
  paramNames,
  drawChainIds,
  drawNumbers,
  samplingOpts,
}) => {
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
    <Box display="flex" height="100%" width="100%" flexDirection="column">
      <Box flex="1" marginBottom="0.75rem">
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
                <TableCell>{drawChainIds[i]}</TableCell>
                <TableCell>{drawNumbers[i]}</TableCell>
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

export default DrawsTablePanel;
