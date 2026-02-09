import { FunctionComponent } from "react";

import { File } from "@SpUtil/files";
import FileListing from "@SpComponents/FileListing";
import UploadArea from "@SpComponents/UploadArea";
import Stack from "@mui/material/Stack";

type Props = {
  files: File[];
  setFiles: (f: File[] | ((prev: File[]) => File[])) => void;
};

const DataFilesPanel: FunctionComponent<Props> = ({ files, setFiles }) => {
  return (
    <div className="dialogWrapper">
      <Stack spacing={2}>
        <div>
          Upload additional files (e.g. csv files) here to be able to access
          them from the data scripts.
        </div>
        <UploadArea height={100} onUpload={setFiles} />
        {files.length > 0 && (
          <>
            <h3>Uploaded files</h3>
            <FileListing files={files} setFiles={setFiles} />
          </>
        )}
      </Stack>
    </div>
  );
};
export default DataFilesPanel;
