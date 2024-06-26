import { Hyperlink, SmallIconButton } from "@fi-sci/misc";
import { default as ModalWindow, useModalWindow } from "@fi-sci/modal-window";
import { Cancel, Check } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useState } from "react";

type CompilationServerConnectionControlProps = {
  // none
};

const publicUrl = "https://trom-stan-wasm-server.magland.org";
const localUrl = "http://localhost:8083";

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
    visible: dialogVisible,
  } = useModalWindow();

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
    <span>
      <span style={{ fontSize: 12 }}>
        <span style={{ color: isConnected ? "lightgreen" : "pink" }}>
          <SmallIconButton
            icon={isConnected ? <Check /> : <Cancel />}
            onClick={openDialog}
          />
        </span>
        &nbsp;
        <Hyperlink color="white" onClick={openDialog}>
          {isConnected ? "connected to " : "not connected to "}
          {serverLabel}
        </Hyperlink>
        &nbsp;&nbsp;
      </span>
      <ModalWindow visible={dialogVisible} onClose={closeDialog}>
        <ConfigureCompilationServerDialog
          stanWasmServerUrl={stanWasmServerUrl}
          setStanWasmServerUrl={setStanWasmServerUrl}
          isConnected={isConnected}
          closeDialog={closeDialog}
          onRetry={handleRetry}
        />
      </ModalWindow>
    </span>
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

type ConfigureCompilationServerDialogProps = {
  stanWasmServerUrl: string;
  setStanWasmServerUrl: (url: string) => void;
  isConnected: boolean;
  closeDialog: () => void;
  onRetry: () => void;
};

const ConfigureCompilationServerDialog: FunctionComponent<
  ConfigureCompilationServerDialogProps
> = ({
  stanWasmServerUrl,
  setStanWasmServerUrl,
  isConnected,
  closeDialog,
  onRetry,
}) => {
  const [choice, setChoice] = useState<"public" | "local" | "custom">("custom");
  useEffect(() => {
    if (stanWasmServerUrl === publicUrl) setChoice("public");
    else if (stanWasmServerUrl === localUrl) setChoice("local");
    else setChoice("custom");
  }, [stanWasmServerUrl]);
  return (
    <div>
      <h3>Select a compilation server</h3>
      <p>
        While the sampling is performed locally in the browser, a compilation
        server is required to compile the Stan programs.
      </p>
      <hr />
      <div>
        {isConnected ? (
          <span style={{ color: "green" }}>Connected</span>
        ) : (
          <span style={{ color: "red" }}>Not connected</span>
        )}
        &nbsp;
        <Hyperlink onClick={onRetry}>retry</Hyperlink>
      </div>
      <hr />
      <div>
        <input
          type="radio"
          id="public"
          name="server"
          value="public"
          checked={choice === "public"}
          onChange={() => {
            if (choice === "custom") setChoice("public");
            setStanWasmServerUrl(publicUrl);
          }}
        />
        <label htmlFor="public">Public server</label>
        <br />

        <input
          type="radio"
          id="local"
          name="server"
          value="local"
          checked={choice === "local"}
          onChange={() => {
            if (choice === "custom") setChoice("local");
            setStanWasmServerUrl(localUrl);
          }}
        />
        <label htmlFor="local">Local server</label>
        <br />

        <input
          type="radio"
          id="custom"
          name="server"
          value="custom"
          checked={choice === "custom"}
          onChange={() => setChoice("custom")}
        />
        <label htmlFor="custom">Custom server</label>
        <br />

        <input
          style={{ width: 500 }}
          disabled={choice !== "custom"}
          type="text"
          value={stanWasmServerUrl}
          onChange={(e) => setStanWasmServerUrl(e.target.value)}
        />
        <br />
        <hr />
        {choice === "local" && (
          <div>
            <p>To start a local compilation server:</p>
            <div>
              <pre>
                docker run -p 8083:8080 -it magland/stan-wasm-server:latest
              </pre>
            </div>
          </div>
        )}
        {choice === "public" && (
          <div>
            <p>
              The public server is provided for convenience, but may not be as
              reliable as a local server, depending on the current load and
              availability.
            </p>
          </div>
        )}
        <hr />
        <button onClick={() => closeDialog()}>Close</button>
      </div>
    </div>
  );
};

export default CompilationServerConnectionControl;
