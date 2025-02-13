import { Octokit } from "@octokit/rest";

const doesGistExist = async (gistUri: string): Promise<boolean> => {
  const parts = gistUri.split("/");
  const gistId = parts[parts.length - 1];
  if (!gistId) {
    return false;
  }
  const octokit = new Octokit();
  try {
    const r = await octokit.request("HEAD /gists/{gist_id}", {
      gist_id: gistId,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return r.status === 200;
  } catch (e) {
    return false;
  }
};

export default doesGistExist;
