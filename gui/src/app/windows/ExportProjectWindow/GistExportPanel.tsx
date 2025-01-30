import { FunctionComponent, useCallback, useState } from "react";

import Button from "@mui/material/Button";
import Link from "@mui/material/Link";

import { FileRegistry } from "@SpCore/Project/FileMapping";
import saveAsGitHubGist from "@SpUtil/gists/saveAsGitHubGist";
import InputPersonalAccessToken from "./InputPersonalAccessToken";
import { makeSPShareableLinkFromGistUrl } from "./makeShareableLink";

type GistExportProps = {
  fileManifest: Partial<FileRegistry>;
  title: string;
  onClose: () => void;
};

const GistExportPanel: FunctionComponent<GistExportProps> = ({
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
      <h3>Export to GitHub Gist</h3>
      <p>
        In order to export this project as a GitHub Gist, you will need to
        provide a GitHub Personal Access Token. This token will be used to
        authenticate with GitHub and create a new Gist with the files in this
        project. To create a new Personal Access Token granting permission to
        read/write your Gists,{" "}
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
      <InputPersonalAccessToken
        gitHubPersonalAccessToken={gitHubPersonalAccessToken}
        setGitHubPersonalAccessToken={setGitHubPersonalAccessToken}
      />
      <div>&nbsp;</div>
      {!gistUrl && (
        <div>
          <Button onClick={handleExport} disabled={!gitHubPersonalAccessToken}>
            Export to GitHub Gist
          </Button>
          &nbsp;
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
      {gistUrl && (
        <div>
          <p>
            Successfully exported to GitHub Gist:{" "}
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

export default GistExportPanel;
