import { Splitter } from '@fi-sci/splitter';
import { AutoFixHigh, Settings, } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import StanCompileResultWindow from "./StanCompileResultWindow";
import useStanc from "../Stanc/useStanc";
import TextEditor, { ToolbarItem } from "./TextEditor";
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

    const { stancErrors, requestFormat } = useStanc("main.stan", editedFileContent, setEditedFileContent);

    const validSyntax = useMemo(() => {
        return stancErrors.errors === undefined
    }, [stancErrors]);

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
        const { mainJsUrl } = await compileStanProgram(stanWasmServerUrl, fileContent, onStatus)

        if (!mainJsUrl) {
            setCompileStatus('failed')
            return
        }
        setCompiledUrl(mainJsUrl)
        setCompileStatus('compiled')
        setTheStanFileContentThasHasBeenCompiled(fileContent)

        // record in local storage that we compiled this particular stan file
        try {
            const key = getKeyNameForCompiledFile(stanWasmServerUrl, fileContent)
            const value = JSON.stringify({ mainJsUrl })
            localStorage.setItem(key, value)
        }
        catch (e: any) {
            console.error('Problem recording compiled file in local storage')
            console.error(e)
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

    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []

        // auto format
        if (!readOnly) {
            if (editedFileContent !== undefined) {
                ret.push({
                    type: 'button',
                    icon: <AutoFixHigh />,
                    tooltip: 'Auto format this stan file',
                    label: 'auto format',
                    onClick: requestFormat,
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
    }, [editedFileContent, fileContent, requestFormat, handleCompile, compileStatus, compileMessage, validSyntax, readOnly])

    const isCompiling = compileStatus === 'compiling'

    const compileResultsHeight = Math.min(300, height / 3)

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height - compileResultsHeight}
            direction="vertical"
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
                editedFileContent ? <StanCompileResultWindow
                    width={0}
                    height={0}
                    stancErrors={stancErrors}
                /> : (
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
