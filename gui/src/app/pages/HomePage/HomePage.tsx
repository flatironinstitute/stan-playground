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
    const { data, update } = useContext(SPAnalysisContext)
    const setSamplingOpts = useCallback((opts: SamplingOpts) => {
        update({ type: 'setSamplingOpts', opts })
    }, [update])

    const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>('')

    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(determineShouldBeInitiallyCollapsed(width))
    const expandedLeftPanelWidth = determineLeftPanelWidth(width) // what the width would be if expanded
    const leftPanelWidth = leftPanelCollapsed ? 20 : expandedLeftPanelWidth // the actual width

    // We automatically collapse the panel if user has resized the window to be
    // too small but we only want to do this right when we cross the threshold,
    // not every time we resize by a pixel. Similar for expanding the panel when
    // we cross the threshold in the other direction.
    const lastWidth = useRef(width)
    useEffect(() => {
        if (!determineShouldBeInitiallyCollapsed(lastWidth.current) && determineShouldBeInitiallyCollapsed(width)) {
            lastWidth.current = width
            setLeftPanelCollapsed(true)
        }
        else if (determineShouldBeInitiallyCollapsed(lastWidth.current) && !determineShouldBeInitiallyCollapsed(width)) {
            lastWidth.current = width
            setLeftPanelCollapsed(false)
        }
    }, [width])

    const topBarHeight = 25

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
                    <RightView
                        width={0}
                        height={0}
                        dataFileContent={data.dataFileContent}
                        // this could be more ergonomic?
                        saveDataFileContent={() => update({ type: 'commitFile', filename: SPAnalysisKnownFiles.DATAFILE })}
                        editedDataFileContent={data.ephemera.dataFileContent}
                        setEditedDataFileContent={(content: string) => update({ type: 'editFile', content, filename: SPAnalysisKnownFiles.DATAFILE })}
                        compiledMainJsUrl={compiledMainJsUrl}
                        samplingOpts={data.samplingOpts}
                        setSamplingOpts={setSamplingOpts}
                    />
                </Splitter>
            </div>
        </div>
    )
}

// the width of the left panel when it is expanded based on the overall width
const determineLeftPanelWidth = (width: number) => {
    const minWidth = 250
    const maxWidth = 500
    return Math.min(maxWidth, Math.max(minWidth, width / 4))
}

// whether the left panel should be collapsed initially based on the overall
// width
const determineShouldBeInitiallyCollapsed = (width: number) => {
    return width < 800
}

type RightViewProps = {
    width: number
    height: number
    dataFileContent: string
    saveDataFileContent: (text: string) => void
    editedDataFileContent: string
    setEditedDataFileContent: (text: string) => void
    compiledMainJsUrl?: string
    samplingOpts: SamplingOpts
    setSamplingOpts: (opts: SamplingOpts) => void
}

const RightView: FunctionComponent<RightViewProps> = ({ width, height, dataFileContent, saveDataFileContent, editedDataFileContent, setEditedDataFileContent, compiledMainJsUrl, samplingOpts, setSamplingOpts }) => {
    return (
        <Splitter
            direction="vertical"
            width={width}
            height={height}
            initialPosition={height / 3}
        >
            <DataFileEditor
                width={0}
                height={0}
                fileName="data.json"
                fileContent={dataFileContent}
                onSaveContent={saveDataFileContent}
                editedFileContent={editedDataFileContent}
                setEditedFileContent={setEditedDataFileContent}
                readOnly={false}
            />
            <LowerRightView
                width={0}
                height={0}
                compiledMainJsUrl={compiledMainJsUrl}
                dataFileContent={dataFileContent}
                dataIsSaved={dataFileContent === editedDataFileContent}
                samplingOpts={samplingOpts}
                setSamplingOpts={setSamplingOpts}
            />
        </Splitter>
    )
}

type LowerRightViewProps = {
    width: number
    height: number
    compiledMainJsUrl?: string
    dataFileContent: string
    dataIsSaved: boolean
    samplingOpts: SamplingOpts
    setSamplingOpts: (opts: SamplingOpts) => void
}

const LowerRightView: FunctionComponent<LowerRightViewProps> = ({ width, height, compiledMainJsUrl, dataFileContent, dataIsSaved, samplingOpts, setSamplingOpts }) => {
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(dataFileContent)
        }
        catch (e) {
            return undefined
        }
    }, [dataFileContent])
    const samplingOptsPanelHeight = 160
    const samplingOptsPanelWidth = Math.min(180, width / 2)

    const { sampler } = useStanSampler(compiledMainJsUrl)
    const { status: samplerStatus } = useSamplerStatus(sampler)
    const isSampling = samplerStatus === 'sampling'
    return (
        <div style={{ position: 'absolute', width, height }}>
            <div style={{ position: 'absolute', width: samplingOptsPanelWidth, height: samplingOptsPanelHeight }}>
                <SamplingOptsPanel
                    samplingOpts={samplingOpts}
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
                    samplingOpts={samplingOpts}
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
