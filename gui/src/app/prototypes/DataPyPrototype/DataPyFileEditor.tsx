import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { PlayArrow } from "@mui/icons-material";
import { PyodideInterface, loadPyodide } from "pyodide";
import TextEditor, { ToolbarItem } from "../../FileEditor/TextEditor";

type Props = {
    fileName: string
    fileContent: string
    onSaveContent: (text: string) => void
    editedFileContent: string
    setEditedFileContent: (text: string) => void
    readOnly: boolean
    setData?: (data: any) => void
    width: number
    height: number
}

let pyodide: PyodideInterface | null = null
const loadPyodideInstance = async () => {
    if (pyodide === null) {
        const p = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full",
            stdout: (x: string) => console.log(x),
            stderr: (x: string) => console.error(x)
        })
        pyodide = p
        await pyodide.loadPackage(['numpy', 'micropip'])
        const micropip = pyodide.pyimport('micropip')
        await micropip.install('stanio')
        return pyodide
    } else {
        return pyodide
    }
}

const DataPyFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, setData, readOnly, width, height}) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'completed' | 'failed'>('idle')
    const handleRun = useCallback(async () => {
        if (status === 'running') {
            return
        }
        if (editedFileContent !== fileContent) {
            throw new Error('Cannot run edited code')
        }
        setStatus('loading')
        try {
            const pyodide = await loadPyodideInstance()
            setStatus('running')
            // the runPython call is going to be blocking, so we want to give
            // react a chance to update the status in the UI.
            await new Promise(resolve => setTimeout(resolve, 100))

            // here's where we can pass in globals
            const globals = pyodide.toPy({ _sp_example_global: 5 });
            let script = fileContent

            // We serialize the data object to json string in the python script
            script += '\n'
            script += 'import stanio\n'
            script += 'import json\n'
            script += 'data = stanio.dump_stan_json(data)\n'
            pyodide.runPython(script, {globals})

            if (setData) {
                // get the data object from the python script
                const data = JSON.parse(globals.get('data'))
                setData(data)
            }
            setStatus('completed')
        }
        catch (e) {
            console.error(e)
            setStatus('failed')
        }
    }, [editedFileContent, fileContent, status, setData])
    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []
        const runnable = fileContent === editedFileContent
        if (runnable) {
            ret.push({
                type: 'button',
                tooltip: 'Run code to generate data',
                label: 'Run',
                icon: <PlayArrow />,
                onClick: handleRun,
                color: 'black',
            })
        }
        let label: string
        let color: string
        if (status === 'loading') {
            label = 'Loading pyodide...'
            color = 'blue'
        }
        else if (status === 'running') {
            label = 'Running...'
            color = 'blue'
        }
        else if (status === 'completed') {
            label = 'Completed'
            color = 'green'
        }
        else if (status === 'failed') {
            label = 'Failed'
            color = 'red'
        }
        else {
            label = ''
            color = 'black'
        }

        if (label) {
            ret.push({
                type: 'text',
                label,
                color
            })
        }
        return ret
    }, [fileContent, editedFileContent, handleRun, status])

    return (
        <TextEditor
            width={width}
            height={height}
            language="python"
            label={fileName}
            text={fileContent}
            onSaveText={onSaveContent}
            editedText={editedFileContent}
            onSetEditedText={setEditedFileContent}
            readOnly={readOnly}
            toolbarItems={toolbarItems}
        />
    )
}

const resultToData = (result: any): any => {
    if (result === null || result === undefined) {
        return result
    }
    if (typeof result !== 'object') {
        return result
    }
    if (result instanceof Map) {
        const ret: {[key: string]: any} = {}
        for (const k of result.keys()) {
            ret[k] = resultToData(result.get(k))
        }
        return ret
    }
    else if (result instanceof Int16Array || result instanceof Int32Array || result instanceof Int8Array || result instanceof Uint16Array || result instanceof Uint32Array || result instanceof Uint8Array || result instanceof Uint8ClampedArray || result instanceof Float32Array || result instanceof Float64Array) {
        return Array.from(result)
    }
    else if (result instanceof Array) {
        return result.map(resultToData)
    }
    else {
        const ret: {[key: string]: any} = {}
        for (const k of Object.keys(result)) {
            ret[k] = resultToData(result[k])
        }
        return ret
    }
}

export default DataPyFileEditor