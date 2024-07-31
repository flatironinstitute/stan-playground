import { Cancel, Check } from "@mui/icons-material";

import CloseableDialog, {
  useDialogControls,
} from "@SpComponents/CloseableDialog";
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import ConfigureCompilationServerDialog from "./ConfigureCompilationServerDialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

export const publicUrl = "https://trom-stan-wasm-server.magland.org";
export const localUrl = "http://localhost:8083";

type CompilationServerConnectionControlProps = {
  // none
};

const CompilationServerConnectionControl: FunctionComponent<
  CompilationServerConnectionControlProps
> = () => {
  const [stanWasmServerUrl, setStanWasmServerUrl] = useState<string>(
    localStorage.getItem("stanWasmServerUrl") || publicUrl,
  );
  const { isConnected, retryConnection } = useIsConnected(stanWasmServerUrl);
  useEffect(() => {
    localStorage.setItem("stanWasmServerUrl", stanWasmServerUrl);
  }, [stanWasmServerUrl]);

  const {
    handleOpen: openDialog,
    handleClose: closeDialog,
    open,
  } = useDialogControls();

  const handleRetry = useCallback(() => {
    retryConnection();
  }, [retryConnection]);

  const serverLabel =
    stanWasmServerUrl === publicUrl
      ? "public"
      : stanWasmServerUrl === localUrl
        ? "local"
        : "custom";
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
          {serverLabel}
        </Typography>
      </IconButton>
      <CloseableDialog
        title="Select a compilation server"
        id="compilationDialog"
        open={open}
        handleClose={closeDialog}
      >
        <ConfigureCompilationServerDialog
          stanWasmServerUrl={stanWasmServerUrl}
          setStanWasmServerUrl={setStanWasmServerUrl}
          isConnected={isConnected}
          closeDialog={closeDialog}
          onRetry={handleRetry}
        />
      </CloseableDialog>
    </>
  );
};

const useIsConnected = (stanWasmServerUrl: string) => {
  const probeUrl = `${stanWasmServerUrl}/probe`;
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [retryCode, setRetryCode] = useState<number>(0);
  const retryConnection = useCallback(() => {
    setRetryCode((r) => r + 1);
  }, []);
  useEffect(() => {
    setIsConnected(false);
    (async () => {
      try {
        const response = await fetch(probeUrl);
        if (response.status === 200) {
          setIsConnected(true);
        }
      } catch (err) {
        setIsConnected(false);
      }
    })();
  }, [probeUrl, retryCode]);
  return { isConnected, retryConnection };
};

export default CompilationServerConnectionControl;
