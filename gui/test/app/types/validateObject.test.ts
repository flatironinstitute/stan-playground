import { describe, expect, test } from 'vitest';
import { isString } from '../../../src/app/types/validateObject';

describe("validateObject isString", () => {
  const expected = [
    { value: "I am a string", result: true },
    { value: 5, result: false }
  ]

  expected.map((o): void => {
    test.concurrent(`isString returns expected value for ${typeof(o.value)}`, () => {
        expect(isString(o.value)).toEqual(o.result);
    })
  })
})
