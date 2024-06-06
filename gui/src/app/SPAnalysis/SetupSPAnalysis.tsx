import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer } from "react"
import { SPAnalysisContext } from "./SPAnalysisContext"
import useRoute, { getQueryFromSourceDataUri } from "../useRoute"
import { defaultSamplingOpts } from "../StanSampler/StanSampler"

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
    const {route} = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    const [analysisFiles, dispatchAnalysisFiles] = useReducer(analysisFilesReducer, {})
    const value = useMemo(() => {
        return {
            localDataModel: {
                title: route.title,
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
                samplingOptsContent: analysisFiles['sampling_opts.json'] || JSON.stringify(defaultSamplingOpts, null, 2),
                setSamplingOptsContent: (text: string) => {
                    dispatchAnalysisFiles({
                        type: 'set',
                        key: 'sampling_opts.json',
                        value: text
                    })
                }
            }
        }
    }, [analysisFiles, route.title])
    useEffect(() => {
        (async () => {
            const q = getQueryFromSourceDataUri(route.sourceDataUri)
            if ((q["data.json"]) || (q["main.stan"]) || (q["sampling_opts.json"])) {
                const dataContent = await loadFromUri(q["data.json"]) || ''
                const stanContent = await loadFromUri(q["main.stan"]) || ''
                const samplingOptsContent = await loadFromUri(q["sampling_opts.json"]) || ''
                dispatchAnalysisFiles({
                    type: 'set',
                    key: 'data.json',
                    value: dataContent
                })
                dispatchAnalysisFiles({
                    type: 'set',
                    key: 'main.stan',
                    value: stanContent
                })
                dispatchAnalysisFiles({
                    type: 'set',
                    key: 'sampling_opts.json',
                    value: samplingOptsContent
                })

            }
        })()
    }, [route.sourceDataUri])
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