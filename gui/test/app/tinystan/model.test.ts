import { describe, expect, test } from "vitest";
import { getMockedModel } from "./mocking/getMockedModel";
import { HMCMetric } from "../../../src/app/tinystan/types";
import {
  HMC_SAMPLER_VARIABLES,
  PATHFINDER_VARIABLES,
} from "../../../src/app/tinystan/constants";

describe("test tinystan code with a mocked WASM module", () => {
  test("version returns major.minor.patch-like string", async () => {
    const { mockedModule, model } = await getMockedModel({});
    const v = model.stanVersion();

    expect(v).toEqual("123.123.123");
    expect(mockedModule._tinystan_stan_version).toHaveBeenCalledTimes(1);
  });

  describe("sample function", () => {
    test("null call behavior", async () => {
      const { mockedModule, model } = await getMockedModel({});
      model.sample({});
      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
    });

    test("erroring call behavior", async () => {
      const { mockedModule, model } = await getMockedModel({ returnCode: 1 });
      expect(() => model.sample({})).toThrow(/Error inside WASM/);

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
    });

    test("model with no free parameters throws", async () => {
      const { mockedModule, model } = await getMockedModel({
        numFreeParams: 0,
      });
      expect(() => model.sample({})).toThrow(/no parameters/);

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
    });

    test("failure in model construction throws", async () => {
      const { mockedModule, model, getStdout } = await getMockedModel({
        modelFails: true,
      });
      expect(() => model.sample({})).toThrow(/Error inside WASM/);

      expect(getStdout()).toMatch(/Error inside WASM/);
      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
    });

    test("data can be string or record", async () => {
      const { mockedModule, model } = await getMockedModel({});

      const data = { hi: 1 };
      const dataStr = JSON.stringify(data);

      model.sample({ data });
      expect(mockedModule.stringToUTF8).toHaveBeenNthCalledWith(
        1,
        dataStr,
        expect.any(Number),
        expect.any(Number),
      );

      mockedModule.stringToUTF8.mockClear();

      model.sample({ data: dataStr });
      expect(mockedModule.stringToUTF8).toHaveBeenNthCalledWith(
        1,
        dataStr,
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(2);
    });

    test("multiple inits are passed correctly", async () => {
      const { mockedModule, model } = await getMockedModel({});

      const inits = { hi: 1 };
      const initsStr = JSON.stringify(inits);

      model.sample({ inits });

      expect(mockedModule.stringToUTF8).toHaveBeenCalledWith(
        initsStr,
        expect.any(Number),
        expect.any(Number),
      );

      mockedModule.stringToUTF8.mockClear();

      const inits2 = [inits, inits];
      const inits2Str = initsStr + "%" + initsStr;

      model.sample({ inits: inits2, num_chains: 2 });

      expect(mockedModule.stringToUTF8).toHaveBeenCalledWith(
        inits2Str,
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(2);
    });

    test("output is correct shape and layout", async () => {
      const { model } = await getMockedModel({
        paramNames: "a,b",
      });

      const num_chains = 3;
      const num_samples = 5;
      const num_warmup = 7;
      const N_PARAMS = HMC_SAMPLER_VARIABLES.length + 2;

      // Two cases:
      // 1. save_warmup = false
      //    - draws is num_params x (num_chains * num_samples)
      // 2. save_warmup = true
      //    - draws is num_params x (num_chains * (num_samples + num_warmup))
      for (const save_warmup of [false, true]) {
        const EXPECTED_SAMPLES = save_warmup
          ? num_samples + num_warmup
          : num_samples;

        const { draws, paramNames } = model.sample({
          num_chains,
          num_samples,
          num_warmup,
          save_warmup,
          adapt: save_warmup,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) =>
          expect(d.length).toEqual(num_chains * EXPECTED_SAMPLES),
        );

        expectColumnMajor(draws, N_PARAMS, num_chains * EXPECTED_SAMPLES);
      }
    });

    test("save_metric output is correct shape and layout", async () => {
      const numFreeParams = 5;
      const { model } = await getMockedModel({ numFreeParams });

      const num_chains = 3;

      for (const metric_choice of [HMCMetric.DIAGONAL, HMCMetric.UNIT]) {
        let { metric } = model.sample({
          save_metric: true,
          metric: metric_choice,
          num_chains,
        });
        expect(metric).toBeDefined();
        expect(metric?.length).toEqual(num_chains);
        expect(metric?.[0].length).toEqual(numFreeParams);
        expect(Array.isArray(metric?.[0][0])).toEqual(false);
        metric = metric as number[][];

        // ensure we are reading out of the heap in the expected order
        // see comment on expectColumnMajor for overview
        expect(metric[0][1]).toEqual(metric[0][0] + 1);
        expect(metric[1][0]).toEqual(metric[0][0] + numFreeParams);
      }

      {
        // dense metric
        let { metric } = model.sample({
          save_metric: true,
          metric: HMCMetric.DENSE,
          num_chains,
        });
        expect(metric).toBeDefined();
        expect(metric?.length).toEqual(num_chains);
        expect(metric?.[0].length).toEqual(numFreeParams);
        expect(Array.isArray(metric?.[0][0])).toEqual(true);
        metric = metric as number[][][];
        expect(metric?.[0][0].length).toEqual(numFreeParams);

        // ensure we are reading out of the heap in the expected order
        // see comment on expectColumnMajor for overview
        expect(metric[0][0][1]).toEqual(metric[0][0][0] + 1);
        expect(metric[0][1][0]).toEqual(metric[0][0][0] + numFreeParams);
        expect(metric[1][0][0]).toEqual(
          metric[0][0][0] + numFreeParams * numFreeParams,
        );
      }
    });

    test("seeding works", async () => {
      const { mockedModule, model } = await getMockedModel({});

      const seed = 123;
      model.sample({ seed });

      expect(mockedModule._tinystan_sample).toHaveBeenNthCalledWith(
        1,
        ...Array(3).fill(expect.any(Number)),
        seed,
        ...Array(24).fill(expect.any(Number)),
      );
    });

    test("errors on bad output sizes", async () => {
      const { mockedModule, model } = await getMockedModel({});
      expect(() => model.sample({ num_chains: 0 })).toThrow(/num_chains/);
      expect(() => model.sample({ num_samples: 0 })).toThrow(/num_samples/);
      expect(() => model.sample({ num_warmup: -1 })).toThrow(/num_warmup/);

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
    });
  });

  describe("pathfinder function", () => {
    test("null call behavior", async () => {
      const { mockedModule, model } = await getMockedModel({});
      model.pathfinder({});

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
    });

    test("erroring call behavior", async () => {
      const { mockedModule, model } = await getMockedModel({ returnCode: 1 });
      expect(() => model.pathfinder({})).toThrow(/Error inside WASM/);

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
    });

    test("model with no free parameters throws", async () => {
      const { mockedModule, model } = await getMockedModel({
        numFreeParams: 0,
      });
      expect(() => model.pathfinder({})).toThrow(/no parameters/);

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
    });

    test("failure in model construction throws", async () => {
      const { mockedModule, model, getStdout } = await getMockedModel({
        modelFails: true,
      });
      expect(() => model.pathfinder({})).toThrow(/Error inside WASM/);

      expect(getStdout()).toMatch(/Error inside WASM/);
      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
    });

    test("data can be string or record", async () => {
      const { mockedModule, model } = await getMockedModel({});

      const data = { hi: 1 };
      const dataStr = JSON.stringify(data);

      model.pathfinder({ data });
      expect(mockedModule.stringToUTF8).toHaveBeenNthCalledWith(
        1,
        dataStr,
        expect.any(Number),
        expect.any(Number),
      );

      mockedModule.stringToUTF8.mockClear();

      model.pathfinder({ data: dataStr });
      expect(mockedModule.stringToUTF8).toHaveBeenNthCalledWith(
        1,
        dataStr,
        expect.any(Number),
        expect.any(Number),
      );

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(2);
    });

    test("output is correct shape and layout", async () => {
      const { model } = await getMockedModel({
        paramNames: "a,b",
      });

      const num_paths = 3;
      const num_draws = 5;
      const num_multi_draws = 7;
      const N_PARAMS = PATHFINDER_VARIABLES.length + 2;

      // Three cases:
      // 1. psis_resample = true, calculate_lp = true
      //    - draws is num_params x num_multi_draws
      // the following two are the same, as not calculating lp
      // implies we cannot resample
      // 2. psis_resample = false, , calculate_lp = true
      //    - draws is num_params x (num_draws * num_paths)
      // 3. calculate_lp = false
      //    - draws is num_params x (num_draws * num_paths)
      for (const [psis_resample, calculate_lp] of [
        [true, true],
        [false, true],
        [true, false],
      ]) {
        const EXPECTED_SAMPLES =
          calculate_lp && psis_resample
            ? num_multi_draws
            : num_draws * num_paths;

        const { draws, paramNames } = model.pathfinder({
          num_paths,
          num_draws,
          num_multi_draws,
          psis_resample,
          calculate_lp,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) => expect(d.length).toEqual(EXPECTED_SAMPLES));

        expectColumnMajor(draws, N_PARAMS, EXPECTED_SAMPLES);
      }
    });

    test("seeding works", async () => {
      const { mockedModule, model } = await getMockedModel({});

      const seed = 123;
      model.pathfinder({ seed });

      expect(mockedModule._tinystan_pathfinder).toHaveBeenNthCalledWith(
        1,
        ...Array(3).fill(expect.any(Number)),
        seed,
        ...Array(20).fill(expect.any(Number)),
      );
    });

    test("errors on bad output sizes", async () => {
      const { mockedModule, model } = await getMockedModel({});
      expect(() => model.pathfinder({ num_paths: 0 })).toThrow(/num_paths/);
      expect(() => model.pathfinder({ num_draws: 0 })).toThrow(/num_draws/);
      expect(() => model.pathfinder({ num_multi_draws: 0 })).toThrow(
        /num_multi_draws/,
      );

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
    });
  });
});

// By construction, our mocked heap has consecutive integer
// values.
// In real Stan, the draws are written out row-major order,
// but we return a parameter-wise (column-major) array.
// So, this tests that the same draw (row) from adjacent
// parameters was taken from adjacent memory, and that the
// next draw was from 'cols' away in memory
//
// Example:
// A model with 4 parameters would produce the following if there
// were 3 draws:
// HEAP:
// 1 2 3 4 5 6 7 8 9 10 11 12
// 4x3 OUTPUT:
// [[1 4 7 10] [2 5 8 11] [3 6 9 12]]
function expectColumnMajor(draws: number[][], cols: number, rows: number) {
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      // the following parameter is the previous parameter + 1
      expect(draws[i + 1][j]).toEqual(draws[i][j] + 1);

      // the following draw for a given parameter is the previous
      // parameter + cols
      expect(draws[i][j + 1]).toEqual(draws[i][j] + cols);
    }
  }
}
