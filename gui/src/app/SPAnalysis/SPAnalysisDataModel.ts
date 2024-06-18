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

export const serializeAnalysis = (data: SPAnalysisDataModel): string => {
    const intermediary = {
        ...data, ephemera: undefined }
    return JSON.stringify(intermediary)
}

export const deserializeAnalysis = (serialized: string): SPAnalysisDataModel => {
    const intermediary = JSON.parse(serialized)
    // Not sure if this is strictly necessary
    intermediary.ephemera = {
        stanFileContent: intermediary.stanFileContent,
        dataFileContent: intermediary.dataFileContent
    }
    return intermediary as SPAnalysisDataModel
}
