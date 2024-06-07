import { Splitter } from '@fi-sci/splitter';
import { AutoFixHigh, Cancel, Settings, } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import StanCompileResultWindow from "./StanCompileResultWindow";
import TextEditor, { ToolbarItem } from "./TextEditor";
import runStanc from "./runStanc";
import compileStanProgram from '../compileStanProgram/compileStanProgram';

type Props = {
    fileName: string
    fileContent: string
    onSaveContent: (text: string) => void
    editedFileContent: string
    setEditedFileContent: (text: string) => void
    onDeleteFile?: () => void
    readOnly: boolean
    width: number
    height: number
    setCompiledUrl: (s: string) => void
}

type CompileStatus = 'preparing' | 'compiling' | 'compiled' | 'failed' | ''

const StanFileEditor: FunctionComponent<Props> = ({ fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, readOnly, width, height, setCompiledUrl }) => {
    const [validSyntax, setValidSyntax] = useState<boolean>(false)
    const handleAutoFormat = useCallback(() => {
        if (editedFileContent === undefined) return
            ; (async () => {
                const model = await runStanc('main.stan', editedFileContent, ["auto-format", "max-line-length=78"])
                if (model.result) {
                    setEditedFileContent(model.result)
                }
            })()
    }, [editedFileContent, setEditedFileContent])

    const [compileStatus, setCompileStatus] = useState<CompileStatus>('')
    const [theStanFileContentThasHasBeenCompiled, setTheStanFileContentThasHasBeenCompiled] = useState<string>('')
    const [compileMessage, setCompileMessage] = useState<string>('')

    const handleCompile = useCallback(async () => {
        setCompileStatus('compiling')
        await new Promise(resolve => setTimeout(resolve, 500)) // for effect
        const onStatus = (msg: string) => {
            setCompileMessage(msg)
        }
        const stanWasmServerUrl = localStorage.getItem('stanWasmServerUrl') || 'https://trom-stan-wasm-server.magland.org'
        const { mainJsUrl, jobId } = await compileStanProgram(stanWasmServerUrl, fileContent, onStatus)

        if (!mainJsUrl) {
            setCompileStatus('failed')
            return
        }
        setCompiledUrl(mainJsUrl)
        setCompileStatus('compiled')
        setTheStanFileContentThasHasBeenCompiled(fileContent)

        // record in local storage that we compiled this particular stan file
        if (jobId) {
            try {
                const key = getKeyNameForCompiledFile(stanWasmServerUrl, fileContent)
                const value = JSON.stringify({ jobId, mainJsUrl })
                localStorage.setItem(key, value)
            }
            catch (e: any) {
                console.error('Problem recording compiled file in local storage')
                console.error(e)
            }
        }
    }, [fileContent, setCompiledUrl])

    useEffect(() => {
        // if the compiled content is not the same as the current content,
        // then the state should not be compiled or failed
        if (fileContent !== theStanFileContentThasHasBeenCompiled) {
            if (compileStatus === 'compiled' || compileStatus === 'failed') {
                setCompileStatus('')
                setCompiledUrl('')
            }
        }
    }, [fileContent, theStanFileContentThasHasBeenCompiled, compileStatus, setCompiledUrl])

    const [didInitialCompile, setDidInitialCompile] = useState(false)
    useEffect(() => {
        // if we think this has been compiled before, let's go ahead and compile it (should be in cache on server)
        // but we are only going to do this on initial load
        if (didInitialCompile) return
        const stanWasmServerUrl = localStorage.getItem('stanWasmServerUrl') || ''
        if (!stanWasmServerUrl) return
        const key = getKeyNameForCompiledFile(stanWasmServerUrl, fileContent)
        const value = localStorage.getItem(key)
        if (!value) return
        handleCompile()
        if (fileContent) {
            setDidInitialCompile(true)
        }
    }, [fileContent, handleCompile, didInitialCompile])

    const showLabelsOnButtons = width > 700
    const [syntaxWindowVisible, setSyntaxWindowVisible] = useState(false)

    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []

        // valid syntax
        if ((!validSyntax) && (!!editedFileContent)) {
            ret.push({
                type: 'button',
                icon: <Cancel />,
                label: showLabelsOnButtons ? 'Syntax error' : '',
                color: 'darkred',
                tooltip: 'Syntax error in Stan file',
                onClick: () => { setSyntaxWindowVisible(true) }
            })
        }

        // auto format
        if (!readOnly) {
            if (editedFileContent !== undefined) {
                ret.push({
                    type: 'button',
                    icon: <AutoFixHigh />,
                    tooltip: 'Auto format this stan file',
                    label: showLabelsOnButtons ? 'auto format' : '',
                    onClick: handleAutoFormat,
                    color: 'darkblue'
                })
            }
        }
        if (editedFileContent === fileContent) {
            if (compileStatus !== 'compiling') {
                if (validSyntax) {
                    ret.push({
                        type: 'button',
                        tooltip: 'Compile Stan model',
                        label: 'compile',
                        icon: <Settings />,
                        onClick: handleCompile,
                        color: 'darkblue'
                    })
                }
            }
            if (compileStatus !== '') {
                ret.push({
                    type: 'text',
                    label: compileMessage,
                    color: compileStatus === 'compiled' ? 'green' : compileStatus === 'failed' ? 'red' : 'black'
                })
            }
        }

        return ret
    }, [editedFileContent, fileContent, handleAutoFormat, handleCompile, compileStatus, compileMessage, validSyntax, readOnly, showLabelsOnButtons])

    const isCompiling = compileStatus === 'compiling'

    const compileResultsHeight = Math.min(300, height / 3)

    console.log('syntaxWindowVisible', syntaxWindowVisible)

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height  - compileResultsHeight}
            direction="vertical"
            hideSecondChild={!(!editedFileContent || syntaxWindowVisible)}
        >
            <TextEditor
                width={0}
                height={0}
                // language="stan"
                language="stan"
                label={fileName}
                text={fileContent}
                onSaveText={onSaveContent}
                editedText={editedFileContent}
                onSetEditedText={setEditedFileContent}
                readOnly={!isCompiling ? readOnly : true}
                toolbarItems={toolbarItems}
            />
            {
                editedFileContent ? (
                    <StanCompileResultWindow
                        width={0}
                        height={0}
                        mainStanText={editedFileContent}
                        onValidityChanged={valid => setValidSyntax(valid)}
                        onClose={() => setSyntaxWindowVisible(false)}
                    />
                ) : (
                    <div style={{ padding: 20 }}>Select an example from the left panel</div>
                )
            }
        </Splitter>
    )
}

const getKeyNameForCompiledFile = (stanWasmServerUrl: string, stanFileContent: string) => {
    return `compiled-file|${stanWasmServerUrl}|${stringChecksum(stanFileContent)}`
}

const stringChecksum = (str: string) => {
    let hash = 0;
    if (str.length == 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


export default StanFileEditor
