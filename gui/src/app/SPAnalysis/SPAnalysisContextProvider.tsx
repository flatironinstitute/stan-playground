import { createContext, FunctionComponent, PropsWithChildren, useEffect, useReducer } from "react"
import {  initialDataModel, SPAnalysisDataModel, modelHasUnsavedChanges } from "./SPAnalysisDataModel"
import { SPAnalysisReducer, SPAnalysisReducerAction, SPAnalysisReducerType } from "./SPAnalysisReducer"
import { useSearchParams } from "react-router-dom"
import { SamplingOpts } from "../StanSampler/StanSampler"
import { deserializeAnalysisFromLocalStorage, serializeAnalysisToLocalStorage } from "./SPAnalysisSerialization"

type SPAnalysisContextType = {
    data: SPAnalysisDataModel
    update: React.Dispatch<SPAnalysisReducerAction>
}

type SPAnalysisContextProviderProps = {
}

export const SPAnalysisContext = createContext<SPAnalysisContextType>({
    data: initialDataModel,
    update: () => { }
})


enum QueryParamKeys {
    StanFile = "stan",
    DataFile = "data",
    SamplingOpts = "sampling_opts",
    Title = "title",
    SONumChains = 'num_chains',
    SONumWarmup = 'num_warmup',
    SONumSamples = 'num_samples',
    SOInitRadius = 'init_radius',
    SOSeed = 'seed',
}

type QueryParams = {
    [key in QueryParamKeys]: string | null
}

const fromSearchParams = (searchParams: URLSearchParams) => {
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


const tryFetch = async (url: string) => {
    console.log('Fetching content from', url);
    try {
        const req = await fetch(url);
        if (!req.ok) {
            console.error('Failed to fetch from url', url, req.status, req.statusText);
            return undefined;
        }
        return await req.text();
    } catch (err) {
        console.error('Failed to fetch from url', url, err);
        return undefined;
    }
}

const deepCopy = (obj: any) => {
    return JSON.parse(JSON.stringify(obj))
}

const fetchRemoteAnalysis = async (query: QueryParams) => {

    // any special 'project' query could be loaded here at the top
    const data: SPAnalysisDataModel = deepCopy(initialDataModel);

    if (query.stan) {
        const stanFileContent = await tryFetch(query.stan);
        if (stanFileContent) {
            data.stanFileContent = stanFileContent;
        }
    }
    if (query.data) {
        const dataFileContent = await tryFetch(query.data);
        if (dataFileContent) {
            data.dataFileContent = dataFileContent;
        }
    }

    if (query.sampling_opts) {
        const text = await tryFetch(query.sampling_opts);
        if (text) {
            // TODO(bmw) validate
            data.samplingOpts = JSON.parse(text);
        }
    } else {
        for (const k in Object.keys(data.samplingOpts)) {
            const key = k as keyof SamplingOpts;
            const setting = query[key];
            if (setting) {
                data.samplingOpts[key] = parseInt(setting);
            }
        }
    }

    if (query.title) {
        data.meta.title = query.title;
    }

    // TODO(bmw) create a 'setEphemera' helper?
    data.ephemera.stanFileContent = data.stanFileContent;
    data.ephemera.dataFileContent = data.dataFileContent;

    return data;
}


const SPAnalysisContextProvider: FunctionComponent<PropsWithChildren<SPAnalysisContextProviderProps>> = ({ children }) => {
    const [data, update] = useReducer<SPAnalysisReducerType>(SPAnalysisReducer, initialDataModel)

    const [searchParams, setSearchParams] = useSearchParams();

    ////////////////////////////////////////////////////////////////////////////////////////
    // For convenience, we save the state to local storage so it is available on
    // reload of the page But this will be revised in the future to use a more
    // sophisticated storage mechanism.
    useEffect(() => {
        // as user reloads the page or closes the tab, save state to local storage
        const handleBeforeUnload = () => {
            const state = serializeAnalysisToLocalStorage(data)
            localStorage.setItem('stan-playground-saved-state', state)
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [data])



    useEffect(() => {
        if (data != initialDataModel) return;

        const query = fromSearchParams(searchParams);

        // any query is set
        if (Object.values(query).some(v => v !== null)) {
            fetchRemoteAnalysis(query).then((data) => {
                update({ type: 'loadInitialData', state: data })
            })
        } else {
            // load the saved state on first load
            const savedState = localStorage.getItem('stan-playground-saved-state')
            if (!savedState) return
            const parsedData = deserializeAnalysisFromLocalStorage(savedState)
            update({ type: 'loadInitialData', state: parsedData })
        }

    }, [data, searchParams])

    useEffect(() => {
        if (searchParams.size !== 0 && modelHasUnsavedChanges(data)) {
            setSearchParams(new URLSearchParams());
        }
    }, [data, searchParams, setSearchParams])
    ////////////////////////////////////////////////////////////////////////////////////////

    return (
        <SPAnalysisContext.Provider value={{ data, update }}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

export default SPAnalysisContextProvider

