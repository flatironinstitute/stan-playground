import { FunctionComponent, PropsWithChildren, useMemo, useReducer } from "react"
import { SPAnalysisContext } from "./SPAnalysisContext"

type SetupSPAnalysisProps = {
    sourceDataUri: string
}

type AnalysisFiles = {
    [key: string]: string
}

type AnalysisFilesAction = {
    type: 'set'
    key: string
    value: string
} | {
    type: 'delete'
    key: string
}

const analysisFilesReducer = (state: AnalysisFiles, action: AnalysisFilesAction): AnalysisFiles => {
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
    const [analysisFiles, dispatchAnalysisFiles] = useReducer(analysisFilesReducer, {})
    const value = useMemo(() => {
        return {
            localDataModel: {
                title: 'SPAnalysis',
                stanFileContent: analysisFiles['main.stan'] || '',
                setStanFileContent: (text: string) => {
                    dispatchAnalysisFiles({
                        type: 'set',
                        key: 'main.stan',
                        value: text
                    })
                },
                dataFileContent: analysisFiles['data.json'] || '',
                setDataFileContent: (text: string) => {
                    dispatchAnalysisFiles({
                        type: 'set',
                        key: 'data.json',
                        value: text
                    })
                },
                samplingOptsContent: analysisFiles['sampling_opts.json'] || '',
                setSamplingOptsContent: (text: string) => {
                    dispatchAnalysisFiles({
                        type: 'set',
                        key: 'sampling_opts.json',
                        value: text
                    })
                }
            }
        }
    }, [analysisFiles])
    return (
        <SPAnalysisContext.Provider value={value}>
            {children}
        </SPAnalysisContext.Provider>
    )
}

export default SetupSPAnalysis