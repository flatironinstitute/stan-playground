import { FunctionComponent, use, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import { AlternatingTableRow } from "@SpComponents/StyledTables";
import { mapModelToFileManifest } from "@SpCore/Project/FileMapping";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { triggerDownload } from "@SpUtil/triggerDownload";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import GistExportPanel from "./GistExportPanel";
import GistUpdatePanel from "./GistUpdatePanel";

import { replaceSpacesWithUnderscores } from "@SpUtil/replaceSpaces";
import { serializeAsZip } from "@SpUtil/serializeAsZip";
import makePyRuntimeScript from "@SpCore/Scripting/Takeout/makePyRuntime";

type ExportProjectProps = {
  onClose: () => void;
};

const ExportProjectPanel: FunctionComponent<ExportProjectProps> = ({
  onClose,
}) => {
  const { data, update } = use(ProjectContext);
  const fileManifest = mapModelToFileManifest(data);

  const [exportingToGist, setExportingToGist] = useState(false);
  const [updatingExistingGist, setUpdatingExistingGist] = useState(false);

  const [includeRunPy, setIncludeRunPy] = useState(false);

  return (
    <div className="dialogWrapper">
      <TableContainer>
        <Table padding="none">
          <TableBody>
            <AlternatingTableRow hover>
              <TableCell>
                <strong>Title</strong>
              </TableCell>
              <TableCell>
                <TextField
                  type="text"
                  value={data.meta.title}
                  onChange={(e) =>
                    update({ type: "retitle", title: e.target.value })
                  }
                  margin="dense"
                  size="small"
                  variant="standard"
                />
              </TableCell>
            </AlternatingTableRow>
            {Object.entries(fileManifest).map(
              ([name, content], i) =>
                content.trim() !== "" && (
                  <AlternatingTableRow key={i} hover>
                    <TableCell>
                      <strong>{name}</strong>
                    </TableCell>
                    <TableCell>{content.length} bytes</TableCell>
                  </AlternatingTableRow>
                ),
            )}
          </TableBody>
          <AlternatingTableRow hover>
            <TableCell>Include a run.py file for use with CmdStanPy?</TableCell>
            <TableCell>
              <input
                type="checkbox"
                checked={includeRunPy}
                onChange={(e) => setIncludeRunPy(e.target.checked)}
              />
            </TableCell>
          </AlternatingTableRow>
        </Table>
      </TableContainer>
      <div>&nbsp;</div>
      {!exportingToGist && !updatingExistingGist && (
        <div>
          <Button
            onClick={async () => {
              const fileManifest: { [key: string]: string } =
                mapModelToFileManifest(data);
              const folderName = replaceSpacesWithUnderscores(data.meta.title);
              if (includeRunPy) {
                fileManifest["run.py"] = makePyRuntimeScript(data);
              }
              serializeAsZip(folderName, fileManifest).then(([zipBlob, name]) =>
                triggerDownload(zipBlob, `SP-${name}.zip`, onClose),
              );
            }}
          >
            Export to .zip file
          </Button>
          &nbsp;
          <Button
            onClick={() => {
              setExportingToGist(true);
            }}
          >
            Export to GitHub Gist
          </Button>
          <Button
            onClick={() => {
              setUpdatingExistingGist(true);
            }}
          >
            Update a GitHub Gist
          </Button>
        </div>
      )}
      {exportingToGist && (
        <GistExportPanel
          fileManifest={fileManifest}
          title={data.meta.title}
          onClose={onClose}
        />
      )}
      {updatingExistingGist && (
        <GistUpdatePanel
          fileManifest={fileManifest}
          title={data.meta.title}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default ExportProjectPanel;
