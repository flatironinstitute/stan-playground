import { Splitter } from "@fi-sci/splitter"
import { FunctionComponent, useEffect, useMemo, useState } from "react"
import TextEditor from "../../FileEditor/TextEditor"
import DataRFileEditor from "./DataRFileEditor"

type DataRPrototypeProps = {
    width: number
    height: number
}

const exampleScript = `import numpy as np

n = 5
x = np.arange(n)
y = np.arange(n) ** 2 + np.random.random(n)
z = [1, 2, 'c']

data = {
    'x': x,
    'y': y,
    'z': z
}
`

const DataRPrototype: FunctionComponent<DataRPrototypeProps> = ({width, height}) => {
    const [script, setScript] = useState<string>('')
    const [editedScript, setEditedScript] = useState<string>('')
    const [data, setData] = useState<any>(undefined)

    useEffect(() => {
        setScript(exampleScript)
        setEditedScript(exampleScript)
    }, [])

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height / 2}
            direction="vertical"
        >
            <DataRFileEditor
                width={0}
                height={0}
                fileName="data.r"
                fileContent={script}
                onSaveContent={setScript}
                editedFileContent={editedScript}
                setEditedFileContent={setEditedScript}
                readOnly={false}
                setData={setData}
            />
            <DataROutputWindow
                width={0}
                height={0}
                data={data}
            />
        </Splitter>
    )
}

type DataROutputWindowProps = {
    width: number
    height: number
    data: any
}

const DataROutputWindow: FunctionComponent<DataROutputWindowProps> = ({width, height, data}) => {
    const text = useMemo(() => data ? JSON.stringify(data, null, 2) : '', [data])
    return (
        <div style={{width, height, overflow: 'hidden'}}>
            <TextEditor
                width={width}
                height={height}
                language="json"
                label="Data"
                text={text}
                editedText={text}
                onSaveText={() => {}} // do nothing
                onSetEditedText={() => {}}
                readOnly={true}
            />
        </div>
    )
}

export default DataRPrototype