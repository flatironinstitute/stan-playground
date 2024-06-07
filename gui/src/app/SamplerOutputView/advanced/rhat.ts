import { computeMean, computeStdDev } from "../util"

export default function rhat(o: {counts: (number | undefined)[], means: (number | undefined)[], stdevs: (number | undefined)[]}) {
    // chain_lengths = [len(chain) for chain in chains]
    // mean_chain_length = np.mean(chain_lengths)
    // means = [np.mean(chain) for chain in chains]
    // vars = [np.var(chain, ddof=1) for chain in chains]
    // r_hat: np.float64 = np.sqrt(
    //     (mean_chain_length - 1) / mean_chain_length + np.var(means, ddof=1) / np.mean(vars)
    // )
    const { counts, means, stdevs } = o
    if (counts.indexOf(undefined) >= 0) return NaN
    if (means.indexOf(undefined) >= 0) return NaN
    if (stdevs.indexOf(undefined) >= 0) return NaN
    const cc = counts as number[]
    const mm = means as number[]
    const ss = stdevs as number[]
    if (cc.length <= 1) return NaN
    for (const count of cc) {
        if (count <= 1) return NaN
    }
    const mean_chain_length = computeMean(cc)
    if (mean_chain_length === undefined) return NaN
    const vars = ss.map((s, i) => (s * s * cc[i] / (cc[i] - 1)))
    const stdevMeans = computeStdDev(mm)
    if (stdevMeans === undefined) return NaN
    const varMeans = stdevMeans * stdevMeans * cc.length / (cc.length - 1)
    const meanVars = computeMean(vars)
    if (meanVars === undefined) return NaN
    const r_hat = Math.sqrt((mean_chain_length - 1) / mean_chain_length + varMeans / meanVars)
    return r_hat
}