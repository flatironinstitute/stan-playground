import { describe, expect, test } from "vitest";
import {
  printCallbackSponge,
  prepareStanJSON,
} from "../../../src/app/tinystan/util";

describe("tinystan prepareStanJSON", () => {
  test("prepareStanJSON does not modify string objects", () => {
    const mystr = "I am a string";
    expect(prepareStanJSON(mystr)).toEqual(mystr);
  });

  test("prepareStanJSON roundtrips non-string objects", () => {
    const myobj = { a: "I'm a string", b: 15 };
    const roundTripped = JSON.parse(prepareStanJSON(myobj));
    expect(myobj).toEqual(roundTripped);
  });

  test("repeated prepareStanJSON calls are idempotent", () => {
    const myobj = { a: "I'm a string", b: 15 };
    const stringified = prepareStanJSON(myobj);
    const stringifiedTwice = prepareStanJSON(stringified);
    expect(stringified).toEqual(stringifiedTwice);

    const roundTripped = JSON.parse(stringified);
    expect(roundTripped).toEqual(myobj);
  });
});

describe("printCallbackSponge is functional", () => {
  test("printCallbackSponge stores multiple calls", () => {
    const { printCallback, getStdout } = printCallbackSponge();
    printCallback("Hello");
    printCallback("World");
    expect(getStdout()).toEqual("Hello\nWorld\n");
  });

  test("clearStdout clears stored calls", () => {
    const { printCallback, getStdout, clearStdout } = printCallbackSponge();
    printCallback("Hello");
    clearStdout();
    printCallback("World");
    expect(getStdout()).toEqual("World\n");
  });
});
