import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import DataFileEditor from "../../FileEditor/DataFileEditor";
import StanFileEditor from "../../FileEditor/StanFileEditor";
import RunPanel from "../../RunPanel/RunPanel";
import SamplerOutputView from "../../SamplerOutputView/SamplerOutputView";
import SamplingOptsPanel from "../../SamplingOptsPanel/SamplingOptsPanel";
import SPAnalysisContextProvider, { SPAnalysisContext } from '../../SPAnalysis/SPAnalysisContextProvider';
import { modelHasUnsavedChanges, SPAnalysisKnownFiles } from "../../SPAnalysis/SPAnalysisDataModel";
import { SamplingOpts } from "../../StanSampler/StanSampler";
import useStanSampler, { useSamplerStatus } from "../../StanSampler/useStanSampler";
import LeftPanel from "./LeftPanel";
import TopBar from "./TopBar";

type Props = {
    width: number
    height: number
}

const HomePage: FunctionComponent<Props> = ({ width, height }) => {

    // NOTE: We should probably move the SPAnalysisContextProvider up to the App or MainWindow
    // component; however this will wait on routing refactor since I don't want to add the `route`
    // item in those contexts in this PR
    return (
        <SPAnalysisContextProvider>
            <HomePageChild width={width} height={height} />
        </SPAnalysisContextProvider>
    )
}

const HomePageChild: FunctionComponent<Props> = ({ width, height }) => {
    const { data } = useContext(SPAnalysisContext)

    const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>('')

    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(determineShouldBeInitiallyCollapsed(width))
    const expandedLeftPanelWidth = determineLeftPanelWidth(width) // what the width would be if expanded
    const leftPanelWidth = leftPanelCollapsed ? 20 : expandedLeftPanelWidth // the actual width

    // We automatically collapse the panel if user has resized the window to be
    // too small but we only want to do this right when we cross the threshold,
    // not every time we resize by a pixel. Similar for expanding the panel when
    // we cross the threshold in the other direction.
    const lastShouldBeCollapsed = useRef(determineShouldBeInitiallyCollapsed(width))
    useEffect(() => {
        const shouldBeCollapsed = determineShouldBeInitiallyCollapsed(width)
        if (shouldBeCollapsed !== lastShouldBeCollapsed.current) {
            lastShouldBeCollapsed.current = shouldBeCollapsed
            setLeftPanelCollapsed(shouldBeCollapsed)
        }
    }, [width])

    const topBarHeight = 22

    useEffect(() => {
        document.title = "Stan Playground - " + data.meta.title;
    }, [data.meta.title])

    return (
        <div style={{ position: 'absolute', width, height, overflow: 'hidden' }}>
            <div className="top-bar" style={{ position: 'absolute', left: 0, top: 0, width, height: topBarHeight, overflow: 'hidden' }}>
                <TopBar
                    title = {data.meta.title}
                    width={width}
                    height={topBarHeight}
                />
            </div>
            <div className="left-panel" style={{ position: 'absolute', left: 0, top: topBarHeight + 2, width: leftPanelWidth, height: height - topBarHeight - 2, overflow: 'auto' }}>
                <LeftPanel
                    collapsed={leftPanelCollapsed}
                    onSetCollapsed={setLeftPanelCollapsed}
                    width={leftPanelWidth}
                    height={height - topBarHeight - 2}
                    hasUnsavedChanges={modelHasUnsavedChanges(data)}
                />
            </div>
            <div className="main-area" style={{ position: 'absolute', left: leftPanelWidth, top: topBarHeight + 2, width: width - leftPanelWidth, height: height - topBarHeight - 2, overflow: 'hidden' }}>
                <Splitter
                    width={width - leftPanelWidth}
                    height={height - topBarHeight - 2}
                    direction="horizontal"
                    initialPosition={Math.min(800, (width - leftPanelWidth) / 2)}
                >
                    <LeftView
                        width={0}
                        height={0}
                        setCompiledMainJsUrl={setCompiledMainJsUrl}
                    />
                    <RightView
                        width={0}
                        height={0}
                        compiledMainJsUrl={compiledMainJsUrl}
                    />
                </Splitter>
            </div>
        </div>
    )
}

