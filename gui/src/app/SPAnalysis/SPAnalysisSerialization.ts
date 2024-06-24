import JSZip from "jszip"
import { replaceSpaces } from "../util/replaceSpaces"
import { FileNames, FileRegistry, mapFileContentsToModel, mapModelToFileManifest, SPAnalysisFileMap } from "./FileMapping"
import { getStringKnownFileKeys, SPAnalysisDataModel } from "./SPAnalysisDataModel"

export const serializeAnalysisToLocalStorage = (data: SPAnalysisDataModel): string => {
    const intermediary = {
        ...data, ephemera: undefined }
    return JSON.stringify(intermediary)
}

export const deserializeAnalysisFromLocalStorage = (serialized: string): SPAnalysisDataModel => {
    const intermediary = JSON.parse(serialized)
    // Not sure if this is strictly necessary
    intermediary.ephemera = {}
    const stringFileKeys = getStringKnownFileKeys()
    stringFileKeys.forEach((k) => intermediary.ephemera[k] = intermediary[k]);
    return intermediary as SPAnalysisDataModel
}

export const serializeAsZip = async (data: SPAnalysisDataModel): Promise<[Blob, string]> => {
    const fileManifest = mapModelToFileManifest(data)
    const folderName = replaceSpaces(data.meta.title)
    const zip = new JSZip()
    const folder = zip.folder(folderName)
    if (!folder) {
        throw new Error('Error creating folder in zip file')
    }
    Object.entries(fileManifest).filter(([name, _]) => name !== SPAnalysisFileMap.ephemera).forEach(([name, content]) => {
        folder.file(name, content)
    })
    const zipBlob = await zip.generateAsync({type: 'blob'})

    return [zipBlob, folderName]
}

/// ***************

export const parseFile = (fileBuffer: ArrayBuffer) => {
    const content = new TextDecoder().decode(fileBuffer)
    return content
}

export const deserializeZipToFiles = async (zipBuffer: ArrayBuffer) => {
    const zip = await JSZip.loadAsync(zipBuffer)
    const dirNames: string[] = []
    zip.forEach((relpath, file) => file.dir && dirNames.push(relpath))
    const folderName = dirNames[0] ?? ''
    if (! dirNames.every(n => n === folderName)) {
        throw new Error('Multiple directories in zip file')
    }
    zip.forEach((_, file) => {
        if (!file.name.startsWith(folderName)) {
            throw new Error('Files are not all in a single folder')
        }
    })
    const folderLength = folderName.length
    const files: {[name: string]: string} =  {}
    // we want to use a traditional for loop here, since async doesn't do nicely with higher-order callbacks
    for (const name in zip.files) {
        const file = zip.files[name]
        if (file.dir) continue
        const basename = name.substring(folderLength)
        if (Object.values(SPAnalysisFileMap).includes(basename as FileNames)) {
            const content = await file.async('arraybuffer')
            const decoded = new TextDecoder().decode(content)
            files[basename] = decoded
            // console.log(`added file ${basename} with content length ${decoded.length}`)
            // console.log(`Files is now ${JSON.stringify(files)}`)
        } else {
            throw new Error(`Unrecognized file in zip: ${file.name} (basename ${basename})`)
        }

    }
    console.log(`Requesting map from files object ${JSON.stringify(files)}`)
    return mapFileContentsToModel(files as Partial<FileRegistry>)
}

// export const loadFromZip = async (localDataModel: any, _name: string, content: ArrayBuffer, o: {replaceProject: boolean}) => {
//     const zip = await JSZip.loadAsync(content)

//     // check for a single folder
//     let folderName: string | undefined = undefined
//     for (const name in zip.files) {
//         if (zip.files[name].dir) {
//             if (folderName) {
//                 throw new Error('Multiple folders in zip file')
//             }
//             else {
//                 folderName = name
//             }
//         }
//     }
//     if (folderName) {
//         // check that all the files are in single folder
//         for (const name in zip.files) {
//             if (!name.startsWith(folderName)) {
//                 throw new Error('Files are not all in a single folder')
//             }
//         }
//     }
//     const files: {name: string, content: ArrayBuffer}[] = []
//     for (const name in zip.files) {
//         const f = zip.files[name]
//         if (!f.dir) {
//             if (f.name === `${(folderName || '')}main.stan`) {
//                 files.push({name: 'main.stan', content: await f.async('arraybuffer')})
//             }
//             else if (f.name === `${(folderName || '')}data.json`) {
//                 files.push({name: 'data.json', content: await f.async('arraybuffer')})
//             }
//             else if (f.name === `${(folderName || '')}sampling_opts.json`) {
//                 files.push({name: 'sampling_opts.json', content: await f.async('arraybuffer')})
//             }
//             else if (f.name === `${(folderName || '')}meta.json`) {
//                 files.push({name: 'meta.json', content: await f.async('arraybuffer')})
//             }
//             else {
//                 throw new Error(`Unrecognized file in zip: ${f.name}`)
//             }
//         }
//     }
//     await loadFromFiles(localDataModel, files, {replaceProject: o.replaceProject})
// }