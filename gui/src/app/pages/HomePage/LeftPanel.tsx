import { Hyperlink, SmallIconButton } from "@fi-sci/misc"
import ModalWindow, { useModalWindow } from "@fi-sci/modal-window"
import { FunctionComponent, useCallback, useContext } from "react"
import examplesStanies, { Stanie } from "../../exampleStanies/exampleStanies"
import { SPAnalysisContext } from "../../SPAnalysis/SPAnalysisContextProvider"
import ExportWindow from "./ExportWindow"
import ImportWindow from "./ImportWindow"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"

type LeftPanelProps = {
    width: number
    height: number
    hasUnsavedChanges: boolean
    collapsed: boolean
    onSetCollapsed: (collapsed: boolean) => void
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({ width, height, hasUnsavedChanges, collapsed, onSetCollapsed }) => {
    // note: this is close enough to pass in directly if we wish
    const { update } = useContext(SPAnalysisContext)

    const handleOpenExample = useCallback((stanie: Stanie) => () => {
        update({ type: 'loadStanie', stanie })
    }, [update])

    const { visible: exportVisible, handleOpen: exportOpen, handleClose: exportClose } = useModalWindow()
    const { visible: importVisible, handleOpen: importOpen, handleClose: importClose } = useModalWindow()

    if (collapsed) {
        return (
            <div style={{position: 'absolute', width, height, backgroundColor: 'lightgray', overflowY: 'auto'}}>
                <div style={{margin: 5}}>
                    <ExpandButton onClick={() => onSetCollapsed(false)} />
                </div>
            </div>
        )
    }

    return (
        <div style={{position: 'absolute', width, height, backgroundColor: 'lightgray', overflowY: 'auto'}}>
            <div style={{margin: 5}}>
                <CollapseButton onClick={() => onSetCollapsed(true)} />
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
                        update({ type: 'clear' })
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

const ExpandButton: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <SmallIconButton
            icon={<ChevronRight />}
            onClick={onClick}
            title="Expand"
        />
    )
}

const CollapseButton: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <SmallIconButton
            icon={<ChevronLeft />}
            onClick={onClick}
            title="Collapse"
        />
    )
}

export default LeftPanel