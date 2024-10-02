import { describe, expect, test } from "vitest";
import {
  compute_potential_scale_reduction,
  compute_split_potential_scale_reduction,
} from "@SpUtil/stan_stats/stan_stats";

import { data1, data2 } from "./data";

describe("R-Hat", () => {
  test("too few samples", () => {
    const chains = [[1, 2]];
    const actual = compute_potential_scale_reduction(chains);
    expect(actual).toBe(NaN);
  });

  test("Non-finite", () => {
    const chains = [[1, 2, 3, 4, 5, 6, Infinity]];
    const actual = compute_potential_scale_reduction(chains);
    expect(actual).toBe(NaN);
  });

  test("Constant chains", () => {
    const chain = [1, 1, 1, 1, 1, 1, 1];
    const chains = [chain, chain];
    const actual = compute_potential_scale_reduction(chains);
    expect(actual).toBe(NaN);
  });

  test("basic", () => {
    // Based on the unit test in Stan 2.35 but using slightly more precision:
    // https://github.com/stan-dev/stan/blob/v2.35.0/src/test/unit/analyze/mcmc/compute_potential_scale_reduction_test.cpp#L23-L60
    const expected_rhat = [
      1.000417, 1.000359, 0.999546, 1.000466, 1.001193, 1.000887, 1.000175,
      1.00019, 1.002262, 0.999539, 0.999603, 0.999511, 1.002374, 1.005145,
      1.005657, 0.999572, 1.000986, 1.008535, 1.000799, 0.999605, 1.000602,
      1.000457, 1.010228, 0.9996, 1.0011, 0.999672, 0.999734, 0.999579,
      1.002418, 1.002131, 1.002444, 0.999978, 0.999686, 1.000791, 0.999546,
      1.000902, 1.001362, 1.002881, 1.00036, 0.999889, 1.000768, 0.999972,
      1.001942, 0.999718, 1.002574, 1.001089, 1.000042, 0.999555,
    ];

    for (const [i, expected] of expected_rhat.entries()) {
      const chains = [data1[i + 4], data2[i + 4]];
      const actual = compute_potential_scale_reduction(chains);
      expect(actual).toBeCloseTo(expected, 6);
    }
  });

  test("split", () => {
    const expected_rhat = [
      1.00718209, 1.00472781, 0.99920319, 1.00060574, 1.00378194, 1.01031069,
      1.00173146, 1.00449845, 1.0011052, 1.00336914, 1.00546003, 1.00105054,
      1.00557523, 1.00462913, 1.00534461, 1.01243951, 1.00174291, 1.00718051,
      1.00186144, 1.0055401, 1.00436048, 1.00146549, 1.01016783, 1.00161542,
      1.00143164, 1.0005802, 0.99922069, 1.00012079, 1.01028435, 1.00100481,
      1.00304822, 1.00435219, 1.00054786, 1.00246262, 1.00446672, 1.00479686,
      1.00209188, 1.01159003, 1.00201738, 1.00076562, 1.00209813, 1.00262278,
      1.00308325, 1.00196623, 1.002463, 1.00084883, 1.00047332, 1.00735293,
    ];

    for (const [i, expected] of expected_rhat.entries()) {
      const chains = [data1[i + 4], data2[i + 4]];
      const actual = compute_split_potential_scale_reduction(chains);

      expect(actual).toBeCloseTo(expected, 6);
    }
  });
});
