import { Reducer } from "react"
import { Stanie } from "../exampleStanies/exampleStanies"
import { defaultSamplingOpts, SamplingOpts } from '../StanSampler/StanSampler'
import { FileToFieldsMap } from "./FileMapping"
import { initialDataModel, persistStateToEphemera, SPAnalysisDataModel, SPAnalysisKnownFiles } from "./SPAnalysisDataModel"


export type SPAnalysisReducerType = Reducer<SPAnalysisDataModel, SPAnalysisReducerAction>

export type SPAnalysisReducerAction = {
    type: 'loadStanie',
    stanie: Stanie
} | {
    type: 'loadFiles',
    files: Partial<FileToFieldsMap>,
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

const loadMetaFromString = (data: SPAnalysisDataModel, json: string, clearExisting: boolean = false): SPAnalysisDataModel => {
    const newMeta = JSON.parse(json)
    // TODO: properly check type of deserialized meta
    const newMetaMember = clearExisting ? { ...newMeta } : { ...data.meta, ...newMeta }
    return { ...data, meta: newMetaMember }
}

const loadSamplingOptsFromString = (data: SPAnalysisDataModel, json: string, clearExisting: boolean = false): SPAnalysisDataModel => {
    const newSampling = JSON.parse(json)
    // TODO: properly check type/fields of deserialized sampling opts
    const newSamplingOptsMember = clearExisting ? { ...newSampling } : { ...data.samplingOpts, ...newSampling }
    return { ...data, samplingOpts: newSamplingOptsMember }
}

const loadFileFromString = (data: SPAnalysisDataModel, field: SPAnalysisKnownFiles, contents: string, replaceProject: boolean = false): SPAnalysisDataModel => {
    const newData = replaceProject ? { ...initialDataModel } : { ...data }
    newData[field] = contents
    return newData
}

const loadFromProjectFiles = (data: SPAnalysisDataModel, files: Partial<FileToFieldsMap>, clearExisting: boolean = false): SPAnalysisDataModel => {
    console.log(`Loading from files with manifest ${JSON.stringify(files)}`)
    let newData = clearExisting ? initialDataModel : data
    delete files['ephemera']     // just to be sure
    if (Object.keys(files).includes('meta')) {
        // console.log(`files includes meta, loading from string ${files.meta}`)
        newData = loadMetaFromString(newData, files.meta ?? '')
        // console.log(`newData is now ${JSON.stringify(newData)}`)
        delete files['meta']
    }
    if (Object.keys(files).includes('samplingOpts')) {
        newData = loadSamplingOptsFromString(newData, files.samplingOpts ?? '')
        delete files['samplingOpts']
    }
    const fileKeys = Object.keys(files) as SPAnalysisKnownFiles[]
    console.log(`Entering reducer, newData is now ${JSON.stringify(newData)}`)
    newData = fileKeys.reduce((currData, currField) => loadFileFromString(currData, currField, files[currField] ?? ''), newData)
    console.log(`Exiting reducer, newData is now ${JSON.stringify(newData)}`)
    newData = persistStateToEphemera(newData)
    return newData
}