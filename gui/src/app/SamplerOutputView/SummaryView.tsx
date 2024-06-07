import { FunctionComponent, useMemo } from "react"
import { ess } from "./advanced/ess"
import { computeMean, computePercentile, computeStdDev } from "./util"
import rhat from "./advanced/rhat"

type SummaryViewProps = {
    width: number
    height: number
    draws: number[][],
    paramNames: string[]
    drawChainIds: number[]
    computeTimeSec: number | undefined
}

const columns = [
    {
        key: 'mean',
        label: 'Mean',
        title: 'Mean value of the parameter'
    },
    {
        key: 'mcse',
        label: 'MCSE',
        title: 'Monte Carlo Standard Error: Standard deviation of the parameter divided by the square root of the effective sample size'
    },
    {
        key: 'stdDev',
        label: 'StdDev',
        title: 'Standard deviation of the parameter'
    },
    {
        key: '5%',
        label: '5%',
        title: '5th percentile of the parameter'
    },
    {
        key: '50%',
        label: '50%',
        title: '50th percentile of the parameter'
    },
    {
        key: '95%',
        label: '95%',
        title: '95th percentile of the parameter'
    },
    {
        key: 'nEff',
        label: 'N_Eff',
        title: 'Effective sample size: A crude measure of the effective sample size (uses ess_imse)'
    },
    {
        key: 'nEff/s',
        label: 'N_Eff/s',
        title: 'Effective sample size per second of compute time'
    },
    {
        key: 'rHat',
        label: 'R_hat',
        title: 'Potential scale reduction factor on split chains (at convergence, R_hat=1)'
    }
]

type TableRow = {
    key: string
    values: number[]
}

const SummaryView: FunctionComponent<SummaryViewProps> = ({ width, height, draws, paramNames, drawChainIds, computeTimeSec }) => {
    const uniqueChainIds = useMemo(() => (Array.from(new Set(drawChainIds)).sort()), [drawChainIds]);

    const rows = useMemo(() => {
        const rows: TableRow[] = [];
        for (const pname of paramNames) {
            const pDraws = draws[paramNames.indexOf(pname)];
            const pDrawsSorted = [...pDraws].sort((a, b) => a - b);
            const ess = computeEss(pDraws, drawChainIds);
            const stdDev = computeStdDev(pDraws);
            const values = columns.map((column) => {
                if (column.key === 'mean') {
                    return computeMean(pDraws);
                }
                else if (column.key === 'mcse') {
                    return stdDev / Math.sqrt(ess);
                }
                else if (column.key === 'stdDev') {
                    return stdDev;
                }
                else if (column.key === '5%') {
                    return computePercentile(pDrawsSorted, 0.05);
                }
                else if (column.key === '50%') {
                    return computePercentile(pDrawsSorted, 0.5);
                }
                else if (column.key === '95%') {
                    return computePercentile(pDrawsSorted, 0.95);
                }
                else if (column.key === 'nEff') {
                    return ess;
                }
                else if (column.key === 'nEff/s') {
                    return computeTimeSec ? ess / computeTimeSec : NaN;
                }
                else if (column.key === 'rHat') {
                    const counts = computeChainCounts(drawChainIds, uniqueChainIds);
                    const means = computeChainMeans(pDraws, drawChainIds, uniqueChainIds);
                    const stdevs = computeChainStdDevs(pDraws, drawChainIds, uniqueChainIds);
                    return rhat({ counts, means, stdevs });
                }
                else {
                    return NaN;
                }
            });
            rows.push({
                key: pname,
                values
            })
        }
        return rows;
    }, [paramNames, draws, drawChainIds, uniqueChainIds, computeTimeSec]);

    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <table className="scientific-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        {
                            columns.map((column, i) => (
                                <th key={i} title={column.title}>{column.label}</th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.map((row, i) => (
                            <tr key={i}>
                                <td>{row.key}</td>
                                {
                                    row.values.map((value, j) => (
                                        <td key={j}>{value.toPrecision(4)}</td>
                                    ))
                                }
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <ul>
                {columns.map((column, i) => (
                    <li key={i}>
                        <strong>{column.label}</strong>: {column.title}
                    </li>
                ))}
            </ul>
        </div>
    )
}

const computeEss = (x: number[], chainIds: number[]) => {
    const uniqueChainIds = Array.from(new Set(chainIds)).sort();
    let sumEss = 0;
    for (const chainId of uniqueChainIds) {
        const chainX = x.filter((_, i) => chainIds[i] === chainId);
        const {essValue} = ess(chainX);
        sumEss += essValue;
    }
    return sumEss;
}

const computeChainCounts = (chainIds: number[], uniqueChainIds: number[]) => {
    return uniqueChainIds.map((chainId) => {
        return chainIds.filter((id) => id === chainId).length;
    });
}

const computeChainMeans = (x: number[], chainIds: number[], uniqueChainIds: number[]) => {
    return uniqueChainIds.map((chainId) => {
        const chainX = x.filter((_, i) => chainIds[i] === chainId);
        return computeMean(chainX);
    });
}

const computeChainStdDevs = (x: number[], chainIds: number[], uniqueChainIds: number[]) => {
    return uniqueChainIds.map((chainId) => {
        const chainX = x.filter((_, i) => chainIds[i] === chainId);
        return computeStdDev(chainX);
    });
}

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

export default SummaryView