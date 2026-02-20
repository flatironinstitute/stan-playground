import { mapFileContentsToModel } from "@SpCore/Project/FileMapping";
import loadFilesFromGist from "@SpUtil/gists/loadFilesFromGist";
import {
  ProjectDataModel,
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

export const queryStringHasParameters = (query: QueryParams) => {
  return Object.values(query).some((v) => v !== null);
};

export const fetchRemoteProject = async (query: QueryParams) => {
  const projectParam = query.project;
  const data: ProjectDataModel = structuredClone(initialDataModel);

  if (projectParam) {
    if (projectParam.startsWith("https://gist.github.com/")) {
      try {
        const contentLoadedFromGist = await loadFilesFromGist(projectParam);
        const dataFromGist = loadFromProjectFiles(
          data,
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
    // other parameters are ignored whenever project= is set
    return data;
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
  const analysisRFilePromise = query["analysis_r"]
    ? tryFetch(query["analysis_r"])
    : Promise.resolve(data.analysisRFileContent);
  const dataPyFilePromise = query["data_py"]
    ? tryFetch(query["data_py"])
    : Promise.resolve(data.dataPyFileContent);
  const dataRFilePromise = query["data_r"]
    ? tryFetch(query["data_r"])
    : Promise.resolve(data.dataRFileContent);
  const sampling_optsPromise = query.sampling_opts
    ? tryFetch(query.sampling_opts)
    : Promise.resolve(null);

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

  const analysisRFileContent = await analysisRFilePromise;
  if (analysisRFileContent !== undefined) {
    data.analysisRFileContent = analysisRFileContent;
  } else {
    data.analysisRFileContent = `# Failed to load content from ${query["analysis_r"]}`;
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
  if (sampling_opts === undefined) {
    const msg = `Failed to load content from ${query["sampling_opts"]}`;
    alert(msg);
    console.error(msg);
  } else if (sampling_opts !== null) {
    try {
      data.samplingOpts = parseSamplingOpts(sampling_opts);
    } catch (err) {
      console.error("Failed to parse sampling_opts", err);
      alert("Invalid sampling options: " + sampling_opts);
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
      data.samplingOpts.seed =
        query.seed === "undefined" ? undefined : parseInt(query.seed);
    }

    if (!validateSamplingOpts(data.samplingOpts)) {
      console.error("Invalid sampling options", data.samplingOpts);
      alert("Invalid sampling options: " + JSON.stringify(data.samplingOpts));
      data.samplingOpts = defaultSamplingOpts;
    }
  }

  if (query.title) {
    data.meta.title = query.title;
  }

  return persistStateToEphemera(data);
};
