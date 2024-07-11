// @vitest-environment jsdom

import { expect, test, describe, vi, afterEach, onTestFinished } from "vitest";
import "@vitest/web-worker";
import { renderHook, waitFor, act } from "@testing-library/react";
import mockedLoad, {
  mockCompiledMainJsUrl,
  erroringCompiledMainJsUrl,
  erroringSamplingOpts,
  mockedDraws,
  mockedParamNames,
  mockedProgress,
} from "./MockStanModel";

import useStanSampler, {
  useSamplerOutput,
  useSamplerProgress,
  useSamplerStatus,
} from "../../../src/app/StanSampler/useStanSampler";
import { defaultSamplingOpts } from "../../../src/app/Project/ProjectDataModel";
import type StanSampler from "../../../src/app/StanSampler/StanSampler";

const mockedStdout = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);
const mockedStderr = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

vi.mock("tinystan", async (importOriginal) => {
  const mod = await importOriginal<typeof import("tinystan")>();
  mod.default.load = mockedLoad;
  return mod;
});

afterEach(() => {
  vi.clearAllMocks();
});

const loadedSampler = async () => {
  const ret = renderHook(() => useStanSampler(mockCompiledMainJsUrl));
  const status = renderHook(() => useSamplerStatus(ret.result.current.sampler));
  await waitFor(() => {
    expect(status.result.current.status).toBe("loaded");
  });

  onTestFinished(() => {
    expect(ret.result.current.sampler?.status).toEqual(
      status.result.current.status,
    );

    expect(mockedStdout).not.toHaveBeenCalledWith("terminating model worker");
    ret.unmount();
    expect(mockedStdout).toHaveBeenCalledWith("terminating model worker");
  });

  return [ret, status] as const;
};

const rerenderableSampler = async () => {
  const ret = renderHook((url: string | undefined) => useStanSampler(url), {
    initialProps: undefined,
  });
  const status = renderHook(
    (sampler: StanSampler | undefined) => useSamplerStatus(sampler),
    {
      initialProps: ret.result.current.sampler,
    },
  );

  return [ret, status] as const;
};

describe("useStanSampler", () => {
  test("empty URL should return undefined", () => {
    const { result } = renderHook(() => useStanSampler(undefined));

    expect(result.current.sampler).toBeUndefined();
  });

  test("other URLs are nonempty", async () => {
    const { result } = renderHook(() => useStanSampler(mockCompiledMainJsUrl));

    expect(result.current.sampler).toBeDefined();
  });

  describe("useSamplerStatus", () => {
    test("loading changes status", async () => {
      const [
        { result, rerender },
        { result: statusResult, rerender: rerenderStatus },
      ] = await rerenderableSampler();

      expect(statusResult.current.status).toBe("");

      rerender(mockCompiledMainJsUrl);
      rerenderStatus(result.current.sampler);

      expect(statusResult.current.status).toBe("loading");

      await waitFor(() => {
        expect(statusResult.current.status).toBe("loaded");
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    test("failing to load changes status", async () => {
      const [
        { result, rerender },
        { result: statusResult, rerender: rerenderStatus },
      ] = await rerenderableSampler();

      expect(statusResult.current.status).toBe("");

      rerender(erroringCompiledMainJsUrl);
      rerenderStatus(result.current.sampler);

      await waitFor(() => {
        expect(statusResult.current.status).toBe("loading");
      });

      await waitFor(() => {
        expect(mockedStderr).toHaveBeenCalledWith("error for testing in load!");
      });

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(statusResult.current.status).toBe("failed");
        expect(statusResult.current.errorMessage).toBe("Model not loaded yet!");
      });
    });

    test("sampling changes status", async () => {
      const [{ result }, { result: statusResult }] = await loadedSampler();

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(statusResult.current.status).toBe("completed");
        expect(result.current.sampler?.paramNames).toEqual(["a", "b"]);
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    test("error during sampling changes status", async () => {
      const [{ result }, { result: statusResult }] = await loadedSampler();

      act(() => {
        result.current.sampler?.sample({}, erroringSamplingOpts);
      });

      await waitFor(() => {
        expect(statusResult.current.status).toBe("failed");
        expect(statusResult.current.errorMessage).toBe(
          "Error: error for testing in sample!",
        );
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    // NOTE: Because vitest-web-worker does not actually run anything concurrently, this test will not work
    // test("cancelling reloads", async () => {
    //   const [{ result }, { result: statusResult }] = await loadedSampler();
    //   act(() => {
    //     result.current.sampler?.sample({}, defaultSamplingOpts);
    //   });
    //   act(() => {
    //     result.current.sampler?.cancel();
    //   });
    //   await waitFor(() => {
    //     expect(statusResult.current.status).toBe("loaded");
    //   });
    //   expect(mockedStderr).not.toHaveBeenCalled();
    // });
  });

  describe("useSamplerProgress", () => {
    test("sampling changes status", async () => {
      const [{ result }] = await loadedSampler();

      const { result: progress } = renderHook(() =>
        useSamplerProgress(result.current.sampler),
      );

      expect(progress.current).toBeUndefined();

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(progress.current).toEqual(mockedProgress);
      });

      expect(mockedStderr).not.toHaveBeenCalled();
    });
  });

  describe("useSamplerOutput", () => {
    test("undefined sampler returns undefined", () => {
      const { result } = renderHook(() => useSamplerOutput(undefined));
      expect(result.current.draws).toBeUndefined();
      expect(result.current.paramNames).toBeUndefined();
      expect(result.current.numChains).toBeUndefined();
      expect(result.current.computeTimeSec).toBeUndefined();
    });

    test("sampling changes output", async () => {
      const [{ result }] = await loadedSampler();

      const { result: output } = renderHook(() =>
        useSamplerOutput(result.current.sampler),
      );

      expect(output.current.draws).toBeUndefined();
      expect(output.current.paramNames).toBeUndefined();
      expect(output.current.numChains).toBeUndefined();
      expect(output.current.computeTimeSec).toBeUndefined();

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(output.current.draws).toEqual(mockedDraws);
        expect(output.current.paramNames).toEqual(mockedParamNames);
        expect(output.current.numChains).toBe(defaultSamplingOpts.num_chains);
        expect(output.current.computeTimeSec).toBeDefined();
      });

      expect(result.current.sampler?.status).toBe("completed");

      expect(result.current.sampler?.draws).toBe(output.current.draws);
      expect(result.current.sampler?.paramNames).toBe(
        output.current.paramNames,
      );
      expect(result.current.sampler?.samplingOpts).toBe(defaultSamplingOpts);
      expect(result.current.sampler?.computeTimeSec).toBe(
        output.current.computeTimeSec,
      );
    });
  });
});
