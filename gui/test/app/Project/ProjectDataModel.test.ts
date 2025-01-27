import {
  DataSource,
  defaultSamplingOpts,
  exportedForTesting,
  getStringKnownFileKeys,
  isProjectDataModel,
  isProjectMetaData,
  isSamplingOpts,
  modelHasUnsavedChanges,
  parseSamplingOpts,
  persistStateToEphemera,
  ProjectKnownFiles,
  SamplingOpts,
  stringifyField,
} from "@SpCore/ProjectDataModel";
import { afterEach, assert, describe, expect, test, vi } from "vitest";

const {
  baseObjectCheck,
  validateSamplingOpts,
  isProjectBase,
  isProjectFiles,
  isProjectEphemeralData,
} = exportedForTesting;

const mockedConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

afterEach(() => {
  mockedConsoleError.mockClear();
});

// Fixtures

const validOpts: SamplingOpts = {
  num_chains: 1,
  num_warmup: 2,
  num_samples: 3,
  init_radius: 0.1,
  seed: undefined,
};
const goodProjectFiles: { [key: string]: string } = {};
Object.values(ProjectKnownFiles).forEach((f) => {
  goodProjectFiles[f] = "filename";
});
const file = Object.values(ProjectKnownFiles)[0];
const goodBase = { ...goodProjectFiles, samplingOpts: validOpts };
const validMetadata = { title: "my title" };
const goodDataModel = {
  ...goodBase,
  samplingOpts: validOpts,
  meta: validMetadata,
  ephemera: { ...goodBase },
};

describe("Sampling options parsing", () => {
  describe("Sampling options type guard", () => {
    const validOpts = {
      num_chains: 4,
      num_warmup: 5,
      num_samples: 6,
      init_radius: 0.1,
      seed: -45,
    };
    test("Accepts valid options object", () => {
      expect(isSamplingOpts(validOpts)).toBe(true);
      expect(isSamplingOpts({ ...validOpts, seed: undefined })).toBe(true);
    });
    test("Rejects on base failure", () => {
      expect(isSamplingOpts("string value")).toBe(false);
      expect(isSamplingOpts(undefined)).toBe(false);
    });
    test("Rejects on non-numeric fields", () => {
      expect(isSamplingOpts({ ...validOpts, num_chains: "string" })).toBe(
        false,
      );
      expect(isSamplingOpts({ ...validOpts, num_warmup: "string" })).toBe(
        false,
      );
      expect(isSamplingOpts({ ...validOpts, num_samples: "string" })).toBe(
        false,
      );
      expect(isSamplingOpts({ ...validOpts, init_radius: "string" })).toBe(
        false,
      );
      expect(isSamplingOpts({ ...validOpts, seed: "string" })).toBe(false);
    });
  });
  describe("Sampling options validator", () => {
    test("Base valid model is valid", () => {
      expect(validateSamplingOpts(validOpts)).toBe(true);
    });
    test("Rejects on non-integer values for integral fields", () => {
      expect(validateSamplingOpts({ ...validOpts, num_chains: 1.5 })).toBe(
        false,
      );
      expect(validateSamplingOpts({ ...validOpts, num_warmup: 1.5 })).toBe(
        false,
      );
      expect(validateSamplingOpts({ ...validOpts, num_samples: 1.5 })).toBe(
        false,
      );
    });
    test("Rejects on negative values for non-negative fields", () => {
      expect(validateSamplingOpts({ ...validOpts, num_warmup: -1.5 })).toBe(
        false,
      );
      expect(validateSamplingOpts({ ...validOpts, init_radius: -1.5 })).toBe(
        false,
      );
      expect(validateSamplingOpts({ ...validOpts, num_warmup: 0 })).toBe(true);
      expect(validateSamplingOpts({ ...validOpts, init_radius: 0 })).toBe(true);
    });
    test("Rejects on non-positive values for positive fields", () => {
      expect(validateSamplingOpts({ ...validOpts, num_chains: 0 })).toBe(false);
      expect(validateSamplingOpts({ ...validOpts, num_chains: -1 })).toBe(
        false,
      );
      expect(validateSamplingOpts({ ...validOpts, num_samples: 0 })).toBe(
        false,
      );
      expect(validateSamplingOpts({ ...validOpts, num_samples: -1 })).toBe(
        false,
      );
    });
  });
  describe("Sampling options parser", () => {
    const validOpts = {
      num_chains: 1,
      num_warmup: 2,
      num_samples: 3,
      init_radius: 0.1,
      seed: undefined,
    };
    const invalidOpts = { ...validOpts, num_samples: -4 };
    const valid = JSON.stringify(validOpts);
    const invalid = JSON.stringify(invalidOpts);
    const wrongType = JSON.stringify({ seed: "something" });
    const wrongKey = JSON.stringify({ type: "something" });
    test("Returns parsed object on success", () => {
      const succeeded = parseSamplingOpts(valid);
      expect(succeeded).toEqual(validOpts);
    });

    test("Correctly handles missing keys", () => {
      const allMissing = JSON.stringify({});
      const parsed = parseSamplingOpts(allMissing);
      expect(parsed).toEqual(defaultSamplingOpts);
    });

    test("Correctly handles bad parse", () => {
      expect(() => parseSamplingOpts("")).toThrow(/Unexpected end of JSON/);
      expect(() => parseSamplingOpts(undefined)).toThrow(
        /Unexpected end of JSON/,
      );
    });
    test("Correctly handles wrong element type", () => {
      expect(() => parseSamplingOpts(wrongType)).toThrow(
        /Invalid sampling opts/,
      );
      expect(mockedConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/Sampling_opts does not parse/),
      );
    });

    test("Correctly handles wrong object keys", () => {
      expect(() => parseSamplingOpts(wrongKey)).toThrow(
        /Invalid sampling opts/,
      );
      expect(mockedConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/Sampling_opts contains invalid/),
      );
    });
    test("Correctly handles invalid values", () => {
      expect(() => parseSamplingOpts(invalid)).toThrow(/Invalid sampling opts/);
      expect(mockedConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/Sampling_opts contains invalid/),
      );
    });
  });
});

