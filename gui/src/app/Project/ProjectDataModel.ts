import baseObjectCheck from "@SpUtil/baseObjectCheck";

export enum ProjectKnownFiles {
  STANFILE = "stanFileContent",
  DATAFILE = "dataFileContent",
  ANALYSISPYFILE = "analysisPyFileContent",
  ANALYSISRFILE = "analysisRFileContent",
  DATAPYFILE = "dataPyFileContent",
  DATARFILE = "dataRFileContent",
}

export type SamplingOpts = {
  num_chains: number;
  num_warmup: number;
  num_samples: number;
  init_radius: number;
  seed: number | undefined;
};

export const defaultSamplingOpts: SamplingOpts = {
  num_chains: 4,
  num_warmup: 1000,
  num_samples: 1000,
  init_radius: 2.0,
  seed: undefined,
};

export const isSamplingOpts = (x: any): x is SamplingOpts => {
  if (!baseObjectCheck(x)) return false;
  if (typeof x.num_chains !== "number") return false;
  if (typeof x.num_warmup !== "number") return false;
  if (typeof x.num_samples !== "number") return false;
  if (typeof x.init_radius !== "number") return false;
  if (x.seed !== undefined && typeof x.seed !== "number") return false;
  return true;
};

const numSamplingOpts = Object.keys(defaultSamplingOpts).length;

export const validateSamplingOpts = (x: SamplingOpts): boolean => {
  const naturalFields = [x.num_chains, x.num_samples, x.num_warmup];
  const positiveFields = [x.num_chains, x.num_samples];
  const nonnegativeFields = [x.num_warmup, x.init_radius];
  if (naturalFields.some((f) => !Number.isInteger(f))) return false;
  if (positiveFields.some((f) => !Number.isFinite(f) || f <= 0)) return false;
  if (nonnegativeFields.some((f) => !Number.isFinite(f) || f < 0)) return false;

  if (x.seed !== undefined && !Number.isInteger(x.seed)) return false;

  if (Object.keys(x).length !== numSamplingOpts) return false;
  return true;
};

export const parseSamplingOpts = (x: string | undefined): SamplingOpts => {
  const parsed = JSON.parse(x ?? "");
  const opts = { ...defaultSamplingOpts, ...parsed };
  if (isSamplingOpts(opts)) {
    if (validateSamplingOpts(opts)) return opts;
    console.error(
      `Sampling_opts contains invalid values: ${JSON.stringify(parsed)}`,
    );
  } else {
    console.error(
      `Sampling_opts does not parse to sampling_opts object: ${JSON.stringify(parsed)}`,
    );
  }
  throw new Error(`Invalid sampling opts ${JSON.stringify(parsed)}`);
};

type ProjectFiles = {
  [filetype in ProjectKnownFiles]: string;
};

const isProjectFiles = (x: any): x is ProjectFiles => {
  if (!baseObjectCheck(x)) return false;
  for (const k of Object.values(ProjectKnownFiles)) {
    if (typeof x[k] !== "string") return false;
  }
  return true;
};

type ProjectBase = ProjectFiles & {
  samplingOpts: SamplingOpts;
};

const isProjectBase = (x: any): x is ProjectBase => {
  if (!baseObjectCheck(x)) return false;
  if (!isSamplingOpts(x.samplingOpts)) return false;
  if (!isProjectFiles(x)) return false;
  return true;
};

type ProjectMetadata = {
  title: string;
};

export const isProjectMetaData = (x: any): x is ProjectMetadata => {
  if (!baseObjectCheck(x)) return false;
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
  if (!baseObjectCheck(x)) return false;
  if (!isProjectMetaData(x.meta)) return false;
  if (!isProjectEphemeralData(x.ephemera)) return false;
  if (!isProjectBase(x)) return false;
  return true;
};

export type ProjectPersistentDataModel = Omit<ProjectDataModel, "ephemera">;

export const initialDataModel: ProjectDataModel = {
  meta: { title: "Untitled" },
  ephemera: {
    stanFileContent: "",
    dataFileContent: "",
    analysisPyFileContent: "",
    analysisRFileContent: "",
    dataPyFileContent: "",
    dataRFileContent: "",
  },
  stanFileContent: "",
  dataFileContent: "",
  analysisPyFileContent: "",
  analysisRFileContent: "",
  dataPyFileContent: "",
  dataRFileContent: "",
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

export const exportedForTesting = {
  baseObjectCheck,
  validateSamplingOpts,
  isProjectFiles,
  isProjectBase,
  isProjectEphemeralData,
};
