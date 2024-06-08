import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useState } from "react"
import { SPAnalysisContext } from "./SPAnalysisContext"
import useRoute, { getQueryFromSourceDataUri } from "../useRoute"
import loadFilesFromGist from "./loadFilesFromGist"

type SetupSPAnalysisProps = {
    // will be used in future when we allow query parameters to be passed to the app
    sourceDataUri: string
}

type KVStore = {
    [key: string]: string
}

type KVStoreAction = {
    type: 'set'
    key: string
    value: string
} | {
    type: 'delete'
    key: string
}

const kvStoreReducer = (state: KVStore, action: KVStoreAction): KVStore => {
    switch (action.type) {
        case 'set': {
            return {
                ...state,
                [action.key]: action.value
            }
        }
        case 'delete': {
            const newState = { ...state }
            delete newState[action.key]
            return newState
        }
    }
}

const SetupSPAnalysis: FunctionComponent<PropsWithChildren<SetupSPAnalysisProps>> = ({ children }) => {
    const {route, setRoute} = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    const [sourceAnalysisFiles, setSourceAnalysisFiles] = useState<KVStore>({})
    const [kvStore, kvStoreDispatch] = useReducer(kvStoreReducer, {})

    ////////////////////////////////////////////////////////////////////////////////////////
    // For convenience, we save the state to local storage so it is available on
    // reload of the page But this will be revised in the future to use a more
    // sophisticated storage mechanism.
    useEffect(() => {
        // as user reloads the page or closes the tab,
        // we save the state to local storage
        const handleBeforeUnload = () => {
            localStorage.setItem('stan-playground-saved-state', JSON.stringify(kvStore))
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [kvStore]);
    useEffect(() => {
        // load the saved state on first load
        const savedState = localStorage.getItem('stan-playground-saved-state')
        if (!savedState) return
        const parsedState = JSON.parse(savedState)
        for (const key in parsedState) {
            if (['main.stan', 'data.json', 'sampling_opts.json'].includes(key)) {
                kvStoreDispatch({
                    type: 'set',
                    key,
                    value: parsedState[key]
                })
            }
        }
    }, [])
    ////////////////////////////////////////////////////////////////////////////////////////

    const value = useMemo(() => {
        return {
            localDataModel: {
                // title is hard-coded for now because we don't yet have a mechanism for it to be changed
                title: route.title,
                stanFileContent: kvStore['main.stan'] || '',
                setStanFileContent: (text: string) => {
                    kvStoreDispatch({
                        type: 'set',
                        key: 'main.stan',
                        value: text
                    })
                },
                dataFileContent: kvStore['data.json'] || '',
                setDataFileContent: (text: string) => {
                    kvStoreDispatch({
                        type: 'set',
                        key: 'data.json',
                        value: text
                    })
                },
                samplingOptsContent: kvStore['sampling_opts.json'] || '',
                setSamplingOptsContent: (text: string) => {
                    kvStoreDispatch({
                        type: 'set',
                        key: 'sampling_opts.json',
                        value: text
                    })
                },
                clearAll: () => {
                    for (const key of ['main.stan', 'data.json', 'sampling_opts.json']) {
                        kvStoreDispatch({
                            type: 'delete',
                            key
                        })
                    }
                }
            },
            sourceAnalysisFiles,
            localAnalysisFiles: kvStore
        }
    }, [kvStore, route.title, sourceAnalysisFiles])
    useEffect(() => {
        // initialize content based on sourceDataUri
        (async () => {
            const q = getQueryFromSourceDataUri(route.sourceDataUri)
            const analysisFiles: KVStore = {}
            if (q.f) {
                if (q.f.startsWith('https://gist.github.com')) {
                    const {files, description} = await loadFilesFromGist(q.f)
                    for (const key in files) {
                        analysisFiles[key] = files[key]
                    }
                    if (description) {
                        setRoute({
                            ...route,
                            title: description
                        })
                    }
                }
                else {
                    console.warn('Unexpected sourceDataUri', q.f)
                }
            }
            else if ((q["data.json"]) || (q["main.stan"]) || (q["sampling_opts.json"])) {
                const dataContent = await loadFromUri(q["data.json"]) || ''
                const stanContent = await loadFromUri(q["main.stan"]) || ''
                const samplingOptsContent = await loadFromUri(q["sampling_opts.json"]) || ''
                analysisFiles['data.json'] = dataContent
                analysisFiles['main.stan'] = stanContent
                analysisFiles['sampling_opts.json'] = samplingOptsContent
            }
            setSourceAnalysisFiles(analysisFiles)
            for (const key in analysisFiles) {
                kvStoreDispatch({
                    type: 'set',
                    key,
                    value: analysisFiles[key]
                })
            }
        })()
    }, [route.sourceDataUri, setRoute, kvStoreDispatch, route])
    return (
        <SPAnalysisContext.Provider value={value}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

const loadFromUri = async (uri?: string): Promise<string | null> => {
    if (!uri) {
        return null
    }
    const response = await fetch(uri)
    if (!response.ok) {
        console.error(`Failed to load ${uri}`)
        return null
    }
    return await response.text()
}

export default SetupSPAnalysis