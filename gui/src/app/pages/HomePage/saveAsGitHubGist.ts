import { Octokit } from "@octokit/core";

const saveAsGitHubGist = async (
  files: { [key: string]: string },
  o: { defaultDescription: string; personalAccessToken: string },
) => {
  const { defaultDescription, personalAccessToken } = o;
  const description = prompt(
    "SAVING AS PUBLIC GIST: Enter a description:",
    defaultDescription,
  );
  if (!description) {
    throw Error("No description provided");
  }
  const octokit = new Octokit({
    auth: personalAccessToken,
  });
  const files2: { [key: string]: { content: string } } = {};
  for (const key in files) {
    // gists do not support empty files or whitespace-only files
    if (files[key].trim() === "") {
      console.warn(`File ${key} is empty or whitespace-only. Not saving.`);
    } else {
      files2[key] = { content: files[key] };
    }
  }
  const r = await octokit.request("POST /gists", {
    description,
    public: true,
    files: files2,
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

export default saveAsGitHubGist;
