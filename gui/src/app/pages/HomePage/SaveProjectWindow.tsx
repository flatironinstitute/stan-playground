import { FunctionComponent, useCallback, useContext, useState } from "react";

import { serializeAsZip } from "@SpCore/ProjectSerialization";
import { FileRegistry, mapModelToFileManifest } from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import saveAsGitHubGist, {
  updateGitHubGist,
} from "@SpCore/gists/saveAsGitHubGist";
import { triggerDownload } from "@SpUtil/triggerDownload";
import Button from "@mui/material/Button";
import loadFilesFromGist from "@SpCore/gists/loadFilesFromGist";

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
    <div>
      <h3>Save this project</h3>
      <table className="project-summary-table">
        <tbody>
          <tr>
            <td>Title</td>
            <td>
              <EditTitleComponent
                value={data.meta.title}
                onChange={(newTitle: string) =>
                  update({ type: "retitle", title: newTitle })
                }
              />
            </td>
          </tr>
          {Object.entries(fileManifest).map(
            ([name, content], i) =>
              content.trim() !== "" && (
                <tr key={i}>
                  <td>{name}</td>
                  <td>{content.length} bytes</td>
                </tr>
              ),
          )}
        </tbody>
      </table>
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
          updateExisting={false}
          onClose={onClose}
        />
      )}
      {updatingExistingGist && (
        <GistExportView
          fileManifest={fileManifest}
          title={data.meta.title}
          updateExisting={true}
          onClose={onClose}
        />
      )}
    </div>
  );
};

type EditTitleComponentProps = {
  value: string;
  onChange: (value: string) => void;
};

const EditTitleComponent: FunctionComponent<EditTitleComponentProps> = ({
  value,
  onChange,
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

type GistExportViewProps = {
  fileManifest: Partial<FileRegistry>;
  title: string;
  updateExisting?: boolean;
  onClose: () => void;
};

const GistExportView: FunctionComponent<GistExportViewProps> = ({
  fileManifest,
  title,
  updateExisting,
  onClose,
}) => {
  const [gitHubPersonalAccessToken, setGitHubPersonalAccessToken] =
    useState("");
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [gistUrlToUpdate, setGistUrlToUpdate] = useState<string | null>(null);

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

  const handleUpdateGist = useCallback(async () => {
    if (!gistUrlToUpdate) return; // should not happen
    try {
      const { files: existingFiles, description } =
        await loadFilesFromGist(gistUrlToUpdate);
      if (description !== title) {
        alert(
          `Gist description does not match project title. At this time, changing the title of a project when updating a Gist is not supported.`,
        );
        return;
      }
      const patch = createPatchForUpdatingGist(existingFiles, fileManifest);
      await updateGitHubGist(gistUrlToUpdate, patch, {
        personalAccessToken: gitHubPersonalAccessToken,
      });
      setGistUrl(gistUrlToUpdate);
    } catch (err: any) {
      alert(`Error updating GitHub Gist: ${err.message}`);
    }
  }, [gitHubPersonalAccessToken, fileManifest, title, gistUrlToUpdate]);

  return (
    <div className="GistExplainer">
      <h3>
        {!updateExisting ? "Save to GitHub Gist" : "Update a GitHub Gist"}
      </h3>
      <p>
        In order to{" "}
        {!updateExisting
          ? "save this project as a GitHub Gist"
          : "update a Gist"}
        , you will need to provide a GitHub Personal Access Token.&nbsp; This
        token will be used to authenticate with GitHub and{" "}
        {!updateExisting ? "create a new Gist" : "update a Gist"} with the files
        in this project.&nbsp; To create a new Personal Access Token granting
        permission to read/write your Gists,{" "}
        <a
          href="https://github.com/settings/tokens/new?description=Stan%20Playground&scopes=gist"
          target="_blank"
          rel="noreferrer"
          style={{ fontWeight: "bold" }}
        >
          follow this link
        </a>
        . Alternatively, you can visit{" "}
        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noreferrer"
        >
          GitHub developer settings
        </a>{" "}
        and navigate to either <i>Classic</i> or <i>Fine-grained tokens</i>.
        Create a token with only Gist read/write permissions.
      </p>
      <p>
        Be sure to specify an expiration date. For security reasons, your token
        will not be saved in this application, so you should store it securely
        in a text file for future use.
      </p>
      <p>Copy the token and paste it into the field below.</p>
      <table className="project-summary-table">
        <tbody>
          <tr>
            <td>GitHub Personal Access Token</td>
            <td>
              <input
                type="password"
                value={gitHubPersonalAccessToken}
                onChange={(e) => setGitHubPersonalAccessToken(e.target.value)}
              />
            </td>
          </tr>
        </tbody>
      </table>
      {updateExisting && (
        <>
          <div>&nbsp;</div>
          <SpecifyGistUrlToUpdateComponent
            gistUrl={gistUrlToUpdate}
            setGistUrl={setGistUrlToUpdate}
          />
        </>
      )}
      <div>&nbsp;</div>
      {!gistUrl && !updateExisting && (
        <div>
          <Button onClick={handleExport} disabled={!gitHubPersonalAccessToken}>
            Save to GitHub Gist
          </Button>
          &nbsp;
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
      {!gistUrl && updateExisting && (
        <div>
          <Button
            onClick={handleUpdateGist}
            disabled={!gitHubPersonalAccessToken || !gistUrlToUpdate}
          >
            Update GitHub Gist
          </Button>
          &nbsp;
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
      {gistUrl && (
        <div>
          <p>
            Successfully {!updateExisting ? "saved to" : "updated"} GitHub
            Gist:&nbsp;
            <a href={gistUrl} target="_blank" rel="noreferrer">
              {gistUrl}
            </a>
          </p>
          <p>
            You can now share the following link to this Stan Playground
            project:&nbsp;
            <br />
            <br />
            <a
              href={makeSPShareableLinkFromGistUrl(gistUrl)}
              target="_blank"
              rel="noreferrer"
            >
              {makeSPShareableLinkFromGistUrl(gistUrl)}
            </a>
            <br />
          </p>
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
    <table className="project-summary-table">
      <tbody>
        <tr>
          <td>GitHub Gist URL to update</td>
          <td>
            <input
              type="text"
              value={gistUrl || ""}
              onChange={(e) => setGistUrl(e.target.value)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const createPatchForUpdatingGist = (
  existingFiles: { [key: string]: string },
  newFiles: { [key: string]: string },
) => {
  const patch: { [key: string]: string | null } = {};
  for (const fname in newFiles) {
    const newContent = newFiles[fname];
    if (existingFiles[fname] === newContent) continue;
    if (!newContent.trim()) continue;
    patch[fname] = newContent;
  }
  // handle deleted files
  for (const fname in existingFiles) {
    if (!newFiles[fname] || !newFiles[fname].trim()) {
      patch[fname] = null;
    }
  }
  return patch;
};

const makeSPShareableLinkFromGistUrl = (gistUrl: string) => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const url = `${protocol}//${host}?project=${gistUrl}`;
  return url;
};

export default SaveProjectWindow;
