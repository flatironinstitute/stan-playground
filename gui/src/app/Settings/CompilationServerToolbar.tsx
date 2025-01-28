import { Cancel, Check } from "@mui/icons-material";

import { FunctionComponent, use } from "react";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {
  localCompilationServerUrl,
  publicCompilationServerUrl,
  ServerType,
  UserSettingsContext,
} from "@SpSettings/UserSettings";
import { CompileContext } from "@SpCompilation/CompileContextProvider";

type CompilationServerConnectionControlProps = {
  // none
};

const CompilationServerConnectionControl: FunctionComponent<
  CompilationServerConnectionControlProps
> = () => {
  const {
    settingsWindow: { openSettings },
    stanWasmServerUrl,
  } = use(UserSettingsContext);

  const { isConnected } = use(CompileContext);

  const serverType = serverTypeForUrl(stanWasmServerUrl);

  return (
    <>
      <IconButton
        onClick={() => openSettings("compilation")}
        color="inherit"
        size="small"
      >
        {isConnected ? (
          <Check htmlColor="lightgreen" fontSize="inherit" />
        ) : (
          <Cancel htmlColor="pink" fontSize="inherit" />
        )}
        &nbsp;
        <Typography color="white" fontSize={12}>
          {isConnected ? "connected to " : "not connected to "}
          {serverType}
        </Typography>
      </IconButton>
    </>
  );
};

export const serverTypeForUrl = (url: string): ServerType => {
  return url === publicCompilationServerUrl
    ? "public"
    : url === localCompilationServerUrl
      ? "local"
      : "custom";
};

export default CompilationServerConnectionControl;
