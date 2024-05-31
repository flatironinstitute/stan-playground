/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNumber, isString, optional, validateObject } from "@fi-sci/misc"
import { createContext, useContext, useMemo } from "react"

export type Fiddle = {
    jpfiddle: {
        title: string
        userId?: string
        userName?: string
        previousFiddleUri?: string
        timestamp?: number
    }
    refs: {
        [key: string]: string | [string, number, number]
    }
}

export const isFiddle = (x: any): x is Fiddle => {
    return validateObject(x, {
        jpfiddle: {
            title: isString,
            userId: optional(isString),
            userName: optional(isString),
            previousFiddleUri: optional(isString),
            timestamp: optional(isNumber)
        },
        refs: (x: any) => {
            if (typeof x !== "object") return false;
            for (const key in x) {
                const value = x[key];
                if (typeof value === "string") continue;
                if (Array.isArray(value) && value.length === 3 && typeof value[0] === "string" && typeof value[1] === "number" && typeof value[2] === "number") continue;
                return false;
            }
            return true;
        }
    })
}

export type LocalFiles = { [key: string]: string } | undefined | null

export type LocalFilesAction = {
    type: 'set-files'
    files: { path: string, content: string }[] | null | undefined
} | {
    type: 'file-changed'
    path: string
    content: string
} | {
    type: 'file-deleted'
    path: string
} | {
    type: 'file-renamed'
    oldPath: string
    newPath: string
}

export const localFilesReducer = (state: LocalFiles, action: LocalFilesAction) => {
    if (action.type === 'set-files') {
        if (action.files === null) return null
        if (action.files === undefined) return undefined
        const r: { [key: string]: string } = {}
        for (const f of action.files) {
            r[f.path] = f.content
        }
        return r
    }
    else if (action.type === 'file-changed') {
        return {
            ...state,
            [action.path]: action.content
        }
    }
    else if (action.type === 'file-deleted') {
        const newState = { ...state }
        delete newState[action.path]
        return newState
    }
    else if (action.type === 'file-renamed') {
        const newState = { ...state }
        newState[action.newPath] = (state || {})[action.oldPath]
        delete newState[action.oldPath]
        return newState
    }
    return state
}

export type JpfiddleContextType = {
    fiddleUri: string
    cloudFiddle?: Fiddle
    localFiles: LocalFiles
    initialLocalFiles?: { path: string, content: string }[]
    setLocalFiles: (files: LocalFiles) => void
    changeLocalFile: (path: string, content: string) => void
    deleteLocalFile: (path: string) => void
    renameLocalFile: (oldPath: string, newPath: string) => void
    saveToCloud: () => void
    saveAsGist: () => void
    updateGist: () => void
    resetFromCloud: () => Promise<{path: string, content: string | null}[]>
    saveAsGistMessage?: string
}

const defaultJpfiddleContext: JpfiddleContextType = {
    fiddleUri: "",
    cloudFiddle: undefined,
    localFiles: undefined,
    initialLocalFiles: undefined,
    setLocalFiles: () => { },
    changeLocalFile: () => { },
    deleteLocalFile: () => { },
    renameLocalFile: () => { },
    saveToCloud: () => { },
    saveAsGist: () => { },
    updateGist: () => { },
    resetFromCloud: async () => { return [] },
    saveAsGistMessage: undefined
}

export const JpfiddleContext = createContext<JpfiddleContextType>(defaultJpfiddleContext)

export const useJpfiddle = () => {
    const { cloudFiddle, localFiles, initialLocalFiles, fiddleUri, setLocalFiles, changeLocalFile, deleteLocalFile, renameLocalFile, saveToCloud, saveAsGist, updateGist, resetFromCloud, saveAsGistMessage } = useContext(JpfiddleContext)
    const fiddleId = useMemo(() => {
        if (!fiddleUri) return 'unsaved'
        return (fiddleUri.split('/').slice(-1)[0] || '').split('.')[0] || 'unknown'
    }, [fiddleUri])
    return { cloudFiddle, localFiles, initialLocalFiles, fiddleUri, fiddleId, setLocalFiles, changeLocalFile, deleteLocalFile, renameLocalFile, saveToCloud, saveAsGist, updateGist, resetFromCloud, saveAsGistMessage }
}