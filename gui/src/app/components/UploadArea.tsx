import { File as SPFile } from "@SpUtil/files";
import { FunctionComponent, useCallback } from "react";
import { useDropzone } from "react-dropzone";

type UploadArea = {
  height: number;
  onUpload: (updater: (prev: SPFile[]) => SPFile[]) => void;
};

const UploadArea: FunctionComponent<UploadArea> = ({ height, onUpload }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const fileNames = acceptedFiles.map((file) => file.name);
      const fileContents = await Promise.all(
        acceptedFiles.map((file) => file.bytes()),
      );
      const files = fileNames.map((name, i) => ({
        name,
        content: fileContents[i],
      }));

      onUpload((prev) => {
        const newNames = files.map((f) => f.name);
        const oldToKeep = prev.filter((f) => !newNames.includes(f.name));
        return [...oldToKeep, ...files];
      });
    },
    [onUpload],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return (
    <div className="FileDropAreaWrapper" style={{ height }}>
      <div {...getRootProps()} className="FileDropAreaInner">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag and drop some files here, or click to select files</p>
        )}
      </div>
    </div>
  );
};

export default UploadArea;
