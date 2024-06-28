import { SamplingOpts, defaultSamplingOpts } from "../StanSampler/StanSampler"

export enum SPAnalysisKnownFiles {
    STANFILE = 'stanFileContent',
    DATAFILE = 'dataFileContent',
}

type SPAnalysisFiles = {
    [filetype in SPAnalysisKnownFiles]: string
}

type SPAnalysisBase = SPAnalysisFiles &
{
    samplingOpts: SamplingOpts
}

type SPAnalysisMetadata = {
    title: string
}

type SPAnalysisEphemeralData = SPAnalysisFiles & {
    // possible future things to track include the compilation status
    // of the current stan src file(s)
    // not implemented in this PR, but we need some content for the type
    server?: string
}

export type SPAnalysisDataModel = SPAnalysisBase &
{
    meta: SPAnalysisMetadata,
    ephemera: SPAnalysisEphemeralData
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

