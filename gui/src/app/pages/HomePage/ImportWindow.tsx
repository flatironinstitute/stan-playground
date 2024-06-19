import { FunctionComponent, useCallback, useEffect, useState } from "react"
import { useSPAnalysis } from "../../SPAnalysis/SPAnalysisContext"
import JSZip from 'jszip'
import UploadFilesArea from "./UploadFilesArea"

type ImportWindowProps = {
    onClose: () => void
}

const ImportWindow: FunctionComponent<ImportWindowProps> = ({ onClose }) => {
    const { localDataModel } = useSPAnalysis()
    const [errorText, setErrorText] = useState<string | null>(null)
    const [filesUploaded, setFilesUploaded] = useState<{name: string, content: ArrayBuffer}[] | null>(null)
    const [showReplaceProjectOptions, setShowReplaceProjectOptions] = useState<boolean>(false)

    const importUploadedFiles = useCallback(async (o: {replaceProject: boolean}) => {
        const {replaceProject} = o
        if (!filesUploaded) return
        try {
            if ((filesUploaded.length === 1) && (filesUploaded[0].name.endsWith('.zip'))) {
                // a single .zip file
                await loadFromZip(localDataModel, filesUploaded[0].name, filesUploaded[0].content, {replaceProject})
            }
            else if ((filesUploaded.length === 1) && (filesUploaded[0].name.endsWith('.stan'))) {
                // a single .stan file
                await loadFromStanFile(localDataModel, filesUploaded[0].name, filesUploaded[0].content, {replaceProject})
            }
            else if ((filesUploaded.length === 1) && (filesUploaded[0].name === 'data.json')) {
                // a single data.json file
                await loadFromFiles(localDataModel, filesUploaded, {replaceProject})
            }
            else {
                for (const file of filesUploaded) {
                    if (!['main.stan', 'data.json', 'sampling_opts.json', 'meta.json'].includes(file.name)) {
                        throw Error('Unrecognized file: ' + file.name)
                    }
                }
                await loadFromFiles(localDataModel, filesUploaded, {replaceProject})
            }
            onClose()
        }
        catch (e: any) {
            setErrorText(e.message)
        }
    }, [filesUploaded, localDataModel, onClose])

    useEffect(() => {
        if (!filesUploaded) return
        if ((filesUploaded.length === 1) && (!filesUploaded[0].name.endsWith('.zip'))) {
            // The user has uploaded a single file and it is not a zip file. In
            // this case we want to give the user the option whether or not to
            // replace the current project.
            setShowReplaceProjectOptions(true)
        }
        else {
            // Otherwise, we just go ahead and import the files, replacing the
            // entire project
            importUploadedFiles({replaceProject: true})
        }
    }, [filesUploaded, importUploadedFiles])

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
            {!filesUploaded ? (
                <div>
                    <UploadFilesArea
                        height={300}
                        onUpload={setFilesUploaded}
                    />
                </div>
            ) : (
                <div>
                    {filesUploaded.map(file => (
                        <div key={file.name}>
                            {file.name}
                        </div>
                    ))}
                </div>
            )}
            {
                showReplaceProjectOptions && (
                    <div>
                        <button onClick={() => importUploadedFiles({replaceProject: true})}>Import into a NEW project</button>
                        &nbsp;
                        <button onClick={() => importUploadedFiles({replaceProject: false})}>Import into EXISTING project</button>
                    </div>
                )
            }
        </div>
    )
}

const loadFromFiles = async (localDataModel: any, files: {
    name: string,
    content: ArrayBuffer
}[], o: {replaceProject: boolean}) => {
    const stanFileContent = files.find(file => file.name === 'main.stan')?.content
    const dataFileContent = files.find(file => file.name === 'data.json')?.content
    const samplingOptsContent = files.find(file => file.name === 'sampling_opts.json')?.content
    const metaContent = files.find(file => file.name === 'meta.json')?.content

    if (stanFileContent || o.replaceProject) {
        localDataModel.setStanFileContent(stanFileContent ? new TextDecoder().decode(stanFileContent) : '')
    }
    if (dataFileContent || o.replaceProject) {
        localDataModel.setDataFileContent(dataFileContent ? new TextDecoder().decode(dataFileContent) : '')
    }
    if (samplingOptsContent || o.replaceProject) {
        localDataModel.setSamplingOptsContent(samplingOptsContent ? new TextDecoder().decode(samplingOptsContent) : '')
    }
    if (metaContent || o.replaceProject) {
        const meta = metaContent ? JSON.parse(new TextDecoder().decode(metaContent)) : {}
        localDataModel.setTitle(meta.title || 'Untitled')
    }
}

const loadFromStanFile = async (localDataModel: any, name: string, content: ArrayBuffer, o: {replaceProject: boolean}) => {
    await loadFromFiles(localDataModel, [
        {name: 'main.stan', content},
    ], {replaceProject: o.replaceProject})
    if (o.replaceProject) {
        localDataModel.setTitle(name)
    }
}

const loadFromZip = async (localDataModel: any, _name: string, content: ArrayBuffer, o: {replaceProject: boolean}) => {
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
    const files: {name: string, content: ArrayBuffer}[] = []
    for (const name in zip.files) {
        const f = zip.files[name]
        if (!f.dir) {
            if (f.name === `${(folderName || '')}main.stan`) {
                files.push({name: 'main.stan', content: await f.async('arraybuffer')})
            }
            else if (f.name === `${(folderName || '')}data.json`) {
                files.push({name: 'data.json', content: await f.async('arraybuffer')})
            }
            else if (f.name === `${(folderName || '')}sampling_opts.json`) {
                files.push({name: 'sampling_opts.json', content: await f.async('arraybuffer')})
            }
            else if (f.name === `${(folderName || '')}meta.json`) {
                files.push({name: 'meta.json', content: await f.async('arraybuffer')})
            }
            else {
                throw new Error(`Unrecognized file in zip: ${f.name}`)
            }
        }
    }
    await loadFromFiles(localDataModel, files, {replaceProject: o.replaceProject})
}

export default ImportWindow