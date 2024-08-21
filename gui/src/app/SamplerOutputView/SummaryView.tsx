import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import {
  AlternatingTableRow,
  SecondaryColoredTableHead,
} from "@SpComponents/StyledTables";
import {
  compute_effective_sample_size,
  compute_split_potential_scale_reduction,
} from "@SpStanStats/stan_stats";
import {
  computeMean,
  computePercentile,
  computeStdDev,
} from "@SpStanStats/summaryStats";
import { FunctionComponent, useMemo } from "react";

type SummaryViewProps = {
  draws: number[][];
  paramNames: string[];
  drawChainIds: number[];
  computeTimeSec: number | undefined;
};

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

const SummaryView: FunctionComponent<SummaryViewProps> = ({
  draws,
  paramNames,
  drawChainIds,
  computeTimeSec,
}) => {
  const rows = useMemo(() => {
    const rows: TableRow[] = [];
    for (const pname of paramNames) {
      const pDraws = draws[paramNames.indexOf(pname)];
      const pDrawsSorted = [...pDraws].sort((a, b) => a - b);
      const ess = computeEss(pDraws, drawChainIds);
      const rhat = computeRhat(pDraws, drawChainIds);
      const stdDev = computeStdDev(pDraws);
      const values = columns.map((column) => {
        if (column.key === "mean") {
          return computeMean(pDraws);
        } else if (column.key === "mcse") {
          return stdDev / Math.sqrt(ess);
        } else if (column.key === "stdDev") {
          return stdDev;
        } else if (column.key === "5%") {
          return computePercentile(pDrawsSorted, 0.05);
        } else if (column.key === "50%") {
          return computePercentile(pDrawsSorted, 0.5);
        } else if (column.key === "95%") {
          return computePercentile(pDrawsSorted, 0.95);
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
        key: pname,
        values,
      });
    }
    return rows;
  }, [draws, paramNames, drawChainIds, computeTimeSec]);

  return (
    <TableContainer>
      <Table>
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
  const ess = compute_effective_sample_size(draws);
  return ess;
};

const computeRhat = (x: number[], chainIds: number[]) => {
  const draws = drawsByChain(x, chainIds);
  const rhat = compute_split_potential_scale_reduction(draws);
  return rhat;
};

// Example of Stan output...
// Inference for Stan model: bernoulli_model
// 1 chains: each with iter=(1000); warmup=(0); thin=(1); 1000 iterations saved.

// Warmup took 0.0080 seconds
// Sampling took 0.048 seconds

//                 Mean     MCSE   StdDev     5%   50%   95%  N_Eff  N_Eff/s  R_hat

// lp__            -7.3  3.8e-02     0.76   -8.8  -7.0  -6.7    399     8313   1.00
// accept_stat__   0.92  3.5e-03  1.2e-01   0.64  0.97   1.0   1222    25458   1.00
// stepsize__      0.96      nan  6.7e-16   0.96  0.96  0.96    nan      nan    nan
// treedepth__      1.3  1.6e-02  4.7e-01    1.0   1.0   2.0    874    18204   1.00
// n_leapfrog__     2.4  3.6e-02  1.1e+00    1.0   3.0   3.0    926    19286   1.00
// divergent__     0.00      nan  0.0e+00   0.00  0.00  0.00    nan      nan    nan
// energy__         7.8  5.2e-02  9.7e-01    6.8   7.6   9.8    353     7347   1.00

// theta           0.25  6.1e-03     0.12  0.079  0.24  0.48    418     8702    1.0

// Samples were drawn using hmc with nuts.
// For each parameter, N_Eff is a crude measure of effective sample size,
// and R_hat is the potential scale reduction factor on split chains (at
// convergence, R_hat=1).

export default SummaryView;
