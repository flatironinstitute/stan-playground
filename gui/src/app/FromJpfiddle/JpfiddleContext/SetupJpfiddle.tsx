/* eslint-disable @typescript-eslint/no-explicit-any */
import { FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from "react"
import ReferenceFileSystemClient from "../ReferenceFileSystemClient"
import loadFiddleFromGitHubGist from "../loadFiddleFromGitHubGist"
import saveAsGitHubGist, { updateGitHubGist } from "../saveAsGitHubGist"
import { Fiddle, JpfiddleContext, LocalFiles, isFiddle, localFilesReducer } from "./JpfiddleContext"

type SetupJpfiddleProps = {
    fiddleUri: string
    apiBaseUrl: string
    useLocalStorageForLocalFiles: boolean
}

const SetupJpfiddle: FunctionComponent<PropsWithChildren<SetupJpfiddleProps>> = ({ fiddleUri, apiBaseUrl, useLocalStorageForLocalFiles, children }) => {
    const [cloudFiddle, setCloudFiddle] = useState<Fiddle | undefined>(undefined)
    useEffect(() => {
        let canceled = false
            ; (async () => {
                const f = await loadCloudFiddle(fiddleUri)
                if (canceled) return
                setCloudFiddle(f)
            })()
        return () => { canceled = true }
    }, [fiddleUri])
    const [localFiles, localFilesDispatch] = useReducer(localFilesReducer, undefined)

    const setLocalFiles = useCallback((files: LocalFiles) => {
        if (files === null) {
            // this is the signal that we need to use the cloud fiddle to set the files
            localFilesDispatch({ type: 'set-files', files: null })
            return
        }
        const files2: { path: string, content: string }[] = []
        if (files) {
            for (const path in files) {
                files2.push({ path, content: files[path] })
            }
        }
        localFilesDispatch({ type: 'set-files', files: files2 })
    }, [])
    const changeLocalFile = useCallback((path: string, content: string) => {
        localFilesDispatch({ type: 'file-changed', path, content })
    }, [])
    const deleteLocalFile = useCallback((path: string) => {
        localFilesDispatch({ type: 'file-deleted', path })
    }, [])
    const renameLocalFile = useCallback((oldPath: string, newPath: string) => {
        localFilesDispatch({ type: 'file-renamed', oldPath, newPath })
    }, [])

    useEffect(() => {
        // prior to leaving page
        if (!useLocalStorageForLocalFiles) return
        if (!localFiles) return
        const onUnload = () => {
            if (!localFiles) return
            setLocalEditedFilesInBrowserStorage(fiddleUri, localFiles)
        }
        window.addEventListener('beforeunload', onUnload)
        return () => {
            window.removeEventListener('beforeunload', onUnload)
        }
    }, [fiddleUri, localFiles, useLocalStorageForLocalFiles])

    const [initialLocalFiles, setInitialLocalFiles] = useState<{ path: string, content: string }[] | undefined>(undefined)
    useEffect(() => {
        let canceled = false
            ; (async () => {
                if (!cloudFiddle) return
                if (useLocalStorageForLocalFiles) {
                    const files = getLocalEditedFilesFromBrowserStorage(fiddleUri)
                    if (files) {
                        setLocalFiles(files)
                        setInitialLocalFiles(Object.keys(files).map(path => ({ path, content: files[path] })))
                        return
                    }
                    else {
                        const ff: { path: string, content: string }[] = []
                        const cloudFiddleClient = new ReferenceFileSystemClient({
                            version: 0,
                            refs: cloudFiddle.refs
                        })
                        for (const path in cloudFiddle.refs) {
                            const buf = await cloudFiddleClient.readBinary(path, {})
                            if (canceled) return
                            if (!buf) {
                                console.error(`Failed to read file from cloud fiddle: ${path}`)
                                continue
                            }
                            const content = new TextDecoder().decode(buf)
                            ff.push({ path, content })
                        }
                        setLocalFiles(Object.fromEntries(ff.map(f => [f.path, f.content])))
                        setInitialLocalFiles(ff)
                    }
                }
            })()
        return () => { canceled = true }
    }, [fiddleUri, setLocalFiles, useLocalStorageForLocalFiles, cloudFiddle])

    useEffect(() => {
        let canceled = false
            ; (async () => {
                if (!cloudFiddle) return
                if (!useLocalStorageForLocalFiles) {
                    if (localFiles === null) {
                        // this is the signal that there is nothing local so we are going to set
                        // the initial files to be the cloud files

                        // I realize this is duplicating the logic in the above useEffect
                        const ff: { path: string, content: string }[] = []
                        const cloudFiddleClient = new ReferenceFileSystemClient({
                            version: 0,
                            refs: cloudFiddle.refs
                        })
                        for (const path in cloudFiddle.refs) {
                            const buf = await cloudFiddleClient.readBinary(path, {})
                            if (canceled) return
                            if (!buf) {
                                console.error(`Failed to read file from cloud fiddle: ${path}`)
                                continue
                            }
                            const content = new TextDecoder().decode(buf)
                            ff.push({ path, content })
                        }
                        setLocalFiles(Object.fromEntries(ff.map(f => [f.path, f.content])))
                        setInitialLocalFiles(ff)
                    }
                }
            })()
        return () => { canceled = true }
    }, [cloudFiddle, localFiles, setLocalFiles, useLocalStorageForLocalFiles])

    const saveToCloud = useCallback(async () => {
        if (!localFiles) return
        if (!checkSizesOfFiles(localFiles)) return
        const existingTitle = cloudFiddle?.jpfiddle?.title
        const title = window.prompt('Enter a title for this fiddle', formSuggestedNewTitle(existingTitle || ''))
        if (!title) return
        const userName = getUserName()
        if (!userName) return
        const newFiddle: Fiddle = {
            jpfiddle: {
                ...cloudFiddle?.jpfiddle,
                title,
                userName,
                previousFiddleUri: fiddleUri,
                timestamp: Date.now() / 1000
            },
            refs: localFiles
        }
        const saveFiddlePasscode = getSaveFiddlePasscode()
        if (!saveFiddlePasscode) return
        const url = `${apiBaseUrl}/api/saveFiddle`
        const rr = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fiddle: newFiddle, saveFiddlePasscode })
        })
        if (!rr.ok) {
            alert(`Problem saving to cloud: ${await rr.text()}`)
            return
        }
        const resp = await rr.json()
        if (!resp.success) {
            alert(`Problem saving to cloud: ${resp.error}`)
            return
        }
        // localforage.removeItem(`local-fiddle|${fiddleUri}`)
        const newFiddleUri = resp.fiddleUri
        window.location.href = `/?f=${newFiddleUri}`
    }, [localFiles, cloudFiddle, fiddleUri, apiBaseUrl])

    const [saveAsGistMessage, setSaveAsGistMessage] = useState<string | undefined>(undefined)
    const saveAsGist = useCallback(async () => {
        if (!localFiles) return
        setSaveAsGistMessage('Saving to GitHub Gist...')
        let htmlUrl: string | undefined
        try {
            htmlUrl = await saveAsGitHubGist(localFiles, cloudFiddle?.jpfiddle.title || '')
            if (!htmlUrl) {
                setSaveAsGistMessage('Problem saving to GitHub Gist')
                return
            }
            alert(`Saved to GitHub Gist: ${htmlUrl}`)
            setSaveAsGistMessage('Saved to GitHub Gist')
        }
        catch (err: any) {
            console.error(err)
            setSaveAsGistMessage(`Problem saving to GitHub Gist: ${err.message}`)
            return
        }
        const newFiddleUri = htmlUrl
        window.location.href = `/?f=${newFiddleUri}`
    }, [localFiles, cloudFiddle])

    const updateGist = useCallback(async () => {
        if (!fiddleUri?.startsWith('https://gist.github.com/')) return
        if (!cloudFiddle) return
        if (!localFiles) return
        const cloudFiddleClient = new ReferenceFileSystemClient({
            version: 0,
            refs: cloudFiddle.refs
        })
        setSaveAsGistMessage('Updating Gist')
        const patch: { [key: string]: string | null } = {}
        for (const fname in localFiles || {}) {
            let cloudFileContent: string | null = null
            if (cloudFiddle.refs[fname]) {
                const buf = await cloudFiddleClient.readBinary(fname, {})
                cloudFileContent = new TextDecoder().decode(buf)
            }
            const localFileContent = localFiles[fname]
            if (cloudFileContent !== localFileContent) {
                patch[fname] = localFileContent
            }
        }
        for (const fname in cloudFiddle.refs) {
            if (localFiles[fname] === undefined) {
                patch[fname] = null
            }
        }
        const numChanges = Object.keys(patch).length
        if (numChanges === 0) {
            setSaveAsGistMessage('No changes to update')
            return
        }
        setSaveAsGistMessage(`Updating Gist with ${numChanges} changes`)
        try {
            await updateGitHubGist(fiddleUri, patch)
        }
        catch (err: any) {
            setSaveAsGistMessage(`Problem updating Gist: ${err.message}`)
            return
        }
        setSaveAsGistMessage(`Updated Gist with ${numChanges} changes`)
    }, [fiddleUri, cloudFiddle, localFiles])

    const resetFromCloud = useMemo(() => (async (): Promise<{path: string, content: string | null}[]> => {
        if (!cloudFiddle) return []
        const okay = window.confirm('Are you sure you want to discard local changes and reset to the cloud version?')
        if (!okay) return []
        const cloudFiddleClient = new ReferenceFileSystemClient({
            version: 0,
            refs: cloudFiddle.refs
        })
        const newFiles: {path: string, content: string | null}[] = []
        for (const fname in cloudFiddle.refs) {
            const buf = await cloudFiddleClient.readBinary(fname, {})
            const content = new TextDecoder().decode(buf)
            newFiles.push({ path: fname, content })
        }
        for (const fname in localFiles || {}) {
            if (!cloudFiddle.refs[fname]) {
                newFiles.push({ path: fname, content: null })
            }
        }
        if (useLocalStorageForLocalFiles) {
            clearLocalEditedFilesFromBrowserStorage(fiddleUri)
        }
        return newFiles
    }), [cloudFiddle, localFiles, useLocalStorageForLocalFiles, fiddleUri])

    const value = useMemo(() => {
        return {
            cloudFiddle,
            localFiles,
            initialLocalFiles,
            fiddleUri,
            setLocalFiles,
            changeLocalFile,
            deleteLocalFile,
            renameLocalFile,
            saveToCloud,
            saveAsGist,
            updateGist,
            resetFromCloud,
            saveAsGistMessage
        }
    }, [fiddleUri, cloudFiddle, localFiles, initialLocalFiles, setLocalFiles, changeLocalFile, deleteLocalFile, renameLocalFile, saveToCloud, saveAsGist, updateGist, resetFromCloud, saveAsGistMessage])

    return (
        <JpfiddleContext.Provider value={value}>
            {children}
        </JpfiddleContext.Provider>
    )
}

