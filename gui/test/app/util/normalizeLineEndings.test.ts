import { normalizeLineEndings } from "@SpUtil/normalizeLineEndings";
import { describe, expect, test } from "vitest";

describe("normalizeLineEndings", () => {
  test("should replace all CRLF with LF", () => {
    const actual = normalizeLineEndings("foo\r\nbar\r\nbaz\r\n");
    expect(actual).toBe("foo\nbar\nbaz\n");
  });

  test("leaves LF alone", () => {
    const before = "foo\nbar\nbaz\n";
    const actual = normalizeLineEndings(before);
    expect(actual).toBe(before);
  });
});
