import { FunctionComponent, useCallback, useState } from "react";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import { FileRegistry } from "@SpCore/Project/FileMapping";
import loadFilesFromGist from "@SpUtil/gists/loadFilesFromGist";
import {
  createPatchForUpdatingGist,
  updateGitHubGist,
} from "@SpUtil/gists/saveAsGitHubGist";
import CopyableLink from "@SpComponents/CopyableLink";

import InputPersonalAccessToken from "./InputPersonalAccessToken";
import { InvitationToShareArea } from "./InvitationToShareArea";

type GistUpdateProps = {
  fileManifest: Partial<FileRegistry>;
  title: string;
  onClose: () => void;
};

const GistUpdatePanel: FunctionComponent<GistUpdateProps> = ({
  fileManifest,
  title,
  onClose,
}) => {
  const [gitHubPersonalAccessToken, setGitHubPersonalAccessToken] =
    useState("");
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  const handleUpdateGist = useCallback(async () => {
    if (!gistUrl) return; // should not happen
    try {
      const { files: existingFiles, description } =
        await loadFilesFromGist(gistUrl);
      if (description !== title) {
        alert(
          `Gist description does not match project title. At this time, changing the title of a project when updating a Gist is not supported.`,
        );
        return;
      }
      const patch = createPatchForUpdatingGist(existingFiles, fileManifest);
      await updateGitHubGist(gistUrl, patch, {
        personalAccessToken: gitHubPersonalAccessToken,
      });
      setUpdated(true);
    } catch (err: any) {
      alert(`Error updating GitHub Gist: ${err.message}`);
    }
  }, [gitHubPersonalAccessToken, fileManifest, title, gistUrl]);

  return (
    <div className="GistExplainer">
      <h3>Update a GitHub Gist</h3>
      <div>&nbsp;</div>
      <SpecifyGistUrlToUpdateComponent
        gistUrl={gistUrl}
        setGistUrl={setGistUrl}
      />
      <div>&nbsp;</div>
      <InputPersonalAccessToken
        gitHubPersonalAccessToken={gitHubPersonalAccessToken}
        setGitHubPersonalAccessToken={setGitHubPersonalAccessToken}
      />
      <div>&nbsp;</div>
      {!updated && gistUrl && (
        <div>
          <Button
            onClick={handleUpdateGist}
            disabled={!gitHubPersonalAccessToken || !gistUrl}
          >
            Update GitHub Gist
          </Button>
          &nbsp;
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
      {updated && gistUrl && (
        <div>
          <p>Successfully updated Gist: </p>
          <CopyableLink link={gistUrl} />
          <InvitationToShareArea project={gistUrl} />
          <Button onClick={onClose}>Close</Button>
        </div>
      )}
    </div>
  );
};

type SpecifyGistUrlToUpdateComponentProps = {
  gistUrl: string | null;
  setGistUrl: (gistUrl: string) => void;
};

const SpecifyGistUrlToUpdateComponent: FunctionComponent<
  SpecifyGistUrlToUpdateComponentProps
> = ({ gistUrl, setGistUrl }) => {
  return (
    <TableContainer>
      <Table padding="none">
        <TableBody>
          <TableRow>
            <TableCell>
              <strong>GitHub Gist URL to update</strong>
            </TableCell>
            <TableCell>
              <TextField
                type="text"
                value={gistUrl || ""}
                onChange={(e) => setGistUrl(e.target.value)}
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

export default GistUpdatePanel;
