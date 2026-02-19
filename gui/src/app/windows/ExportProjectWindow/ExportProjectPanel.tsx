import { FunctionComponent, use, useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";

import { AlternatingTableRow } from "@SpComponents/StyledTables";
import { mapModelToFileManifest } from "@SpCore/Project/FileMapping";
import { serializeProjectToZip } from "@SpCore/Project/ProjectSerialization";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import makeRuntimeScript from "@SpCore/Scripting/Takeout/makeRuntime";
import { triggerDownload } from "@SpUtil/triggerDownload";

import GistExportPanel from "./GistExportPanel";
import GistUpdatePanel from "./GistUpdatePanel";
import QuickSharePanel from "./QuickSharePanel";

type ExportProjectProps = {
  onClose: () => void;
};

type Exporting = "none" | "gist" | "update-gist" | "quick";

const ExportProjectPanel: FunctionComponent<ExportProjectProps> = ({
  onClose,
}) => {
  const { data, update } = use(ProjectContext);
  const fileManifest = mapModelToFileManifest(data);

  const [exportingType, setExportingType] = useState<Exporting>("none");

  const [includeRunPy, setIncludeRunPy] = useState(
    data.analysisPyFileContent.length > 0 || data.dataPyFileContent.length > 0,
  );
  const [runPy, setRunPy] = useState("");

  const [includeRunR, setIncludeRunR] = useState(
    data.analysisRFileContent.length > 0 || data.dataRFileContent.length > 0,
  );
  const [runR, setRunR] = useState("");

  useEffect(() => {
    makeRuntimeScript(data, "py").then(setRunPy);
    makeRuntimeScript(data, "R").then(setRunR);
  }, [data]);

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
                &nbsp; {includeRunPy ? runPy.length : 0} bytes
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
                &nbsp; {includeRunR ? runR.length : 0} bytes
              </TableCell>
            </AlternatingTableRow>
          </TableBody>
        </Table>
      </TableContainer>
      {exportingType === "none" && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            onClick={async () => {
              serializeProjectToZip(
                data,
                includeRunPy ? runPy : null,
                includeRunR ? runR : null,
              ).then(([zipBlob, filename]) =>
                triggerDownload(zipBlob, `SP-${filename}.zip`, onClose),
              );
            }}
          >
            Export to .zip file
          </Button>
          <Button
            onClick={() => {
              setExportingType("quick");
            }}
          >
            Quick Share
          </Button>
          <Button
            onClick={() => {
              setExportingType("gist");
            }}
          >
            Save to Gist
          </Button>
          <Button
            onClick={() => {
              setExportingType("update-gist");
            }}
          >
            Update a Gist
          </Button>
        </Stack>
      )}
      {exportingType === "quick" && (
        <QuickSharePanel data={data} onClose={onClose} />
      )}
      {exportingType === "gist" && (
        <GistExportPanel
          fileManifest={fileManifest}
          title={data.meta.title}
          onClose={onClose}
        />
      )}
      {exportingType === "update-gist" && (
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
