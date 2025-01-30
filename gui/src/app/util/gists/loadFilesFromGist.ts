import { Octokit } from "@octokit/rest";

const loadFilesFromGist = async (
  gistUri: string,
): Promise<{ files: { [key: string]: string }; description: string }> => {
  const parts = gistUri.split("/");
  const gistId = parts[parts.length - 1];
  const octokit = new Octokit();
  const r = await octokit.request("GET /gists/{gist_id}", {
    gist_id: gistId,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const gist = r.data;
  const description = gist.description || "";
  const gistFiles = gist.files;
  const files: { [key: string]: string } = {};
  for (const fname in gistFiles) {
    const file = gistFiles[fname];
    if (!file) continue;
    const content = file.content;
    if (content === undefined) continue;
    files[fname] = content;
  }
  return { files, description };
};

export default loadFilesFromGist;
