/*
Translated from
https://github.com/stan-dev/stan/blob/develop/src/stan/analyze/mcmc/compute_effective_sample_size.hpp
and
https://github.com/stan-dev/stan/blob/develop/src/stan/analyze/mcmc/autocovariance.hpp
*/

import { transform as inPlaceFftTransform, inverseTransform as inPlaceInverseFftTransform } from "../advanced/fft";

/**
 * Computes the effective sample size (ESS) for the specified
 * parameter across all kept samples.  The value returned is the
 * minimum of ESS and the number_total_draws *
 * log10(number_total_draws).
 *
 * See more details in Stan reference manual section "Effective
 * Sample Size". http://mc-stan.org/users/documentation
 *
 * Current implementation assumes draws are stored in contiguous
 * blocks of memory.  Chains are trimmed from the back to match the
 * length of the shortest chain.  Note that the effective sample size
 * can not be estimated with less than four draws.
 *
 * draws: arrays of draws for each chain
 * returns: effective sample size for the specified parameter
 */
function compute_effective_sample_size(draws: number[][]): number {
    const num_chains = draws.length;

    // use the minimum number of draws across all chains
    let num_draws = draws[0].length;
    for (let chain = 1; chain < num_chains; ++chain) {
        num_draws = Math.min(num_draws, draws[chain].length);
    }

    if (num_draws < 4) {
        // we don't have enough draws to compute ESS
        return NaN;
    }

    // check if chains are constant; all equal to first draw's value
    let are_all_const = false;
    const init_draw = new Array(num_chains).fill(0);
    for (let chain_idx = 0; chain_idx < num_chains; chain_idx++) {
        const draw = draws[chain_idx];
        for (let n = 0; n < num_draws; n++) {
            if (!isFinite(draw[n])) {
                // we can't compute ESS if there are non-finite values
                return NaN;
            }
        }

        init_draw[chain_idx] = draw[0];

        const precision = 1e-12;
        if (draw.every(d => Math.abs(d - draw[0]) < precision)) {
            are_all_const = true;
        }
    }

    if (are_all_const) {
        // If all chains are constant then return NaN
        // if they all equal the same constant value
        const precision = 1e-12;
        if (init_draw.every(d => Math.abs(d - init_draw[0]) < precision)) {
            return NaN;
        }
    }

    // acov: autocovariance for each chain
    const acov = new Array(num_chains).fill(0).map(() => new Array(num_draws).fill(0));
    // chain_mean: mean of each chain
    const chain_mean = new Array(num_chains).fill(0);
    // chain_var: variance of each chain
    const chain_var = new Array(num_chains).fill(0);
    for (let chain = 0; chain < num_chains; ++chain) {
        const draw = draws[chain];
        acov[chain] = autocovariance(draw);
        chain_mean[chain] = compute_mean(draw);
        chain_var[chain] = acov[chain][0] * num_draws / (num_draws - 1);
    }

    // mean_var: mean of the chain variances
    const mean_var = compute_mean(chain_var);

    let var_plus = mean_var * (num_draws - 1) / num_draws;
    if (num_chains > 1) {
        var_plus += compute_sample_variance(chain_mean);
    }

    const rho_hat_s = new Array(num_draws).fill(0);
    const acov_s = new Array(num_chains).fill(0);
    for (let chain = 0; chain < num_chains; ++chain) {
        acov_s[chain] = acov[chain][1];
    }
    let rho_hat_even = 1.0;
    rho_hat_s[0] = rho_hat_even;
    let rho_hat_odd = 1 - (mean_var - compute_mean(acov_s)) / var_plus;
    rho_hat_s[1] = rho_hat_odd;

    // Convert raw autocovariance estimators into Geyer's initial
    // positive sequence. Loop only until num_draws - 4 to
    // leave the last pair of autocorrelations as a bias term that
    // reduces variance in the case of antithetical chains.
    let s = 1;
    while (s < (num_draws - 4) && (rho_hat_even + rho_hat_odd) > 0) {
        for (let chain = 0; chain < num_chains; ++chain) {
            acov_s[chain] = acov[chain][s + 1];
        }
        rho_hat_even = 1 - (mean_var - compute_mean(acov_s)) / var_plus;
        for (let chain = 0; chain < num_chains; ++chain) {
            acov_s[chain] = acov[chain][s + 2];
        }
        rho_hat_odd = 1 - (mean_var - compute_mean(acov_s)) / var_plus;
        if ((rho_hat_even + rho_hat_odd) >= 0) {
            rho_hat_s[s + 1] = rho_hat_even;
            rho_hat_s[s + 2] = rho_hat_odd;
        }
        s += 2;
    }

    const max_s = s;
    // this is used in the improved estimate, which reduces variance
    // in antithetic case -- see tau_hat below
    if (rho_hat_even > 0) {
        rho_hat_s[max_s + 1] = rho_hat_even;
    }

    // Convert Geyer's initial positive sequence into an initial
    // monotone sequence
    for (let s = 1; s <= max_s - 3; s += 2) {
        if (rho_hat_s[s + 1] + rho_hat_s[s + 2] > rho_hat_s[s - 1] + rho_hat_s[s]) {
            rho_hat_s[s + 1] = (rho_hat_s[s - 1] + rho_hat_s[s]) / 2;
            rho_hat_s[s + 2] = rho_hat_s[s + 1];
        }
    }

    const num_total_draws = num_chains * num_draws;
    // Geyer's truncated estimator for the asymptotic variance
    // Improved estimate reduces variance in antithetic case
    const tau_hat = -1 + 2 * compute_sum(rho_hat_s.slice(0, max_s)) + rho_hat_s[max_s + 1];
    return Math.min(num_total_draws / tau_hat, num_total_draws * Math.log10(num_total_draws));
}