const loadCloudFiddle = async (fiddleUri: string): Promise<Fiddle> => {
    if (!fiddleUri) {
        return {
            jpfiddle: {
                title: 'Untitled'
            },
            refs: {}
        }
    }
    else if (fiddleUri.startsWith('https://gist.github.com/')) {
        const fiddle = await loadFiddleFromGitHubGist(fiddleUri)
        return fiddle
    }
    else if (fiddleUri.startsWith('https://') || fiddleUri.startsWith('http://')) {
        const response = await fetch(fiddleUri)
        if (!response.ok) throw Error(`Unable to load fiddle from cloud: ${fiddleUri}`)
        const fiddle = await response.json()
        if (!isFiddle(fiddle)) throw Error(`Invalid fiddle format for ${fiddleUri}`)
        return fiddle
    }
    else {
        throw Error(`Invalid fiddle uri: ${fiddleUri}`)
    }
}

const getLocalEditedFilesFromBrowserStorage = (fiddleUri: string | undefined): LocalFiles | undefined => {
    const x = localStorage.getItem(`local-edited-files|${fiddleUri || '_'}`)
    if (!x) return undefined
    try {
        return JSON.parse(x)
    }
    catch (err) {
        console.warn('Problem parsing local-edited-files from browser storage', err)
        return undefined
    }
}

