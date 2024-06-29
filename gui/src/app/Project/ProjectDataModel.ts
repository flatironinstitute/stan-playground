import {
  SamplingOpts,
  defaultSamplingOpts,
  isSamplingOpts,
} from "../StanSampler/StanSampler";

export enum ProjectKnownFiles {
  STANFILE = "stanFileContent",
  DATAFILE = "dataFileContent",
}

type ProjectFiles = {
  [filetype in ProjectKnownFiles]: string;
};

const isProjectFiles = (x: any): x is ProjectFiles => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  for (const k of Object.values(ProjectKnownFiles)) {
    if (typeof x[k] !== "string") return false;
  }
  return true;
};

type ProjectBase = ProjectFiles & {
  samplingOpts: SamplingOpts;
};

const isProjectBase = (x: any): x is ProjectBase => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (!isSamplingOpts(x.samplingOpts)) return false;
  if (!isProjectFiles(x)) return false;
  return true;
};

type ProjectMetadata = {
  title: string;
};

export const isProjectMetaData = (x: any): x is ProjectMetadata => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (typeof x.title !== "string") return false;
  return true;
};

type ProjectEphemeralData = ProjectFiles & {
  // possible future things to track include the compilation status
  // of the current stan src file(s)
  // not implemented in this PR, but we need some content for the type
  server?: string;
};

const isProjectEphemeralData = (x: any): x is ProjectEphemeralData => {
  if (!isProjectFiles(x)) return false;
  return true;
};

export type ProjectDataModel = ProjectBase & {
  meta: ProjectMetadata;
  ephemera: ProjectEphemeralData;
};

export const isProjectDataModel = (x: any): x is ProjectDataModel => {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (!isProjectMetaData(x.meta)) return false;
  if (!isProjectEphemeralData(x.ephemera)) return false;
  if (!isProjectBase(x)) return false;
  return true;
};

export type ProjectPersistentDataModel = Omit<ProjectDataModel, "ephemera">;

export const initialDataModel: ProjectDataModel = {
  meta: { title: "Undefined" },
  ephemera: {
    stanFileContent: "",
    dataFileContent: "",
  },
  stanFileContent: "",
  dataFileContent: "",
  samplingOpts: defaultSamplingOpts,
};

export const persistStateToEphemera = (
  data: ProjectDataModel,
): ProjectDataModel => {
  const newEphemera = { ...data.ephemera };
  getStringKnownFileKeys().forEach((k) => (newEphemera[k] = data[k]));
  return {
    ...data,
    ephemera: newEphemera,
  };
};

export const getStringKnownFileKeys = () => Object.values(ProjectKnownFiles);

export const modelHasUnsavedChanges = (data: ProjectDataModel): boolean => {
  const stringFileKeys = getStringKnownFileKeys();
  return stringFileKeys.some((k) => data[k] !== data.ephemera[k]);
};

export const modelHasUnsavedDataFileChanges = (
  data: ProjectDataModel,
): boolean => {
  return data.dataFileContent !== data.ephemera.dataFileContent;
};

export const stringifyField = (
  data: ProjectDataModel,
  field: keyof ProjectDataModel,
): string => {
  if (field === "ephemera") return "";
  const value = data[field];
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};
