import { Reducer } from "react"
import { Stanie } from "../exampleStanies/exampleStanies"
import { defaultSamplingOpts, SamplingOpts } from '../StanSampler/StanSampler'
import { initialDataModel, SPAnalysisDataModel } from "./SPAnalysisDataModel"


export type SPAnalysisReducerType = Reducer<SPAnalysisDataModel, SPAnalysisReducerAction>

export type SPAnalysisReducerAction = {
    type: 'loadStanie',
    stanie: Stanie
} | {
    type: 'retitle',
    title: string
} | {
    type: 'saveStanSrc',
    src: string
} | {
    // note: could trigger rerun of data-generating script?
    // or have a separate verb for that
    type: 'updateData',
    data: string
} | {
    type: 'setSamplingOpts',
    opts: Partial<SamplingOpts>
} | {
    type: 'localStorageLoad',
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
                meta: { ...s.meta, title: a.stanie.meta.title ?? 'Untitled' }
            }
        }
        case "retitle": {
            return {
                ...s,
                meta: { ...s.meta, title: a.title }
            }
        }
        case "saveStanSrc": {
            return {
                ...s,
                stanFileContent: a.src
            }
        }
        case "updateData": {
            return {
                ...s,
                dataFileContent: a.data
            }
        }
        case "setSamplingOpts": {
            return {
                ...s,
                samplingOpts: { ...s.samplingOpts, ...a.opts }
            }
        }
        case "localStorageLoad": {
            return a.state;
        }
        case "clear": {
            return initialDataModel
        }
    }
}
