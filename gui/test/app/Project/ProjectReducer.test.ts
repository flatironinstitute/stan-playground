import {
  DataSource,
  getStringKnownFileKeys,
  initialDataModel,
  ProjectDataModel,
  ProjectKnownFiles,
  SamplingOpts,
} from "@SpCore/ProjectDataModel";
import ProjectReducer, { ProjectReducerAction } from "@SpCore/ProjectReducer";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockedConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

const hoistedMocks = vi.hoisted(() => {
  return {
    mockedLoad: vi.fn(),
  };
});

vi.mock("@SpCore/ProjectSerialization", async (importOriginal) => {
  const base =
    await importOriginal<typeof import("@SpCore/ProjectSerialization")>();
  return { ...base, loadFromProjectFiles: hoistedMocks.mockedLoad };
});

afterEach(() => {
  mockedConsoleError.mockClear();
  hoistedMocks.mockedLoad.mockClear();
});

const fakeEmptyProjectData: ProjectDataModel = {} as any as ProjectDataModel;
const fakeLoadFileResponse: ProjectDataModel = {
  id: 5,
} as any as ProjectDataModel;

const permanentFiles = {
  stanFileContent: "permanent stan",
  dataFileContent: "permanent data",
};

const ephemeralFiles = {
  stanFileContent: "ephemeral stan",
  dataFileContent: "ephemeral data",
};

