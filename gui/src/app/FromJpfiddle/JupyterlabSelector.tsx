import { Hyperlink } from "@fi-sci/misc";
import { FunctionComponent, useEffect, useState } from "react";
import { JupyterLabSelection, initialJupyterlabSelection } from "./jupyterlabSelection";

type JupyterlabSelectorProps = {
    // none
}

// const isChrome = navigator.userAgent.indexOf('Chrome') > -1

export const jupyterSelectorInstructionsUrl = "https://github.com/magland/jpfiddle/blob/main/doc/local_jupyterlab.md"

const JupyterlabSelector: FunctionComponent<JupyterlabSelectorProps> = () => {
    const [selection, setSelection] = useState<JupyterLabSelection>(initialJupyterlabSelection)
    const [changed, setChanged] = useState(false)
    useEffect(() => {
        localStorage.setItem('jupyterlabSelection', JSON.stringify(selection))
    }, [selection])
    return (
        <div style={{padding: 3}}>
            <span style={{fontWeight: 'bold'}}>Select a JupyterLab</span>
            <div>
                <input type="radio" id="jupyterlite" name="jupyterlab" value="jupyterlite" checked={selection.type === 'jupyterlite'} onChange={() => {
                    setSelection({type: 'jupyterlite'})
                    setChanged(true)
                }}/>
                {/* We have disabled the flaky kernel for now */}
                <label htmlFor="jupyterlite">JupyterLite (no kernel)</label>
            </div>
            <div>
                <input type="radio" id="local" name="jupyterlab" value="local" checked={selection.type === 'local'} onChange={() => {
                    const url = prompt('Enter the URL of the local JupyterLab', 'http://localhost:8888/lab')
                    if (url) {
                        setSelection({type: 'local', url})
                        setChanged(true)
                    }
                }} />
                <label htmlFor="local">Local JupyterLab</label>
            </div>
            {selection.type === 'local' && <div>
                <Hyperlink
                    onClick={() => {
                        const url = prompt('Enter the URL of the local JupyterLab', selection.type === 'local' ? selection.url : 'http://localhost:8888/lab')
                        if (url) {
                            setSelection({type: 'local', url})
                            setChanged(true)
                        }
                    }
                }>Edit URL</Hyperlink>&nbsp;|&nbsp;
                <Hyperlink
                    href={jupyterSelectorInstructionsUrl}
                    target="_blank"
                >Instructions</Hyperlink>
            </div>}
            {changed && <div style={{color: 'red'}}>
                Reload the page to apply the changes
            </div>}

            {/* The following should be displayed if we haven't actually disabled the flaky kernel. See https://github.com/jupyterlite/jupyterlite/issues/1399 */}
            {/* {isChrome && selection.type === 'local' && <div style={{color: 'red'}}>
                Authentication to a local JupyterLab may not work in Chrome. Try Firefox or Safari.
            </div>} */}
        </div>
    )
}

export default JupyterlabSelector;