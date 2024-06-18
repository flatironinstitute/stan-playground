import { Reducer } from "react"
import { Stanie } from "../exampleStanies/exampleStanies"
import { defaultSamplingOpts, SamplingOpts } from '../StanSampler/StanSampler'
import { initialDataModel, SPAnalysisDataModel, SPAnalysisKnownFiles } from "./SPAnalysisDataModel"


export type SPAnalysisReducerType = Reducer<SPAnalysisDataModel, SPAnalysisReducerAction>

export type SPAnalysisReducerAction = {
    type: 'loadStanie',
    stanie: Stanie
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
    type: 'loadLocalStorage',
    state: SPAnalysisDataModel
} | {
    type: 'clear'
}

export const SPAnalysisReducer: SPAnalysisReducerType = (s: SPAnalysisDataModel, a: SPAnalysisReducerAction) => {
    switch (a.type) {
        case "loadStanie": {
            return {
                ...s,
                stanFileContent: a.stanie.stan,
                dataFileContent: JSON.stringify(a.stanie.data),
                samplingOpts: defaultSamplingOpts,
                meta: { ...s.meta, title: a.stanie.meta.title ?? 'Untitled' },
                ephemera: {
                    ...s.ephemera,
                    stanFileContent: a.stanie.stan,
                    dataFileContent: JSON.stringify(a.stanie.data)
                }
            }
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
            return { ...s, samplingOpts: { ...s.samplingOpts, ...a.opts }}
        }
        case "loadLocalStorage": {
            return a.state;
        }
        case "clear": {
            return initialDataModel
        }
    }
}

