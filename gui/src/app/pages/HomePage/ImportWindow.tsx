import { FunctionComponent, useCallback, useState } from "react"
import { useSPAnalysis } from "../../SPAnalysis/SPAnalysisContext"
import JSZip from 'jszip'
import UploadFilesArea from "./UploadFilesArea"

type ImportWindowProps = {
    onClose: () => void
}

const ImportWindow: FunctionComponent<ImportWindowProps> = ({ onClose }) => {
    const { localDataModel } = useSPAnalysis()
    const [errorText, setErrorText] = useState<string | null>(null)

    const handleFilesUploaded = useCallback(async (files: {
        name: string,
        content: ArrayBuffer
    }[]) => {
        try {
            if ((files.length === 1) && (files[0].name.endsWith('.zip'))) {
                await loadFromZip(localDataModel, files[0].name, files[0].content)
            }
            else if ((files.length === 1) && (files[0].name.endsWith('.stan'))) {
                await loadFromStanFile(localDataModel, files[0].name, files[0].content)
            }
            else if ((files.length === 1) && (files[0].name === 'data.json')) {
                await loadFromFiles(localDataModel, files)
            }
            else {
                for (const file of files) {
                    let ok = false
                    for (const fname of ['main.stan', 'data.json', 'sampling_opts.json', 'meta.json']) {
                        if (file.name === fname) {
                            ok = true
                            break
                        }
                    }
                    if (!ok) {
                        throw Error('Unrecognized file: ' + file.name)
                    }
                }
                await loadFromFiles(localDataModel, files)
            }
            onClose()
        }
        catch (e: any) {
            setErrorText(e.message)
        }
    }, [localDataModel, onClose])

    return (
        <div>
            <h3>Import analysis</h3>
            <div>
                You can upload:
                <ul>
                    <li>A .zip file that was previously exported</li>
                    <li>A directory of files that were extracted from an exported .zip file</li>
                    <li>An individual *.stan file</li>
                    <li>An individual data.json file</li>
                </ul>
            </div>
            <div style={{color: 'red'}}>
                {errorText}
            </div>
            <div>
                <UploadFilesArea
                    height={300}
                    onUpload={handleFilesUploaded}
                />
            </div>
        </div>
    )
}

const loadFromFiles = async (localDataModel: any, files: {
    name: string,
    content: ArrayBuffer
}[]) => {
    const stanFileContent = files.find(file => file.name === 'main.stan')?.content
    const dataFileContent = files.find(file => file.name === 'data.json')?.content
    const samplingOptsContent = files.find(file => file.name === 'sampling_opts.json')?.content
    const metaContent = files.find(file => file.name === 'meta.json')?.content

    localDataModel.setStanFileContent(stanFileContent ? new TextDecoder().decode(stanFileContent) : '')
    localDataModel.setDataFileContent(dataFileContent ? new TextDecoder().decode(dataFileContent) : '')
    localDataModel.setSamplingOptsContent(samplingOptsContent ? new TextDecoder().decode(samplingOptsContent) : '')
    const meta = metaContent ? JSON.parse(new TextDecoder().decode(metaContent)) : {}
    localDataModel.setTitle(meta.title || 'Untitled')
}

const loadFromStanFile = async (localDataModel: any, name: string, content: ArrayBuffer) => {
    localDataModel.setStanFileContent(new TextDecoder().decode(content))
    localDataModel.setDataFileContent('')
    localDataModel.setSamplingOptsContent('')
    localDataModel.setTitle(name)
}

const loadFromZip = async (localDataModel: any, name: string, content: ArrayBuffer) => {
    const zip = await JSZip.loadAsync(content)

    // check for a single folder
    let folderName: string | undefined = undefined
    for (const name in zip.files) {
        if (zip.files[name].dir) {
            if (folderName) {
                throw new Error('Multiple folders in zip file')
            }
            else {
                folderName = name
            }
        }
    }
    if (folderName) {
        // check that all the files are in single folder
        for (const name in zip.files) {
            if (!name.startsWith(folderName)) {
                throw new Error('Files are not all in a single folder')
            }
        }
    }
    localDataModel.setTitle(folderName || 'Untitled') // use this if there is no meta.json
    for (const name in zip.files) {
        const f = zip.files[name]
        if (!f.dir) {
            if (f.name === `${(folderName || '')}main.stan`) {
                localDataModel.setStanFileContent(await f.async('text'))
            }
            else if (f.name === `${(folderName || '')}data.json`) {
                localDataModel.setDataFileContent(await f.async('text'))
            }
            else if (f.name === `${(folderName || '')}sampling_opts.json`) {
                localDataModel.setSamplingOptsContent(await f.async('text'))
            }
            else if (f.name === `${(folderName || '')}meta.json`) {
                const meta = JSON.parse(await f.async('text'))
                localDataModel.setTitle(meta.title || 'Untitled')
            }
            else {
                throw new Error(`Unrecognized file in zip: ${f.name}`)
            }
        }
    }
}

export default ImportWindow