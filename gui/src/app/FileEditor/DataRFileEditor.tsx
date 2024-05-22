import { FunctionComponent, useCallback, useMemo, useState } from "react";
import TextEditor, { ToolbarItem } from "./TextEditor";
import { PlayArrow } from "@mui/icons-material";
import { WebR } from 'webr';


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

let webR: WebR | null = null
const loadWebRInstance = async () => {
    if (webR === null) {
        const w = new WebR()
        await w.init()
        w.installPackages(['jsonlite'])
        webR = w
        return webR
    } else {
        return webR
    }
}

const DataRFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, setData, readOnly, width, height}) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'running' | 'completed' | 'failed'>('idle')
    const handleRun = useCallback(async () => {
        if (status === 'running') {
            return
        }
        if (editedFileContent !== fileContent) {
            throw new Error('Cannot run edited code')
        }
        setStatus('loading')
        await new Promise(resolve => setTimeout(resolve, 100))
        try {
            const webR = await loadWebRInstance()
            setStatus('running')
            await new Promise(resolve => setTimeout(resolve, 100))
            const rCode = fileContent + '\n\n' + `
# Convert the list to JSON format
json_data <- jsonlite::toJSON(data, pretty = TRUE, auto_unbox = TRUE)
json_data
            `
            const result = await webR.evalRString(rCode);
            if (setData) {
                setData(JSON.parse(result))
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
        ret.push({
            type: 'text',
            label: status === 'running' ? 'Running...' : status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : '',
            color: status === 'running' ? 'blue' : status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'black'
        })
        return ret
    }, [fileContent, editedFileContent, handleRun, status])

    return (
        <TextEditor
            width={width}
            height={height}
            language="r"
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

export default DataRFileEditor