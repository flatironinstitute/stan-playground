import { SPAnalysisDataModel, initialDataModel, persistStateToEphemera } from "./SPAnalysisDataModel";


enum QueryParamKeys {
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

export const fromSearchParams = (searchParams: URLSearchParams) => {
    for (const key of searchParams.keys()) {
        // warn on unknown keys
        if (!Object.values(QueryParamKeys).includes(key as QueryParamKeys)) {
            console.warn('Unknown query parameter', key)
        }
    }

    const query: QueryParams = {
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
    return query
}

export const queryStringHasParameters = (query: QueryParams) => {
    return Object.values(query).some(v => v !== null)
}

const tryFetch = async (url: string) => {
    console.log('Fetching content from', url)
    try {
        const req = await fetch(url)
        if (!req.ok) {
            console.error('Failed to fetch from url', url, req.status, req.statusText)
            return undefined
        }
        return await req.text()
    } catch (err) {
        console.error('Failed to fetch from url', url, err)
        return undefined
    }
}

const deepCopy = (obj: any) => {
    return JSON.parse(JSON.stringify(obj))
}

export const fetchRemoteAnalysis = async (query: QueryParams) => {
    // any special 'project' query could be loaded here at the top
    const data: SPAnalysisDataModel = deepCopy(initialDataModel)
    
    if (query.stan) {
        const stanFileContent = await tryFetch(query.stan)
        if (stanFileContent) {
            data.stanFileContent = stanFileContent
        }
    }
    if (query.data) {
        const dataFileContent = await tryFetch(query.data)
        if (dataFileContent) {
            data.dataFileContent = dataFileContent
        }
    }

    if (query.sampling_opts) {
        const text = await tryFetch(query.sampling_opts)
        if (text) {
            // TODO(bmw) validate
            data.samplingOpts = JSON.parse(text)
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
