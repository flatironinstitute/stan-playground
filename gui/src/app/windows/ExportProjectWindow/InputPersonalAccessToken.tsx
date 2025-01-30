import { FunctionComponent } from "react";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TextField from "@mui/material/TextField";
import TableRow from "@mui/material/TableRow";

type InputGitHubPersonalAccessTokenComponentProps = {
  gitHubPersonalAccessToken: string;
  setGitHubPersonalAccessToken: (token: string) => void;
};

const InputPersonalAccessToken: FunctionComponent<
  InputGitHubPersonalAccessTokenComponentProps
> = ({ gitHubPersonalAccessToken, setGitHubPersonalAccessToken }) => {
  return (
    <TableContainer>
      <Table padding="none">
        <TableBody>
          <TableRow>
            <TableCell>
              <strong>GitHub Personal Access Token</strong>
            </TableCell>
            <TableCell>
              <TextField
                type="password"
                value={gitHubPersonalAccessToken}
                onChange={(e) => setGitHubPersonalAccessToken(e.target.value)}
                margin="dense"
                size="small"
                variant="standard"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InputPersonalAccessToken;