describe("Project reducer", () => {
  describe("Loading project from files", () => {
    const mockFiles = { stanFileContent: "stan file stuff" };
    const loadAction: ProjectReducerAction = {
      type: "loadFiles",
      files: mockFiles,
      clearExisting: false,
    };
    test("Calls load project with appropriate parameters", () => {
      hoistedMocks.mockedLoad.mockImplementation(() => fakeLoadFileResponse);
      const result = ProjectReducer(fakeEmptyProjectData, loadAction);
      expect(result).toBe(fakeLoadFileResponse);
      expect(hoistedMocks.mockedLoad).toHaveBeenCalledOnce();
      expect(hoistedMocks.mockedLoad).toHaveBeenCalledWith(
        fakeEmptyProjectData,
        mockFiles,
        false,
      );
    });
    test("Logs error and returns initial state if load-files call fails", () => {
      hoistedMocks.mockedLoad.mockImplementation(() => {
        throw new Error("Mocked error");
      });
      const result = ProjectReducer(fakeEmptyProjectData, loadAction);
      expect(result).toBe(fakeEmptyProjectData);
      expect(mockedConsoleError).toHaveBeenCalledWith(
        "Error loading files",
        new Error("Mocked error"),
      );
    });
  });

  describe("Changing title", () => {
    const oldTitle = "foo";
    const newTitle = "new title";
    const fakeMeta = { title: oldTitle, foo: "bar" };
    const initial = { meta: fakeMeta } as any as ProjectDataModel;
    const retitleAction: ProjectReducerAction = {
      type: "retitle",
      title: newTitle,
    };
    test("Title is changed", () => {
      const result = ProjectReducer(initial, retitleAction);
      expect(result.meta.title).toEqual(newTitle);
    });
    test("Other metadata remains unchanged", () => {
      // bit of a trick because there isn't any right now
      const result = ProjectReducer(initial, retitleAction) as any;
      expect(result.meta.foo).toEqual((initial.meta as any).foo);
    });
  });

  describe("Editing a file", () => {
    const initialState = {
      ...permanentFiles,
      ephemera: { ...ephemeralFiles },
    } as any as ProjectDataModel;
    const newContent = "This is new content";
    const theFile = ProjectKnownFiles.STANFILE;
    const notTheFile = ProjectKnownFiles.DATAFILE;
    const editAction: ProjectReducerAction = {
      type: "editFile",
      content: newContent,
      filename: theFile,
    };
    test("Edit action updates selected ephemera", () => {
      const result = ProjectReducer(initialState, editAction);
      expect(result.ephemera[theFile]).toEqual(newContent);
    });
    test("Edit action does not alter other ephemera", () => {
      const result = ProjectReducer(initialState, editAction);
      expect(result.ephemera[notTheFile]).toEqual(
        initialState.ephemera[notTheFile],
      );
    });
    test("Edit action does not alter permanent files", () => {
      const files = getStringKnownFileKeys();
      const result = ProjectReducer(initialState, editAction);
      files.forEach((f) => expect(result[f]).toEqual(initialState[f]));
    });
  });

  describe("Saving edits", () => {
    const initialState = {
      ...permanentFiles,
      ephemera: { ...ephemeralFiles },
      meta: { dataSource: DataSource.GENERATED_BY_PYTHON },
    } as any as ProjectDataModel;

    const editAction: ProjectReducerAction = {
      type: "editFile",
      content: "new content",
      filename: ProjectKnownFiles.DATAFILE,
    };
    const commitAction: ProjectReducerAction = {
      type: "commitFile",
      filename: ProjectKnownFiles.DATAFILE,
    };
    test("Save action copies chosen ephemera to state", () => {
      expect(initialState[ProjectKnownFiles.DATAFILE]).not.toEqual(
        initialState.ephemera[ProjectKnownFiles.DATAFILE],
      );
      const result = ProjectReducer(initialState, commitAction);
      expect(result[ProjectKnownFiles.DATAFILE]).toEqual(
        result.ephemera[ProjectKnownFiles.DATAFILE],
      );
    });
    test("Saving data.json clears data source", () => {
      expect(initialState[ProjectKnownFiles.DATAFILE]).not.toEqual(
        initialState.ephemera[ProjectKnownFiles.DATAFILE],
      );
      const result = ProjectReducer(initialState, commitAction);
      expect(result.meta.dataSource).toBeUndefined();
    });
    test("Save action does not save non-chosen files", () => {
      const result = ProjectReducer(initialState, commitAction);
      expect(result[ProjectKnownFiles.STANFILE]).not.toEqual(
        result.ephemera[ProjectKnownFiles.STANFILE],
      );
    });
    test("Save action does not alter existing ephemera", () => {
      const result = ProjectReducer(initialState, commitAction);
      expect(result.ephemera).toEqual(initialState.ephemera);
    });
    test("Saving data generation script updates status on data it generated", () => {
      const pairs = [
        {
          source: DataSource.GENERATED_BY_PYTHON,
          newSource: DataSource.GENERATED_BY_STALE_PYTHON,
          file: ProjectKnownFiles.DATAPYFILE,
        },
        {
          source: DataSource.GENERATED_BY_R,
          newSource: DataSource.GENERATED_BY_STALE_R,
          file: ProjectKnownFiles.DATARFILE,
        },
      ];
      pairs.forEach((p) => {
        const initial = {
          ...initialState,
          meta: { dataSource: p.source },
        } as any as ProjectDataModel;
        const edit = { ...editAction, filename: p.file };
        const edited = ProjectReducer(initial, edit);
        const commit = { ...commitAction, filename: p.file };
        const result = ProjectReducer(edited, commit);
        expect(result.meta.dataSource).toEqual(p.newSource);
      });
    });

    test("Commiting identical data generation script does not change status", () => {
      const pairs = [
        {
          source: DataSource.GENERATED_BY_PYTHON,
          file: ProjectKnownFiles.DATAPYFILE,
        },
        {
          source: DataSource.GENERATED_BY_R,
          file: ProjectKnownFiles.DATARFILE,
        },
      ];
      pairs.forEach((p) => {
        const initial = {
          ...initialState,
          meta: { dataSource: p.source },
        } as any as ProjectDataModel;

        const commit = { ...commitAction, filename: p.file };
        const result = ProjectReducer(initial, commit);
        expect(result.meta.dataSource).toEqual(p.source);
      });
    });
    test("Saving data generation script does not change status for data.json it didn't generate", () => {
      const pairs = [
        {
          source: DataSource.GENERATED_BY_PYTHON,
          file: ProjectKnownFiles.DATAPYFILE,
        },
        {
          source: DataSource.GENERATED_BY_R,
          file: ProjectKnownFiles.DATARFILE,
        },
      ];
      const sources = Object.entries(DataSource);
      pairs.forEach((p) => {
        sources
          .filter(([, value]) => value !== p.source)
          .forEach((s) => {
            const initial = {
              ...initialState,
              meta: { dataSource: s },
            } as any as ProjectDataModel;
            const commit = { ...commitAction, filename: p.file };
            const result = ProjectReducer(initial, commit);
            expect(result.meta.dataSource).toEqual(s);
          });
      });
    });
  });

  describe("Updating sampling options", () => {
    const initialState = {
      label: "foo",
      samplingOpts: {
        num_chains: 5,
        num_warmup: 5,
        num_samples: 5,
        init_radius: 5,
      } as SamplingOpts,
    } as any as ProjectDataModel;
    const newSamplingOpts = {
      num_chains: 10,
      num_warmup: 10,
    };
    const setSamplingAction: ProjectReducerAction = {
      type: "setSamplingOpts",
      opts: newSamplingOpts,
    };
    test("Returns current state with updated sampling opts", () => {
      const result = ProjectReducer(initialState, setSamplingAction) as any;
      expect(result.label).toBe("foo");
      expect(result.samplingOpts.num_chains).toEqual(
        newSamplingOpts.num_chains,
      );
      expect(result.samplingOpts.num_warmup).toEqual(
        newSamplingOpts.num_warmup,
      );
    });
    test("Preserves initial state sampling opts that are not replaced by update", () => {
      const result = ProjectReducer(initialState, setSamplingAction);
      expect(result.samplingOpts.num_chains).toEqual(
        newSamplingOpts.num_chains,
      );
      expect(result.samplingOpts.num_warmup).toEqual(
        newSamplingOpts.num_warmup,
      );
      expect(result.samplingOpts.num_samples).toEqual(
        initialState.samplingOpts.num_samples,
      );
      expect(result.samplingOpts.init_radius).toEqual(
        initialState.samplingOpts.init_radius,
      );
    });
  });

  describe("Initial load", () => {
    test("Returns passed state as the new state", () => {
      const newState = { id: "foo" } as any as ProjectDataModel;
      const initializeAction: ProjectReducerAction = {
        type: "loadInitialData",
        state: newState,
      };
      const result = ProjectReducer(fakeEmptyProjectData, initializeAction);
      expect(result).toBe(newState);
    });
  });

  describe("Clearing data model", () => {
    test("Correctly returns initial data model on reset", () => {
      const clearAction: ProjectReducerAction = { type: "clear" };
      const result = ProjectReducer(fakeEmptyProjectData, clearAction);
      expect(result).toBe(initialDataModel);
    });
  });

  describe("Generate data", () => {
    test("Updates data file and ephemera with new data", () => {
      const initialState = {
        ...permanentFiles,
        ephemera: { ...ephemeralFiles },
        meta: { dataSource: DataSource.GENERATED_BY_R },
      } as any as ProjectDataModel;
      const newData = "generated data";
      const generateAction: ProjectReducerAction = {
        type: "generateData",
        content: newData,
        dataSource: DataSource.GENERATED_BY_PYTHON,
      };
      const result = ProjectReducer(initialState, generateAction);
      expect(result[ProjectKnownFiles.DATAFILE]).toEqual(newData);
      expect(result.ephemera[ProjectKnownFiles.DATAFILE]).toEqual(newData);
      expect(result.meta.dataSource).toEqual(DataSource.GENERATED_BY_PYTHON);
    });
  });
});
