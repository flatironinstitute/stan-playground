import { SPAnalysisDataModel, initialDataModel, persistStateToEphemera } from "./SPAnalysisDataModel";
import loadFilesFromGist from "./loadFilesFromGist";
import { loadFromProjectFiles } from "./SPAnalysisReducer";
import { mapFileContentsToModel } from "./FileMapping";


enum QueryParamKeys {
    Project= "project",
    StanFile = "stan",
    DataFile = "data",
    SamplingOpts = "sampling_opts",
    Title = "title",
    SONumChains = 'num_chains',
    SONumWarmup = 'num_warmup',
    SONumSamples = 'num_samples',
    SOInitRadius = 'init_radius',
    SOSeed = 'seed'
}

type QueryParams = {
    [key in QueryParamKeys]: string | null
}

export const fromQueryParams = (searchParams: URLSearchParams) => {

    for (const key of searchParams.keys()) {
        // warn on unknown keys
        if (!Object.values(QueryParamKeys).includes(key as QueryParamKeys)) {
            console.warn('Unknown query parameter', key)
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
    }

    return queries;
}

export const queryStringHasParameters = (query: QueryParams) => {
    return Object.values(query).some(v => v !== null)
}

const tryFetch = async (url: string, fallback: string | undefined) => {
    console.log('Fetching content from', url)
    try {
        const req = await fetch(url)
        if (!req.ok) {
            console.error('Failed to fetch from url', url, req.status, req.statusText)
            return fallback
        }
        return await req.text()
    } catch (err) {
        console.error('Failed to fetch from url', url, err)
        return fallback
    }
}

const deepCopy = (obj: any) => {
    return JSON.parse(JSON.stringify(obj))
}

export const fetchRemoteAnalysis = async (query: QueryParams) => {
    const projectUri = query.project

    let data: SPAnalysisDataModel = deepCopy(initialDataModel);
    if (projectUri) {
        if (projectUri.startsWith('https://gist.github.com/')) {
            const contentLoadedFromGist = await loadFilesFromGist(projectUri);
            data = loadFromProjectFiles(data, mapFileContentsToModel(contentLoadedFromGist.files), false);
            data.meta.title = contentLoadedFromGist.description;
        } else {
            // right now we only support loading from a gist
            console.error('Unsupported project URI', projectUri)
        }
    }

    const stanFilePromise = query.stan ? tryFetch(query.stan, `// Unable to load from ${query.stan}`) : Promise.resolve(undefined);
    const dataFilePromise = query.data ? tryFetch(query.data, `Unable to load from ${query.data}`) : Promise.resolve(undefined);
    const sampling_optsPromise = query.sampling_opts ? tryFetch(query.sampling_opts, undefined) : Promise.resolve(undefined);

    const stanFileContent = await stanFilePromise;
    if (stanFileContent) {
        data.stanFileContent = stanFileContent;
    }
    const dataFileContent = await dataFilePromise;
    if (dataFileContent) {
        data.dataFileContent = dataFileContent;
    }

    const sampling_opts = await sampling_optsPromise;
    if (sampling_opts) {
        try {
            const parsed = JSON.parse(sampling_opts)
            // TODO validate the parsed object
            data.samplingOpts = parsed
        } catch (err) {
            console.error('Failed to parse sampling_opts', err)
        }
    } else {
        if (query.num_chains) {
            data.samplingOpts.num_chains = parseInt(query.num_chains)
        }
        if (query.num_warmup) {
            data.samplingOpts.num_warmup = parseInt(query.num_warmup)
        }
        if (query.num_samples) {
            data.samplingOpts.num_samples = parseInt(query.num_samples)
        }
        if (query.init_radius) {
            data.samplingOpts.init_radius = parseFloat(query.init_radius)
        }
        if (query.seed) {
            data.samplingOpts.seed = parseInt(query.seed)
        }
    }

    if (query.title) {
        data.meta.title = query.title
    }

    return persistStateToEphemera(data);
}
