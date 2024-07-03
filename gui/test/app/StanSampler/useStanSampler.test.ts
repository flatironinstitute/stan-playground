// @vitest-environment jsdom

import { expect, test, describe, vi, afterEach } from "vitest";
import "@vitest/web-worker";
import { renderHook, waitFor } from "@testing-library/react";
import useStanSampler from "../../../src/app/StanSampler/useStanSampler";
import StanModel from "tinystan";
import mockModelLoad from "./MockStanModel";

const mockedStdout = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);
const mockedStderr = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

const mockedLoadModel = vi
  .spyOn(StanModel, "load")
  .mockImplementation(mockModelLoad);

afterEach(() => {
  mockedStdout.mockClear();
  mockedStderr.mockClear();
  mockedLoadModel.mockClear();
});

describe("useStanSampler", () => {
  test("empty URL should return undefined", () => {
    const { result } = renderHook(() => useStanSampler(undefined));

    expect(result.current.sampler).toBeUndefined();
  });

  test("other URLs are nonempty", () => {
    const { result, unmount } = renderHook(() => useStanSampler("localhost"));

    expect(result.current.sampler).toBeDefined();

    expect(mockedStdout).not.toHaveBeenCalledWith("terminating model worker");
    unmount();
    waitFor(() => {
      expect(mockedStdout).toHaveBeenCalledWith("terminating model worker");
    });
  });
});
