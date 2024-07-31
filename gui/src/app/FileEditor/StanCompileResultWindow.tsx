import { StancErrors } from "@SpStanc/Types";
import { Close, Done } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import { FunctionComponent } from "react";

type Props = {
  stancErrors: StancErrors;
  onClose?: () => void;
};

const StanCompileResultWindow: FunctionComponent<Props> = ({
  stancErrors,
  onClose,
}) => {
  let content: any;
  if (stancErrors.errors && stancErrors.errors.length > 0) {
    content = (
      <div className="CompileErrorsPane">
        <h3>Errors</h3>
        {stancErrors.errors.slice(1).map((error, i) => (
          <div key={i} className="ErrorWarningMessage">
            <pre>{error}</pre>
          </div>
        ))}
      </div>
    );
  } else if (stancErrors.warnings && stancErrors.warnings.length > 0) {
    content = (
      <div className="CompileWarningsPane">
        <h3>Warnings</h3>
        {stancErrors.warnings.map((warning, i) => (
          <div key={i} className="ErrorWarningMessage">
            <pre>{warning}</pre>
          </div>
        ))}
      </div>
    );
  } else {
    content = (
      <div className="CompilationDone">
        <Done />
      </div>
    );
  }

  return (
    <div className="ErrorsWindow">
      <IconButton size="small" onClick={onClose} title="Close">
        <Close fontSize="inherit" />
      </IconButton>
      {content}
    </div>
  );
};

export default StanCompileResultWindow;
