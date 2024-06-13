import { FunctionComponent, useMemo } from "react"
import { useSPAnalysis } from "../../SPAnalysis/SPAnalysisContext"
import JSZip from 'jszip'

type ExportWindowProps = {
    onClose: () => void
}

const ExportWindow: FunctionComponent<ExportWindowProps> = ({ onClose }) => {
    const { localDataModel } = useSPAnalysis()

    const files = useMemo(() => {
        return {
            'main.stan': localDataModel.stanFileContent,
            'data.json': localDataModel.dataFileContent,
            'sampling_opts.json': localDataModel.samplingOptsContent,
            'meta.json': JSON.stringify({
                // Even though the folder name is derived from the
                // title, we still include it in a meta file because
                // we want to preserve the spaces in the title. When
                // loading, if the meta.json is not present, we will
                // use the folder name to derive the title.
                title: localDataModel.title
            })
        }
    }, [localDataModel])

    return (
        <div>
            <h3>Export this analysis</h3>
            <table className="table1">
                <tbody>
                    <tr>
                        <td>Title</td>
                        <td>
                            <EditTitleComponent
                                value={localDataModel.title}
                                onChange={localDataModel.setTitle}
                            />
                        </td>
                    </tr>
                    {
                        Object.entries(files).map(([name, content], i) => (
                            <tr key={i}>
                                <td>{name}</td>
                                <td>
                                    {content.length} bytes
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <div>
                <button onClick={async () => {
                    const title = localDataModel.title
                    const folderName = replaceSpaces(title)
                    const zip = new JSZip()
                    const folder = zip.folder(folderName)
                    if (!folder) {
                        throw new Error('Could not create folder in zip file')
                    }
                    Object.entries(files).forEach(([name, content]) => {
                        folder.file(name, content)
                    })
                    const zipBlob = await zip.generateAsync({type: 'blob'})
                    const zipBlobUrl = URL.createObjectURL(zipBlob)
                    const a = document.createElement('a')
                    a.href = zipBlobUrl
                    a.download = `SP-${folderName}.zip`
                    a.click()
                    URL.revokeObjectURL(zipBlobUrl)
                    onClose()
                }}>
                    Export to .zip file
                </button>
            </div>
        </div>
    )
}

const replaceSpaces = (str: string) => {
    return str.replace(/ /g, '_')
}

type EditTitleComponentProps = {
    value: string
    onChange: (value: string) => void
}

const EditTitleComponent: FunctionComponent<EditTitleComponentProps> = ({ value, onChange }) => {
    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    )
}

export default ExportWindow