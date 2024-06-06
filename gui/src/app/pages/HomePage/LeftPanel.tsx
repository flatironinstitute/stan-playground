import { FunctionComponent, useCallback, useMemo } from "react"
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
                    <LocalChangesView />
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

const LocalChangesView: FunctionComponent = () => {
    const { localAnalysisFiles, sourceAnalysisFiles } = useSPAnalysis()
    const { modifiedFileNames, addedFileNames, deletedFileNames } = useMemo(() => {
        const modifiedFileNames = Object.keys(localAnalysisFiles).filter(key => key in sourceAnalysisFiles).filter(key => sourceAnalysisFiles[key] !== localAnalysisFiles[key])
        const addedFileNames = Object.keys(localAnalysisFiles).filter(key => !(key in sourceAnalysisFiles))
        const deletedFileNames = Object.keys(sourceAnalysisFiles).filter(key => !(key in localAnalysisFiles))
        return {
            modifiedFileNames,
            addedFileNames,
            deletedFileNames
        }
    }, [localAnalysisFiles, sourceAnalysisFiles])
    const hasChanges = modifiedFileNames.length > 0 || addedFileNames.length > 0 || deletedFileNames.length > 0
    if (!hasChanges) return <div />
    return (
        <div>
            <h3>Local changes</h3>
            <ul>
                {
                    addedFileNames.map((fname, ii) => (
                        <li key={ii}>
                            {fname} - added
                        </li>
                    ))
                }
                {
                    deletedFileNames.map((fname, ii) => (
                        <li key={ii}>
                            {fname} - removed
                        </li>
                    ))
                }
                {
                    modifiedFileNames.map((fname, ii) => (
                        <li key={ii}>
                            {fname} - modified
                        </li>
                    ))
                }
            </ul>
        </div>
    )
}

export default LeftPanel