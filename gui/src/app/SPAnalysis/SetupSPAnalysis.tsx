import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from "react"
import useRoute, { Route } from "../useRoute"
import { SPAnalysisContext } from "./SPAnalysisContext"

type SetupSPAnalysisProps = {
    // none
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
    const [kvStore, kvStoreDispatch] = useReducer(kvStoreReducer, {})

    const { route, setRoute } = useRoute()

    const initialStateHasBeenSet = useRef<boolean>(false)

    const [initialFilesLoadedFromUrl, setInitialFilesLoadedFromUrl] = useState<{ [key: string]: string } | undefined>(undefined)
    const [ initialRoute, setInitialRoute ] = useState<Route | undefined>(undefined)

    ////////////////////////////////////////////////////////////////////////////////////////
    // Local storage persistence
    useEffect(() => {
        // as user reloads the page or closes the tab, we save the state to
        // local storage
        if (route.sourceDataQuery) {
            // if the URL has a query string, we don't save the state to local storage
            return
        }
        const handleBeforeUnload = () => {
            localStorage.setItem('stan-playground-saved-state', JSON.stringify(kvStore))
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [kvStore, route.sourceDataQuery])
    useEffect(() => {
        // load the saved state on first load
        if (initialStateHasBeenSet.current) return
        if (route.sourceDataQuery) {
            // if the URL has a query string, we don't load the state from local
            // storage
            return
        }
        try {
            const savedState = localStorage.getItem('stan-playground-saved-state')
            if (!savedState) return
            const parsedState = JSON.parse(savedState)
            for (const key in parsedState) {
                if (['main.stan', 'data.json', 'sampling_opts.json', 'meta.json'].includes(key)) {
                    kvStoreDispatch({
                        type: 'set',
                        key,
                        value: parsedState[key]
                    })
                }
            }
        }
        finally {
            initialStateHasBeenSet.current = true
        }
    }, [route.sourceDataQuery])
    ////////////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////////////
    // Loading from URL
    useEffect(() => {
        let canceled = false
        if (initialStateHasBeenSet.current) return
        if (!route.sourceDataQuery) {
            return
        }
        (async () => {
            try {
                const sdq = route.sourceDataQuery
                if (!sdq) throw new Error('Unexpected missing sourceDataQuery')
                // load all the content first so we don't ever get a partial load of internal state
                const filesToSet: { [key: string]: string } = {}
                if (sdq.stan) {
                    const stanContent = await fetchFromUri(sdq.stan)
                    filesToSet['main.stan'] = stanContent
                }
                if (sdq.data) {
                    const dataContent = await fetchFromUri(sdq.data)
                    filesToSet['data.json'] = dataContent
                }
                if (sdq.sampling_opts) {
                    const samplingOptsContent = await fetchFromUri(sdq.sampling_opts)
                    filesToSet['sampling_opts.json'] = samplingOptsContent
                }
                if (sdq.inline_sampling_opts) {
                    if (sdq.sampling_opts) {
                        throw new Error('Cannot have both inline sampling opts and sampling_opts in query string')
                    }
                    filesToSet['sampling_opts.json'] = JSON.stringify(sdq.inline_sampling_opts, null, 2)
                }
                if (canceled) return
                for (const key in filesToSet) {
                    kvStoreDispatch({
                        type: 'set',
                        key,
                        value: filesToSet[key]
                    })
                }
                setInitialFilesLoadedFromUrl(filesToSet)
                setInitialRoute(deepCopy(route))
            }
            catch (e) {
                console.error('Error loading from URL', e)
            }
            finally {
                initialStateHasBeenSet.current = true
            }
        })()
        return () => { canceled = true }
    }, [route])
    ////////////////////////////////////////////////////////////////////////////////////////

    // if any of the file contents change after the initial load, we clear the URL
    useEffect(() => {
        if (!initialFilesLoadedFromUrl) return
        let somethingChanged = false
        for (const key in kvStore) {
            if (kvStore[key] !== initialFilesLoadedFromUrl[key]) {
                somethingChanged = true
                break
            }
        }
        if (somethingChanged) {
            setRoute({
                page: 'home'
            })
        }
        else {
            if (initialRoute) {
                // if we made some changes and then undid them, let's be helpful and reset the URL!
                setRoute(initialRoute)
            }
        }
    }, [kvStore, initialFilesLoadedFromUrl, initialRoute, setRoute])

    const value = useMemo(() => {
        const meta = safeParseJson(kvStore['meta.json'] || '{}') || {}
        const title = meta.title || 'Untitled'
        const setTitle = (title: string) => {
            kvStoreDispatch({
                type: 'set',
                key: 'meta.json',
                value: JSON.stringify({ title })
            })
        }
        return {
            localDataModel: {
                title,
                setTitle,
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
                    for (const key of ['main.stan', 'data.json', 'sampling_opts.json', 'meta.json']) {
                        kvStoreDispatch({
                            type: 'delete',
                            key
                        })
                    }
                }
            }
        }
    }, [kvStore])
    return (
        <SPAnalysisContext.Provider value={value}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

const fetchFromUri = async (uri: string): Promise<string> => {
    const response = await fetch(uri)
    if (!response.ok) {
        throw new Error(`Failed to fetch from ${uri}`)
    }
    return response.text()
}

const deepCopy = (obj: any) => {
    return JSON.parse(JSON.stringify(obj))
}

const safeParseJson = (text: string): any => {
    try {
        return JSON.parse(text)
    } catch (e) {
        return null
    }
}

export default SetupSPAnalysis