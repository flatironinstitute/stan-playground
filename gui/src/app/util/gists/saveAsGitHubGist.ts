import { Octokit } from "@octokit/core";

type SaveAsGitHubGistOpts = {
  defaultDescription: string;
  personalAccessToken: string;
};

const saveAsGitHubGist = async (
  files: { [key: string]: string },
  o: SaveAsGitHubGistOpts,
) => {
  const { defaultDescription, personalAccessToken } = o;
  const description = prompt(
    "SAVING AS PUBLIC GIST: Enter a description:",
    defaultDescription,
  );
  if (!description) {
    throw new Error("No description provided");
  }
  const octokit = new Octokit({
    auth: personalAccessToken,
  });
  const filesForGistExport: { [key: string]: { content: string } } = {};
  for (const key in files) {
    // gists do not support empty files or whitespace-only files
    if (files[key].trim() === "") {
      console.warn(`File ${key} is empty or whitespace-only. Not saving.`);
    } else {
      filesForGistExport[key] = { content: files[key] };
    }
  }
  const r = await octokit.request("POST /gists", {
    description,
    public: true,
    files: filesForGistExport,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  // const gistId = r.data.id;
  const gistUrl = r.data.html_url;
  if (!gistUrl) {
    throw new Error("Problem creating gist. r.data.html_url is null.");
  }
  return gistUrl;
};

export const updateGitHubGist = async (
  gistUri: string,
  patch: { [path: string]: string | null },
  o: { personalAccessToken: string },
) => {
  const octokit = new Octokit({
    auth: o.personalAccessToken,
  });
  const gistId = gistUri.split("/").pop();
  if (!gistId) {
    throw new Error("Invalid gist URI");
  }
  // patch
  const files: { [key: string]: { content?: string } } = {};
  for (const path in patch) {
    const content = patch[path];
    if (content === null || content.trim() === "") {
      files[path] = {};
    } else {
      files[path] = { content };
    }
  }
  await octokit.request(`PATCH /gists/${gistId}`, {
    gist_id: gistId,
    files,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
};

export const createPatchForUpdatingGist = (
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

export default saveAsGitHubGist;
