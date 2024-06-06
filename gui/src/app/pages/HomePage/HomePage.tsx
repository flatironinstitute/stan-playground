import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import DataFileEditor from "../../FileEditor/DataFileEditor";
import StanFileEditor from "../../FileEditor/StanFileEditor";
import RunPanel from "../../RunPanel/RunPanel";
import SamplerOutputView from "../../SamplerOutputView/SamplerOutputView";
import SamplingOptsPanel from "../../SamplingOptsPanel/SamplingOptsPanel";
import { SamplingOpts, defaultSamplingOpts } from "../../StanSampler/StanSampler";
import useStanSampler, { useSamplerStatus } from "../../StanSampler/useStanSampler";
import useRoute from "../../useRoute";
import SetupSPAnalysis from "../../SPAnalysis/SetupSPAnalysis";
import { useSPAnalysis } from "../../SPAnalysis/SPAnalysisContext";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";

type Props = {
    width: number
    height: number
}

const HomePage: FunctionComponent<Props> = ({ width, height }) => {
    const { route } = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    return (
        <SetupSPAnalysis
            key={route.sourceDataUri || ''} // force complete re-render when sourceDataUri changes
            sourceDataUri={route.sourceDataUri}
        >
            <HomePageChild width={width} height={height} />
        </SetupSPAnalysis>
    )
}

const HomePageChild: FunctionComponent<Props> = ({ width, height }) => {
    const { route, setRoute } = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    const { localDataModel } = useSPAnalysis()


    const stanFileContent = useMemo(() => (
        localDataModel?.stanFileContent || ''
    ), [localDataModel])

    const saveStanFileContent = useCallback((text: string) => {
        localDataModel?.setStanFileContent(text)
    }, [localDataModel])

    const [editedStanFileContent, setEditedStanFileContent] = useState('')
    useEffect(() => {
        setEditedStanFileContent(stanFileContent)
    }, [stanFileContent])

    const dataFileContent = useMemo(() => (
        localDataModel?.dataFileContent || ''
    ), [localDataModel])
    const saveDataFileContent = useCallback((text: string) => {
        localDataModel?.setDataFileContent(text)
    }, [localDataModel])
    const [editedDataFileContent, setEditedDataFileContent] = useState('')
    useEffect(() => {
        setEditedDataFileContent(dataFileContent)
    }, [dataFileContent])

    const samplingOptsContent = useMemo(() => (
        localDataModel?.samplingOptsContent || JSON.stringify(defaultSamplingOpts, null, 2)
    ), [localDataModel])
    const setSamplingOptsContent = useCallback((text: string) => {
        localDataModel?.setSamplingOptsContent(text)
    }, [localDataModel])
    const samplingOpts = useMemo(() => (
        { ...defaultSamplingOpts, ...JSON.parse(samplingOptsContent) }
    ), [samplingOptsContent])
    const setSamplingOpts = useCallback((opts: SamplingOpts) => {
        setSamplingOptsContent(JSON.stringify(opts, null, 2))
    }, [setSamplingOptsContent])

    const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>('')

    const leftPanelWidth = Math.max(250, Math.min(340, width * 0.2))
    const topBarHeight = 25

    useEffect(() => {
        // update the title in the route
        if (!localDataModel) return
        const newRoute = { ...route, title: localDataModel.title }
        setRoute(newRoute, true)
    }, [localDataModel.title, route, setRoute])

    useEffect(() => {
        // update the document title based on the route
        if (!route.title) {
            document.title = 'stan-playground'
        }
        else {
            document.title = route.title
        }
    }, [route.title])

    return (
        <div style={{ position: 'absolute', width, height, overflow: 'hidden' }}>
            <div className="top-bar" style={{ position: 'absolute', left: 0, top: 0, width, height: topBarHeight, overflow: 'hidden' }}>
                <TopBar
                    width={width}
                    height={topBarHeight}
                />
            </div>
            <div className="left-panel" style={{ position: 'absolute', left: 0, top: topBarHeight + 2, width: leftPanelWidth, height: height - topBarHeight - 2, overflow: 'auto' }}>
                <LeftPanel
                    width={leftPanelWidth}
                    height={height - topBarHeight - 2}
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
                        fileContent={stanFileContent}
                        onSaveContent={saveStanFileContent}
                        editedFileContent={editedStanFileContent}
                        setEditedFileContent={setEditedStanFileContent}
                        readOnly={false}
                        setCompiledUrl={setCompiledMainJsUrl}
                    />
                    <RightView
                        width={0}
                        height={0}
                        dataFileContent={dataFileContent}
                        saveDataFileContent={saveDataFileContent}
                        editedDataFileContent={editedDataFileContent}
                        setEditedDataFileContent={setEditedDataFileContent}
                        compiledMainJsUrl={compiledMainJsUrl}
                        samplingOpts={samplingOpts}
                        setSamplingOpts={setSamplingOpts}
                    />
                </Splitter>
            </div>
        </div>
    )
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
