import { afterEach, describe, expect, test, vi } from "vitest";
import {
  fetchRemoteProject,
  fromQueryParams,
  QueryParamKeys,
  queryStringHasParameters,
} from "@SpCore/ProjectQueryLoading";
import {
  defaultSamplingOpts,
  initialDataModel,
  ProjectKnownFiles,
  SamplingOpts,
} from "@SpCore/ProjectDataModel";

const mockedConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

const mockedAlert = vi.fn();
globalThis.alert = mockedAlert;

const mockedConsoleWarn = vi
  .spyOn(console, "warn")
  .mockImplementation(() => undefined);

const hoistedMocks = vi.hoisted(() => {
  const mockedSamplingOpts: SamplingOpts = {
    num_chains: 123,
    num_samples: 456,
    num_warmup: 789,
    init_radius: 0.1,
    seed: 987654321,
  } as const;

  const tryFetch = vi.fn(async (url: string) => {
    console.error("url", url);
    if (url === "good") {
      return "good data";
    }
    if (url === "good_sampling_opts") {
      return JSON.stringify(mockedSamplingOpts);
    }
    return undefined;
  });

  const mockedGistFiles = {
    description: "gist discription",
    files: {
      "main.stan": "gist stan code",
      "data.json": '{"data": "gist data"}',
      "analysis.py": "gist analysis.py",
      "analysis.R": "gist analysis.R",
      "data.py": "gist data.py",
      "data.R": "gist data.R",
      "sampling_opts.json": JSON.stringify(mockedSamplingOpts),
      "extra.txt": "gist extra",
    },
  };

  const loadFilesFromGist = vi.fn(async (gistUri: string) => {
    if (gistUri === "https://gist.github.com/test/good") {
      return mockedGistFiles;
    }
    return Promise.reject("bad url");
  });

  return {
    mockedSamplingOpts,
    tryFetch,
    mockedGistFiles,
    loadFilesFromGist,
  };
});

vi.mock("@SpUtil/tryFetch", async () => {
  return { tryFetch: hoistedMocks.tryFetch };
});

vi.mock("@SpCore/gists/loadFilesFromGist", async () => {
  return { default: hoistedMocks.loadFilesFromGist };
});

afterEach(() => {
  mockedConsoleError.mockClear();
  hoistedMocks.tryFetch.mockClear();
  hoistedMocks.loadFilesFromGist.mockClear();
  mockedConsoleWarn.mockClear();
  mockedAlert.mockClear();
});

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