// the width of the left panel when it is expanded based on the overall width
const determineLeftPanelWidth = (width: number) => {
    const minWidth = 150
    const maxWidth = 250
    return Math.min(maxWidth, Math.max(minWidth, width / 4))
}

// whether the left panel should be collapsed initially based on the overall
// width
const determineShouldBeInitiallyCollapsed = (width: number) => {
    return width < 800
}

type LeftViewProps = {
    width: number
    height: number
    setCompiledMainJsUrl: (url: string) => void
}

const LeftView: FunctionComponent<LeftViewProps> = ({ width, height, setCompiledMainJsUrl }) => {
    const { data, update } = useContext(SPAnalysisContext)
    return (
        <Splitter
            direction="vertical"
            width={width}
            height={height}
            initialPosition={2 * height / 3}
        >
            <StanFileEditor
                width={0}
                height={0}
                fileName="main.stan"
                fileContent={data.stanFileContent}
                // this could be made more ergonomic?
                onSaveContent={() => update({ type: 'commitFile', filename: SPAnalysisKnownFiles.STANFILE })}
                editedFileContent={data.ephemera.stanFileContent}
                setEditedFileContent={(content: string) => update({ type: 'editFile', content, filename: SPAnalysisKnownFiles.STANFILE })}
                readOnly={false}
                setCompiledUrl={setCompiledMainJsUrl}
            />
            <DataFileEditor
                width={0}
                height={0}
                fileName="data.json"
                fileContent={data.dataFileContent}
                onSaveContent={() => update({ type: 'commitFile', filename: SPAnalysisKnownFiles.DATAFILE })}
                editedFileContent={data.ephemera.dataFileContent}
                setEditedFileContent={(content: string) => update({ type: 'editFile', content, filename: SPAnalysisKnownFiles.DATAFILE })}
                readOnly={false}
            />
        </Splitter>
    )
}

type RightViewProps = {
    width: number
    height: number
    compiledMainJsUrl?: string
}

const RightView: FunctionComponent<RightViewProps> = ({ width, height, compiledMainJsUrl }) => {
    const { data, update } = useContext(SPAnalysisContext)
    const dataIsSaved = data.dataFileContent === data.ephemera.dataFileContent
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(data.dataFileContent)
        }
        catch (e) {
            return undefined
        }
    }, [data.dataFileContent])
    const samplingOptsPanelHeight = 160
    const samplingOptsPanelWidth = Math.min(180, width / 2)

    const setSamplingOpts = useCallback((opts: SamplingOpts) => {
        update({ type: 'setSamplingOpts', opts })
    }, [update])

    const { sampler } = useStanSampler(compiledMainJsUrl)
    const { status: samplerStatus } = useSamplerStatus(sampler)
    const isSampling = samplerStatus === 'sampling'
    return (
        <div style={{ position: 'absolute', width, height }}>
            <div style={{ position: 'absolute', width: samplingOptsPanelWidth, height: samplingOptsPanelHeight }}>
                <SamplingOptsPanel
                    samplingOpts={data.samplingOpts}
                    setSamplingOpts={!isSampling ? setSamplingOpts : undefined}
                />
            </div>
            <div style={{ position: 'absolute', left: samplingOptsPanelWidth, width: width - samplingOptsPanelWidth, top: 0, height: samplingOptsPanelHeight }}>
                <RunPanel
                    width={width}
                    height={samplingOptsPanelHeight}
                    sampler={sampler}
                    data={parsedData}
                    dataIsSaved={dataIsSaved}
                    samplingOpts={data.samplingOpts}
                />
            </div>
            <div style={{ position: 'absolute', width, top: samplingOptsPanelHeight, height: height - samplingOptsPanelHeight }}>
                {sampler && <SamplerOutputView
                    width={width}
                    height={height - samplingOptsPanelHeight}
                    sampler={sampler}
                />
                }
            </div>
        </div>
    )
}

export default HomePage