describe("Project data model type guards", () => {
  describe("Base object check", () => {
    test("Should reject a falsy input", () => {
      expect(baseObjectCheck(undefined)).toBe(false);
      expect(baseObjectCheck(null)).toBe(false);
    });
    test("Should reject a non-object-typed input", () => {
      expect(baseObjectCheck("string value")).toBe(false);
    });
    test("Should accept any non-null object", () => {
      expect(baseObjectCheck({})).toBe(true);
    });
  });
  describe("All derived types honor base object check", () => {
    const allTypeguards = [
      isProjectFiles,
      isProjectBase,
      isProjectEphemeralData,
      isProjectDataModel,
      isProjectMetaData,
    ];
    test("Reject on falsy input", () => {
      allTypeguards.forEach((tg) => expect(tg(undefined)).toBe(false));
      allTypeguards.forEach((tg) => expect(tg(null)).toBe(false));
    });
    test("Reject on non-object-typed input", () => {
      allTypeguards.forEach((tg) => expect(tg("string")).toBe(false));
    });
  });
  describe("Project files typeguard", () => {
    test("Approves when all project files are set to string values", () => {
      expect(isProjectFiles(goodProjectFiles)).toBe(true);
    });
    test("Returns false when some project files are missing", () => {
      const missingProjectFiles = { ...goodProjectFiles };
      delete missingProjectFiles[file];
      expect(isProjectFiles(missingProjectFiles)).toBe(false);
    });
    test("Returns false when some project files have non-string values", () => {
      const nonStringFiles = { ...goodProjectFiles };
      nonStringFiles[file] = 6 as any;
      expect(isProjectFiles(nonStringFiles)).toBe(false);
    });
  });
  describe("Project base typeguard", () => {
    test("Succeeds when given sampling opts and project files", () => {
      expect(isProjectBase(goodBase)).toBe(true);
    });
    test("Returns false on invalid project files", () => {
      const bad = { ...goodBase } as any;
      delete bad[file];
      expect(isProjectBase(bad)).toBe(false);
    });
    test("Returns false on invalid sampling opts", () => {
      const bad = { ...goodBase } as any;
      delete bad.samplingOpts;
      expect(isProjectBase(bad)).toBe(false);
    });
  });
  describe("Project metadata typeguard", () => {
    test("Returns true on good metadata file", () => {
      expect(isProjectMetaData(validMetadata)).toBe(true);
    });
    test("Returns false on non-string title", () => {
      expect(isProjectMetaData({ title: 6 })).toBe(false);
      expect(isProjectMetaData({ no_title: "title" })).toBe(false);
    });
    test("Returns true for valid data source", () => {
      expect(
        isProjectMetaData({
          title: "title",
          dataSource: DataSource.GENERATED_BY_PYTHON,
        }),
      ).toBe(true);
      expect(
        isProjectMetaData({
          title: "title",
          dataSource: DataSource.GENERATED_BY_R,
        }),
      ).toBe(true);
    });
    test("Returns false on bad data source", () => {
      expect(isProjectMetaData({ title: "title", dataSource: 1 })).toBe(false);
    });
  });
  describe("Project ephemeral-data typeguard", () => {
    test("Returns true for valid project files object", () => {
      expect(isProjectEphemeralData(goodProjectFiles)).toBe(true);
    });
    test("Returns false for missing project files", () => {
      const missingProjectFiles = { ...goodProjectFiles };
      delete missingProjectFiles[file];
      expect(isProjectEphemeralData(missingProjectFiles)).toBe(false);
    });
    test("Returns false when some project files have non-string values", () => {
      const nonStringFiles = { ...goodProjectFiles };
      nonStringFiles[file] = 6 as any;
      expect(isProjectEphemeralData(nonStringFiles)).toBe(false);
    });
  });
  describe("Project data model typeguard", () => {
    test("Returns true for valid data model", () => {
      expect(isProjectDataModel(goodDataModel)).toBe(true);
    });
    test("Returns false for missing metadata", () => {
      const bad = { ...goodDataModel, meta: undefined };
      expect(isProjectDataModel(bad)).toBe(false);
    });
    test("Returns false for missing ephemeral data", () => {
      const bad = { ...goodDataModel, ephemera: undefined };
      expect(isProjectDataModel(bad)).toBe(false);
    });
    test("Returns false for missing project base", () => {
      const bad = { ...goodDataModel } as any;
      delete bad[file];
      expect(isProjectDataModel(bad)).toBe(false);
    });
  });
});

