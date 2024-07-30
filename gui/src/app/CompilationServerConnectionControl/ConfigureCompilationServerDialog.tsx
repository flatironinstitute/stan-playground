import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import { FunctionComponent, useEffect, useState } from "react";
import { localUrl, publicUrl } from "./CompilationServerConnectionControl";

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
    <div className="dialogWrapper">
      <p>
        While the sampling is performed locally in the browser, a compilation
        server is required to compile the Stan programs.
      </p>
      <hr />
      <div>
        {isConnected ? (
          <span className="connected">Connected</span>
        ) : (
          <span className="disconnected">Not connected</span>
        )}
        &nbsp;
        <Link onClick={onRetry} component="button" underline="none">
          retry
        </Link>
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
          // This one isn't honoring a class-based style for some reason
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
        <Button onClick={() => closeDialog()}>Close</Button>
      </div>
    </div>
  );
};

export default ConfigureCompilationServerDialog;
