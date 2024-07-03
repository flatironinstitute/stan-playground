// @vitest-environment jsdom
import { expect, test, describe } from "vitest";
import "@vitest/web-worker";
import {
  defaultSamplingOpts,
  isSamplingOpts,
} from "../../../src/app/StanSampler/StanSampler";

describe("isSamplingOpts", () => {
  test("defaultSamplingOpts passes", () => {
    expect(isSamplingOpts(defaultSamplingOpts)).toBe(true);
  });

  test("nonexistent options fail", () => {
    expect(isSamplingOpts(undefined)).toBe(false);
    expect(isSamplingOpts(false)).toBe(false);
    expect(isSamplingOpts(0)).toBe(false);
  });
});
