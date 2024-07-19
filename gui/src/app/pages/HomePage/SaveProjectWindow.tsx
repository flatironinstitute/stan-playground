import { FunctionComponent, useCallback, useContext, useState } from "react";

import { serializeAsZip } from "@SpCore//ProjectSerialization";
import { FileRegistry, mapModelToFileManifest } from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import saveAsGitHubGist from "@SpCore/gists/saveAsGitHubGist";
import { triggerDownload } from "@SpUtil/triggerDownload";
import Button from "@mui/material/Button";

type SaveProjectWindowProps = {
  onClose: () => void;
};

const SaveProjectWindow: FunctionComponent<SaveProjectWindowProps> = ({
  onClose,
}) => {
  const { data, update } = useContext(ProjectContext);
  const fileManifest = mapModelToFileManifest(data);

  const [exportingToGist, setExportingToGist] = useState(false);

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
          {Object.entries(fileManifest).map(([name, content], i) => (
            <tr key={i}>
              <td>{name}</td>
              <td>{content.length} bytes</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>&nbsp;</div>
      {!exportingToGist && (
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
        </div>
      )}
      {exportingToGist && (
        <GistExportView
          fileManifest={fileManifest}
          title={data.meta.title}
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
        a GitHub Personal Access Token.&nbsp; This token will be used to
        authenticate with GitHub and create a new Gist with the files in this
        project.&nbsp; You can create a new Personal Access Token by visiting
        your{" "}
        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noreferrer"
        >
          GitHub settings
        </a>
        .&nbsp; Go to <i>Fine-grained tokens</i> and generate a new fine-grained
        token. Be sure to only grant Gist read/write permission by using Gists
        item in the <i>Account Permissions</i> section. You should also specify
        an expiration date.&nbsp; Copy the token and paste it into the field
        below.
      </p>
      <p>
        For security reasons, your token will not be saved in this
        application,&nbsp; so you should store it securely in a text file for
        future use.
      </p>
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
            Successfully saved to GitHub Gist:&nbsp;
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

const makeSPShareableLinkFromGistUrl = (gistUrl: string) => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const url = `${protocol}//${host}?project=${gistUrl}`;
  return url;
};

export default SaveProjectWindow;
