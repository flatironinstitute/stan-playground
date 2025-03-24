import { FunctionComponent, useMemo } from "react";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

import {
  effective_sample_size,
  split_potential_scale_reduction,
  percentile,
  mean,
  std_deviation,
} from "mcmc-stats";

import type { StanDraw } from "../SamplerOutputArea";

import {
  AlternatingTableRow,
  SecondaryColoredTableHead,
} from "@SpComponents/StyledTables";

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
    key: "fifthPercentile",
    label: "5%",
    title: "5th percentile of the parameter",
  },
  {
    key: "median",
    label: "50%",
    title: "50th percentile of the parameter",
  },
  {
    key: "ninetyFifthPercentile",
    label: "95%",
    title: "95th percentile of the parameter",
  },
  {
    key: "ess",
    label: "ESS",
    title:
      "Effective sample size: An estimate of the number of independent draws this sample is equivalent to",
  },
  {
    key: "essPerSecond",
    label: "ESS/s",
    title: "Effective sample size per second of compute time",
  },
  {
    key: "rHat",
    label: "Rhat",
    title:
      "Potential scale reduction factor on split chains (at convergence, Rhat=1)",
  },
] as const;

type TableRow = {
  key: string;
  values: number[];
};

type SummaryProps = {
  variables: StanDraw[];
  computeTimeSec: number;
};

const SummaryPanel: FunctionComponent<SummaryProps> = ({
  variables,
  computeTimeSec,
}) => {
  const rows = useMemo(() => {
    const rows: TableRow[] = [];
    for (const { name, draws } of variables) {
      const drawsFlatSorted = [...draws.flat()].sort((a, b) => a - b);

      const ess = effective_sample_size(draws);
      const stdDev = std_deviation(drawsFlatSorted);

      const row = {
        mean: mean(drawsFlatSorted),
        mcse: stdDev / Math.sqrt(ess),
        stdDev,
        fifthPercentile: percentile(drawsFlatSorted, 0.05),
        median: percentile(drawsFlatSorted, 0.5),
        ninetyFifthPercentile: percentile(drawsFlatSorted, 0.95),
        ess,
        essPerSecond: ess / computeTimeSec,
        rHat: split_potential_scale_reduction(draws),
      } as const;

      rows.push({
        key: name,
        values: columns.map((column) => row[column.key]),
      });
    }
    return rows;
  }, [variables, computeTimeSec]);

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

export default SummaryPanel;
