import { FunctionComponent, useCallback } from "react";

import { Delete } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
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

  return (
    <TableContainer>
      <Table padding="none">
        <TableBody>
          {files.map(({ name, content }) => (
            <AlternatingTableRow hover key={name}>
              <TableCell>
                <strong>{name}</strong>
              </TableCell>
              <TableCell>{content.byteLength} bytes</TableCell>
              <TableCell>
                <IconButton onClick={() => onDelete(name)} size="small">
                  <Delete fontSize="inherit" />
                </IconButton>
              </TableCell>
            </AlternatingTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FileListing;
