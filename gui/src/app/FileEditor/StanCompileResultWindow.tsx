import { Close, Done } from "@mui/icons-material";
import { FunctionComponent, useEffect, useState } from "react";
import runStanc from "./runStanc";
import { SmallIconButton } from "@fi-sci/misc";

type Props = {
    width: number
    height: number
    mainStanText: string | undefined
    onValidityChanged?: (valid: boolean) => void
    onClose?: () => void
}

type CompiledModel = {
    errors?: string[]
    warnings?: string[]
    result: string
}

const StanCompileResultWindow: FunctionComponent<Props> = ({width, height, mainStanText, onValidityChanged, onClose}) => {
    const [model, setModel] = useState<CompiledModel | undefined>(undefined)
    useEffect(() => {
        setModel(undefined)
        if (mainStanText === undefined) return
        ;(async () => {
            const m = await runStanc('main.stan', mainStanText, ["auto-format", "max-line-length=78"])
            setModel(m)
        })()
    }, [mainStanText])

    useEffect(() => {
        if (!model) {
            onValidityChanged && onValidityChanged(false)
            return
        }
        onValidityChanged && onValidityChanged(model.errors === undefined)
    }, [model, onValidityChanged])

    if (!model) return <div />
    let content: any
    if ((model.errors) && (model.errors.length > 0)) {
        content = (
            <div style={{color: 'red'}}>
                <h3>Errors</h3>
                {model.errors.map((error, i) => <div key={i} style={{font: 'courier', fontSize: 13}}><pre>{error}</pre></div>)}
            </div>
        )
    }
    else if ((model.warnings) && (model.warnings.length > 0)) {
        content = (
            <div style={{color: 'blue'}}>
                <h3>Warnings</h3>
                {model.warnings.map((warning, i) => <div key={i} style={{font: 'courier', fontSize: 13}}><pre>{warning}</pre></div>)}
            </div>
        )
    }
    else if (model.result === mainStanText) {
        content = (<div style={{color: 'green'}}><Done /> canonical format</div>)
    }
    else {
        content = (<div style={{color: 'green'}}><Done /></div>)
    }
    return (
        <div style={{width, height, overflow: 'auto'}}>
            <div>
                <SmallIconButton icon={<Close />} onClick={onClose} />
            </div>
            {content}
        </div>
    )
}

export default StanCompileResultWindow