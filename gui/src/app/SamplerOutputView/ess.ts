// See: https://github.com/flatironinstitute/bayes-kit/blob/main/bayes_kit/ess.py

import { inverseTransform, transform as transformFft } from "./fft"

// def autocorr_fft(chain: VectorType) -> VectorType:
//     """
//     Return sample autocorrelations at all lags for the specified sequence.
//     Algorithmically, this function calls a fast Fourier transform (FFT).
//     Parameters:
//     chain: sequence whose autocorrelation is returned
//     Returns:
//     autocorrelation estimates at all lags for the specified sequence
//     """
//     size = 2 ** np.ceil(np.log2(2 * len(chain) - 1)).astype("int")
//     var = np.var(chain)
//     ndata = chain - np.mean(chain)
//     fft = np.fft.fft(ndata, size)
//     pwr = np.abs(fft) ** 2
//     N = len(ndata)
//     acorr = np.fft.ifft(pwr).real / var / N
//     return acorr

export function autocorr_fft(chain: number[], n: number): number[] {
    const size = Math.round(Math.pow(2, Math.ceil(Math.log2(2 * chain.length - 1))))
    const variance = computeVariance(chain)
    if (variance === undefined) return []
    const mean = computeMean(chain)
    const ndata = chain.map(x => (x - (mean || 0)))
    while (ndata.length < size) {
        ndata.push(0)
    }
    const ndataFftReal = [...ndata]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ndataFftImag = ndata.map(_x => (0))
    transformFft(ndataFftReal, ndataFftImag)
    const pwr = ndataFftReal.map((r, i) => (r * r + ndataFftImag[i] * ndataFftImag[i]))
    const N = ndata.length
    const acorrReal = [...pwr]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const acorrImag = pwr.map(_ => (0))
    inverseTransform(acorrReal, acorrImag) // doesn't include scaling
    return acorrReal.slice(0, n).map(x => (x / variance / N / chain.length))
}

export function autocorr_slow(chain: number[], n: number): number[] {
    // todo: use FFT

    const mu = chain.length ? sum(chain) / chain.length : 0
    const chain_ctr = chain.map(a => (a - mu))
    const N = chain_ctr.length

    //////////////////////////////////////////////////////////////
    // acorrN = np.correlate(chain_ctr, chain_ctr, "full")[N - 1 :]
    let acorrN: number[] = []
    for (let i = 0; i < n; i++) {
        let aa = 0
        for (let j = 0; j < N - i; j++) {
            aa += chain_ctr[j] * chain_ctr[j + i]
        }
        acorrN.push(aa)
    }
    //////////////////////////////////////////////////////////////

    // normalize so that acorrN[0] = 1
    const a0 = acorrN[0]
    acorrN = acorrN.map(a => (a / a0))

    return acorrN
}

export function first_neg_pair_start(chain: number[]): number {
    const N = chain.length
    let n = 0
    while (n + 1 < N) {
        if (chain[n] + chain[n + 1] < 0) {
            return n
        }
        n = n + 1
    }
    return N
}

export function ess_ipse(chain: number[]): number {
    if (chain.length < 4) {
        console.warn('ess requires chain.length >=4')
        return 0
    }

    // for verifying we get the same answer with both methods
    // console.log('test autocor_slow', autocorr_slow([1, 2, 3, 4, 0, 0, 0], 5))
    // console.log('test autocor_fft', autocorr_fft([1, 2, 3, 4, 0, 0, 0], 5))

    // const acor = autocorr_slow(chain, chain.length)
    const acor = autocorr_fft(chain, chain.length)
    const n = first_neg_pair_start(acor)
    const sigma_sq_hat = acor[0] + 2 * sum(acor.slice(1, n))
    const ess = chain.length / sigma_sq_hat
    return ess
}

export function ess_imse(chain: number[]): {essValue: number, acor: number[]} {
    if (chain.length < 4) {
        console.warn('ess requires chain.length >=4')
        return {essValue: 0, acor: []}
    }
    // const acor = autocorr_slow(chain, chain.length)
    const acor = autocorr_fft(chain, chain.length)
    const n = first_neg_pair_start(acor)
    let prev_min = 1
    let accum = 0
    let i = 1
    while (i + 1 < n) {
        prev_min = Math.min(prev_min, acor[i] + acor[i + 1])
        accum = accum + prev_min
        i = i + 2
    }

    const sigma_sq_hat = acor[0] + 2 * accum
    const essValue = chain.length / sigma_sq_hat
    return {essValue, acor}
}

export function ess(chain: number[]) {
    // use ess_imse for now
    return ess_imse(chain)
}

function sum(x: number[]) {
    return x.reduce((a, b) => (a + b), 0)
}

function computeVariance(x: number[]) {
    const mu = computeMean(x)
    if (mu === undefined) return undefined
    return sum(x.map(a => (
        (a - mu) * (a - mu)
    ))) / x.length
}

function computeMean(x: number[]) {
    return x.length ? sum(x) / x.length : undefined
}