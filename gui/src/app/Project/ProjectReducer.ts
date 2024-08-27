import { FieldsContentsMap } from "@SpCore/FileMapping";
import {
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
      newState[a.filename] = s.ephemera[a.filename];
      return newState;
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

export default ProjectReducer;
