import { FunctionComponent, useCallback, useContext, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import { AlternatingTableRow } from "@SpComponents/StyledTables";
import { FileRegistry, mapModelToFileManifest } from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { triggerDownload } from "@SpUtil/triggerDownload";
import Button from "@mui/material/Button";
import loadFilesFromGist from "@SpCore/gists/loadFilesFromGist";
import { serializeAsZip } from "@SpCore/ProjectSerialization";
import saveAsGitHubGist, {
  createPatchForUpdatingGist,
  updateGitHubGist,
} from "@SpCore/gists/saveAsGitHubGist";
import TextField from "@mui/material/TextField";
import TableRow from "@mui/material/TableRow";
import Link from "@mui/material/Link";

type SaveProjectWindowProps = {
  onClose: () => void;
};

const SaveProjectWindow: FunctionComponent<SaveProjectWindowProps> = ({
  onClose,
}) => {
  const { data, update } = useContext(ProjectContext);
  const fileManifest = mapModelToFileManifest(data);

  const [exportingToGist, setExportingToGist] = useState(false);
  const [updatingExistingGist, setUpdatingExistingGist] = useState(false);

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
        </Table>
      </TableContainer>
      <div>&nbsp;</div>
      {!exportingToGist && !updatingExistingGist && (
        <div>
          <Button
            onClick={async () => {
              serializeAsZip(data).then(([zipBlob, name]) =>
                triggerDownload(zipBlob, `SP-${name}.zip`, onClose),
              );
            }}
          >
            Save to .zip file
          </Button>
          &nbsp;
          <Button
            onClick={() => {
              setExportingToGist(true);
            }}
          >
            Save to GitHub Gist
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
        <GistExportView
          fileManifest={fileManifest}
          title={data.meta.title}
          onClose={onClose}
        />
      )}
      {updatingExistingGist && (
        <GistUpdateView
          fileManifest={fileManifest}
          title={data.meta.title}
          onClose={onClose}
        />
      )}
    </div>
  );
};

type GistExportViewProps = {
  fileManifest: Partial<FileRegistry>;
  title: string;
  onClose: () => void;
};

const GistExportView: FunctionComponent<GistExportViewProps> = ({
  fileManifest,
  title,
  onClose,
}) => {
  const [gitHubPersonalAccessToken, setGitHubPersonalAccessToken] =
    useState("");
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    try {
      const gistUrl = await saveAsGitHubGist(fileManifest, {
        defaultDescription: title,
        personalAccessToken: gitHubPersonalAccessToken,
      });
      setGistUrl(gistUrl);
    } catch (err: any) {
      alert(`Error saving to GitHub Gist: ${err.message}`);
    }
  }, [gitHubPersonalAccessToken, fileManifest, title]);

  return (
    <div className="GistExplainer">
      <h3>Save to GitHub Gist</h3>
      <p>
        In order to save this project as a GitHub Gist, you will need to provide
        a GitHub Personal Access Token. This token will be used to authenticate
        with GitHub and create a new Gist with the files in this project. To
        create a new Personal Access Token granting permission to read/write
        your Gists,{" "}
        <Link
          href="https://github.com/settings/tokens/new?description=Stan%20Playground&scopes=gist"
          target="_blank"
          rel="noreferrer"
          style={{ fontWeight: "bold" }}
        >
          follow this link
        </Link>
        . Alternatively, you can visit{" "}
        <Link
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noreferrer"
        >
          GitHub developer settings
        </Link>{" "}
        and navigate to either <i>Classic</i> or <i>Fine-grained tokens</i>.
        Create a token with only Gist read/write permissions.
      </p>
      <p>
        Be sure to specify an expiration date. For security reasons, your token
        will not be saved in this application, so you should store it securely
        in a text file for future use.
      </p>
      <p>Copy the token and paste it into the field below.</p>
      <InputGitHubPersonalAccessTokenComponent
        gitHubPersonalAccessToken={gitHubPersonalAccessToken}
        setGitHubPersonalAccessToken={setGitHubPersonalAccessToken}
      />
      <div>&nbsp;</div>
      {!gistUrl && (
        <div>
          <Button onClick={handleExport} disabled={!gitHubPersonalAccessToken}>
            Save to GitHub Gist
          </Button>
          &nbsp;
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
      {gistUrl && (
        <div>
          <p>
            Successfully saved to GitHub Gist:{" "}
            <Link href={gistUrl} target="_blank" rel="noreferrer">
              {gistUrl}
            </Link>
          </p>
          <p>
            You can now share the following link to this Stan Playground
            project:&nbsp;
            <br />
            <br />
            <Link
              href={makeSPShareableLinkFromGistUrl(gistUrl)}
              target="_blank"
              rel="noreferrer"
            >
              {makeSPShareableLinkFromGistUrl(gistUrl)}
            </Link>
            <br />
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      )}
    </div>
  );
};

type GistUpdateViewProps = {
  fileManifest: Partial<FileRegistry>;
  title: string;
  onClose: () => void;
};

const GistUpdateView: FunctionComponent<GistUpdateViewProps> = ({
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
      <InputGitHubPersonalAccessTokenComponent
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
          <p>
            Successfully updated Gist:{" "}
            <Link href={gistUrl} target="_blank" rel="noreferrer">
              {gistUrl}
            </Link>
          </p>
          <InvitationToShareProjectParagraph gistUrl={gistUrl} />
          <Button onClick={onClose}>Close</Button>
        </div>
      )}
    </div>
  );
};

type InputGitHubPersonalAccessTokenComponentProps = {
  gitHubPersonalAccessToken: string;
  setGitHubPersonalAccessToken: (token: string) => void;
};

const InputGitHubPersonalAccessTokenComponent: FunctionComponent<
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

type InvitationToShareProjectParagraphProps = {
  gistUrl: string;
};

const InvitationToShareProjectParagraph: FunctionComponent<
  InvitationToShareProjectParagraphProps
> = ({ gistUrl }) => {
  return (
    <p>
      You can now share the following link to this Stan Playground
      project:&nbsp;
      <br />
      <br />
      <Link
        href={makeSPShareableLinkFromGistUrl(gistUrl)}
        target="_blank"
        rel="noreferrer"
      >
        {makeSPShareableLinkFromGistUrl(gistUrl)}
      </Link>
      <br />
    </p>
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

const makeSPShareableLinkFromGistUrl = (gistUrl: string) => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const url = `${protocol}//${host}?project=${gistUrl}`;
  return url;
};

export default SaveProjectWindow;
