import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import DataFileEditor from "../../FileEditor/DataFileEditor";
import StanFileEditor from "../../FileEditor/StanFileEditor";
import { useJpfiddle } from "../../FromJpfiddle/JpfiddleContext/JpfiddleContext";
import SetupJpfiddle from "../../FromJpfiddle/JpfiddleContext/SetupJpfiddle";
import RunPanel from "../../RunPanel/RunPanel";
import SamplerOutputView from "../../SamplerOutputView/SamplerOutputView";
import SamplingOptsPanel from "../../SamplingOptsPanel/SamplingOptsPanel";
import { SamplingOpts, defaultSamplingOpts } from "../../StanSampler/StanSampler";
import useStanSampler, { useSamplerStatus } from "../../StanSampler/useStanSampler";
import useRoute from "../../useRoute";
import LeftPanel from "../../FromJpfiddle/LeftPanel";
import TopBar from "./TopBar";
import ReferenceFileSystemClient from "../../FromJpfiddle/ReferenceFileSystemClient";

type Props = {
    width: number
    height: number
}

const defaultStanContent = ''
const defaultDataContent = ''
const defaultSamplingOptsContent = JSON.stringify(defaultSamplingOpts)

const examples: { title: string, uri: string }[] = [
    {
        title: 'Linear regression',
        uri: 'https://gist.github.com/magland/da3d4143276827609ec9317bb3db8b04'
    },
    {
        title: 'Disease transmission',
        uri: 'https://gist.github.com/magland/d5bc7d37561539dca14256061c829cc9'
    }
]

const HomePage: FunctionComponent<Props> = ({ width, height }) => {
    const { route } = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    return (
        <SetupJpfiddle
            key={route.fiddleUri || ''} // force complete re-render when fiddleUri changes
            fiddleUri={route.fiddleUri || ''}
            apiBaseUrl="https://jpfiddle.vercel.app"
            useLocalStorageForLocalFiles={true}
            titleFromUrl={route.title}
        >
            <HomePageChild width={width} height={height} />
        </SetupJpfiddle>
    )
}

