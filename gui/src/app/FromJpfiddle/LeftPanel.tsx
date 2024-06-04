/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hyperlink } from "@fi-sci/misc";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { Fiddle } from "./JpfiddleContext/JpfiddleContext";
import JupyterlabSelector, { jupyterSelectorInstructionsUrl } from "./JupyterlabSelector";
import useRoute from "../useRoute";

type LeftPanelProps = {
    width: number
    height: number
    fiddleUri: string
    fiddleId: string
    cloudFiddle: Fiddle | undefined
    cloudFiles?: {[key: string]: string}
    localEditedFiles?: {[key: string]: string}
    onSaveChangesToCloud: () => void
    onSaveAsGist: () => void
    onUpdateGist: () => void
    saveAsGistMessage?: string
    onResetToCloudVersion: () => void
    loadFilesStatus: 'loading' | 'loaded' | 'error'
    alternateFiddleWord?: string
    jupyterSelectionType?: string
    showNotesAboutJpfiddle?: boolean
    showJupyterSelector?: boolean
    examples?: {title: string, uri: string}[]
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({ width, height, fiddleUri, fiddleId, cloudFiddle, cloudFiles, localEditedFiles, onSaveChangesToCloud, onSaveAsGist, onUpdateGist, saveAsGistMessage, onResetToCloudVersion, loadFilesStatus, alternateFiddleWord, jupyterSelectionType, showNotesAboutJpfiddle, showJupyterSelector, examples }) => {
    const {route, setRoute} = useRoute()
    const addedFilePaths: string[] = useMemo(() => {
        if (!localEditedFiles) return []
        if (!cloudFiddle) return []
        const added: string[] = []
        for (const pp in localEditedFiles) {
            if (!(pp in cloudFiddle.refs)) {
                added.push(pp)
            }
        }
        return added
    }, [localEditedFiles, cloudFiddle])

    const removedFilePaths: string[] = useMemo(() => {
        if (!cloudFiddle) return []
        if (!localEditedFiles) return []
        const removed: string[] = []
        for (const pp in cloudFiddle.refs) {
            if (!(pp in localEditedFiles)) {
                removed.push(pp)
            }
        }
        return removed
    }, [localEditedFiles, cloudFiddle])

    const modifiedFilePaths: string[] = useMemo(() => {
        if (!cloudFiddle) return []
        if (!localEditedFiles) return []
        if (!cloudFiles) return []

        const modified: string[] = []
        for (const pp in localEditedFiles) {
            if (cloudFiddle.refs[pp]) {
                if (cloudFiles[pp] !== localEditedFiles[pp]) {
                    modified.push(pp)
                }
            }
        }
        return modified
    }, [localEditedFiles, cloudFiles, cloudFiddle])

    const hasChanges = useMemo(() => {
        return addedFilePaths.length > 0 || removedFilePaths.length > 0 || modifiedFilePaths.length > 0
    }, [addedFilePaths, removedFilePaths, modifiedFilePaths])

    let loadingStatusSection: any | undefined = undefined
    if ((fiddleUri && (!cloudFiddle)) || (loadFilesStatus !== 'loaded')) {
        loadingStatusSection = (
            <div>
                {fiddleUri && (!cloudFiddle) ? (
                    <div>
                        Loading {fiddleUri}
                    </div>
                ) : <div>Loaded</div>}
                {loadFilesStatus === 'loading' && (
                    <div>
                        Loading files...
                    </div>
                )}
            </div>
        )
    }
    const localChangesSection = (
        <div>
            {hasChanges && (
                <div>
                    <h3>Local changes</h3>
                    <ul>
                        {
                            addedFilePaths.map((path, ii) => (
                                <li key={ii}>
                                    {path} - added
                                </li>
                            ))
                        }
                        {
                            removedFilePaths.map((path, ii) => (
                                <li key={ii}>
                                    {path} - removed
                                </li>
                            ))
                        }
                        {
                            modifiedFilePaths.map((path, ii) => (
                                <li key={ii}>
                                    {path} - modified
                                </li>
                            ))
                        }
                    </ul>
                </div>
            )}
            {(hasChanges || !fiddleUri.startsWith('https://tempory.net')) && (
                <div>
                    <Hyperlink onClick={onSaveChangesToCloud}>
                        Save to cloud
                    </Hyperlink>
                </div>
            )}
            {hasChanges && (
                <div>
                    <Hyperlink onClick={onResetToCloudVersion}>
                        Reset to cloud version
                    </Hyperlink>
                </div>
            )}
        </div>
    )

    const jupyterlabSelectorSection = showJupyterSelector && (
        <JupyterlabSelector />
    )

    const metaSection = (
        <div style={{ position: 'relative', left: 2, width: width - 22 }}>
            {capitalize(alternateFiddleWord) || 'Fiddle'}: {cloudFiddle?.jpfiddle.title || ''} ({fiddleId})
            <br />
            Owner: {cloudFiddle?.jpfiddle.userName || ''}
        </div>
    )

    const temporyWarningSection = (
        fiddleUri.startsWith('https://tempory.net') && (
            <div style={{ color: '#a31' }}>
                Warning: Files stored on tempory.net are temporary and subject to deletion.
            </div>
        )
    )

    const { recentFiddles, addRecentFiddle } = useRecentFiddles()
    const cloudFiddleTitle = useMemo(() => cloudFiddle?.jpfiddle.title, [cloudFiddle])
    useEffect(() => {
        if ((fiddleUri) && (cloudFiddleTitle)) {
            addRecentFiddle(cloudFiddleTitle, fiddleUri)
        }
    }, [fiddleUri, cloudFiddleTitle, addRecentFiddle])
    const recentFiddlesSection = (
        <div style={{ position: 'relative', height: 150, overflowY: 'auto'}}>
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>Recent</span>
            {
                recentFiddles.filter(rf => rf.url !== fiddleUri).map((rf, ii) => (
                    <div key={ii}>
                        <Hyperlink onClick={() => {
                            window.location.href = `/?f=${rf.url}`
                        }}>
                            {rf.title}
                        </Hyperlink>
                    </div>
                ))
            }
        </div>
    )

    const previousVersionSection = (
        cloudFiddle?.jpfiddle.previousFiddleUri && (
            <div>
                <Hyperlink onClick={() => {
                    window.location.href = `/?f=${cloudFiddle.jpfiddle.previousFiddleUri}`
                }}>
                    Previous version of this {alternateFiddleWord || 'fiddle'}
                </Hyperlink>
            </div>
        )
    )

    const notesSection = (
        <div>
            {jupyterSelectionType === 'jupyterlite' && (
                <div>
                    <p>
                        You are using <b>JupyterLite</b> which is a lightweight version of JupyterLab
                        that runs entirely in the browser. For now we have <b>disabled the Pyodide kernel</b> for
                        this mode since we are encountering some problems. But you can still browse
                        and edit the notebooks and other files. If you would like to execute the cells,
                        then you should use the &quote;Local JupyterLab&quote; option.
                        &nbsp;<a href={jupyterSelectorInstructionsUrl} target="_blank" rel="noreferrer">
                            Read more
                        </a>.
                        {/* If we reenable the Pyodide kernel, then uncomment the following:
                        It is not as featureful as JupyterLab
                        and can be slow, but it is convenient for browsing a fiddle without
                        needing to host a Jupyter server. If you plan to do more than just
                        browsing, you should consider using the "Local JupyterLab" option.
                        &nbsp;<a href={jupyterSelectorInstructionsUrl} target="_blank" rel="noreferrer">
                            Read more
                        </a>. */}
                    </p>
                </div>
            )}
            {jupyterSelectionType === 'local' && (
                <div>
                    <p>
                        You are using a <b>local JupyterLab</b>. This is a full-featured version of JupyterLab
                        that runs on your local machine. Draft fiddles are saved on your local machine.
                        &nbsp;<a href={jupyterSelectorInstructionsUrl} target="_blank" rel="noreferrer">
                            Read more
                        </a>.
                    </p>
                </div>
            )}
            {showNotesAboutJpfiddle && (
                <>
                <div>
                    <p>
                        Only text files are saved in the fiddle (e.g., files with extension .ipynb, .py, .md, .txt, etc.).
                    </p>
                </div>
                <div>
                    <a href="https://github.com/magland/jpfiddle" target="_blank" rel="noreferrer">
                        Read more about jpfiddle
                    </a>
                </div>
                </>
            )}
        </div>
    )

    const advancedSection = (
        <div>
            <details open>
                <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                    GitHub
                </summary>
                {localEditedFiles && <div>
                    <Hyperlink
                        onClick={onSaveAsGist}>
                        {fiddleUri.startsWith('https://gist.github.com') ? 'Save as new GitHub Gist' : 'Save as Gist'}
                    </Hyperlink>
                </div>}
                {localEditedFiles && fiddleUri.startsWith('https://gist.github.com') && (
                    <div>
                        <Hyperlink
                            onClick={onUpdateGist}
                        >
                            Update Gist
                        </Hyperlink>
                    </div>
                )}
                {
                    saveAsGistMessage && (
                        <div>
                            {saveAsGistMessage}
                        </div>
                    )
                }
            </details>
        </div>
    )

    const examplesSection = (examples || []).length > 0 && (
        <div>
            <details open>
                <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                    Examples
                </summary>
                {
                    examples?.map((ex, ii) => (
                        <div key={ii}>
                            <Hyperlink onClick={() => {
                                setRoute({
                                    ...route,
                                    page: 'home',
                                    fiddleUri: ex.uri,
                                    title: ex.title
                                })
                            }}>
                                {ex.title}
                            </Hyperlink>
                        </div>
                    ))
                }
            </details>
        </div>
    )


    {/* <div>
        <h3>Log in using GitHub in order to use jpfiddle</h3>
        <LoginButton />
      </div> */}

    return (
        <div style={{ position: 'absolute', left: 8, width: width - 16, height, overflowY: 'auto' }}>
            {loadingStatusSection}
            {<hr />}

            {metaSection}
            {metaSection && <hr />}

            {localChangesSection}
            {localChangesSection && <hr />}

            {jupyterlabSelectorSection}
            {jupyterlabSelectorSection && <hr />}

            {recentFiddlesSection}
            {recentFiddlesSection && <hr />}

            {previousVersionSection}
            {previousVersionSection && <hr />}

            {notesSection}
            {notesSection && <hr />}

            {temporyWarningSection}
            {temporyWarningSection && <hr />}

            {advancedSection}
            {advancedSection && <hr />}

            {examplesSection}
            {examplesSection && <hr />}

        </div>
    )
}

const getInitialRecentFiddlesFromLocalStorage = (): {title: string, url: string}[] => {
    const recentFiddles = localStorage.getItem('recentFiddles')
    if (!recentFiddles) return []
    try {
        return JSON.parse(recentFiddles)
    } catch (e) {
        return []
    }
}

const useRecentFiddles = () => {
    const [recentFiddles, setRecentFiddles] = useState<{title: string, url: string}[]>(getInitialRecentFiddlesFromLocalStorage())
    const addRecentFiddle = useCallback((title: string, url: string) => {
        if (recentFiddles.length > 0 && recentFiddles[0].url === url) return // important so we don't change the object
        let newRecentFiddles = [{title, url}, ...recentFiddles.filter(rf => rf.url !== url)]
        if (newRecentFiddles.length > 50) {
            newRecentFiddles = newRecentFiddles.slice(0, 50)
        }
        setRecentFiddles(newRecentFiddles)
        localStorage.setItem('recentFiddles', JSON.stringify(newRecentFiddles))
    }, [recentFiddles])
    return { recentFiddles, addRecentFiddle }
}

const refsAreEqual = (a: any, b: any) => {
    if (!a) return a === b
    if (typeof a === 'string') {
        return a === b
    }
    if (typeof a === 'number') {
        return a === b
    }
    if (Array.isArray(a)) {
        if (!Array.isArray(b)) return false
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) {
            if (!refsAreEqual(a[i], b[i])) return false
        }
        return true
    }
    if (typeof a === 'object') {
        if (typeof b !== 'object') return false
        const keys = Object.keys(a)
        if (keys.length !== Object.keys(b).length) return false
        for (const key of keys) {
            if (!refsAreEqual(a[key], b[key])) return false
        }
        return true
    }
    throw Error('Unexpected')
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Thanks: https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export const JSONStringifyDeterministic = (obj: any, space: string | number | undefined = undefined) => {
    const allKeys: string[] = [];
    JSON.stringify(obj, function (key, value) {
        allKeys.push(key);
        return value;
    });
    allKeys.sort();
    return JSON.stringify(obj, allKeys, space);
};

const capitalize = (s: string | undefined) => {
    if (!s) return s
    return s.charAt(0).toUpperCase() + s.slice(1)
}

export default LeftPanel
