import { Cancel, Check } from "@mui/icons-material";

import { useDialogControls } from "@SpComponents/CloseableDialog";
import { FunctionComponent, useContext } from "react";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CompileContext } from "@SpCompilation/CompileContext";
import {
  ServerType,
  publicCompilationServerUrl,
  localCompilationServerUrl,
} from "./Constants";
import SettingsWindow from "@SpSettings/SettingsWindow";

type CompilationServerConnectionControlProps = {
  // none
};

const CompilationServerConnectionControl: FunctionComponent<
  CompilationServerConnectionControlProps
> = () => {
  const { stanWasmServerUrl, isConnected } = useContext(CompileContext);

  const {
    handleOpen: openDialog,
    handleClose: closeDialog,
    open,
  } = useDialogControls();

  const serverType = serverTypeForUrl(stanWasmServerUrl);

  return (
    <>
      <IconButton onClick={openDialog} color="inherit" size="small">
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
      <SettingsWindow open={open} close={closeDialog} />
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
