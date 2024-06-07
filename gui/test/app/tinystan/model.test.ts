import { describe, expect, test } from "vitest";
import { getMockedModel } from "./mocking/WASMModule";

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
      expect(() => model.sample({})).toThrow("Error at address 999");

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(1);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("empty model errors", async () => {
      const { mockedModule, model } = await getMockedModel({ numParams: 0 });
      expect(() => model.sample({})).toThrow(/no parameters/);

      expect(mockedModule._tinystan_sample).toHaveBeenCalledTimes(0);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("output is correct shape and layout", async () => {
      const { mockedModule, model } = await getMockedModel({
        paramNames: "a,b",
      });

      const num_chains = 3;
      const num_samples = 5;

      const { draws, paramNames } = model.sample({ num_chains, num_samples });

      expect(paramNames).toContain("a");
      expect(paramNames).toContain("b");
      expect(draws.length).toEqual(paramNames.length);

      const N_PARAMS = 9; // 7 from HMC, a and b
      expect(draws.length).toEqual(N_PARAMS);
      draws.forEach((d) => expect(d.length).toEqual(num_chains * num_samples));

      // ensure we are reading out of the heap in the expected order
      expect(draws[8][0]).toEqual(draws[7][0] + 1);
      expect(draws[8][1]).toEqual(draws[8][0] + N_PARAMS);

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
      expect(() => model.pathfinder({})).toThrow("Error at address 999");

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(1);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });

    test("empty model errors", async () => {
      const { mockedModule, model } = await getMockedModel({ numParams: 0 });
      expect(() => model.pathfinder({})).toThrow(/no parameters/);

      expect(mockedModule._tinystan_pathfinder).toHaveBeenCalledTimes(0);
      expect(mockedModule).toHaveNoMemoryLeaks();
    });
  });
});
