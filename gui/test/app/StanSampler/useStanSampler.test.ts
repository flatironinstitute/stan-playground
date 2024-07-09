// @vitest-environment jsdom

import { expect, test, describe, vi, afterEach, onTestFinished } from "vitest";
import "@vitest/web-worker";
import { renderHook, waitFor, act } from "@testing-library/react";
import useStanSampler, {
  useSamplerOutput,
  useSamplerProgress,
  useSamplerStatus,
} from "../../../src/app/StanSampler/useStanSampler";
import { defaultSamplingOpts } from "../../../src/app/StanSampler/StanSampler";

import fakeURL from "./empty.js?url";
import erroringURL from "./fail.js?url";
const erroringSamplingOpts = {
  ...defaultSamplingOpts,
  num_chains: 999,
};

const mockedStdout = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);
const mockedStderr = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

vi.mock("tinystan", async (importOriginal) => {
  const mockedLoad = await import("./MockStanModel");
  const mod = await importOriginal<typeof import("tinystan")>();
  mod.default.load = mockedLoad.default;
  return mod;
});

afterEach(() => {
  vi.clearAllMocks();
});

const loadedSampler = async () => {
  const ret = renderHook(() => useStanSampler(fakeURL));
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

describe("useStanSampler", () => {
  test("empty URL should return undefined", () => {
    const { result } = renderHook(() => useStanSampler(undefined));

    expect(result.current.sampler).toBeUndefined();
  });

  test("other URLs are nonempty", async () => {
    const { result } = renderHook(() => useStanSampler(fakeURL));

    expect(result.current.sampler).toBeDefined();
  });

  describe("useSamplerStatus", () => {
    test("loading changes status", async () => {
      const { result, rerender } = renderHook(
        (props: { url: string } | undefined) => useStanSampler(props?.url),
        { initialProps: undefined },
      );

      const { result: statusResult, rerender: rerenderStatus } = renderHook(
        (sampler) => useSamplerStatus(sampler),
        { initialProps: result.current.sampler },
      );

      expect(statusResult.current.status).toBe("");

      rerender({ url: fakeURL });
      rerenderStatus(result.current.sampler);

      await waitFor(() => {
        expect(statusResult.current.status).toBe("loading");
      });

      await waitFor(() => {
        expect(statusResult.current.status).toBe("loaded");
      });
      expect(mockedStderr).not.toHaveBeenCalled();
    });

    test("failing to load changes status", async () => {
      const { result, rerender } = renderHook(
        (props: { url: string } | undefined) => useStanSampler(props?.url),
        { initialProps: undefined },
      );

      const { result: statusResult, rerender: rerenderStatus } = renderHook(
        (sampler) => useSamplerStatus(sampler),
        { initialProps: result.current.sampler },
      );

      expect(statusResult.current.status).toBe("");

      rerender({ url: erroringURL });
      rerenderStatus(result.current.sampler);

      await waitFor(() => {
        expect(statusResult.current.status).toBe("loading");
      });

      await waitFor(() => {
        expect(mockedStderr).toHaveBeenCalledWith(
          new Error("error for testing in load!"),
        );
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
        expect(progress.current).toBeDefined();
        expect(progress.current?.iteration).toBe(123);
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
        expect(output.current.draws).toEqual([
          [1, 2],
          [3, 4],
        ]);
        expect(output.current.paramNames).toEqual(["a", "b"]);
        expect(output.current.numChains).toBe(4);
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
