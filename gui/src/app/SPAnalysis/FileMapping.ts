import { SPAnalysisDataModel, stringifyField } from "./SPAnalysisDataModel"

export enum FileNames {
    META = 'meta.json',
    SAMPLING = 'sampling_opts.json',
    STANFILE = 'main.stan',
    DATAFILE = 'data.json',
    UNUSED = 'UNUSED'
}

type FileMapType = {
    [name in keyof SPAnalysisDataModel]: FileNames
}

export const SPAnalysisFileMap: FileMapType = {
    meta: FileNames.META,
    samplingOpts: FileNames.SAMPLING,
    stanFileContent: FileNames.STANFILE,
    dataFileContent: FileNames.DATAFILE,
    ephemera: FileNames.UNUSED
}

export type FileRegistry = {
    [name in FileNames]: string
}

export const mapModelToFileManifest = (data: SPAnalysisDataModel) => {
    const fileManifest: Partial<FileRegistry> = {};
    const fields = Object.keys(SPAnalysisFileMap) as (keyof SPAnalysisDataModel)[]
    fields.forEach((k) => {
        const key = SPAnalysisFileMap[k]
        fileManifest[key] = stringifyField(data, k)
    })
    return fileManifest
}

export type FileToFieldsMap = {
    [name in keyof SPAnalysisDataModel]: string
}

export const mapFilesToModel = (files: Partial<FileRegistry>): Partial<FileToFieldsMap> => {
    const fields = Object.keys(files)
    const theMap: Partial<FileToFieldsMap> = {}
    console.log(`Fields: ${fields} length is ${fields.length}`)
    fields.forEach(f => {
        switch (f) {
            case FileNames.META: {
                theMap.meta = files[f]
                break;
            }
            case FileNames.DATAFILE: {
                theMap.dataFileContent = files[f]
                break;
            }
            case FileNames.STANFILE: {
                theMap.stanFileContent = files[f]
                break;
            }
            case FileNames.SAMPLING: {
                theMap.samplingOpts = files[f]
                break;
            }
            default:
                // Don't do anything for unrecognized filenames
                break;
        }
    })
    console.log(`Established map as ${JSON.stringify(theMap)}`)
    return theMap
}
