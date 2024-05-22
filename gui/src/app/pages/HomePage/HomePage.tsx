import { Hyperlink } from "@fi-sci/misc";
import { Splitter } from "@fi-sci/splitter";
import { FunctionComponent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import DataJsonFileEditor from "../../FileEditor/DataJsonFileEditor";
import StanFileEditor from "../../FileEditor/StanFileEditor";
import RunPanel from "../../RunPanel/RunPanel";
import SamplerOutputView from "../../SamplerOutputView/SamplerOutputView";
import useStanSampler, { useSamplerStatus } from "../../StanSampler/useStanSampler";
import examplesStanies, { Stanie, StanieMetaData } from "../../exampleStanies/exampleStanies";
import SamplingOptsPanel from "../../SamplingOptsPanel/SamplingOptsPanel";
import { SamplingOpts, defaultSamplingOpts } from "../../StanSampler/StanSampler";
import {storeBlob, fetchBlob} from "./storeBlob";
import { SharedUrlHistory, SharedUrlHistoryReducer } from "./sharedUrlHistory";
import TabWidget from "../../TabWidget/TabWidget";
import DataPyFileEditor from "../../FileEditor/DataPyFileEditor";

const queryParams = new URLSearchParams(window.location.search)
const q = {
    stan: queryParams.get('stan'),
    data: queryParams.get('data'),
    dataPy: queryParams.get('dataPy'),
    sopts: queryParams.get('sopts'),
    title: queryParams.get('title')
}

const doLoadFromQuery = q.stan && q.data && q.sopts && q.title

type Props = {
    width: number
    height: number
}

const defaultStanContent = ''
const defaultDataJsonContent = ''
const defaultDataPyContent = ''
const defaultMetaContent = '{"title": "Untitled"}'
const defaultSamplingOptsContent = JSON.stringify(defaultSamplingOpts)

let initialStanFileContent = localStorage.getItem('main.stan') || defaultStanContent
let initialDataJsonFileContent = localStorage.getItem('data.json') || defaultDataJsonContent
let initialDataPyFileContent = localStorage.getItem('data.py') || defaultDataPyContent
let initialMetaContent = localStorage.getItem('meta.json') || defaultMetaContent
let initialSamplingOptsContent = localStorage.getItem('samplingOpts.json') || defaultSamplingOptsContent

if (doLoadFromQuery) {
    initialStanFileContent = ''
    initialDataJsonFileContent = '{}'
    initialDataPyFileContent = ''
    initialMetaContent = '{}'
    initialSamplingOptsContent = '{}'
}

const safeJsonParse = (s: string | null) => {
    try {
        return JSON.parse(s || '')
    }
    catch (e) {
        return null
    }
}
const initialSharedUrlHistory = safeJsonParse(localStorage.getItem('sharedUrlHistory')) || []

const HomePage: FunctionComponent<Props> = ({ width, height }) => {
    const [stanFileContent, saveStanFileContent] = useState(initialStanFileContent)
    const [editedStanFileContent, setEditedStanFileContent] = useState('')
    useEffect(() => {
        setEditedStanFileContent(stanFileContent)
    }, [stanFileContent])
    useEffect(() => {
        localStorage.setItem('main.stan', stanFileContent)
    }, [stanFileContent])

    const [dataJsonFileContent, saveDataJsonFileContent] = useState(initialDataJsonFileContent)
    const [editedDataJsonFileContent, setEditedDataJsonFileContent] = useState('')
    useEffect(() => {
        setEditedDataJsonFileContent(dataJsonFileContent)
    }, [dataJsonFileContent])
    useEffect(() => {
        localStorage.setItem('data.json', dataJsonFileContent)
    }, [dataJsonFileContent])

    const [dataPyFileContent, saveDataPyFileContent] = useState(initialDataPyFileContent)
    useEffect(() => {
        localStorage.setItem('data.py', dataPyFileContent)
    }, [dataPyFileContent])

    const [samplingOptsContent, setSamplingOptsContent] = useState(initialSamplingOptsContent)
    useEffect(() => {
        localStorage.setItem('samplingOpts.json', samplingOptsContent)
    }, [samplingOptsContent])
    const samplingOpts = useMemo(() => (
        {...defaultSamplingOpts, ...JSON.parse(samplingOptsContent)}
    ), [samplingOptsContent])

    const setSamplingOpts = useCallback((opts: SamplingOpts) => {
        setSamplingOptsContent(JSON.stringify(opts, null, 2))
    }, [setSamplingOptsContent])

    const [metaContent, setMetaContent] = useState(initialMetaContent)
    useEffect(() => {
        localStorage.setItem('meta.json', metaContent)
    }, [metaContent])

    useEffect(() => {
        if (!doLoadFromQuery) return
        const urlToSaveToHistory = window.location.href
        ; (async () => {
            try {
                const stan = await fetchBlob('stan', q.stan || '')
                const dataJson = await fetchBlob('data.json', q.data || '')
                const dataPy = q.dataPy ? await fetchBlob('data.py', q.dataPy || '') : undefined
                const sopts = await fetchBlob('opts.json', q.sopts || '')
                saveStanFileContent(stan)
                saveDataJsonFileContent(dataJson)
                saveDataPyFileContent(dataPy || '')
                setSamplingOptsContent(sopts)
                setMetaContent(JSON.stringify({ title: q.title || '' }, null, 2))
                // after we have done this, let's remove they query part of the url
                window.history.replaceState({}, document.title, window.location.pathname)
                // and save this to the shared url history
                const title = q.title || 'Untitled'
                sharedUrlHistoryDispatch({type: 'add', url: urlToSaveToHistory, title})
            }
            catch (err) {
                console.error(err)
                alert('Problem loading from query.')
            }
        })()
    }, [])

    const doNotSaveOnUnload = useRef<boolean>(false)
    useEffect(() => {
        // if the user reloads the page, then we want
        // to save the current state of the editor in local storage
        // because this may have been overwritten in a different
        // tab, and the user would expect to see the same content
        // upon reload
        const handleBeforeUnload = () => {
            if (doNotSaveOnUnload.current) {
                return
            }
            localStorage.setItem('main.stan', stanFileContent);
            localStorage.setItem('data.json', dataJsonFileContent);
            localStorage.setItem('data.py', dataPyFileContent);
            localStorage.setItem('meta.json', metaContent);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [stanFileContent, dataJsonFileContent, dataPyFileContent, metaContent, doNotSaveOnUnload]);

    const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<string>('')

    const leftPanelWidth = width > 400 ? 200 : 0

    const handleLoadStanie = useCallback((stanie: Stanie) => {
        saveStanFileContent(stanie.stan)
        saveDataJsonFileContent(stringifyData(stanie.data))
        saveDataPyFileContent(stanie.dataPy)
        setMetaContent(JSON.stringify(stanie.meta, null, 2))
    }, [saveStanFileContent, saveDataJsonFileContent, setMetaContent])

    const handleClearBrowserData = useCallback(() => {
        const confirmed = window.confirm('Are you sure you want to clear all browser data?')
        if (!confirmed) {
            return
        }
        localStorage.clear()
        doNotSaveOnUnload.current = true
        window.location.reload()
    }, [])

    const [sharedUrlHistory, sharedUrlHistoryDispatch] = useReducer(SharedUrlHistoryReducer, initialSharedUrlHistory)
    useEffect(() => {
        localStorage.setItem('sharedUrlHistory', JSON.stringify(sharedUrlHistory))
    }, [sharedUrlHistory])

    const generateShareableUrl = useMemo(() => (async (o: {title: string}) => {
        const stanSha1 = await storeBlob('stan', stanFileContent)
        const dataSha1 = await storeBlob('data.json', dataJsonFileContent)
        const dataPySha1 = dataPyFileContent ? await storeBlob('data.py', dataPyFileContent) : ''
        const samplingOptsSha1 = await storeBlob('opts.json', samplingOptsContent)
        const {title} = o
        // need to url encode title
        const titleEncoded = encodeURIComponent(title)
        const a = window.location.href.split('?')[0]
        let url = `${a}?stan=${stanSha1}&data=${dataSha1}&sopts=${samplingOptsSha1}&title=${titleEncoded}`
        if (dataPySha1) {
            url = `${url}&dataPy=${dataPySha1}`
        }
        sharedUrlHistoryDispatch({type: 'add', url, title})
        return url
    }), [stanFileContent, dataJsonFileContent, dataPyFileContent, samplingOptsContent])

    return (
        <div style={{ position: 'absolute', width, height }}>
            <div style={{ width: leftPanelWidth, height, position: 'absolute' }}>
                <LeftPanel
                    width={leftPanelWidth}
                    height={height}
                    metaContent={metaContent}
                    setMetaContent={setMetaContent}
                    onLoadStanie={handleLoadStanie}
                    onClearBrowserData={handleClearBrowserData}
                    generateShareableUrl={generateShareableUrl}
                    sharedUrlHistory={sharedUrlHistory}
                />
            </div>
            <div style={{ position: 'absolute', left: leftPanelWidth, width: width - leftPanelWidth, height }}>
                <Splitter
                    width={width - leftPanelWidth}
                    height={height}
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
                        dataJsonFileContent={dataJsonFileContent}
                        saveDataJsonFileContent={saveDataJsonFileContent}
                        editedDataJsonFileContent={editedDataJsonFileContent}
                        setEditedDataJsonFileContent={setEditedDataJsonFileContent}
                        dataPyFileContent={dataPyFileContent}
                        saveDataPyFileContent={saveDataPyFileContent}
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
    dataJsonFileContent: string
    saveDataJsonFileContent: (text: string) => void
    editedDataJsonFileContent: string
    setEditedDataJsonFileContent: (text: string) => void
    dataPyFileContent: string
    saveDataPyFileContent: (text: string) => void
    compiledMainJsUrl?: string
    samplingOpts: SamplingOpts
    setSamplingOpts: (opts: SamplingOpts) => void
}

const dataTabs = [
    {
        id: 'data.json',
        label: 'data.json',
        closeable: false
    },
    {
        id: 'data.py',
        label: 'data.py',
        closeable: false
    }
]

const RightView: FunctionComponent<RightViewProps> = ({ width, height, dataJsonFileContent, saveDataJsonFileContent, editedDataJsonFileContent, setEditedDataJsonFileContent, dataPyFileContent, saveDataPyFileContent, compiledMainJsUrl, samplingOpts, setSamplingOpts }) => {
    const [currentDataTabId, setCurrentDataTabId] = useState<'data.json' | 'data.py'>('data.json')
    const [editedDataPyFileContent, setEditedDataPyFileContent] = useState(dataPyFileContent)
    useEffect(() => {
        setEditedDataPyFileContent(dataPyFileContent)
    }, [dataPyFileContent])
    const handleSetData = useCallback((data: any) => {
        saveDataJsonFileContent(stringifyData(data))
    }, [saveDataJsonFileContent])
    return (
        <Splitter
            direction="vertical"
            width={width}
            height={height}
            initialPosition={height / 3}
        >
            <TabWidget
                tabs={dataTabs}
                width={0}
                height={0}
                currentTabId={currentDataTabId}
                setCurrentTabId={id => setCurrentDataTabId(id as 'data.json' | 'data.py')}
            >
                <DataJsonFileEditor
                    width={0}
                    height={0}
                    fileName="data.json"
                    fileContent={dataJsonFileContent}
                    onSaveContent={saveDataJsonFileContent}
                    editedFileContent={editedDataJsonFileContent}
                    setEditedFileContent={setEditedDataJsonFileContent}
                    readOnly={false}
                />
                <DataPyFileEditor
                    width={0}
                    height={0}
                    fileName="data.py"
                    fileContent={dataPyFileContent}
                    onSaveContent={saveDataPyFileContent}
                    editedFileContent={editedDataPyFileContent}
                    setEditedFileContent={setEditedDataPyFileContent}
                    setData={handleSetData}
                    readOnly={false}
                />
            </TabWidget>
            <LowerRightView
                width={0}
                height={0}
                compiledMainJsUrl={compiledMainJsUrl}
                dataJsonFileContent={dataJsonFileContent}
                dataIsSaved={dataJsonFileContent === editedDataJsonFileContent}
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
    dataJsonFileContent: string
    dataIsSaved: boolean
    samplingOpts: SamplingOpts
    setSamplingOpts: (opts: SamplingOpts) => void
}

const LowerRightView: FunctionComponent<LowerRightViewProps> = ({ width, height, compiledMainJsUrl, dataJsonFileContent, dataIsSaved, samplingOpts, setSamplingOpts }) => {
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(dataJsonFileContent)
        }
        catch (e) {
            return undefined
        }
    }, [dataJsonFileContent])
    const samplingOptsPanelHeight = 160
    const samplingOptsPanelWidth = Math.min(180, width / 2)

    const {sampler} = useStanSampler(compiledMainJsUrl)
    const {status: samplerStatus} = useSamplerStatus(sampler)
    const isSampling = samplerStatus === 'sampling'
    return (
        <div style={{position: 'absolute', width, height}}>
            <div style={{position: 'absolute', width: samplingOptsPanelWidth, height: samplingOptsPanelHeight}}>
                <SamplingOptsPanel
                    samplingOpts={samplingOpts}
                    setSamplingOpts={!isSampling ? setSamplingOpts: undefined}
                />
            </div>
            <div style={{position: 'absolute', left: samplingOptsPanelWidth, width: width - samplingOptsPanelWidth, top: 0, height: samplingOptsPanelHeight}}>
                <RunPanel
                    width={width}
                    height={samplingOptsPanelHeight}
                    sampler={sampler}
                    data={parsedData}
                    dataIsSaved={dataIsSaved}
                    samplingOpts={samplingOpts}
                />
            </div>
            <div style={{position: 'absolute', width, top: samplingOptsPanelHeight, height: height - samplingOptsPanelHeight}}>
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

type LeftPanelProps = {
    width: number
    height: number
    metaContent: string
    setMetaContent: (text: string) => void
    onLoadStanie: (stanie: Stanie) => void
    onClearBrowserData: () => void
    generateShareableUrl: (o: {title: string}) => Promise<string>
    sharedUrlHistory: SharedUrlHistory
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({ width, height, metaContent, setMetaContent, onLoadStanie, onClearBrowserData, generateShareableUrl, sharedUrlHistory }) => {
    const metaData = useMemo(() => {
        try {
            const x = JSON.parse(metaContent) as StanieMetaData
            return {
                title: x.title || undefined
            }
        }
        catch (e) {
            return {}
        }
    }, [metaContent])

    const updateTitle = useCallback((title: string) => {
        setMetaContent(JSON.stringify({
            ...metaData,
            title
        }))
    }, [metaData, setMetaContent])

    const [isPreparingShareableUrl, setIsPreparingShareableUrl] = useState(false)
    const [shareableUrl, setShareableUrl] = useState<string | undefined>(undefined)
    const handleShare = useCallback(async () => {
        const title = metaData.title || 'Untitled'
        const newTitle = window.prompt('Enter a title for the shared analysis:', title)
        if (!newTitle) return
        updateTitle(newTitle)
        setIsPreparingShareableUrl(true)
        try {
            setShareableUrl(undefined)
            // need to pass the newTitle because the updateTitle has not taken effect
            // for this version of the generateShareableUrl function
            const url = await generateShareableUrl({title: newTitle})
            setShareableUrl(url)
        }
        catch (err) {
            console.error(err)
            alert('Problem generating shareable URL.')
        }
        finally {
            setIsPreparingShareableUrl(false)
        }
    }, [generateShareableUrl, metaData.title, updateTitle])

    return (
        <div style={{ width, height, backgroundColor: '#333', color: '#ccc' }}>
            <div>&nbsp;</div>
            <div style={{ position: 'relative', left: 10, width: width - 20 }}>
                <strong>Title:</strong>
            </div>
            <div style={{ height: 7 }}>&nbsp;</div>
            <div style={{ position: 'relative', left: 10, width: width - 20 }}>
                <input
                    style={{ width: width - 40, fontSize: 16, backgroundColor: '#444', color: '#ccc', padding: 5, border: 'none' }}
                    type="text"
                    value={metaData.title || ''}
                    onChange={(e) => updateTitle(e.target.value)}
                />
            </div>
            <hr />
            <div style={{ position: 'relative', left: 10, width: width - 20 }}>
                <strong>Examples</strong>
                <div style={{ height: 7 }}>&nbsp;</div>
                {
                    examplesStanies.map((stanie, i) => {
                        return (
                            <div key={i}>
                                <Hyperlink color="lightblue" onClick={() => onLoadStanie(stanie)}>
                                    {stanie.meta.title}
                                </Hyperlink>
                            </div>
                        )
                    })
                }
            </div>
            <hr />
            <div style={{ position: 'relative', left: 10, width: width - 20 }}>
                <Hyperlink onClick={handleShare} color="lightblue">Share</Hyperlink>
            </div>
            {
                isPreparingShareableUrl && (
                    <div style={{ position: 'relative', left: 10, width: width - 20 }}>
                        Preparing shareable URL...
                    </div>
                )
            }
            {
                shareableUrl && (
                    <div style={{ position: 'relative', left: 10, width: width - 20 }}>
                        <CopyableTextField text={shareableUrl} />
                    </div>
                )
            }
            <hr />
            <div style={{ position: 'relative', left: 10, width: width - 20, height: 200, overflowY: 'auto' }}>
                <SharedUrlHistoryView
                    width={width - 20}
                    sharedUrlHistory={sharedUrlHistory}
                />
            </div>
            <hr />
            <div style={{ position: 'absolute', left: 10, width: width - 20, bottom: 10 }}>
                <Hyperlink color="#c66" onClick={onClearBrowserData}>
                    clear all browser data
                </Hyperlink>
            </div>
        </div>
    )
}

const stringifyData = (data: { [key: string]: any }) => {
    const replacer = (_key: string, value: any) => Array.isArray(value) ? JSON.stringify(value) : value;

    return JSON.stringify(data, replacer, 2)
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')
}

type CopyableTextFieldProps = {
    text: string
}

const CopyableTextField: FunctionComponent<CopyableTextFieldProps> = ({ text }) => {
    const ref = useRef<HTMLTextAreaElement>(null)
    const [copied, setCopied] = useState(false)
    const handleCopy = useCallback(() => {
        if (!ref.current) return
        ref.current.select()
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
        }, 8000)
    }, [ref])

    return (
        <div>
            <textarea
                ref={ref}
                style={{ width: '100%', height: 35, backgroundColor: '#444', color: '#ccc', padding: 5, border: 'none' }}
                value={text}
                readOnly
            />
            <div style={{ textAlign: 'right', fontSize: 12 }}>
                <Hyperlink onClick={handleCopy} color="lightblue">
                    {copied ? 'Copied!' : 'Copy'}
                </Hyperlink>
            </div>
        </div>
    )
}

type SharedUrlHistoryViewProps = {
    width: number
    sharedUrlHistory: SharedUrlHistory
}

const SharedUrlHistoryView: FunctionComponent<SharedUrlHistoryViewProps> = ({ sharedUrlHistory }) => {
    return (
        <div>
            <strong>Recent</strong>
            <div style={{ height: 7 }}>&nbsp;</div>
            {
                sharedUrlHistory.map((x, i) => {
                    return (
                        <div key={i}>
                            <Hyperlink color="lightblue" href={x.url}>
                                {x.title}
                            </Hyperlink>
                        </div>
                    )
                })
            }
        </div>
    )
}

export default HomePage
