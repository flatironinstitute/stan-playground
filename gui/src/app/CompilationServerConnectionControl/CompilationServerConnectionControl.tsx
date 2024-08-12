import { Cancel, Check } from "@mui/icons-material";

import CloseableDialog, {
  useDialogControls,
} from "@SpComponents/CloseableDialog";
import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import ConfigureCompilationServerDialog from "./ConfigureCompilationServerDialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CompileContext } from "@SpCompileContext/CompileContext";

export const publicCompilationServerUrl =
  "https://stan-wasm.flatironinstitute.org";
export const localCompilationServerUrl = "http://localhost:8083";

type ServerType = "public" | "local" | "custom";

type CompilationServerConnectionControlProps = {
  // none
};

const CompilationServerConnectionControl: FunctionComponent<
  CompilationServerConnectionControlProps
> = () => {
  const { stanWasmServerUrl } = useContext(CompileContext);
  const { isConnected, retryConnection } = useIsConnected(stanWasmServerUrl);

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

const useIsConnected = (stanWasmServerUrl: string) => {
  const probeUrl = `${stanWasmServerUrl}/probe`;
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [retryCode, setRetryCode] = useState<number>(0);
  const retryConnection = useCallback(() => {
    setRetryCode((r) => r + 1);
  }, []);
  useEffect(() => {
    setIsConnected(false);
    if (!probeUrl.startsWith("http://") && !probeUrl.startsWith("https://")) {
      // important to do this check because otherwise fetch may succeed because
      // the server of this web app may respond with success
      return;
    }
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
