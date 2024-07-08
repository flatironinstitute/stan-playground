// @vitest-environment jsdom

import { expect, test, describe, vi, afterEach } from "vitest";
import "@vitest/web-worker";
import { renderHook, waitFor, act } from "@testing-library/react";
import useStanSampler, {
  useSamplerProgress,
  useSamplerStatus,
} from "../../../src/app/StanSampler/useStanSampler";
import { defaultSamplingOpts } from "../../../src/app/StanSampler/StanSampler";

import fakeURL from "./empty.js?url";

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
  return [ret, status] as const;
};

describe("useStanSampler", () => {
  test("empty URL should return undefined", () => {
    const { result } = renderHook(() => useStanSampler(undefined));

    expect(result.current.sampler).toBeUndefined();
  });

  test("other URLs are nonempty", async () => {
    const { result, unmount } = renderHook(() => useStanSampler(fakeURL));

    expect(result.current.sampler).toBeDefined();

    expect(mockedStdout).not.toHaveBeenCalledWith("terminating model worker");
    unmount();
    expect(mockedStdout).toHaveBeenCalledWith("terminating model worker");
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
});