describe("Model saving and save state", () => {
  describe("Model has unsaved changes", () => {
    test("Returns false if all files match ephemeral", () => {
      expect(modelHasUnsavedChanges(goodDataModel as any)).toBe(false);
    });
    test("Returns true if any file does not match ephemeral", () => {
      const keys = Object.values(ProjectKnownFiles);
      keys.forEach((k) => {
        const badData: any = {
          ...goodDataModel,
          ephemera: { ...goodDataModel.ephemera },
        };
        badData.ephemera[k] = (goodDataModel as any).ephemera[k] + "nonce";
        expect(modelHasUnsavedChanges(badData)).toBe(true);
      });
    });
  });

  describe("Persisting state to ephemera", () => {
    test("After executing, ephemera state matches data state", () => {
      const start: any = {
        ...goodDataModel,
        ephemera: {
          stanFileContent: "not matching",
          dataFileContent: "not matching",
        },
      };
      Object.keys(start.ephemera).forEach((k) => {
        assert(start.ephemera[k] !== start[k]);
      });
      const end: any = persistStateToEphemera(start);
      Object.keys(end.ephemera).forEach((k) => {
        assert(end.ephemera[k] === start[k]);
        assert(end.ephemera[k] !== start.ephemera[k]);
      });
    });
  });
});

describe("Utility functions", () => {
  describe("Stringify field", () => {
    test("Returns string representations for all fields", () => {
      const keys = Object.keys(goodDataModel);
      keys.forEach((k) => {
        const ret = stringifyField(goodDataModel as any, k as any);
        expect(typeof ret === "string");
      });
    });
    test("Omits 'ephemera' field", () => {
      const rep = JSON.stringify(goodDataModel.ephemera);
      expect(rep).not.toEqual("");
      const stringified = stringifyField(goodDataModel as any, "ephemera");
      expect(stringified).toEqual("");
    });
  });
  describe("Get string known file keys", () => {
    test("Returns complete list of the values of the enum", () => {
      const returned = getStringKnownFileKeys();
      const expected = Object.values(ProjectKnownFiles);
      expect(returned.length).toEqual(expected.length);
      expected.forEach((f) => expect(returned.includes(f)));
    });
  });
});
