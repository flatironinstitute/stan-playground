import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useState } from "react"
import { SPAnalysisContext } from "./SPAnalysisContext"

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

    const [title, setTitle] = useState('Untitled')

    const value = useMemo(() => {
        return {
            localDataModel: {
                // title is hard-coded for now because we don't yet have a mechanism for it to be changed
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
                    for (const key of ['main.stan', 'data.json', 'sampling_opts.json']) {
                        kvStoreDispatch({
                            type: 'delete',
                            key
                        })
                    }
                }
            }
        }
    }, [kvStore, title])
    return (
        <SPAnalysisContext.Provider value={value}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

export default SetupSPAnalysis