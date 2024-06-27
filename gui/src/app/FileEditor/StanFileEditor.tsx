import { Splitter } from '@fi-sci/splitter';
import { AutoFixHigh, Cancel, Settings, } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import StanCompileResultWindow from "./StanCompileResultWindow";
import useStanc from "../Stanc/useStanc";
import TextEditor, { CodeMarker, ToolbarItem } from "./TextEditor";
import compileStanProgram from '../compileStanProgram/compileStanProgram';
import { StancErrors } from '../Stanc/Types';

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

    const hasWarnings = useMemo(() => {
        return (stancErrors.warnings) && (stancErrors.warnings.length > 0)
    }, [stancErrors])

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

    const showLabelsOnButtons = width > 700
    const [syntaxWindowVisible, setSyntaxWindowVisible] = useState(false)

    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []

        // invalid syntax
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
        else if ((hasWarnings) && (!!editedFileContent)) {
            ret.push({
                type: 'button',
                icon: <Cancel />,
                label: showLabelsOnButtons ? 'Syntax warning' : '',
                color: 'blue',
                tooltip: 'Syntax warning in Stan file',
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
                    label: showLabelsOnButtons ? 'auto format': undefined,
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
    }, [editedFileContent, fileContent, handleCompile, requestFormat, showLabelsOnButtons, validSyntax, compileStatus, compileMessage, readOnly, hasWarnings])

    const isCompiling = compileStatus === 'compiling'

    const compileResultsHeight = Math.min(300, height / 3)

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height - compileResultsHeight}
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
                codeMarkers={stancErrorsToCodeMarkers(stancErrors)}
            />
            {
                editedFileContent ? <StanCompileResultWindow
                    width={0}
                    height={0}
                    stancErrors={stancErrors}
                    onClose={() => setSyntaxWindowVisible(false)}
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

const stancErrorsToCodeMarkers = (stancErrors: StancErrors) => {
    const cm: CodeMarker[] = []
    const errorsAndWarnings = [...(stancErrors.errors || []), ...(stancErrors.warnings || [])]
    for (const x of errorsAndWarnings) {
        if (!x) continue

        // Example: Syntax error in 'main.stan', line 1, column 0 to column 1, parsing error:

        let lineNumber: number | undefined = undefined
        let startColumn: number | undefined = undefined
        let endColumn: number | undefined = undefined

        const sections = x.split(',').map(x => x.trim())
        for (const section of sections) {
            if (section.startsWith('line ')) {
                lineNumber = parseInt(section.slice('line '.length))
            }
            else if (section.startsWith('column ')) {
                const cols = section.slice('column '.length).split(' to ')
                startColumn = parseInt(cols[0])
                endColumn = cols.length > 1 ? parseInt(cols[1].slice('column '.length)) : startColumn + 1
            }
        }

        if ((lineNumber !== undefined) && (startColumn !== undefined) && (endColumn !== undefined)) {
            cm.push({
                startLineNumber: lineNumber,
                startColumn: startColumn + 1,
                endLineNumber: lineNumber,
                endColumn: endColumn + 1,
                message: x,
                severity: x.toLowerCase().startsWith('warning') ? 'warning' : 'error'
            })
        }
    }
    return cm
}


export default StanFileEditor
