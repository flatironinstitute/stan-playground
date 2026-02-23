import { mapFileContentsToModel } from "@SpCore/Project/FileMapping";
import loadFilesFromGist from "@SpUtil/gists/loadFilesFromGist";
import {
  ProjectDataModel,
  ProjectKnownFiles,
  SamplingOpts,
  defaultSamplingOpts,
  initialDataModel,
  parseSamplingOpts,
  persistStateToEphemera,
  validateSamplingOpts,
} from "@SpCore/Project/ProjectDataModel";
import {
  deserializeProjectFromURLParameter,
  hasKnownProjectParameterPrefix,
  loadFromProjectFiles,
} from "@SpCore/Project/ProjectSerialization";
import { tryFetch } from "@SpUtil/tryFetch";

export enum QueryParamKeys {
  Project = "project",
  StanFile = "stan",
  DataFile = "data",
  AnalysisPyFile = "analysis_py",
  AnalysisRFile = "analysis_r",
  DataPyFile = "data_py",
  DataRFile = "data_r",
  SamplingOpts = "sampling_opts",
  Title = "title",
  SONumChains = "num_chains",
  SONumWarmup = "num_warmup",
  SONumSamples = "num_samples",
  SOInitRadius = "init_radius",
  SOSeed = "seed",
}

type QueryParams = {
  [key in QueryParamKeys]: string | null;
};

export const fromQueryParams = (searchParams: URLSearchParams) => {
  for (const key of searchParams.keys()) {
    // warn on unknown keys
    if (!Object.values(QueryParamKeys).includes(key as QueryParamKeys)) {
      console.warn("Unknown query parameter", key);
    }
  }

  const queries: QueryParams = {
    project: searchParams.get(QueryParamKeys.Project),
    stan: searchParams.get(QueryParamKeys.StanFile),
    data: searchParams.get(QueryParamKeys.DataFile),
    analysis_py: searchParams.get(QueryParamKeys.AnalysisPyFile),
    analysis_r: searchParams.get(QueryParamKeys.AnalysisRFile),
    data_py: searchParams.get(QueryParamKeys.DataPyFile),
    data_r: searchParams.get(QueryParamKeys.DataRFile),
    sampling_opts: searchParams.get(QueryParamKeys.SamplingOpts),
    title: searchParams.get(QueryParamKeys.Title),
    num_chains: searchParams.get(QueryParamKeys.SONumChains),
    num_warmup: searchParams.get(QueryParamKeys.SONumWarmup),
    num_samples: searchParams.get(QueryParamKeys.SONumSamples),
    init_radius: searchParams.get(QueryParamKeys.SOInitRadius),
    seed: searchParams.get(QueryParamKeys.SOSeed),
  };

  return queries;
};

const queryParamToDataModelFieldMap = {
  [QueryParamKeys.StanFile]: ProjectKnownFiles.STANFILE,
  [QueryParamKeys.DataFile]: ProjectKnownFiles.DATAFILE,
  [QueryParamKeys.AnalysisPyFile]: ProjectKnownFiles.ANALYSISPYFILE,
  [QueryParamKeys.AnalysisRFile]: ProjectKnownFiles.ANALYSISRFILE,
  [QueryParamKeys.DataPyFile]: ProjectKnownFiles.DATAPYFILE,
  [QueryParamKeys.DataRFile]: ProjectKnownFiles.DATARFILE,
} as const;

export const queryStringHasParameters = (query: QueryParams) => {
  return Object.values(query).some((v) => v !== null);
};

export const fetchRemoteProject = async (query: QueryParams) => {
  if (query.project) {
    // other parameters are ignored whenever project= is set
    return await loadFromProjectParameter(query.project);
  }

  const data: ProjectDataModel = structuredClone(initialDataModel);

  if (query.title) {
    data.meta.title = query.title;
  }

  const fetchFileForParameter = async (
    param: keyof typeof queryParamToDataModelFieldMap,
    comment: string = "# ",
  ) => {
    if (query[param]) {
      const value = await tryFetch(query[param]);
      return value ?? `${comment}Failed to load content from ${query[param]}`;
    }
    return data[queryParamToDataModelFieldMap[param]];
  };

  [
    data.stanFileContent,
    data.dataFileContent,
    data.analysisPyFileContent,
    data.analysisRFileContent,
    data.dataPyFileContent,
    data.dataRFileContent,
    data.samplingOpts,
  ] = await Promise.all([
    fetchFileForParameter(QueryParamKeys.StanFile, "// "),
    fetchFileForParameter(QueryParamKeys.DataFile, "// "),
    fetchFileForParameter(QueryParamKeys.AnalysisPyFile),
    fetchFileForParameter(QueryParamKeys.AnalysisRFile),
    fetchFileForParameter(QueryParamKeys.DataPyFile),
    fetchFileForParameter(QueryParamKeys.DataRFile),
    loadSamplingOptsFromQueryParams(query),
  ]);

  return persistStateToEphemera(data);
};

const loadFromProjectParameter = async (projectParam: string) => {
  if (projectParam.startsWith("https://gist.github.com/")) {
    try {
      const contentLoadedFromGist = await loadFilesFromGist(projectParam);
      const dataFromGist = loadFromProjectFiles(
        mapFileContentsToModel(contentLoadedFromGist.files),
      );
      dataFromGist.meta.title = contentLoadedFromGist.description;
      return persistStateToEphemera(dataFromGist);
    } catch (err) {
      console.error("Failed to load content from gist", err);
      alert(`Failed to load content from gist ${projectParam}`);
    }
  } else if (hasKnownProjectParameterPrefix(projectParam)) {
    try {
      const dataFromParam = deserializeProjectFromURLParameter(projectParam);
      if (dataFromParam) {
        return persistStateToEphemera(dataFromParam);
      } else {
        throw new Error("Failed to deserialize project from URL parameter");
      }
    } catch (err) {
      console.error("Failed to load content from project string", err);
      alert("Failed to load content from compressed project");
    }
  } else {
    console.error("Unsupported project parameter type", projectParam);
  }
  return initialDataModel;
};

const loadSamplingOptsFromQueryParams = async (query: QueryParams) => {
  // try to load json of all opts
  if (query.sampling_opts) {
    const sampling_opts = await tryFetch(query.sampling_opts);
    if (sampling_opts === undefined) {
      const msg = `Failed to load content from ${query["sampling_opts"]}`;
      alert(msg);
      console.error(msg);
      return defaultSamplingOpts;
    }
    try {
      return parseSamplingOpts(sampling_opts);
    } catch (err) {
      console.error("Failed to parse sampling_opts", err);
      alert("Invalid sampling options: " + sampling_opts);
    }
  }

  // load individual opts from query params
  const samplingOpts: SamplingOpts = { ...defaultSamplingOpts };
  if (query.num_chains) {
    samplingOpts.num_chains = parseInt(query.num_chains);
  }
  if (query.num_warmup) {
    samplingOpts.num_warmup = parseInt(query.num_warmup);
  }
  if (query.num_samples) {
    samplingOpts.num_samples = parseInt(query.num_samples);
  }
  if (query.init_radius) {
    samplingOpts.init_radius = parseFloat(query.init_radius);
  }
  if (query.seed) {
    samplingOpts.seed =
      query.seed === "undefined" ? undefined : parseInt(query.seed);
  }

  if (!validateSamplingOpts(samplingOpts)) {
    console.error("Invalid sampling options", samplingOpts);
    alert("Invalid sampling options: " + JSON.stringify(samplingOpts));
    return defaultSamplingOpts;
  }
  return samplingOpts;
};
