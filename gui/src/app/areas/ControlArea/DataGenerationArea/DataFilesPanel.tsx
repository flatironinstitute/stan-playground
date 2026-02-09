import { FunctionComponent, use, useCallback } from "react";

import FileListing from "@SpComponents/FileListing";
import UploadArea from "@SpComponents/UploadArea";
import Stack from "@mui/material/Stack";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { File } from "@SpUtil/files";

const DataFilesPanel: FunctionComponent = () => {
  const {
    update,
    data: { extraDataFiles: files },
  } = use(ProjectContext);

  const setFiles = useCallback(
    (updater: (prev: File[]) => File[]) => {
      const newFiles = updater(files);
      update({ type: "setExtraDataFiles", files: newFiles });
    },
    [update, files],
  );

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
            <h3>Available files</h3>
            <FileListing files={files} setFiles={setFiles} />
          </>
        )}
      </Stack>
    </div>
  );
};
export default DataFilesPanel;
