import { Close, Done } from "@mui/icons-material";
import { FunctionComponent } from "react";
import { StancErrors } from "../Stanc/Types";
import { SmallIconButton } from "@fi-sci/misc";

type Props = {
    width: number
    height: number
    stancErrors: StancErrors
    onClose?: () => void
}

const StanCompileResultWindow: FunctionComponent<Props> = ({ width, height, stancErrors, onClose }) => {
    let content: any
    if ((stancErrors.errors) && (stancErrors.errors.length > 0)) {
        content = (
            <div style={{ width, height, color: 'red', padding: 0, overflow: 'auto' }}>
                <h3>Errors</h3>
                {stancErrors.errors.slice(1).map((error, i) => <div key={i} style={{ font: 'courier', fontSize: 13 }}><pre>{error}</pre></div>)}
            </div>
        )
    }
    else if ((stancErrors.warnings) && (stancErrors.warnings.length > 0)) {
        content = (
            <div style={{ width, height, color: 'blue', padding: 0, overflow: 'auto' }}>
                <h3>Warnings</h3>
                {stancErrors.warnings.map((warning, i) => <div key={i} style={{ font: 'courier', fontSize: 13 }}><pre>{warning}</pre></div>)}
            </div>
        )
    }
    else {
        content = (<div style={{ color: 'green' }}><Done /></div>)
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
