import { Done } from "@mui/icons-material";
import { FunctionComponent, useEffect, useState } from "react";
import runStanc from "./runStanc";

type Props = {
    width: number
    height: number
    mainStanText: string | undefined
    onValidityChanged?: (valid: boolean) => void
}

type CompiledModel = {
    errors?: string[]
    warnings?: string[]
    result: string
}

const StanCompileResultWindow: FunctionComponent<Props> = ({width, height, mainStanText, onValidityChanged}) => {
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
    if ((model.errors) && (model.errors.length > 0)) {
        return (
            <div style={{width, height, color: 'red', padding: 0, overflow: 'auto'}}>
                <h3>Errors</h3>
                {model.errors.map((error, i) => <div key={i} style={{font: 'courier', fontSize: 13}}><pre>{error}</pre></div>)}
            </div>
        )
    }
    if ((model.warnings) && (model.warnings.length > 0)) {
        return (
            <div style={{width, height, color: 'blue', padding: 0, overflow: 'auto'}}>
                <h3>Warnings</h3>
                {model.warnings.map((warning, i) => <div key={i} style={{font: 'courier', fontSize: 13}}><pre>{warning}</pre></div>)}
            </div>
        )
    }
    if (model.result === mainStanText) {
        return (<div style={{color: 'green'}}><Done /> canonical format</div>)
    }
    return (<div style={{color: 'green'}}><Done /></div>)
}

export default StanCompileResultWindow