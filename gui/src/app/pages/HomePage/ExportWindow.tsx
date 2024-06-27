import { FunctionComponent, useCallback, useContext, useState } from "react"

import { FileRegistry, mapModelToFileManifest } from "../../SPAnalysis/FileMapping"
import { SPAnalysisContext } from "../../SPAnalysis/SPAnalysisContextProvider"
import { serializeAsZip } from "../../SPAnalysis/SPAnalysisSerialization"
import { triggerDownload } from "../../util/triggerDownload"
import saveAsGitHubGist from "./saveAsGitHubGist"

type ExportWindowProps = {
    onClose: () => void
}

const ExportWindow: FunctionComponent<ExportWindowProps> = ({ onClose }) => {
    const { data, update } = useContext(SPAnalysisContext)
    const fileManifest = mapModelToFileManifest(data)

    const [exportingToGist, setExportingToGist] = useState(false)

    return (
        <div>
            <h3>Export this analysis</h3>
            <table className="table1" style={{maxWidth: 500}}>
                <tbody>
                    <tr>
                        <td>Title</td>
                        <td>
                            <EditTitleComponent
                                value={data.meta.title}
                                onChange={(newTitle: string) => update({ type: 'retitle', title: newTitle })}
                            />
                        </td>
                    </tr>
                    {
                        Object.entries(fileManifest).map(([name, content], i) => (
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
            <div>&nbsp;</div>
            {!exportingToGist && (
                <div>
                    <button onClick={async () => {
                        serializeAsZip(data).then(([zipBlob, name]) => triggerDownload(zipBlob, `SP-${name}.zip`, onClose))
                    }}>
                        Export to .zip file
                    </button>
                    &nbsp;
                    <button onClick={() => {setExportingToGist(true)}}>
                        Export to GitHub Gist
                    </button>
                </div>
            )}
            {exportingToGist && (
                <GistExportView
                    fileManifest={fileManifest}
                    title={data.meta.title}
                    onClose={onClose}
                />
            )}
        </div>
    )
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

type GistExportViewProps = {
    fileManifest: Partial<FileRegistry>
    title: string
    onClose: () => void
}

const GistExportView: FunctionComponent<GistExportViewProps> = ({ fileManifest, title, onClose }) => {
    const [gitHubPersonalAccessToken, setGitHubPersonalAccessToken] = useState('')
    const [gistUrl, setGistUrl] = useState<string | null>(null)

    const handleExport = useCallback(async () => {
        try {
            const gistUrl = await saveAsGitHubGist(fileManifest, {defaultDescription: title, personalAccessToken: gitHubPersonalAccessToken})
            setGistUrl(gistUrl)
        }
        catch (err: any) {
            alert(`Error exporting to GitHub Gist: ${err.message}`)
        }
    }, [gitHubPersonalAccessToken, fileManifest, title])

    return (
        <div style={{maxWidth: 800}}>
            <h3>Export to GitHub Gist</h3>
            <p>
                In order to save this project as a GitHub Gist, you will need to provide a GitHub Personal Access Token.&nbsp;
                This token will be used to authenticate with GitHub and create a new Gist with the files in this project.&nbsp;
                You can create a new Personal Access Token by visiting your <a href="https://github.com/settings" target="_blank" rel="noreferrer">GitHub settings</a>.&nbsp;
                Go to <i>Developer settings</i> and <i>Tokens (classic)</i>.&nbsp;
                Generate a new classic token and be sure to only grant gist scope with an expiration date.&nbsp;
                Copy the token and paste it into the field below.
            </p>
            <p>
                For security reasons, your token will not be saved in this application,&nbsp;
                so you may want to store it securely in a text file for future use.
            </p>
            <table className="table1" style={{maxWidth: 500}}>
                <tbody>
                    <tr>
                        <td>GitHub Personal Access Token</td>
                        <td>
                            <input
                                type="password"
                                value={gitHubPersonalAccessToken}
                                onChange={e => setGitHubPersonalAccessToken(e.target.value)}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div>&nbsp;</div>
            {!gistUrl && (
                <div>
                    <button onClick={handleExport} disabled={!gitHubPersonalAccessToken}>
                        Export to GitHub Gist
                    </button>
                    &nbsp;
                    <button onClick={onClose}>
                        Cancel
                    </button>
                </div>
            )}
            {gistUrl && (
                <div>
                    <p>
                        Successfully exported to GitHub Gist:&nbsp;
                        <a href={gistUrl} target="_blank" rel="noreferrer">{gistUrl}</a>
                    </p>
                    <p>
                        You can now share the following link to this Stan Playground project:&nbsp;<br /><br />
                        <a href={makeSPShareableLinkFromGistUrl(gistUrl)} target="_blank" rel="noreferrer">{makeSPShareableLinkFromGistUrl(gistUrl)}</a>
                        <br />
                    </p>
                    <button onClick={onClose}>
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}

const makeSPShareableLinkFromGistUrl = (gistUrl: string) => {
    const protocol = window.location.protocol
    const host = window.location.host
    const url = `${protocol}//${host}?project=${gistUrl}`
    return url
}

export default ExportWindow
