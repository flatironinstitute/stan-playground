// see https://vitest.dev/guide/extending-matchers.html
import type { Assertion, AsymmetricMatchersContaining } from "vitest";

interface CustomMatchers<R = undefined> {
  toHaveNoMemoryLeaks: () => R;
}
declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
