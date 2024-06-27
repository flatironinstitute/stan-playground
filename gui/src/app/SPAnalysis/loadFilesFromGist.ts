import { Octokit } from "@octokit/rest"

const loadFilesFromGist = async (gistUri: string): Promise<{ files: { [key: string]: string }, description: string }> => {
    const parts = gistUri.split('/')
    const gistId = parts[parts.length - 1]
    const octokit = new Octokit()
    const r = await octokit.request('GET /gists/{gist_id}', {
        gist_id: gistId,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
    const gist = r.data
    const description = gist.description || ''
    const gistFiles = gist.files
    const files: { [key: string]: string } = {}
    for (const fname in gistFiles) {
        const file = gistFiles[fname]
        if (!file) continue
        let content = file.content
        if (content === undefined) continue
        // Gists do not support empty files or whitespace-only files. This
        // provides a workaround for that by allowing the user to specify an
        // empty file by starting the content with the string '<<empty>>'. This
        // is then removed from the content.
        if (content.startsWith('<<empty>>')) {
            const x = content.slice('<<empty>>'.length)
            if (x.trim() === '') {
                content = x
            }
        }
        // Gists do not support directories This is a placeholder for the future
        // where we may want a subdirectory structure for project files. Here we
        // replace the '|' character with '/' to simulate a directory structure.
        const fname2 = replaceBarsWithSlashes(fname)
        files[fname2] = content
    }
    return { files, description }
}

const replaceBarsWithSlashes = (s: string) => {
    return s.split('|').join('/')
}

export default loadFilesFromGist