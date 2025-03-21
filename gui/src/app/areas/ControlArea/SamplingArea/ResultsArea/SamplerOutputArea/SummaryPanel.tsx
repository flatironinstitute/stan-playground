import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import {
  AlternatingTableRow,
  SecondaryColoredTableHead,
} from "@SpComponents/StyledTables";
import prettifyStanParamName from "@SpUtil/prettifyStanParamName";
import {
  effective_sample_size,
  split_potential_scale_reduction,
  percentile,
  mean,
  std_deviation,
} from "mcmc-stats";

import { FunctionComponent, useMemo } from "react";

const columns = [
  {
    key: "mean",
    label: "Mean",
    title: "Mean value of the parameter",
  },
  {
    key: "mcse",
    label: "MCSE",
    title:
      "Monte Carlo Standard Error: Standard deviation of the parameter divided by the square root of the effective sample size",
  },
  {
    key: "stdDev",
    label: "StdDev",
    title: "Standard deviation of the parameter",
  },
  {
    key: "5%",
    label: "5%",
    title: "5th percentile of the parameter",
  },
  {
    key: "50%",
    label: "50%",
    title: "50th percentile of the parameter",
  },
  {
    key: "95%",
    label: "95%",
    title: "95th percentile of the parameter",
  },
  {
    key: "nEff",
    label: "N_Eff",
    title:
      "Effective sample size: A crude measure of the effective sample size",
  },
  {
    key: "nEff/s",
    label: "N_Eff/s",
    title: "Effective sample size per second of compute time",
  },
  {
    key: "rHat",
    label: "R_hat",
    title:
      "Potential scale reduction factor on split chains (at convergence, R_hat=1)",
  },
];

type TableRow = {
  key: string;
  values: number[];
};

type SummaryProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
  computeTimeSec: number | undefined;
};

const SummaryPanel: FunctionComponent<SummaryProps> = ({
  draws,
  paramNames,
  drawChainIds,
  computeTimeSec,
}) => {
  const rows = useMemo(() => {
    const rows: TableRow[] = [];
    for (const [index, pname] of paramNames.entries()) {
      const pDraws = draws[index];
      const pDrawsSorted = [...pDraws].sort((a, b) => a - b);
      const ess = computeEss(pDraws, drawChainIds);
      const rhat = computeRhat(pDraws, drawChainIds);
      const stdDev = std_deviation(pDraws);
      const values = columns.map((column) => {
        if (column.key === "mean") {
          return mean(pDraws);
        } else if (column.key === "mcse") {
          return stdDev / Math.sqrt(ess);
        } else if (column.key === "stdDev") {
          return stdDev;
        } else if (column.key === "5%") {
          return percentile(pDrawsSorted, 0.05);
        } else if (column.key === "50%") {
          return percentile(pDrawsSorted, 0.5);
        } else if (column.key === "95%") {
          return percentile(pDrawsSorted, 0.95);
        } else if (column.key === "nEff") {
          return ess;
        } else if (column.key === "nEff/s") {
          return computeTimeSec ? ess / computeTimeSec : NaN;
        } else if (column.key === "rHat") {
          return rhat;
        } else {
          return NaN;
        }
      });
      rows.push({
        key: prettifyStanParamName(pname),
        values,
      });
    }
    return rows;
  }, [draws, paramNames, drawChainIds, computeTimeSec]);

  return (
    <TableContainer sx={{ maxHeight: "100%", overflow: "auto" }}>
      <Table stickyHeader>
        <SecondaryColoredTableHead>
          <TableRow>
            <TableCell>Parameter</TableCell>
            {columns.map((column, i) => (
              <TableCell key={i} title={column.title}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </SecondaryColoredTableHead>
        <TableBody>
          {rows.map((row, i) => (
            <AlternatingTableRow key={i} hover>
              <TableCell component="th">{row.key}</TableCell>
              {row.values.map((value, j) => (
                <TableCell key={j}>{value.toPrecision(4)}</TableCell>
              ))}
            </AlternatingTableRow>
          ))}
        </TableBody>
      </Table>
      <ul>
        {columns.map((column, i) => (
          <li key={i}>
            <strong>{column.label}</strong>: {column.title}
          </li>
        ))}
      </ul>
    </TableContainer>
  );
};

const drawsByChain = (draws: number[], chainIds: number[]): number[][] => {
  // Group draws by chain for use in computing ESS and Rhat
  const uniqueChainIds = Array.from(new Set(chainIds)).sort();
  const drawsByChain: number[][] = new Array(uniqueChainIds.length)
    .fill(0)
    .map(() => []);
  for (let i = 0; i < draws.length; i++) {
    const chainId = chainIds[i];
    const chainIndex = uniqueChainIds.indexOf(chainId);
    drawsByChain[chainIndex].push(draws[i]);
  }
  return drawsByChain;
};

const computeEss = (x: number[], chainIds: number[]) => {
  const draws = drawsByChain(x, chainIds);
  const ess = effective_sample_size(draws);
  return ess;
};

const computeRhat = (x: number[], chainIds: number[]) => {
  const draws = drawsByChain(x, chainIds);
  const rhat = split_potential_scale_reduction(draws);
  return rhat;
};

export default SummaryPanel;