const HomePageChild: FunctionComponent<Props> = ({ width, height }) => {
    const { route, setRoute } = useRoute()
    if (route.page !== 'home') {
        throw Error('Unexpected route')
    }
    const { fiddleUri, fiddleId, cloudFiddle, localFiles, initialLocalFiles, setLocalFiles, changeLocalFile, saveToCloud, saveAsGist, updateGist, saveAsGistMessage, resetFromCloud } = useJpfiddle()
    const stanFileContent = useMemo(() => (
        (localFiles || {})['main.stan'] || defaultStanContent
    ), [localFiles])

    const saveStanFileContent = useCallback((text: string) => {
        changeLocalFile('main.stan', text)
    }, [changeLocalFile])

    const [editedStanFileContent, setEditedStanFileContent] = useState('')
    useEffect(() => {
        setEditedStanFileContent(stanFileContent)
    }, [stanFileContent])

    const dataFileContent = useMemo(() => (
        (localFiles || {})['data.json'] || defaultDataContent
    ), [localFiles])
    const saveDataFileContent = useCallback((text: string) => {
        changeLocalFile('data.json', text)
    }, [changeLocalFile])
    const [editedDataFileContent, setEditedDataFileContent] = useState('')
    useEffect(() => {
        setEditedDataFileContent(dataFileContent)
    }, [dataFileContent])

    const samplingOptsContent = useMemo(() => (
        (localFiles || {})['samplingOpts.json'] || defaultSamplingOptsContent
    ), [localFiles])
    const setSamplingOptsContent = useCallback((text: string) => {
        changeLocalFile('samplingOpts.json', text)
    }, [changeLocalFile])
    const samplingOpts = useMemo(() => (
        { ...defaultSamplingOpts, ...JSON.parse(samplingOptsContent) }
    ), [samplingOptsContent])
    const setSamplingOpts = useCallback((opts: SamplingOpts) => {
        setSamplingOptsContent(JSON.stringify(opts, null, 2))
    }, [setSamplingOptsContent])

    const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>('')

    const leftPanelWidth = Math.max(250, Math.min(340, width * 0.2))
    const topBarHeight = 25

    const cloudFiddleClient = useMemo(() => {
        if (!cloudFiddle) return undefined
        return new ReferenceFileSystemClient({
            version: 0,
            refs: cloudFiddle.refs
        })
    }, [cloudFiddle])
    const [cloudFiles, setCloudFiles] = useState<{ [fileName: string]: string } | undefined>(undefined)
    useEffect(() => {
        // set the cloud files
        let canceled = false
            ; (async () => {
                if (!cloudFiddle) return
                if (!cloudFiddleClient) return
                const ff: { [fileName: string]: string } = {}
                for (const fname in cloudFiddle.refs) {
                    const buf = await cloudFiddleClient.readBinary(fname, {})
                    if (canceled) return
                    const content = new TextDecoder().decode(buf)
                    ff[fname] = content
                }
                setCloudFiles(ff)
            })()
        return () => { canceled = true }
    }, [cloudFiddle, cloudFiddleClient])

    useEffect(() => {
        let canceled = false
            ; (async () => {
                if (!initialLocalFiles) {
                    // use the cloud fiddle
                    if (!cloudFiddle) return
                    if (!cloudFiddleClient) return
                    const ff: { [fileName: string]: string } = {}
                    for (const fname in cloudFiddle.refs) {
                        const buf = await cloudFiddleClient.readBinary(fname, {})
                        if (canceled) return
                        const content = new TextDecoder().decode(buf)
                        ff[fname] = content
                    }
                    setLocalFiles(ff)
                }
                else {
                    // use the initial files
                    const ff: { [fileName: string]: string } = {}
                    for (const a of initialLocalFiles) {
                        ff[a.path] = a.content
                    }
                    setLocalFiles(ff)
                }
            })()
        return () => { canceled = true }
    }, [initialLocalFiles, cloudFiddle, cloudFiddleClient, setLocalFiles])

    useEffect(() => {
        // update the title in the route
        if (!cloudFiddle) return
        if (!cloudFiddle.jpfiddle) return
        if (!cloudFiddle.jpfiddle.title) return
        if (cloudFiddle.jpfiddle.title === route.title) return
        const newRoute = { ...route, title: cloudFiddle.jpfiddle.title }
        setRoute(newRoute, true)
    }, [cloudFiddle, route, setRoute])

    useEffect(() => {
        // update the document title based on the route
        if (!route.title) {
            document.title = 'stan-playground'
        }
        else {
            document.title = route.title
        }
    }, [route.title])

    const handleResetToCloudVersion = useCallback(async () => {
        const newFiles: {path: string, content: string | null}[] = await resetFromCloud()
        const ff: { [fileName: string]: string } = {}
        for (const a of newFiles) {
            if (a.content !== null) {
                ff[a.path] = a.content
            }
        }
        setLocalFiles(ff)
    }, [resetFromCloud, setLocalFiles])

    return (
        <div style={{ position: 'absolute', width, height, overflow: 'hidden' }}>
            <div className="jpfiddle-top-bar" style={{ position: 'absolute', left: 0, top: 0, width, height: topBarHeight, overflow: 'hidden' }}>
                <TopBar
                    width={width}
                    height={topBarHeight}
                    cloudFiddle={cloudFiddle}
                    fiddleUri={fiddleUri}
                />
            </div>
            <div className="jpfiddle-left-panel" style={{ position: 'absolute', left: 0, top: topBarHeight + 2, width: leftPanelWidth, height: height - topBarHeight - 2, overflow: 'auto' }}>
                <LeftPanel
                    width={leftPanelWidth}
                    height={height - topBarHeight - 2}
                    fiddleUri={fiddleUri}
                    fiddleId={fiddleId}
                    cloudFiddle={cloudFiddle}
                    cloudFiles={cloudFiles}
                    localEditedFiles={localFiles || undefined}
                    onSaveChangesToCloud={saveToCloud}
                    onSaveAsGist={saveAsGist}
                    onUpdateGist={updateGist}
                    saveAsGistMessage={saveAsGistMessage}
                    onResetToCloudVersion={handleResetToCloudVersion}
                    loadFilesStatus="loaded"
                    alternateFiddleWord="analysis"
                    jupyterSelectionType={undefined}
                    showNotesAboutJpfiddle={false}
                    showJupyterSelector={false}
                    examples={examples}
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
