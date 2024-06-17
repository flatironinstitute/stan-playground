import { SamplingOpts, defaultSamplingOpts } from "../StanSampler/StanSampler"

// Possible future inclusion: the ID of the server we're connected to

type SPAnalysisBase = {
    stanFileContent: string
    dataFileContent: string
    samplingOpts: SamplingOpts
}

type SPAnalysisEphemeralData = {
    // possible future things to track include the compilation status
    // of the current stan src file(s)
    server?: string
}

type SPAnalysisMetadata = {
    title: string
}

export type SPAnalysisDataModel = SPAnalysisBase &
{
    meta: SPAnalysisMetadata,
    ephemera?: SPAnalysisEphemeralData
}

export const initialDataModel: SPAnalysisDataModel = {
    meta: { title: "Undefined" },
    stanFileContent: "",
    dataFileContent: "",
    samplingOpts: defaultSamplingOpts
}

export const serializeAnalysis = (data: SPAnalysisDataModel): string => {
    const intermediary = { ...data, ephemera: undefined }
    return JSON.stringify(intermediary)
}

export const deserializeAnalysis = (serialized: string): SPAnalysisDataModel => {
    const intermediary = JSON.parse(serialized)
    // consider stripping ephemeral data on deserialization
    return intermediary as SPAnalysisDataModel
}
