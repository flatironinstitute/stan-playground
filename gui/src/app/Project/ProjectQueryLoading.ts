import { isSamplingOpts } from "../StanSampler/StanSampler";
import { mapFileContentsToModel } from "./FileMapping";
import {
  ProjectDataModel,
  initialDataModel,
  persistStateToEphemera,
} from "./ProjectDataModel";
import { loadFromProjectFiles } from "./ProjectSerialization";
import loadFilesFromGist from "./loadFilesFromGist";

enum QueryParamKeys {
  Project = "project",
  StanFile = "stan",
  DataFile = "data",
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

const tryFetch = async (url: string) => {
  console.log("Fetching content from", url);
  try {
    const req = await fetch(url);
    if (!req.ok) {
      console.error(
        "Failed to fetch from url",
        url,
        req.status,
        req.statusText,
      );
      return undefined;
    }
    return await req.text();
  } catch (err) {
    console.error("Failed to fetch from url", url, err);
    return undefined;
  }
};

const deepCopy = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
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

  const sampling_opts = await sampling_optsPromise;
  if (sampling_opts) {
    try {
      const parsed = JSON.parse(sampling_opts);
      if (isSamplingOpts(parsed)) {
        data.samplingOpts = parsed;
      } else {
        console.error("Invalid sampling_opts in fetchRemoteProject", parsed);
      }
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
