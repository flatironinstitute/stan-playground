import { FunctionComponent, PropsWithChildren, useMemo, useReducer } from "react"
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
    const value = useMemo(() => {
        return {
            localDataModel: {
                title: 'SPAnalysis',
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

export default SetupSPAnalysis