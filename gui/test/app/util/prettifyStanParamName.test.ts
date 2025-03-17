import prettifyStanParamName from "@SpUtil/prettifyStanParamName";
import { describe, expect, test } from "vitest";

describe("normalizeLineEndings", () => {
  test("Basic name is untouched", () => {
    const before = "alpha";
    const actual = prettifyStanParamName(before);
    expect(actual).toBe(before);
  });

  test("Basic indexing gets rewritten", () => {
    const actual = prettifyStanParamName("theta.7");
    expect(actual).toStrictEqual("theta[7]");
  });

  test("Tuple access gets rewritten", () => {
    const actual = prettifyStanParamName("foo:1");
    expect(actual).toStrictEqual("foo.1");
  });

  test("Multidimensional indexing gets combined", () => {
    const actual = prettifyStanParamName("bar.3.2.4");
    expect(actual).toStrictEqual("bar[3,2,4]");
  });

  test("Nested tuples get rewritten", () => {
    const actual = prettifyStanParamName("flub:3:2:4");
    expect(actual).toStrictEqual("flub.3.2.4");
  });

  test("Combinations of tuples and indexing are handled", () => {
    const actual = prettifyStanParamName("psi:1.2.3:2.4");
    expect(actual).toStrictEqual("psi.1[2,3].2[4]");
  });
});
