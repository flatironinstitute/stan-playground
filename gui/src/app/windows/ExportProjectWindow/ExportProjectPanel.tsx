import { FunctionComponent, use, useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

import { AlternatingTableRow } from "@SpComponents/StyledTables";
import { FileNames, mapModelToFileManifest } from "@SpCore/Project/FileMapping";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import makeRuntimeScript from "@SpCore/Scripting/Takeout/makeRuntime";
import { triggerDownload } from "@SpUtil/triggerDownload";
import { replaceSpacesWithUnderscores } from "@SpUtil/replaceSpaces";
import { serializeAsZip } from "@SpUtil/serializeAsZip";

import GistExportPanel from "./GistExportPanel";
import GistUpdatePanel from "./GistUpdatePanel";

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

  const [includeRunPy, setIncludeRunPy] = useState(
    data.analysisPyFileContent.length > 0 || data.dataPyFileContent.length > 0,
  );
  const [runPy, setRunPy] = useState("");

  const [includeRunR, setIncludeRunR] = useState(
    data.analysisRFileContent.length > 0 || data.dataRFileContent.length > 0,
  );
  const [runR, setRunR] = useState("");

  useEffect(() => {
    if (includeRunPy) {
      makeRuntimeScript(data, "py").then(setRunPy);
    } else {
      setRunPy("");
    }
  }, [includeRunPy, data]);

  useEffect(() => {
    if (includeRunR) {
      makeRuntimeScript(data, "R").then(setRunR);
    } else {
      setRunR("");
    }
  }, [includeRunR, data]);

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
            <AlternatingTableRow
              hover
              title="An optional script file intended to be used locally with CmdStanPy"
            >
              <TableCell>
                <strong className="HoverHelp">run.py</strong>
              </TableCell>
              <TableCell>
                <input
                  type="checkbox"
                  checked={includeRunPy}
                  onChange={(e) => setIncludeRunPy(e.target.checked)}
                />
                &nbsp; {runPy.length} bytes
              </TableCell>
            </AlternatingTableRow>
            <AlternatingTableRow
              hover
              title="An optional script file intended to be used locally with CmdStanR"
            >
              <TableCell>
                <strong className="HoverHelp">run.R</strong>
              </TableCell>
              <TableCell>
                <input
                  type="checkbox"
                  checked={includeRunR}
                  onChange={(e) => setIncludeRunR(e.target.checked)}
                />
                &nbsp; {runR.length} bytes
              </TableCell>
            </AlternatingTableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <div>&nbsp;</div>
      {!exportingToGist && !updatingExistingGist && (
        <div>
          <Button
            onClick={async () => {
              const fileManifest: { [key: string]: string | Uint8Array } =
                mapModelToFileManifest(data);
              const folderName = replaceSpacesWithUnderscores(data.meta.title);
              if (includeRunPy) {
                fileManifest["run.py"] = runPy;
              }
              if (includeRunR) {
                fileManifest["run.R"] = runR;
              }

              // hack(?): actually include files in zip, when they're normally serialized for gists etc
              delete fileManifest[FileNames.EXTRA_DATA_MANIFEST];
              for (const { name, content } of data.extraDataFiles) {
                fileManifest[name] = content;
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
