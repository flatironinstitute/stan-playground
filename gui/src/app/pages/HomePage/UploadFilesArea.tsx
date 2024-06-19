import { FunctionComponent, useCallback } from "react"
import { useDropzone } from "react-dropzone"

type UploadFilesAreaProps = {
    height: number
    onUpload: (files: {
        name: string,
        content: ArrayBuffer
    }[]) => void
}

const UploadFilesArea: FunctionComponent<UploadFilesAreaProps> = ({ height, onUpload }) => {
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const fileNames = acceptedFiles.map(file => file.name)
        const fileContents = await Promise.all(acceptedFiles.map(file => file.arrayBuffer()))
        const files = fileNames.map((name, i) => ({
            name,
            content: fileContents[i]
        }))
        onUpload(files)
    }, [onUpload])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
    return (
        <div style={{height, border: '1px solid black', padding: 10}}>
            <div {...getRootProps()} style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <input {...getInputProps()} />
                {
                    isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag and drop some files here, or click to select files</p>
                }
            </div>
        </div>
    )
}

export default UploadFilesArea