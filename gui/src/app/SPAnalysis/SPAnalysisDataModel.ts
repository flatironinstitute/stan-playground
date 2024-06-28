import { SamplingOpts, defaultSamplingOpts, isSamplingOpts } from "../StanSampler/StanSampler"

export enum SPAnalysisKnownFiles {
    STANFILE = 'stanFileContent',
    DATAFILE = 'dataFileContent',
}

type SPAnalysisFiles = {
    [filetype in SPAnalysisKnownFiles]: string
}

const isSPAnalysisFiles = (x: any): x is SPAnalysisFiles => {
    if (!x) return false
    if (typeof x !== 'object') return false
    for (const k of Object.values(SPAnalysisKnownFiles)) {
        if (typeof x[k] !== 'string') return false
    }
    return true
}

type SPAnalysisBase = SPAnalysisFiles &
{
    samplingOpts: SamplingOpts
}

const isSPAnalysisBase = (x: any): x is SPAnalysisBase => {
    if (!x) return false
    if (typeof x !== 'object') return false
    if (!isSamplingOpts(x.samplingOpts)) return false
    if (!isSPAnalysisFiles(x)) return false
    return true
}

type SPAnalysisMetadata = {
    title: string
}

export const isSPAnalysisMetaData = (x: any): x is SPAnalysisMetadata => {
    if (!x) return false
    if (typeof x !== 'object') return false
    if (typeof x.title !== 'string') return false
    return true
}

type SPAnalysisEphemeralData = SPAnalysisFiles & {
    // possible future things to track include the compilation status
    // of the current stan src file(s)
    // not implemented in this PR, but we need some content for the type
    server?: string
}

const isSPAnalysisEphemeralData = (x: any): x is SPAnalysisEphemeralData => {
    if (!isSPAnalysisFiles(x)) return false
    return true
}

export type SPAnalysisDataModel = SPAnalysisBase &
{
    meta: SPAnalysisMetadata,
    ephemera: SPAnalysisEphemeralData
}

export const isSPAnalysisDataModel = (x: any): x is SPAnalysisDataModel => {
    if (!x) return false
    if (typeof x !== 'object') return false
    if (!isSPAnalysisMetaData(x.meta)) return false
    if (!isSPAnalysisEphemeralData(x.ephemera)) return false
    if (!isSPAnalysisBase(x)) return false
    return true
}


export type SPAnalysisPersistentDataModel = Omit<SPAnalysisDataModel, "ephemera">

export const initialDataModel: SPAnalysisDataModel = {
    meta: { title: "Undefined" },
    ephemera: {
        stanFileContent: "",
        dataFileContent: "",
    },
    stanFileContent: "",
    dataFileContent: "",
    samplingOpts: defaultSamplingOpts
}

export const persistStateToEphemera = (data: SPAnalysisDataModel): SPAnalysisDataModel => {
    const newEphemera = { ...data.ephemera }
    getStringKnownFileKeys().forEach(k => newEphemera[k] = data[k])
    return {
        ...data,
        ephemera: newEphemera
    }
}

export const getStringKnownFileKeys = () => Object.values(SPAnalysisKnownFiles);

export const modelHasUnsavedChanges = (data: SPAnalysisDataModel): boolean => {
    const stringFileKeys = getStringKnownFileKeys()
    return stringFileKeys.some((k) => data[k] !== data.ephemera[k])
}

export const modelHasUnsavedDataFileChanges = (data: SPAnalysisDataModel): boolean => {
    return data.dataFileContent !== data.ephemera.dataFileContent
}

export const stringifyField = (data: SPAnalysisDataModel, field: keyof SPAnalysisDataModel): string => {
    if (field === 'ephemera') return ''
    const value = data[field]
    if (typeof value === 'string') return value
    return JSON.stringify(value)
}

