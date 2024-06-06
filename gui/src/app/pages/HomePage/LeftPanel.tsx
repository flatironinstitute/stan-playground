import { FunctionComponent, useCallback } from "react"
import examplesStanies, { Stanie } from "../../exampleStanies/exampleStanies"
import { Hyperlink } from "@fi-sci/misc"
import { useSPAnalysis } from "../../SPAnalysis/SPAnalysisContext"
import { defaultSamplingOpts } from "../../StanSampler/StanSampler"

type LeftPanelProps = {
    width: number
    height: number
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({ width, height }) => {
    const {
        localDataModel
    } = useSPAnalysis()

    const handleOpenExample = useCallback((stanie: Stanie) => () => {
        localDataModel.setStanFileContent(stanie.stan)
        localDataModel.setDataFileContent(JSON.stringify(stanie.data, null, 2))
        localDataModel.setSamplingOptsContent(JSON.stringify(defaultSamplingOpts, null, 2))
    }, [localDataModel])
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
                    <p>
                        This panel will have controls for loading/saving data from cloud
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LeftPanel