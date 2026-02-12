import {
  base64decode,
  base64encode,
  encodeTextFile,
  tryDecodeText,
} from "@SpUtil/files";
import { describe, expect, test } from "vitest";

describe("file utilities", () => {
  test("Text encoding round-trips", () => {
    const text = "Hello, world!\nThis is a test of text encoding.";
    const file = encodeTextFile("test.txt", text);
    const decoded = tryDecodeText(file.content);
    expect(decoded).toBeDefined();
    expect(decoded).toBe(text + "\n");
  });

  test("Base-64 encoding round trips", () => {
    const text = "Hello, world!\nThis is a test of base-64 encoding.";
    const file = encodeTextFile("test.txt", text);
    const encoded = base64encode(file);
    const decodedFile = base64decode(encoded);

    expect(decodedFile.name).toBe(file.name);
    expect(file.content).toEqual(decodedFile.content);
  });

  test("base64 encoding can round-trip binary data through json", () => {
    const binaryData = new Uint8Array([0, 255, 128, 64, 32, 0, 1, 2, 3, 4]);
    const file = { name: "binary.dat", content: binaryData };
    const encoded = base64encode(file);

    const json = JSON.stringify(encoded);

    const parsed = JSON.parse(json);

    const decodedFile = base64decode(parsed);
    expect(decodedFile.name).toBe(file.name);
    expect(file.content).toEqual(decodedFile.content);
  });
});
