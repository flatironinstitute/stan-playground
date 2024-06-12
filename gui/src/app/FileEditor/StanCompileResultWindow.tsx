import { Done } from "@mui/icons-material";
import { FunctionComponent } from "react";
import { StancErrors } from "../Stanc/useStanc";

type Props = {
    width: number
    height: number
    stancErrors: StancErrors,
}

const StanCompileResultWindow: FunctionComponent<Props> = ({ width, height, stancErrors }) => {

    if ((stancErrors.errors) && (stancErrors.errors.length > 0)) {
        return (
            <div style={{ width, height, color: 'red', padding: 0, overflow: 'auto' }}>
                <h3>Errors</h3>
                {stancErrors.errors.slice(1).map((error, i) => <div key={i} style={{ font: 'courier', fontSize: 13 }}><pre>{error}</pre></div>)}
            </div>
        )
    }
    if ((stancErrors.warnings) && (stancErrors.warnings.length > 0)) {
        return (
            <div style={{ width, height, color: 'blue', padding: 0, overflow: 'auto' }}>
                <h3>Warnings</h3>
                {stancErrors.warnings.map((warning, i) => <div key={i} style={{ font: 'courier', fontSize: 13 }}><pre>{warning}</pre></div>)}
            </div>
        )
    }

    return (<div style={{ color: 'green' }}><Done /></div>)
}

export default StanCompileResultWindow
