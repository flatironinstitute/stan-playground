import { describe, expect, test, vi } from "vitest";
import {
  compute_effective_sample_size,
  compute_split_effective_sample_size,
} from "@SpUtil/stan_stats/stan_stats";
import { computeStdDev } from "@SpUtil/stan_stats/summaryStats";

import { data1, data2 } from "./data";

describe("ESS", () => {
  test("too few samples", () => {
    const chains = [[1, 2]];
    const actual = compute_effective_sample_size(chains);
    expect(actual).toBe(NaN);
  });

  test("Non-finite", () => {
    const chains = [[1, 2, 3, 4, 5, 6, Infinity]];
    const actual = compute_effective_sample_size(chains);
    expect(actual).toBe(NaN);
  });

  test("Constant chains", () => {
    const chain = [1, 1, 1, 1, 1, 1, 1];
    const chains = [chain, chain];
    const actual = compute_effective_sample_size(chains);
    expect(actual).toBe(NaN);
  });

  test("one chain", () => {
    // Based on the unit test in Stan 2.35 but with more digits of precision
    // https://github.com/stan-dev/stan/blob/v2.35.0/src/test/unit/analyze/mcmc/compute_effective_sample_size_test.cpp#L22-L57

    const expected_ess = [
      284.77189783, 105.68133852, 668.69085592, 569.40248945, 523.29194917,
      403.39642868, 432.34846958, 441.28796989, 209.86506314, 472.82764779,
      451.13261546, 429.32700879, 375.41770775, 507.37609173, 222.90641272,
      218.27768923, 316.07200543, 489.08398336, 404.05662679, 379.35140759,
      232.84915591, 445.68359658, 675.56238444, 362.88182976, 720.20116516,
      426.74354119, 376.69233682, 509.39946501, 247.15051215, 440.42603897,
      160.53246711, 411.10864659, 419.39514647, 411.98813366, 425.52858473,
      420.61546436, 336.49516091, 131.94624221, 461.60551174, 469.62779507,
      479.45824312, 611.19593264, 483.30090212, 584.6144363, 500.26381682,
      453.11227606, 646.06673456, 72.18775005,
    ];

    for (const [i, expected] of expected_ess.entries()) {
      const chains = [data1[i + 4]];
      const actual = compute_effective_sample_size(chains);
      expect(actual).toBeCloseTo(expected, 8);
    }
  });

  test("two chains", () => {
    // Based on the unit test in Stan 2.35 but with more digits of precision
    // https://github.com/stan-dev/stan/blob/v2.35.0/src/test/unit/analyze/mcmc/compute_effective_sample_size_test.cpp#L59-L96

    const expected_ess = [
      467.36757686, 138.62780027, 1171.62891355, 543.89301136, 519.89670767,
      590.53267759, 764.75729757, 690.21936104, 326.2174526, 505.50985231,
      356.4451065, 590.14928533, 655.71371952, 480.727695, 178.74587968,
      184.87140679, 643.85564048, 472.13048627, 563.84825583, 584.74450883,
      449.13707437, 400.2347514, 339.21683773, 680.60538752, 1410.38271694,
      836.01702508, 871.38979093, 952.26509331, 620.94420986, 869.97895746,
      235.16790031, 788.52022938, 911.34806602, 234.22761856, 909.20881398,
      748.70965886, 722.36225578, 196.76168649, 945.74138475, 768.7970146,
      725.52731616, 1078.4672626, 471.56987828, 956.35673474, 498.19497759,
      582.66324514, 696.8506905, 99.78353935,
    ];

    for (const [i, expected] of expected_ess.entries()) {
      const chains = [data1[i + 4], data2[i + 4]];
      const actual = compute_effective_sample_size(chains);

      expect(actual).toBeCloseTo(expected, 8);
    }
  });

  test("two chains (split)", () => {
    // https://github.com/stan-dev/stan/blob/v2.35.0/src/test/unit/analyze/mcmc/compute_effective_sample_size_test.cpp#L170-L208
    const expected_ess = [
      467.84472286, 134.49757091, 1189.59121923, 569.19341812, 525.00159997,
      572.69157167, 763.91010048, 710.97717906, 338.29803319, 493.34818866,
      333.49289697, 588.28304375, 665.62041018, 504.26271137, 187.04932436,
      156.91316803, 650.01816166, 501.45489247, 570.16074452, 550.3664524,
      446.21946848, 408.21801438, 364.20430683, 678.69938531, 1419.23404653,
      841.74191739, 881.92328583, 960.42014222, 610.92148539, 917.64184496,
      239.59903291, 773.72649323, 921.33231871, 227.34002818, 900.81898633,
      748.47755057, 727.36524051, 184.94880796, 948.42542442, 776.03021619,
      735.27919044, 1077.17739932, 475.25192235, 955.28139954, 503.04549546,
      591.91289033, 715.96959077, 95.5938079,
    ];

    for (const [i, expected] of expected_ess.entries()) {
      const chains = [data1[i + 4], data2[i + 4]];
      const actual = compute_split_effective_sample_size(chains);

      expect(actual).toBeCloseTo(expected, 8);
    }
  });
});

describe("MCSE", () => {
  test("MCSE from ESS", () => {
    const expected_mcse = [
      1.04145411, 3.791888876e-2, 2.17337681e-2, 1.825876681e-2, 2.6612159e-3,
      1.131246947e-3, 1.260798781e-2, 1.030700714e-2, 1.228143969e-2,
      3.330029841e-3, 5.353227092e-3, 1.308588008e-2, 4.700032366e-3,
      5.257861092e-3, 7.53385116e-3, 2.758236978e-3, 4.345012004e-3,
      5.841727439e-3, 1.771073621e-2, 1.03721158e-2, 6.046724542e-3,
      6.605926256e-3, 7.575775682e-3, 1.190997112e-2, 1.602859734e-2,
      7.008613253e-3, 7.249334314e-3, 5.329946992e-3, 3.879811372e-3,
      4.748270142e-3, 4.865599426e-3, 2.880021654e-3, 5.057902504e-3,
      4.800369415e-3, 7.453771374e-3, 4.140658457e-3, 3.925703715e-3,
      5.498448282e-3, 3.515675895e-3, 4.387941995e-3, 5.155243445e-3,
      1.318791554e-2, 3.738973852e-3, 4.325514463e-3, 4.724583423e-3,
      4.468024552e-3, 7.140312463e-3, 3.651782874e-3, 5.773674797e-3,
      5.189233437e-3, 6.343078722e-3, 4.972475627e-3,
    ];

    const MCSE = (d: number[][]) => {
      const ess = compute_effective_sample_size(d);
      const std = computeStdDev(d.flat());
      return std / Math.sqrt(ess);
    };

    for (const [i, expected] of expected_mcse.entries()) {
      const chains = [data1[i], data2[i]];
      const actual = MCSE(chains);

      expect(actual).toBeCloseTo(expected, 8);
    }
  });
});
