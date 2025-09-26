// @vitest-environment jsdom

import useStanc from "@SpCore/Stanc/useStanc";
import { act, renderHook, waitFor } from "@testing-library/react";
import "@vitest/web-worker";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockedStdout = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);
const mockedStderr = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

afterEach(() => {
  mockedStdout.mockClear();
  mockedStderr.mockClear();
});

describe("useStanc", () => {
  test("requestFormat should call the callback with a formatted model", async () => {
    const code = "data { int x; }";
    const setCode = vi.fn();

    const { result, unmount } = renderHook(() =>
      useStanc("main.stan", code, setCode),
    );

    expect(result.current.requestFormat).toBeTypeOf("function");

    act(() => {
      result.current.requestFormat();
    });

    await waitFor(
      () => {
        expect(setCode).toHaveBeenCalledOnce();
        expect(setCode).toHaveBeenCalledWith("data {\n  int x;\n}\n");
      },
      { timeout: 3000 },
    );

    expect(mockedStdout).not.toHaveBeenCalledWith("terminating stanc worker");
    unmount();
    expect(mockedStdout).toHaveBeenCalledWith("terminating stanc worker");
  });

  test("changing the code triggers a check", async () => {
    const initialCode = "data { int x; }";
    const setCode = vi.fn();

    const { result, rerender, unmount } = renderHook(
      ({ code }: { code: string }) => useStanc("main.stan", code, setCode),
      { initialProps: { code: initialCode } },
    );

    expect(result.current.stancErrors.errors).toBeUndefined();
    expect(result.current.stancErrors.warnings).toBeUndefined();

    rerender({ code: "data { int x; " });

    await waitFor(
      () => {
        expect(result.current.stancErrors.errors).toBeDefined();
        expect(result.current.stancErrors.errors?.[1]).toContain(
          "Syntax error",
        );
        expect(setCode).not.toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    expect(mockedStdout).not.toHaveBeenCalledWith("terminating stanc worker");
    unmount();
    expect(mockedStdout).toHaveBeenCalledWith("terminating stanc worker");
  });
});
