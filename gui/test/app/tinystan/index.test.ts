import { describe, expect, test } from 'vitest';
import { exportedForTesting } from '../../../src/app/tinystan';

describe("tinystan string_safe_jsonify", () => {
    const { string_safe_jsonify } = exportedForTesting
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
    // testing an exception
    test("string_safe_jsonify returns non-parseable object on string input", () => {
        const notValidJson = "I am a string, do not ask too much of me";
        // Note that we have to pass a wrapper function to expect in this case, not just
        // the function-under-test itself.
        // toThrow takes /a regex/ for matching the error text if desired.
        expect(() => JSON.parse(string_safe_jsonify(notValidJson))).toThrow(/not valid JSON/);
    })
})
