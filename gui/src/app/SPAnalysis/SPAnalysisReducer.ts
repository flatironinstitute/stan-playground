import { Reducer } from "react"
import { Stanie } from "../exampleStanies/exampleStanies"
import { defaultSamplingOpts, SamplingOpts } from '../StanSampler/StanSampler'
import { FieldsContentsMap } from "./FileMapping"
import { initialDataModel, SPAnalysisDataModel, SPAnalysisKnownFiles } from "./SPAnalysisDataModel"
import { loadFromProjectFiles } from "./SPAnalysisSerialization"


export type SPAnalysisReducerType = Reducer<SPAnalysisDataModel, SPAnalysisReducerAction>

export type SPAnalysisReducerAction = {
    type: 'loadStanie',
    stanie: Stanie
} | {
    type: 'loadFiles',
    files: Partial<FieldsContentsMap>,
    clearExisting: boolean
} | {
    type: 'retitle',
    title: string
} | {
    type: 'editFile',
    content: string,
    filename: SPAnalysisKnownFiles
} | {
    type: 'commitFile',
    filename: SPAnalysisKnownFiles
} | {
    type: 'setSamplingOpts',
    opts: Partial<SamplingOpts>
} | {
    type: 'loadInitialData',
    state: SPAnalysisDataModel
} | {
    type: 'clear'
}

export const SPAnalysisReducer = (s: SPAnalysisDataModel, a: SPAnalysisReducerAction) => {
    switch (a.type) {
        case "loadStanie": {
            const dataFileContent = JSON.stringify(a.stanie.data, null, 2);
            return {
                ...s,
                stanFileContent: a.stanie.stan,
                dataFileContent,
                samplingOpts: defaultSamplingOpts,
                meta: { ...s.meta, title: a.stanie.meta.title ?? 'Untitled' },
                ephemera: {
                    ...s.ephemera,
                    stanFileContent: a.stanie.stan,
                    dataFileContent,
                }
            }
        }
        case "loadFiles": {
            return loadFromProjectFiles(s, a.files, a.clearExisting)
        }
        case "retitle": {
            return {
                ...s,
                meta: { ...s.meta, title: a.title }
            }
        }
        case "editFile": {
            const newEphemera = { ...s.ephemera }
            newEphemera[a.filename] = a.content
            return { ...s, ephemera: newEphemera }
        }
        case "commitFile": {
            const newState = { ...s }
            newState[a.filename] = s.ephemera[a.filename]
            return newState
        }
        case "setSamplingOpts": {
            return { ...s, samplingOpts: { ...s.samplingOpts, ...a.opts } }
        }
        case "loadInitialData": {
            return a.state;
        }
        case "clear": {
            return initialDataModel
        }
    }
}
