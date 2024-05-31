import {Octokit} from '@octokit/core';

const saveAsGitHubGist = async (files: {[key: string]: string}, defaultDescription: string) => {
    const token = prompt("SAVING AS PUBLIC GIST: Enter your GitHub personal access token (this is not stored). The token must permit creating gists.");
    if (!token) {
        return;
    }
    const description = prompt("SAVING AS PUBLIC GIST: Enter a description:", defaultDescription);
    if (!description) {
        return;
    }
    const octokit = new Octokit({
        auth: token
    });
    const files2: {[key: string]: {content: string}} = {};
    for (const key in files) {
        const key2 = replaceSlashesWithBars(key);
        let content2 = files[key];
        // gists do not support empty files or whitespace-only files
        if (content2.trim() === '') {
            content2 = '<<empty>>' + content2; // include the whitespace so we can recover the original file
        }
        files2[key2] = {content: content2};
    }
    const r = await octokit.request('POST /gists', {
        description,
        'public': true,
        files: files2,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    // const gistId = r.data.id;
    const gistUrl = r.data.html_url;
    return gistUrl;
}

export const updateGitHubGist = async (gistUri: string, patch: {[path: string]: string | null}) => {
    const token = prompt("UPDATING GIST: Enter your GitHub personal access token (this is not stored). The token must permit creating gists.");
    if (!token) {
        return;
    }
    const octokit = new Octokit({
        auth: token
    });
    const gistId = gistUri.split('/').pop();
    if (!gistId) {
        throw new Error('Invalid gist URI');
    }
    // patch
    const files: {[key: string]: {content?: string}} = {};
    for (const path in patch) {
        const path2 = replaceSlashesWithBars(path);
        let content = patch[path];
        if (content === null) {
            files[path2] = {};
        }
        else {
            if (content.trim() === '') {
                content = '<<empty>>' + content; // include the whitespace so we can recover the original file
            }
            files[path2] = {content};
        }
    }
    await octokit.request(`PATCH /gists/${gistId}`, {
        gist_id: gistId,
        files,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
}

const replaceSlashesWithBars = (s: string) => {
    return s.split('/').join('|');
}

export default saveAsGitHubGist;