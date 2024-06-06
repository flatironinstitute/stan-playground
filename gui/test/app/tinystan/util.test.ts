import { describe, expect, test } from 'vitest';
import { string_safe_jsonify } from '../../../src/app/tinystan/util';

describe("tinystan string_safe_jsonify", () => {
    test("string_safe_jsonify does not modify string objects", () => {
        const mystr = "I am a string";
        // toBe: insist on referential equality
        expect(string_safe_jsonify(mystr)).toBe(mystr);
    })
    test("string_safe_jsonify roundtrips non-string objects", () => {
        const myobj = { a: "I'm a string", b: 15 };
        const roundTripped = JSON.parse(string_safe_jsonify(myobj));
        // toEqual: property equivalence. You probably want to use this one.
        expect(myobj).toEqual(roundTripped);
    })
    test("repeated string_safe_jsonify calls are idempotent", () => {
        const myobj = { a: "I'm a string", b: 15 };
        const stringified = string_safe_jsonify(myobj);
        const stringifiedTwice = string_safe_jsonify(stringified);
        expect(stringified).toEqual(stringifiedTwice);

        const roundTripped = JSON.parse(stringified);
        expect(roundTripped).toEqual(myobj);
    });
    // testing an exception
    test("string_safe_jsonify returns non-parseable object on string input", () => {
        const notValidJson = "I am a string, do not ask too much of me";
        // Note that we have to pass a wrapper function to expect in this case, not just
        // the function-under-test itself.
        // toThrow takes /a regex/ for matching the error text if desired.
        expect(() => JSON.parse(string_safe_jsonify(notValidJson))).toThrow(/not valid JSON/);
    })
})
