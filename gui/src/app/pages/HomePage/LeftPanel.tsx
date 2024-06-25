import { Hyperlink } from "@fi-sci/misc"
import { FunctionComponent, useCallback, useContext } from "react"
import examplesStanies, { Stanie } from "../../exampleStanies/exampleStanies"
import { SPAnalysisContext } from "../../SPAnalysis/SPAnalysisContextProvider"

type LeftPanelProps = {
    width: number
    height: number
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({ width, height }) => {
    // note: this is close enough to pass in directly if we wish
    const { update } = useContext(SPAnalysisContext)

    const handleOpenExample = useCallback((stanie: Stanie) => () => {
        update({ type: 'loadStanie', stanie })
    }, [update])
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
            </div>
        </div>
    )
}

export default LeftPanel