describe("Query fetching", () => {
  test("fetchRemoteProject gets title", async () => {
    const queryParam = new URLSearchParams("title=my title");
    const queries = fromQueryParams(queryParam);

    const project = await fetchRemoteProject(queries);
    expect(project.meta.title).toEqual("my title");
  });

  const keyToDataModel = {
    stan: "stanFileContent",
    data: "dataFileContent",
    analysis_py: "analysisPyFileContent",
    analysis_r: "analysisRFileContent",
    data_py: "dataPyFileContent",
    data_r: "dataRFileContent",
  } as const;

  for (const key of Object.keys(keyToDataModel)) {
    const dataModelKey = keyToDataModel[
      key as keyof typeof keyToDataModel
    ] as ProjectKnownFiles;

    test(`fetchRemoteProject fills in error for bad ${key} URL`, async () => {
      const queryParam = new URLSearchParams(key + "=badurl");
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);

      expect(project[dataModelKey]).toContain(
        "Failed to load content from badurl",
      );
      expect(project.ephemera[dataModelKey]).toContain(
        "Failed to load content from badurl",
      );
    });

    test(`fetchRemoteProject populates from good ${key} URL`, async () => {
      const queryParam = new URLSearchParams(key + "=good");
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);
      expect(project[dataModelKey]).toEqual("good data");
      expect(project.ephemera[dataModelKey]).toEqual("good data");
    });
  }

  test(`fetchRemoteProject fills in error for bad sampling_opts URL`, async () => {
    const queryParam = new URLSearchParams("sampling_opts=bad_sampling_opts");
    const queries = fromQueryParams(queryParam);

    const project = await fetchRemoteProject(queries);
    expect(project.samplingOpts).toEqual(initialDataModel.samplingOpts);
    const msg = "Failed to load content from bad_sampling_opts";
    expect(mockedConsoleError).toHaveBeenCalledWith(msg);
    expect(mockedAlert).toHaveBeenCalledWith(msg);
  });

  test(`fetchRemoteProject populates from good sampling_opts URL`, async () => {
    const queryParam = new URLSearchParams("sampling_opts=good_sampling_opts");
    const queries = fromQueryParams(queryParam);

    const project = await fetchRemoteProject(queries);
    expect(project.samplingOpts).toEqual(hoistedMocks.mockedSamplingOpts);
  });

  test(`fetchRemoteProject populates from good URL with bad JSON`, async () => {
    const queryParam = new URLSearchParams("sampling_opts=good");
    const queries = fromQueryParams(queryParam);

    const project = await fetchRemoteProject(queries);
    expect(project.samplingOpts).toEqual(defaultSamplingOpts);
    expect(mockedConsoleError).toHaveBeenCalledWith(
      "Failed to parse sampling_opts",
      expect.anything(),
    );
  });

  for (const key of Object.keys(hoistedMocks.mockedSamplingOpts)) {
    const option = key as keyof SamplingOpts;
    const value = hoistedMocks.mockedSamplingOpts[option];

    test(`fetchRemoteProject gets sampling option ${key}`, async () => {
      const queryParam = new URLSearchParams(`${key}=${value}`);
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);
      expect(project.samplingOpts[option]).toEqual(value);
      expect(mockedConsoleError).not.toHaveBeenCalled();
    });

    test(`fetchRemoteProject errors on bad ${key}`, async () => {
      const queryParam = new URLSearchParams(`${key}=bad`);
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);
      expect(project.samplingOpts[option]).toEqual(defaultSamplingOpts[option]);
      expect(mockedConsoleError).toHaveBeenCalledWith(
        "Invalid sampling options",
        expect.anything(),
      );
    });
  }

  test(`fetchRemoteProject gets sampling seed even if undefined`, async () => {
    const queryParam = new URLSearchParams("seed=undefined");
    const queries = fromQueryParams(queryParam);

    const project = await fetchRemoteProject(queries);
    expect(project.samplingOpts.seed).toBeUndefined();
    expect(mockedConsoleError).not.toHaveBeenCalled();
  });

  describe("fetchRemoteProject project handling", () => {
    test("fetchRemoteProject errors on non-gist project", async () => {
      const queryParam = new URLSearchParams("project=notgist");
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);
      expect(project).toEqual(initialDataModel);

      expect(mockedConsoleError).toHaveBeenCalledWith(
        "Unsupported project URI",
        "notgist",
      );
    });

    test("fetchRemoteProject errors when gist retrieval fails", async () => {
      const queryParam = new URLSearchParams(
        "project=https://gist.github.com/test/bad",
      );
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);
      expect(project).toEqual(initialDataModel);

      expect(mockedConsoleError).toHaveBeenCalledWith(
        "Failed to load content from gist",
        "bad url",
      );
    });

    test("fetchRemoteProject populates from good gist project", async () => {
      const queryParam = new URLSearchParams(
        "project=https://gist.github.com/test/good",
      );
      const queries = fromQueryParams(queryParam);

      const project = await fetchRemoteProject(queries);
      expect(project.stanFileContent).toEqual("gist stan code");
      expect(project.ephemera.stanFileContent).toEqual("gist stan code");
      expect(project.meta.title).toEqual("gist discription");

      expect(project.dataFileContent).toEqual('{"data": "gist data"}');
      expect(project.ephemera.dataFileContent).toEqual('{"data": "gist data"}');

      expect(project.analysisPyFileContent).toEqual("gist analysis.py");
      expect(project.ephemera.analysisPyFileContent).toEqual(
        "gist analysis.py",
      );

      expect(project.analysisRFileContent).toEqual("gist analysis.R");
      expect(project.ephemera.analysisRFileContent).toEqual("gist analysis.R");

      expect(project.dataPyFileContent).toEqual("gist data.py");
      expect(project.ephemera.dataPyFileContent).toEqual("gist data.py");

      expect(project.dataRFileContent).toEqual("gist data.R");
      expect(project.ephemera.dataRFileContent).toEqual("gist data.R");

      expect(project.samplingOpts).toEqual(hoistedMocks.mockedSamplingOpts);
    });
  });
});
