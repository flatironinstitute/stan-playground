export type JupyterLabSelection = {
    type: 'jupyterlite'
} | {
    type: 'local'
    url: string
}

export let initialJupyterlabSelection: JupyterLabSelection = {
    type: 'jupyterlite'
}
if (localStorage.getItem('jupyterlabSelection')) {
    try {
        initialJupyterlabSelection = JSON.parse(localStorage.getItem('jupyterlabSelection')!)
    } catch (e) {
        // ignore
    }
}