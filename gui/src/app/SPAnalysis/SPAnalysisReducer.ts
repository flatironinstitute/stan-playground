import { Reducer } from "react"
import { Stanie } from "../exampleStanies/exampleStanies"
import { defaultSamplingOpts, isSamplingOpts, SamplingOpts } from '../StanSampler/StanSampler'
import { FieldsContentsMap } from "./FileMapping"
import { initialDataModel, isSPAnalysisMetaData, persistStateToEphemera, SPAnalysisDataModel, SPAnalysisKnownFiles } from "./SPAnalysisDataModel"


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
    type: 'loadLocalStorage',
    state: SPAnalysisDataModel
} | {
    type: 'clear'
}

export const SPAnalysisReducer: SPAnalysisReducerType = (s: SPAnalysisDataModel, a: SPAnalysisReducerAction) => {
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
            try {
                return loadFromProjectFiles(s, a.files, a.clearExisting)
            }
            catch (e) {
                // probably sampling opts or meta files were not valid
                console.error('Error loading files', e)
                return s
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

const loadMetaFromString = (data: SPAnalysisDataModel, json: string, clearExisting: boolean = false): SPAnalysisDataModel => {
    const newMeta = JSON.parse(json)
    if (!isSPAnalysisMetaData(newMeta)) {
        throw Error('Deserialized meta is not valid')
    }
    const newMetaMember = clearExisting ? { ...newMeta } : { ...data.meta, ...newMeta }
    return { ...data, meta: newMetaMember }
}

const loadSamplingOptsFromString = (data: SPAnalysisDataModel, json: string, clearExisting: boolean = false): SPAnalysisDataModel => {
    const newSampling = JSON.parse(json)
    if (!isSamplingOpts(newSampling)) {
        throw Error('Deserialized sampling opts are not valid')
    }
    const newSamplingOptsMember = clearExisting ? { ...newSampling } : { ...data.samplingOpts, ...newSampling }
    return { ...data, samplingOpts: newSamplingOptsMember }
}

const loadFileFromString = (data: SPAnalysisDataModel, field: SPAnalysisKnownFiles, contents: string, replaceProject: boolean = false): SPAnalysisDataModel => {
    const newData = replaceProject ? { ...initialDataModel } : { ...data }
    newData[field] = contents
    return newData
}

const loadFromProjectFiles = (data: SPAnalysisDataModel, files: Partial<FieldsContentsMap>, clearExisting: boolean = false): SPAnalysisDataModel => {
    let newData = clearExisting ? initialDataModel : data
    if (Object.keys(files).includes('meta')) {
        newData = loadMetaFromString(newData, files.meta ?? '')
        delete files['meta']
    }
    if (Object.keys(files).includes('samplingOpts')) {
        newData = loadSamplingOptsFromString(newData, files.samplingOpts ?? '')
        delete files['samplingOpts']
    }
    const fileKeys = Object.keys(files) as SPAnalysisKnownFiles[]
    newData = fileKeys.reduce((currData, currField) => loadFileFromString(currData, currField, files[currField] ?? ''), newData)
    newData = persistStateToEphemera(newData)
    return newData
}