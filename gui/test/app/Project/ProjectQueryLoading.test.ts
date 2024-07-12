import {
  fromQueryParams,
  //   fetchRemoteProject,
  QueryParamKeys,
  queryStringHasParameters,
} from "@SpCore/ProjectQueryLoading";
import { afterEach, describe, expect, test, vi } from "vitest";

class MockSearchParams {
  keysDict: { [key: string]: string };
  constructor(dict: { [key: string]: string }) {
    this.keysDict = dict;
  }

  keys(): string[] {
    return Object.keys(this.keysDict);
  }

  get(field: string): string {
    return this.keysDict[field];
  }

  set(field: string, value: string): void {
    this.keysDict[field] = value;
  }
}

const baseParams: { [key: string]: string } = {};
baseParams[QueryParamKeys.Project] = "my project";
baseParams[QueryParamKeys.Title] = "my title";

const baseSearchParams = new MockSearchParams(baseParams);

const mockedConsoleWarn = vi
  .spyOn(console, "warn")
  .mockImplementation(() => undefined);

afterEach(() => {
  mockedConsoleWarn.mockClear();
});

describe("Project query parameter processing", () => {
  describe("Query string object creation", () => {
    test("correctly populates provided query parameters", () => {
      const parsedParams = fromQueryParams(
        baseSearchParams as unknown as URLSearchParams,
      );
      expect(parsedParams.data).toBeUndefined();
      expect(parsedParams.project).toEqual(baseParams[QueryParamKeys.Project]);
      expect(parsedParams.title).toEqual(baseParams[QueryParamKeys.Title]);
    });

    test("warns on unknown query parameter", () => {
      const paramsWithBadParam = { ...baseParams, UNKNOWN: "some value" };
      const badSearchParams = new MockSearchParams(paramsWithBadParam);
      const parsedParams = fromQueryParams(
        badSearchParams as unknown as URLSearchParams,
      );
      expect(mockedConsoleWarn).toHaveBeenCalledWith(
        "Unknown query parameter",
        "UNKNOWN",
      );
      expect(parsedParams.project).toEqual(baseParams[QueryParamKeys.Project]);
      expect(parsedParams.title).toEqual(baseParams[QueryParamKeys.Title]);
    });
  });

  describe("Query string nullity check", () => {
    test("Returns true if query has some non-null elements", () => {
      const fakeQuery: any = baseParams;
      expect(queryStringHasParameters(fakeQuery)).toEqual(true);
    });

    test("Returns false if query object has no non-null elements", () => {
      const emptyQuery: any = {};
      expect(queryStringHasParameters(emptyQuery)).toEqual(false);
    });
  });
});

// TODO: Testing fetchRemoteProject
