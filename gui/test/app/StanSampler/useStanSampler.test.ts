// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import "@vitest/web-worker";
import { afterEach, describe, expect, test, vi } from "vitest";
import mockedLoad, {
  erroringCompiledMainJsUrl,
  erroringSamplingOpts,
  mockCompiledMainJsUrl,
  mockedDraws,
  mockedParamNames,
  mockedProgress,
} from "./MockStanModel";

import { defaultSamplingOpts } from "@SpCore/ProjectDataModel";
import useStanSampler from "@SpStanSampler/useStanSampler";

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
  const sampler = renderHook(() => useStanSampler(mockCompiledMainJsUrl));
  await waitFor(() => {
    expect(sampler.result.current.latestRun.status).toBe("loaded");
  });
  return sampler;
};

const rerenderableSampler = async () => {
  const sampler = renderHook((url: string | undefined) => useStanSampler(url), {
    initialProps: undefined,
  });
  return sampler;
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

  test("cannot sample after unmount", async () => {
    const { result, unmount } = await loadedSampler();

    expect(mockedStdout).not.toHaveBeenCalledWith("terminating model worker");
    unmount();
    expect(mockedStdout).toHaveBeenCalledWith("terminating model worker");

    act(() => {
      expect(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      }).toThrowError("model worker is undefined");
    });

    await waitFor(() => {
      // e.g. not "sampling"
      expect(result.current.latestRun.status).toBe("loaded");
    });
  });

  describe("status changes", () => {
    test("loading changes status", async () => {
      const { result, rerender } = await rerenderableSampler();

      expect(result.current.latestRun.status).toBe("");

      rerender(mockCompiledMainJsUrl);

      expect(result.current.latestRun.status).toBe("loading");

      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("loaded");
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    test("failing to load changes status", async () => {
      const { result, rerender } = await rerenderableSampler();

      expect(result.current.latestRun.status).toBe("");

      rerender(erroringCompiledMainJsUrl);

      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("loading");
      });

      await waitFor(() => {
        expect(mockedStderr).toHaveBeenCalledWith("error for testing in load!");
      });

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("failed");
        expect(result.current.latestRun.errorMessage).toBe(
          "Model not loaded yet!",
        );
      });
    });

    test("sampling changes status", async () => {
      const { result } = await loadedSampler();

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("completed");
        expect(result.current.latestRun.runResult?.paramNames).toEqual(
          mockedParamNames,
        );
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    test("error during sampling changes status", async () => {
      const { result } = await loadedSampler();

      act(() => {
        result.current.sampler?.sample({}, erroringSamplingOpts);
      });

      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("failed");
        expect(result.current.latestRun.errorMessage).toBe(
          "Error: error for testing in sample!",
        );
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    test("cancelling reloads", async () => {
      const { result } = await loadedSampler();
      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });
      // NOTE: Because vitest-web-worker does not actually run anything concurrently,
      // we cannot include this assertion.
      // await waitFor(() => {
      //   expect(result.current.latestRun.status).toBe("sampling");
      // });

      // cancelling resets to "loaded"
      act(() => {
        result.current.sampler?.cancel();
      });
      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("loaded");
      });

      // can still sample afterwards
      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(result.current.latestRun.status).toBe("completed");
        expect(result.current.latestRun.runResult?.paramNames).toEqual(
          mockedParamNames,
        );
      });

      expect(mockedStderr).not.toHaveBeenCalled();
    });
  });

  describe("progress updates", () => {
    test("sampling changes status", async () => {
      const { result } = await loadedSampler();

      expect(result.current.latestRun.progress).toBeUndefined();

      act(() => {
        result.current.sampler?.sample({}, defaultSamplingOpts);
      });

      await waitFor(() => {
        expect(result.current.latestRun.progress).toEqual(mockedProgress);
      });

      expect(mockedStderr).not.toHaveBeenCalled();
    });
  });

  describe("outputs", () => {
    test("undefined sampler returns undefined", () => {
      const { result } = renderHook(() => useStanSampler(undefined));
      expect(result.current.latestRun.runResult?.draws).toBeUndefined();
      expect(result.current.latestRun.runResult?.paramNames).toBeUndefined();
      expect(
        result.current.latestRun.runResult?.computeTimeSec,
      ).toBeUndefined();
    });

    test("sampling changes output", async () => {
      const { result } = await loadedSampler();

      expect(result.current.latestRun.runResult?.draws).toBeUndefined();
      expect(result.current.latestRun.runResult?.paramNames).toBeUndefined();
      expect(
        result.current.latestRun.runResult?.computeTimeSec,
      ).toBeUndefined();
      expect(result.current.latestRun.samplingOpts).toBeUndefined();

      const testingSamplingOpts = {
        ...defaultSamplingOpts,
        num_chains: 3,
        seed: 12345,
      };
      act(() => {
        result.current.sampler?.sample({}, testingSamplingOpts);
      });

      await waitFor(() => {
        expect(result.current.latestRun.samplingOpts).toBe(testingSamplingOpts);
        expect(result.current.latestRun.runResult).toBeDefined();
        expect(result.current.latestRun.runResult?.draws).toEqual(mockedDraws);
        expect(result.current.latestRun.runResult?.paramNames).toEqual(
          mockedParamNames,
        );
        expect(
          result.current.latestRun.runResult?.computeTimeSec,
        ).toBeDefined();
      });

      expect(result.current.latestRun.status).toBe("completed");
    });
  });
});
