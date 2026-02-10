import { FunctionComponent, useCallback } from "react";

import { Delete } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Tooltip from "@mui/material/Tooltip";

import { AlternatingTableRow } from "@SpComponents/StyledTables";
import { File } from "@SpUtil/files";

type Props = {
  files: File[];
  setFiles: (updater: (prev: File[]) => File[]) => void;
};

const FileListing: FunctionComponent<Props> = ({ files, setFiles }) => {
  const onDelete = useCallback(
    (name: string) => {
      setFiles((prev) => prev.filter((f) => f.name !== name));
    },
    [setFiles],
  );
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return (
    <TableContainer>
      <Table padding="none">
        <TableBody>
          {files.map(({ name, content }) => {
            let text;
            try {
              text = decoder.decode(content);
              text =
                text.length > 100
                  ? text.substring(0, 100) + " ...\n(preview truncated)"
                  : text;
            } catch {
              text = "Binary file (preview not available)";
            }

            return (
              <Tooltip
                title={<pre className="WrappedToolTip">{text}</pre>}
                key={name}
                arrow
                disableInteractive
              >
                <AlternatingTableRow hover>
                  <TableCell>
                    <strong className="FileListingTitle"> {name}</strong>
                  </TableCell>
                  <TableCell>{content.byteLength} bytes</TableCell>
                  <TableCell>
                    <Tooltip title="Delete file">
                      <IconButton onClick={() => onDelete(name)} size="small">
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </AlternatingTableRow>
              </Tooltip>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FileListing;