function compute_sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

function compute_mean(arr: number[]): number {
    return compute_sum(arr) / arr.length;
}

function compute_population_variance(arr: number[]): number {
    const mean = compute_mean(arr);
    return compute_mean(arr.map(d => (d - mean) ** 2));
}

function compute_sample_variance(arr: number[]): number {
    const mean = compute_mean(arr);
    return compute_sum(arr.map(d => (d - mean) ** 2)) / (arr.length - 1);
}

function autocorrelation(y: number[]): number[] {
    const N = y.length;
    const M = fftNextGoodSize(N);
    const Mt2 = 2 * M;

    // centered_signal = y-mean(y) followed by N zeros
    const centered_signal = new Array(Mt2).fill(0);
    const y_mean = compute_mean(y);
    for (let n = 0; n < N; n++) {
        centered_signal[n] = y[n] - y_mean;
    }

    const freqvec: [number, number][] = forwardFFT(centered_signal);
    for (let i = 0; i < freqvec.length; i++) {
        freqvec[i] = [freqvec[i][0] ** 2 + freqvec[i][1] ** 2, 0];
    }

    const ac_tmp = inverseFFT(freqvec);

    // use "biased" estimate as recommended by Geyer (1992)
    const ac = new Array(N).fill(0);
    for (let n = 0; n < N; n++) {
        ac[n] = ac_tmp[n][0] / (N * N * 2);
    }
    const ac0 = ac[0];
    for (let n = 0; n < N; n++) {
        ac[n] /= ac0;
    }

    return ac;
}

function autocovariance(y: number[]): number[] {
    const acov = autocorrelation(y);
    const variance = compute_population_variance(y);
    return acov.map(v => v * variance);
}

function fftNextGoodSize(n: number): number {
    const isGoodSize = (n: number) => {
        while (n % 2 === 0) {
            n /= 2;
        }
        while (n % 3 === 0) {
            n /= 3;
        }
        while (n % 5 === 0) {
            n /= 5;
        }
        return n === 1;
    }
    while (!isGoodSize(n)) {
        n++;
    }
    return n;
}

function forwardFFT(signal: number[]): [number, number][] {
    const realPart = [...signal];
    const imagPart = new Array(signal.length).fill(0);
    inPlaceInverseFftTransform(realPart, imagPart);
    return realPart.map((v, i) => [v, imagPart[i]]);
}

function inverseFFT(freqvec: [number, number][]): [number, number][] {
    const realPart = freqvec.map(v => v[0]);
    const imagPart = freqvec.map(v => v[1]);
    inPlaceFftTransform(realPart, imagPart);
    return realPart.map((v, i) => [v, imagPart[i]]);
}

const split_chains = (draws: number[][]) => {
    const num_chains = draws.length;
    let num_draws = draws[0].length;
    for (let chain = 1; chain < num_chains; ++chain) {
        num_draws = Math.min(num_draws, draws[chain].length);
    }

    const half = num_draws / 2;
    const half_draws = Math.ceil(half);
    const split_draws = new Array(2 * num_chains);
    for (let n = 0; n < num_chains; ++n) {
        split_draws[2 * n] = draws[n].slice(0, half_draws);
        split_draws[2 * n + 1] = draws[n].slice(half_draws);
    }

    return split_draws;
}

export const compute_split_effective_sample_size = (draws: number[][]) => {
    const num_chains = draws.length;
    let num_draws = draws[0].length;
    for (let chain = 1; chain < num_chains; ++chain) {
        num_draws = Math.min(num_draws, draws[chain].length);
    }

    const split_draws = split_chains(draws);

    return compute_effective_sample_size(split_draws);
}

export default compute_effective_sample_size;
