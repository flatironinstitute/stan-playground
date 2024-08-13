import { CompileContext } from "@SpCompileContext/CompileContext";
import { Refresh } from "@mui/icons-material";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import { FunctionComponent, useCallback, useContext } from "react";
import {
  localCompilationServerUrl,
  publicCompilationServerUrl,
  serverTypeForUrl,
} from "./CompilationServerConnectionControl";

type ConfigureCompilationServerDialogProps = {
  isConnected: boolean;
  onRetry: () => void;
};

const ConfigureCompilationServerDialog: FunctionComponent<
  ConfigureCompilationServerDialogProps
> = ({ isConnected, onRetry }) => {
  const { stanWasmServerUrl, setStanWasmServerUrl } =
    useContext(CompileContext);

  const serverType = serverTypeForUrl(stanWasmServerUrl);

  const makeChoice = useCallback(
    (_: unknown, choice: string) => {
      if (choice === "public") {
        setStanWasmServerUrl(publicCompilationServerUrl);
      } else if (choice === "local") {
        setStanWasmServerUrl(localCompilationServerUrl);
      } else if (choice === "custom") {
        setStanWasmServerUrl("");
      } else {
        return;
      }
    },
    [setStanWasmServerUrl],
  );

  return (
    <div className="dialogWrapper">
      <p>
        While the sampling is performed locally in the browser, a compilation
        server is required to compile the Stan programs.
      </p>
      <Divider />
      <p>
        {isConnected ? (
          <span className="connected">Connected</span>
        ) : (
          <span className="disconnected">Not connected</span>
        )}
        &nbsp;
        <IconButton onClick={onRetry} size="small" title="Retry connection">
          <Refresh fontSize="inherit" />
        </IconButton>
      </p>
      <Divider />

      <FormControl>
        <FormLabel id="compilation-server-selection">
          Compilation server
        </FormLabel>
        <RadioGroup value={serverType} onChange={makeChoice}>
          <FormControlLabel
            value="public"
            control={<Radio />}
            label="Public server"
          />
          <FormControlLabel
            value="local"
            control={<Radio />}
            label="Local server"
          />
          <FormControlLabel
            value="custom"
            control={<Radio />}
            label="Custom server"
          />
        </RadioGroup>

        {serverType === "custom" && (
          <div>
            <TextField
              variant="standard"
              label="Custom server URL"
              disabled={serverType !== "custom"}
              value={stanWasmServerUrl}
              onChange={(e) => setStanWasmServerUrl(e.target.value)}
            />
            <br />
            <br />
          </div>
        )}
      </FormControl>

      {serverType === "local" && (
        <div>
          <p>
            To start a local compilation server{" "}
            <span className="details">({localCompilationServerUrl})</span>:
          </p>
          <div>
            <pre>
              docker run -p 8083:8080 -it magland/stan-wasm-server:latest
            </pre>
          </div>
        </div>
      )}
      {serverType === "public" && (
        <div>
          <p>
            The public server{" "}
            <span className="details">({publicCompilationServerUrl})</span> is
            provided for convenience, but may not be as reliable as a local
            server, depending on the current load and availability.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfigureCompilationServerDialog;