const setLocalEditedFilesInBrowserStorage = (fiddleUri: string | undefined, files: LocalFiles) => {
    localStorage.setItem(`local-edited-files|${fiddleUri || '_'}`, JSON.stringify(files))
}

const clearLocalEditedFilesFromBrowserStorage = (fiddleUri: string | undefined) => {
    localStorage.removeItem(`local-edited-files|${fiddleUri || '_'}`)
}

const formSuggestedNewTitle = (existingTitle: string): string => {
    if (!existingTitle) return ''
    // if it's old-title, we want to make it old-title v2
    // if it's old-title v2, we want to make it old-title v3
    // etc
    if (existingTitle === 'Untitled') return existingTitle
    const match = existingTitle.match(/(.*) v(\d+)$/)
    if (!match) return `${existingTitle} v2`
    const base = match[1]
    const num = parseInt(match[2])
    return `${base} v${num + 1}`
}

const getUserName = (): string | null => {
    const userNameFromLocalStorage = localStorage.getItem('jpfiddle-user-name')
    const msg = 'Enter your full name. This is needed so we can delete large suspicious fiddles.'
    const name = window.prompt(msg, userNameFromLocalStorage || '')
    if (!name) return null
    localStorage.setItem('jpfiddle-user-name', name)
    return name
}

const getSaveFiddlePasscode = (): string | null => {
    const passcodeFromLocalStorage = localStorage.getItem('jpfiddle-save-fiddle-passcode')
    const msg = 'Enter the passcode for saving fiddles. You can obtain this from the jpfiddle administrator.'
    let defaultString = ''
    if (passcodeFromLocalStorage) {
        // replace with stars
        defaultString = passcodeFromLocalStorage.replace(/./g, '*')
    }
    let passcode = window.prompt(msg, defaultString)
    if (passcode === defaultString) {
        passcode = passcodeFromLocalStorage
    }
    if (!passcode) return null
    localStorage.setItem('jpfiddle-save-fiddle-passcode', passcode)
    return passcode
}

const checkSizesOfFiles = (files: LocalFiles): boolean => {
    let totalSize = 0
    for (const path in files) {
        const size0 = files[path].length
        if (size0 > 1000 * 1000) {
            alert(`File ${path} is too large (${size0} bytes). Maximum size is 1MB.`)
            return false
        }
        totalSize += size0
    }
    if (totalSize > 5 * 1000 * 1000) {
        alert(`Total size of files is too large (${totalSize} bytes). Maximum size is 5MB.`)
        return false
    }
    return true
}


export default SetupJpfiddle