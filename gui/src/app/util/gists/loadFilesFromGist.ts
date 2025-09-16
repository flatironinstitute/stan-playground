const loadFilesFromGist = async (
  gistUri: string,
): Promise<{ files: { [key: string]: string }; description: string }> => {
  // @octokit/rest started to fail with 401 Unauthorized
  const r = await fetch(
    "https://stan-playground-gist-access.vercel.app/api/gist/load",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gistUri }),
    },
  );
  if (!r.ok) {
    throw new Error(`Failed to load gist: ${r.status} ${r.statusText}`);
  }
  const gist = await r.json();
  const description = gist.description || "";
  const gistFiles = gist.files;
  const files: { [key: string]: string } = {};
  for (const fname in gistFiles) {
    const file = gistFiles[fname];
    if (!file) continue;
    files[fname] = file;
  }
  return { files, description };
};

export default loadFilesFromGist;
