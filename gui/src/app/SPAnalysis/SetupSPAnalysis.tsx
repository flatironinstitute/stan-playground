import { FunctionComponent, PropsWithChildren, useEffect, useMemo, useReducer, useState } from "react"
import { SPAnalysisContext } from "./SPAnalysisContext"
import useRoute, { getQueryFromSourceDataUri } from "../useRoute"
import { defaultSamplingOpts } from "../StanSampler/StanSampler"
import loadFilesFromGist from "./loadFilesFromGist"

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
    const {route, setRoute} = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    const [sourceAnalysisFiles, setSourceAnalysisFiles] = useState<AnalysisFiles>({})
    const [localAnalysisFiles, localAnalysisFilesDispatch] = useReducer(analysisFilesReducer, {})
    const value = useMemo(() => {
        return {
            localDataModel: {
                title: route.title,
                stanFileContent: localAnalysisFiles['main.stan'] || '',
                setStanFileContent: (text: string) => {
                    localAnalysisFilesDispatch({
                        type: 'set',
                        key: 'main.stan',
                        value: text
                    })
                },
                dataFileContent: localAnalysisFiles['data.json'] || '',
                setDataFileContent: (text: string) => {
                    localAnalysisFilesDispatch({
                        type: 'set',
                        key: 'data.json',
                        value: text
                    })
                },
                samplingOptsContent: localAnalysisFiles['sampling_opts.json'] || JSON.stringify(defaultSamplingOpts, null, 2),
                setSamplingOptsContent: (text: string) => {
                    localAnalysisFilesDispatch({
                        type: 'set',
                        key: 'sampling_opts.json',
                        value: text
                    })
                }
            },
            sourceAnalysisFiles,
            localAnalysisFiles
        }
    }, [localAnalysisFiles, route.title, sourceAnalysisFiles])
    useEffect(() => {
        // initialize content based on sourceDataUri
        (async () => {
            const q = getQueryFromSourceDataUri(route.sourceDataUri)
            const analysisFiles: AnalysisFiles = {}
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
                localAnalysisFilesDispatch({
                    type: 'set',
                    key,
                    value: analysisFiles[key]
                })
            }
        })()
    }, [route.sourceDataUri, setRoute, localAnalysisFilesDispatch, route])
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