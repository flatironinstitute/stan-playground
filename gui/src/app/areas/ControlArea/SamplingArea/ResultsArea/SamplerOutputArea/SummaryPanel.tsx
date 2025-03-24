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
  variables: StanDraw[];
  computeTimeSec: number | undefined;
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
      const rhat = split_potential_scale_reduction(draws);

      const stdDev = std_deviation(drawsFlatSorted);
      const values = columns.map((column) => {
        if (column.key === "mean") {
          return mean(drawsFlatSorted);
        } else if (column.key === "mcse") {
          return stdDev / Math.sqrt(ess);
        } else if (column.key === "stdDev") {
          return stdDev;
        } else if (column.key === "5%") {
          return percentile(drawsFlatSorted, 0.05);
        } else if (column.key === "50%") {
          return percentile(drawsFlatSorted, 0.5);
        } else if (column.key === "95%") {
          return percentile(drawsFlatSorted, 0.95);
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
        key: name,
        values,
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
