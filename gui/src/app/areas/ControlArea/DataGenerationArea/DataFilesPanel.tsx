import { FunctionComponent, use, useCallback, useState } from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import FileListing from "@SpComponents/FileListing";
import UploadArea from "@SpComponents/UploadArea";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { File } from "@SpUtil/files";
import { isFileName as isProjectFile } from "@SpCore/Project/FileMapping";

const DataFilesPanel: FunctionComponent = () => {
  const {
    update,
    data: { extraDataFiles: files },
  } = use(ProjectContext);

  const [errorText, setErrorText] = useState<string>("");

  const setFiles = useCallback(
    (updater: (prev: File[]) => File[]) => {
      setErrorText("");
      const newFiles = updater(files);

      const validFiles = [];
      const invalidFiles = [];
      for (const file of newFiles) {
        if (
          isProjectFile(file.name) ||
          file.name == "run.py" ||
          file.name == "run.R"
        ) {
          invalidFiles.push(file.name);
          continue;
        }
        validFiles.push(file);
      }
      if (invalidFiles.length > 0) {
        setErrorText(
          "Error: The following files have names that are already in use by Stan Playground and were not added: " +
            invalidFiles.join(", "),
        );
      }

      update({ type: "setExtraDataFiles", files: validFiles });
    },
    [update, files, setErrorText],
  );

  return (
    <div className="dialogWrapper">
      <Stack spacing={2}>
        <div>
          Upload additional files (e.g. csv files) here to be able to access
          them from the data scripts.
        </div>
        <UploadArea height={100} onUpload={setFiles} />
        {errorText !== "" && (
          <Typography color="error.main">{errorText}</Typography>
        )}
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
