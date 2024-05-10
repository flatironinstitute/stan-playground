import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import StanFileEditor from "../../FileEditor/StanFileEditor";
import { Splitter } from "@fi-sci/splitter";
import DataFileEditor from "../../FileEditor/DataFileEditor";
import RunPanel from "../../RunPanel/RunPanel";
import StanModel from "../../tinystan/StanModel";
import { Hyperlink } from "@fi-sci/misc";
import examplesStanies, { Stanie, StanieMetaData } from "../../exampleStanies/exampleStanies";

type Props = {
    width: number
    height: number
}

const defaultStanContent = ''
const defaultDataContent = ''
const defaultMetaContent = '{"title": "Untitled"}'

const initialFileContent = localStorage.getItem('main.stan') || defaultStanContent

const initialDataFileContent = localStorage.getItem('data.json') || defaultDataContent

const initialMetaContent = localStorage.getItem('meta.json') || defaultMetaContent

const HomePage: FunctionComponent<Props> = ({width, height}) => {
    const [fileContent, saveFileContent] = useState(initialFileContent)
    const [editedFileContent, setEditedFileContent] = useState('')
    useEffect(() => {
        setEditedFileContent(fileContent)
    }, [fileContent])
    useEffect(() => {
        localStorage.setItem('main.stan', fileContent)
    }, [fileContent])

    const [dataFileContent, saveDataFileContent] = useState(initialDataFileContent)
    const [editedDataFileContent, setEditedDataFileContent] = useState('')
    useEffect(() => {
        setEditedDataFileContent(dataFileContent)
    }, [dataFileContent])
    useEffect(() => {
        localStorage.setItem('data.json', dataFileContent)
    }, [dataFileContent])

    const [metaContent, setMetaContent] = useState(initialMetaContent)
    useEffect(() => {
        localStorage.setItem('meta.json', metaContent)
    }, [metaContent])

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
            localStorage.setItem('main.stan', fileContent);
            localStorage.setItem('data.json', dataFileContent);
            localStorage.setItem('meta.json', metaContent);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [fileContent, dataFileContent, metaContent, doNotSaveOnUnload]);

    const [stanModel, setStanModel] = useState<StanModel | undefined>(undefined)

    const leftPanelWidth = width > 400 ? 200 : 0

    const handleLoadStanie = useCallback((stanie: Stanie) => {
        saveFileContent(stanie.stan)
        saveDataFileContent(JSON.stringify(stanie.data, null, 2))
        setMetaContent(JSON.stringify(stanie.meta, null, 2))
    }, [saveFileContent, saveDataFileContent, setMetaContent])

    const handleClearBrowserData = useCallback(() => {
        const confirmed = window.confirm('Are you sure you want to clear all browser data?')
        if (!confirmed) {
            return
        }
        localStorage.clear()
        doNotSaveOnUnload.current = true
        window.location.reload()
    }, [])

    return (
        <div style={{position: 'absolute', width, height}}>
            <div style={{width: leftPanelWidth, height, position: 'absolute'}}>
                <LeftPanel
                    width={leftPanelWidth}
                    height={height}
                    metaContent={metaContent}
                    setMetaContent={setMetaContent}
                    onLoadStanie={handleLoadStanie}
                    onClearBrowserData={handleClearBrowserData}
                />
            </div>
            <div style={{position: 'absolute', left: leftPanelWidth, width: width - leftPanelWidth, height}}>
                <Splitter
                    width={width}
                    height={height}
                    direction="horizontal"
                    initialPosition={width / 2}
                >
                    <StanFileEditor
                        width={0}
                        height={0}
                        fileName="main.stan"
                        fileContent={fileContent}
                        onSaveContent={saveFileContent}
                        editedFileContent={editedFileContent}
                        setEditedFileContent={setEditedFileContent}
                        readOnly={false}
                        onStanModelLoaded={setStanModel}
                    />
                    <RightView
                        width={0}
                        height={0}
                        dataFileContent={dataFileContent}
                        saveDataFileContent={saveDataFileContent}
                        editedDataFileContent={editedDataFileContent}
                        setEditedDataFileContent={setEditedDataFileContent}
                        stanModel={stanModel}
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
    stanModel: StanModel | undefined
}

const RightView: FunctionComponent<RightViewProps> = ({width, height, dataFileContent, saveDataFileContent, editedDataFileContent, setEditedDataFileContent, stanModel}) => {
    const parsedData = useMemo(() => {
        try {
            return JSON.parse(dataFileContent)
        }
        catch (e) {
            return undefined
        }
    }, [dataFileContent])
    return (
        <Splitter
            direction="vertical"
            width={width}
            height={height}
            initialPosition={height / 2}
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
            <RunPanel
                width={0}
                height={0}
                stanModel={stanModel}
                data={parsedData}
                dataIsSaved={dataFileContent === editedDataFileContent}
            />
        </Splitter>
    )
}

type LeftPanelProps = {
    width: number
    height: number
    metaContent: string
    setMetaContent: (text: string) => void
    onLoadStanie: (stanie: Stanie) => void
    onClearBrowserData: () => void
}

const LeftPanel: FunctionComponent<LeftPanelProps> = ({width, height, metaContent, setMetaContent, onLoadStanie, onClearBrowserData}) => {
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
    return (
        <div style={{width, height, backgroundColor: '#333', color: '#ccc'}}>
            <div>&nbsp;</div>
            <div style={{position: 'relative', left: 10, width: width - 20}}>
                <strong>Title:</strong>
            </div>
            <div style={{height: 7}}>&nbsp;</div>
            <div style={{position: 'relative', left: 10, width: width - 20}}>
                <input
                    style={{width: width - 40, fontSize: 16, backgroundColor: '#444', color: '#ccc', padding: 5, border: 'none'}}
                    type="text"
                    value={metaData.title || ''}
                    onChange={(e) => updateTitle(e.target.value)}
                />
            </div>
            <hr />
            <div style={{position: 'relative', left: 10, width: width - 20}}>
                <strong>Examples</strong>
                <div style={{height: 7}}>&nbsp;</div>
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
            <div style={{position: 'relative', height: 30}} />
            <div style={{position: 'absolute', left: 10, width: width - 20, bottom: 10}}>
                <Hyperlink color="#c66" onClick={onClearBrowserData}>
                    clear all browser data
                </Hyperlink>
            </div>
        </div>
    )
}

export default HomePage