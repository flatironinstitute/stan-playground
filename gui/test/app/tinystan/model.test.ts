import { describe, expect, test } from "vitest";
import { getMockedModel } from "./mocking/WASMModule";
import { HMCMetric } from "../../../src/app/tinystan/types";

describe("test tinystan code with a mocked WASM module", () => {
  test("version returns and doesn't leak", async () => {
    const { mockedModule, model } = await getMockedModel({});
    const v = model.stanVersion();

    expect(v).toEqual("123.123.123");
    expect(mockedModule._tinystan_stan_version).toHaveBeenCalledTimes(1);
    expect(mockedModule).toHaveNoMemoryLeaks();
  });

  describe("sample function", () => {
    test("null call doesn't leak", async () => {
      const { mockedModule, model } = await getMockedModel({});
      model.sample({});

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("erroring call doesn't leak", async () => {
      const { mockedModule, model } = await getMockedModel({ returnCode: 1 });
      expect(() => model.sample({})).toThrow(/Error inside WASM/);

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("empty model errors", async () => {
      const { mockedModule, model } = await getMockedModel({ numParams: 0 });
      expect(() => model.sample({})).toThrow(/no parameters/);

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("model failing to allocate errors", async () => {
      const { mockedModule, model, getStdout } = await getMockedModel({
        modelFails: true,
      });
      expect(() => model.sample({})).toThrow(/Error inside WASM/);

      expect(getStdout()).toMatch(/Error inside WASM/);
      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
      expect(mockedModule).toHaveNoMemoryLeaks();
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
      expect(mockedModule).toHaveNoMemoryLeaks();
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
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("output is correct shape and layout", async () => {
      const { mockedModule, model } = await getMockedModel({
        paramNames: "a,b",
      });

      const num_chains = 3;
      const num_samples = 5;
      const num_warmup = 7;
      const N_PARAMS = 9; // 7 from HMC, a and b

      {
        // not saving warmup
        const { draws, paramNames } = model.sample({
          num_chains,
          num_samples,
          num_warmup,
          save_warmup: false,
          adapt: false,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) =>
          expect(d.length).toEqual(num_chains * num_samples),
        );

        // ensure we are reading out of the heap in the expected order
        expect(draws[8][0]).toEqual(draws[7][0] + 1);
        expect(draws[8][1]).toEqual(draws[8][0] + N_PARAMS);
      }

      {
        // save warmup
        const { draws, paramNames } = model.sample({
          num_chains,
          num_samples,
          num_warmup,
          save_warmup: true,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) =>
          expect(d.length).toEqual(num_chains * (num_samples + num_warmup)),
        );

        // ensure we are reading out of the heap in the expected order
        expect(draws[8][0]).toEqual(draws[7][0] + 1);
        expect(draws[8][1]).toEqual(draws[8][0] + N_PARAMS);
      }

      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("save_metric output is correct shape and layout", async () => {
      const numParams = 5;
      const { mockedModule, model } = await getMockedModel({ numParams });

      const num_chains = 3;

      for (const metric_choice of [HMCMetric.DIAGONAL, HMCMetric.UNIT]) {
        let { metric } = model.sample({
          save_metric: true,
          metric: metric_choice,
          num_chains,
        });
        expect(metric).toBeDefined();
        expect(metric?.length).toEqual(num_chains);
        expect(metric?.[0].length).toEqual(numParams);
        expect(Array.isArray(metric?.[0][0])).toEqual(false);
        metric = metric as number[][];

        // ensure we are reading out of the heap in the expected order
        expect(metric[0][1]).toEqual(metric[0][0] + 1);
        expect(metric[1][0]).toEqual(metric[0][0] + numParams);
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
        expect(metric?.[0].length).toEqual(numParams);
        expect(Array.isArray(metric?.[0][0])).toEqual(true);
        metric = metric as number[][][];
        expect(metric?.[0][0].length).toEqual(numParams);

        // ensure we are reading out of the heap in the expected order
        expect(metric[0][0][1]).toEqual(metric[0][0][0] + 1);
        expect(metric[0][1][0]).toEqual(metric[0][0][0] + numParams);
        expect(metric[1][0][0]).toEqual(
          metric[0][0][0] + numParams * numParams,
        );
      }

      expect(mockedModule).toHaveNoMemoryLeaks();
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
      expect(mockedModule).toHaveNoMemoryLeaks();
    });
  });

  describe("pathfinder function", () => {
    test("null call doesn't leak", async () => {
      const { mockedModule, model } = await getMockedModel({});
      model.pathfinder({});

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("erroring call doesn't leak", async () => {
      const { mockedModule, model } = await getMockedModel({ returnCode: 1 });
      expect(() => model.pathfinder({})).toThrow(/Error inside WASM/);

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("empty model errors", async () => {
      const { mockedModule, model } = await getMockedModel({ numParams: 0 });
      expect(() => model.pathfinder({})).toThrow(/no parameters/);

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("model failing to allocate errors", async () => {
      const { mockedModule, model, getStdout } = await getMockedModel({
        modelFails: true,
      });
      expect(() => model.pathfinder({})).toThrow(/Error inside WASM/);

      expect(getStdout()).toMatch(/Error inside WASM/);
      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
      expect(mockedModule).toHaveNoMemoryLeaks();
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
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("output is correct shape and layout", async () => {
      const { mockedModule, model } = await getMockedModel({
        paramNames: "a,b",
      });

      const num_paths = 3;
      const num_draws = 5;
      const num_multi_draws = 7;
      const N_PARAMS = 4; // 2 from pathfinder, a and b

      {
        // psis_resample = true
        const { draws, paramNames } = model.pathfinder({
          num_paths,
          num_draws,
          num_multi_draws,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) => expect(d.length).toEqual(num_multi_draws));

        // ensure we are reading out of the heap in the expected order
        expect(draws[3][0]).toEqual(draws[2][0] + 1);
        expect(draws[3][1]).toEqual(draws[3][0] + N_PARAMS);
      }

      {
        // psis_resample = false
        const { draws, paramNames } = model.pathfinder({
          num_paths,
          num_draws,
          num_multi_draws,
          psis_resample: false,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) => expect(d.length).toEqual(num_draws * num_paths));

        // ensure we are reading out of the heap in the expected order
        expect(draws[3][0]).toEqual(draws[2][0] + 1);
        expect(draws[3][1]).toEqual(draws[3][0] + N_PARAMS);
      }

      {
        // psis_resample = false
        const { draws, paramNames } = model.pathfinder({
          num_paths,
          num_draws,
          num_multi_draws,
          calculate_lp: false,
        });

        expect(paramNames).toContain("a");
        expect(paramNames).toContain("b");
        expect(draws.length).toEqual(paramNames.length);

        expect(draws.length).toEqual(N_PARAMS);
        draws.forEach((d) => expect(d.length).toEqual(num_draws * num_paths));

        // ensure we are reading out of the heap in the expected order
        expect(draws[3][0]).toEqual(draws[2][0] + 1);
        expect(draws[3][1]).toEqual(draws[3][0] + N_PARAMS);
      }

      expect(mockedModule).toHaveNoMemoryLeaks();
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
      expect(mockedModule).toHaveNoMemoryLeaks();
    });
  });
});
