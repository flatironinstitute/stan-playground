import { Cancel, Check } from "@mui/icons-material";

import CloseableDialog, {
  useDialogControls,
} from "@SpComponents/CloseableDialog";
import { FunctionComponent, useCallback, useContext } from "react";
import ConfigureCompilationServerDialog from "./CompilationServerDialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CompileContext } from "@SpCompilation/CompileContext";
import {
  ServerType,
  publicCompilationServerUrl,
  localCompilationServerUrl,
} from "./Constants";

type CompilationServerConnectionControlProps = {
  // none
};

const CompilationServerConnectionControl: FunctionComponent<
  CompilationServerConnectionControlProps
> = () => {
  const { stanWasmServerUrl, isConnected, retryConnection } =
    useContext(CompileContext);

  const {
    handleOpen: openDialog,
    handleClose: closeDialog,
    open,
  } = useDialogControls();

  const handleRetry = useCallback(() => {
    retryConnection();
  }, [retryConnection]);

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
      <CloseableDialog
        title="Select a compilation server"
        id="compilationDialog"
        open={open}
        handleClose={closeDialog}
      >
        <ConfigureCompilationServerDialog
          isConnected={isConnected}
          onRetry={handleRetry}
        />
      </CloseableDialog>
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
