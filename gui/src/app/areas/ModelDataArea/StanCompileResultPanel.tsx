import { UserSettingsContext } from "@SpCore/Settings/UserSettings";
import { StancErrors } from "@SpCore/Stanc/Types";
import { Close, Done } from "@mui/icons-material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { FunctionComponent, use } from "react";

type StanCompileResultProps = {
  stancErrors: StancErrors;
  onClose?: () => void;
};

const StanCompileResultPanel: FunctionComponent<StanCompileResultProps> = ({
  stancErrors,
  onClose,
}) => {
  let content: any;
  if (stancErrors.errors && stancErrors.errors.length > 0) {
    content = (
      <Box color="error.dark">
        <h3>Errors</h3>
        {stancErrors.errors.slice(1).map((error, i) => (
          <div key={i} className="ErrorWarningMessage">
            <pre>{error}</pre>
          </div>
        ))}
      </Box>
    );
  } else if (stancErrors.warnings && stancErrors.warnings.length > 0) {
    const { pedantic } = use(UserSettingsContext);
    content = (
      <Box color="info.dark">
        <h3>Warnings {pedantic ? "(pedantic)" : ""}</h3>
        {stancErrors.warnings.map((warning, i) => (
          <div key={i} className="ErrorWarningMessage">
            <pre>{warning}</pre>
          </div>
        ))}
      </Box>
    );
  } else {
    content = (
      <Box color="success.main">
        <Done />
      </Box>
    );
  }

  return (
    <div className="CompileResultPanel">
      <IconButton size="small" onClick={onClose} title="Close">
        <Close fontSize="inherit" />
      </IconButton>
      {content}
    </div>
  );
};

export default StanCompileResultPanel;
