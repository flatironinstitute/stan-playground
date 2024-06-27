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
    width: number
    height: number
    outputDiv?: HTMLDivElement | null
}

const AnalysisPyFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, readOnly, width, height, outputDiv}) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'completed' | 'failed'>('idle')

    const loadPyodideInstance = useMemo(() => {
        let pyodide: PyodideInterface | null = null
        const loadPyodideInstance = async () => {
            if (pyodide === null) {
                const p = await loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full",
                    stdout: (x: string) => {
                        const color = 'blue'
                        const pre = document.createElement('pre')
                        pre.style.color = color
                        pre.appendChild(document.createTextNode(x))
                        outputDiv?.appendChild(pre)
                    },
                    stderr: (x: string) => {
                        const color = 'red'
                        const pre = document.createElement('pre')
                        pre.style.color = color
                        pre.appendChild(document.createTextNode(x))
                        outputDiv?.appendChild(pre)
                    }
                })
                pyodide = p
                await pyodide.loadPackage(['numpy', 'matplotlib'])
                return pyodide
            } else {
                return pyodide
            }
        }
        return loadPyodideInstance
    }, [outputDiv])

    const handleRun = useCallback(async () => {
        if (status === 'running') {
            return
        }
        if (editedFileContent !== fileContent) {
            throw new Error('Cannot run edited code')
        }
        const oldPyodideMplTarget = (document as any).pyodideMplTarget;
        (document as any).pyodideMplTarget = outputDiv;
        // clear the output div
        if (outputDiv) {
            outputDiv.innerHTML = ''
        }
        setStatus('loading')
        await new Promise(resolve => setTimeout(resolve, 100))
        try {
            const pyodide = await loadPyodideInstance()
            setStatus('running')
            await new Promise(resolve => setTimeout(resolve, 100))

            // here's where we can pass in globals
            const globals = pyodide.toPy({ _sp_example_global: 5 });
            const script = fileContent
            pyodide.runPython(script, {globals})
            setStatus('completed')
        }
        catch (e: any) {
            console.error(e)
            const pre = document.createElement('pre')
            pre.style.color = 'red'
            pre.appendChild(document.createTextNode(e.toString()))
            outputDiv?.appendChild(pre)
            setStatus('failed')
        }
        finally {
            (document as any).pyodideMplTarget = oldPyodideMplTarget;
        }
    }, [editedFileContent, fileContent, status, loadPyodideInstance, outputDiv])
    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []
        const runnable = (fileContent === editedFileContent) && outputDiv
        if (runnable) {
            ret.push({
                type: 'button',
                tooltip: 'Run script',
                label: 'Run',
                icon: <PlayArrow />,
                onClick: handleRun,
                color: 'black',
            })
        }
        if (!outputDiv) {
            ret.push({
                type: 'text',
                label: 'No output window',
                color: 'red'
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

export default AnalysisPyFileEditor