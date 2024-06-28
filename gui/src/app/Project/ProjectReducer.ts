import { Reducer } from "react";
import { Stanie } from "../exampleStanies/exampleStanies";
import { defaultSamplingOpts, SamplingOpts } from "../StanSampler/StanSampler";
import { FieldsContentsMap } from "./FileMapping";
import {
  initialDataModel,
  ProjectDataModel,
  ProjectKnownFiles,
} from "./ProjectDataModel";
import { loadFromProjectFiles } from "./ProjectSerialization";

export type ProjectReducerType = Reducer<
  ProjectDataModel,
  ProjectReducerAction
>;

export type ProjectReducerAction =
  | {
      type: "loadStanie";
      stanie: Stanie;
    }
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

export const ProjectReducer = (
  s: ProjectDataModel,
  a: ProjectReducerAction,
) => {
  switch (a.type) {
    case "loadStanie": {
      const dataFileContent = JSON.stringify(a.stanie.data, null, 2);
      return {
        ...s,
        stanFileContent: a.stanie.stan,
        dataFileContent,
        samplingOpts: defaultSamplingOpts,
        meta: { ...s.meta, title: a.stanie.meta.title ?? "Untitled" },
        ephemera: {
          ...s.ephemera,
          stanFileContent: a.stanie.stan,
          dataFileContent,
        },
      };
    }
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
  }
};
