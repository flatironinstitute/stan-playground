import { FunctionComponent, useMemo } from "react";
import TextEditor, { ToolbarItem } from "./TextEditor";


type Props = {
    fileName: string
    fileContent: string
    onSaveContent: () => void
    editedFileContent: string
    setEditedFileContent: (text: string) => void
    onDeleteFile?: () => void
    readOnly: boolean
    width: number
    height: number
}

const DataFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, readOnly, width, height}) => {
    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []
        return ret
    }, [])

    return (
        <TextEditor
            width={width}
            height={height}
            language="json"
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

export default DataFileEditor