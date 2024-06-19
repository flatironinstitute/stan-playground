import { FunctionComponent, useCallback } from "react"
import examplesStanies, { Stanie } from "../../exampleStanies/exampleStanies"
import { Hyperlink } from "@fi-sci/misc"
import { useSPAnalysis } from "../../SPAnalysis/SPAnalysisContext"
import { defaultSamplingOpts } from "../../StanSampler/StanSampler"
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window"
import ExportWindow from "./ExportWindow"
import ImportWindow from "./ImportWindow"

type LeftPanelProps = {
    width: number
    height: number
    hasUnsavedChanges: boolean
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({ width, height, hasUnsavedChanges }) => {
    const {
        localDataModel
    } = useSPAnalysis()

    const handleOpenExample = useCallback((stanie: Stanie) => () => {
        localDataModel.setStanFileContent(stanie.stan)
        localDataModel.setDataFileContent(JSON.stringify(stanie.data, null, 2))
        localDataModel.setSamplingOptsContent(JSON.stringify(defaultSamplingOpts, null, 2))
        localDataModel.setTitle(stanie.meta.title || 'Untitled')
    }, [localDataModel])

    const { visible: exportVisible, handleOpen: exportOpen, handleClose: exportClose } = useModalWindow()
    const { visible: importVisible, handleOpen: importOpen, handleClose: importClose } = useModalWindow()

    return (
        <div style={{position: 'absolute', width, height, backgroundColor: 'lightgray', overflowY: 'auto'}}>
            <div style={{margin: 5}}>
                <h3>Examples</h3>
                {
                    examplesStanies.map((stanie, i) => (
                        <div key={i} style={{margin: 5}}>
                            <Hyperlink onClick={handleOpenExample(stanie)}>
                                {stanie.meta.title}
                            </Hyperlink>
                        </div>
                    ))
                }
                <hr />
                <div>
                    {/* This will probably be removed or replaced in the future. It's just for convenience during development. */}
                    <button onClick={() => {
                        const ok = window.confirm('Are you sure you want to clear all data in the editors?')
                        if (!ok) return
                        localDataModel.clearAll()
                    }}>Clear all</button>
                </div>
                <div>
                    <p>
                        This panel will have controls for loading/saving data from cloud
                    </p>
                </div>
                <div>
                    <button
                        onClick={importOpen}
                        disabled={hasUnsavedChanges}
                    >
                        Import
                    </button>
                    &nbsp;
                    <button
                        onClick={exportOpen}
                        disabled={hasUnsavedChanges}
                    >
                        Export
                    </button>
                </div>
            </div>
            <ModalWindow
                visible={importVisible}
                onClose={importClose}
            >
                <ImportWindow
                    onClose={importClose}
                />
            </ModalWindow>
            <ModalWindow
                visible={exportVisible}
                onClose={exportClose}
            >
                <ExportWindow
                    onClose={exportClose}
                />
            </ModalWindow>
        </div>
    )
}

export default LeftPanel