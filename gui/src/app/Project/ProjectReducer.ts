import { FieldsContentsMap } from "@SpCore/FileMapping";
import {
  DataSource,
  initialDataModel,
  ProjectDataModel,
  ProjectKnownFiles,
  SamplingOpts,
} from "@SpCore/ProjectDataModel";
import { loadFromProjectFiles } from "@SpCore/ProjectSerialization";
import { unreachable } from "@SpUtil/unreachable";
import { Reducer } from "react";

export type ProjectReducerType = Reducer<
  ProjectDataModel,
  ProjectReducerAction
>;

export type ProjectReducerAction =
  | {
      type: "loadFiles";
      files: Partial<FieldsContentsMap>;
      clearExisting: boolean;
    }
  | {
      type: "retitle";
      title: string;
    }
  | { type: "generateData"; content: string; dataSource: DataSource }
  | {
      type: "editFile";
      content: string;
      filename: ProjectKnownFiles;
    }
  | {
      type: "commitFile";
      filename: ProjectKnownFiles;
    }
  | {
      type: "setSamplingOpts";
      opts: Partial<SamplingOpts>;
    }
  | {
      type: "loadInitialData";
      state: ProjectDataModel;
    }
  | {
      type: "clear";
    };

const ProjectReducer = (s: ProjectDataModel, a: ProjectReducerAction) => {
  switch (a.type) {
    case "loadFiles": {
      try {
        return loadFromProjectFiles(s, a.files, a.clearExisting);
      } catch (e) {
        // probably sampling opts or meta files were not valid
        console.error("Error loading files", e);
        return s;
      }
    }
    case "retitle": {
      return {
        ...s,
        meta: { ...s.meta, title: a.title },
      };
    }
    case "editFile": {
      const newEphemera = { ...s.ephemera };
      newEphemera[a.filename] = a.content;
      return { ...s, ephemera: newEphemera };
    }
    case "commitFile": {
      const newState = { ...s };
      const newDataSource = confirmDataSourceForCommit(
        s.meta.dataSource,
        a.filename,
      );
      if (newDataSource !== s.meta.dataSource) {
        newState.meta = { ...s.meta, dataSource: newDataSource };
      }
      newState[a.filename] = s.ephemera[a.filename];
      return newState;
    }
    case "generateData": {
      return {
        ...s,
        [ProjectKnownFiles.DATAFILE]: a.content,
        ephemera: {
          ...s.ephemera,
          [ProjectKnownFiles.DATAFILE]: a.content,
        },
        meta: { ...s.meta, dataSource: a.dataSource },
      };
    }
    case "setSamplingOpts": {
      return { ...s, samplingOpts: { ...s.samplingOpts, ...a.opts } };
    }
    case "loadInitialData": {
      return a.state;
    }
    case "clear": {
      return initialDataModel;
    }
    default:
      return unreachable(a);
  }
};

const confirmDataSourceForCommit = (
  currentSource: DataSource | undefined,
  editedFile: ProjectKnownFiles,
): DataSource | undefined => {
  if (editedFile === ProjectKnownFiles.DATAFILE) return undefined;
  if (
    editedFile === ProjectKnownFiles.DATAPYFILE &&
    currentSource === DataSource.GENERATED_BY_PYTHON
  ) {
    return DataSource.GENERATED_BY_STALE_PYTHON;
  }
  if (
    editedFile === ProjectKnownFiles.DATARFILE &&
    currentSource === DataSource.GENERATED_BY_R
  ) {
    return DataSource.GENERATED_BY_STALE_R;
  }

  return currentSource;
};

export default ProjectReducer;
