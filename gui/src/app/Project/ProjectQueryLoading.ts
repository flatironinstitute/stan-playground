import { mapFileContentsToModel } from "@SpCore/FileMapping";
import loadFilesFromGist from "@SpCore/gists/loadFilesFromGist";
import {
  ProjectDataModel,
  initialDataModel,
  parseSamplingOpts,
  persistStateToEphemera,
} from "@SpCore/ProjectDataModel";
import { loadFromProjectFiles } from "@SpCore/ProjectSerialization";
import { deepCopy } from "@SpUtil/deepCopy";
import { tryFetch } from "@SpUtil/tryFetch";

export enum QueryParamKeys {
  Project = "project",
  StanFile = "stan",
  DataFile = "data",
  AnalysisPyFile = "analysis_py",
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

export const queryStringHasParameters = (query: QueryParams) => {
  return Object.values(query).some((v) => v !== null);
};

export const fetchRemoteProject = async (query: QueryParams) => {
  const projectUri = query.project;

  let data: ProjectDataModel = deepCopy(initialDataModel);
  if (projectUri) {
    if (projectUri.startsWith("https://gist.github.com/")) {
      let contentLoadedFromGist: {
        files: { [key: string]: string };
        description: string;
      };
      try {
        contentLoadedFromGist = await loadFilesFromGist(projectUri);
      } catch (err) {
        console.error("Failed to load content from gist", err);
        alert(`Failed to load content from gist ${projectUri}`);
        // do not continue with any other query parameters if we failed to load the gist
        return persistStateToEphemera(data);
      }
      data = loadFromProjectFiles(
        data,
        mapFileContentsToModel(contentLoadedFromGist.files),
        false,
      );
      data.meta.title = contentLoadedFromGist.description;
    } else {
      // right now we only support loading from a gist
      console.error("Unsupported project URI", projectUri);
    }
  }

  const stanFilePromise = query.stan
    ? tryFetch(query.stan)
    : Promise.resolve(data.stanFileContent);
  const dataFilePromise = query.data
    ? tryFetch(query.data)
    : Promise.resolve(data.dataFileContent);
  const analysisPyFilePromise = query["analysis_py"]
    ? tryFetch(query["analysis_py"])
    : Promise.resolve(data.analysisPyFileContent);
  const dataPyFilePromise = query["data_py"]
    ? tryFetch(query["data_py"])
    : Promise.resolve(undefined);
  const dataRFilePromise = query["data_r"]
    ? tryFetch(query["data_r"])
    : Promise.resolve(undefined);
  const sampling_optsPromise = query.sampling_opts
    ? tryFetch(query.sampling_opts)
    : Promise.resolve(undefined);

  const stanFileContent = await stanFilePromise;
  if (stanFileContent !== undefined) {
    data.stanFileContent = stanFileContent;
  } else {
    data.stanFileContent = `// Failed to load content from ${query.stan}`;
  }

  const dataFileContent = await dataFilePromise;
  if (dataFileContent !== undefined) {
    data.dataFileContent = dataFileContent;
  } else {
    data.dataFileContent = `// Failed to load content from ${query.data}`;
  }

  const analysisPyFileContent = await analysisPyFilePromise;
  if (analysisPyFileContent !== undefined) {
    data.analysisPyFileContent = analysisPyFileContent;
  } else {
    data.analysisPyFileContent = `# Failed to load content from ${query["analysis_py"]}`;
  }

  const dataPyFileContent = await dataPyFilePromise;
  if (dataPyFileContent !== undefined) {
    data.dataPyFileContent = dataPyFileContent;
  } else {
    data.dataPyFileContent = `# Failed to load content from ${query["data_py"]}`;
  }

  const dataRFileContent = await dataRFilePromise;
  if (dataRFileContent !== undefined) {
    data.dataRFileContent = dataRFileContent;
  } else {
    data.dataRFileContent = `# Failed to load content from ${query["data_r"]}`;
  }

  const sampling_opts = await sampling_optsPromise;
  if (sampling_opts) {
    try {
      data.samplingOpts = parseSamplingOpts(sampling_opts);
    } catch (err) {
      console.error("Failed to parse sampling_opts", err);
    }
  } else {
    if (query.num_chains) {
      data.samplingOpts.num_chains = parseInt(query.num_chains);
    }
    if (query.num_warmup) {
      data.samplingOpts.num_warmup = parseInt(query.num_warmup);
    }
    if (query.num_samples) {
      data.samplingOpts.num_samples = parseInt(query.num_samples);
    }
    if (query.init_radius) {
      data.samplingOpts.init_radius = parseFloat(query.init_radius);
    }
    if (query.seed) {
      data.samplingOpts.seed = parseInt(query.seed);
    }
  }

  if (query.title) {
    data.meta.title = query.title;
  }

  return persistStateToEphemera(data);
};
