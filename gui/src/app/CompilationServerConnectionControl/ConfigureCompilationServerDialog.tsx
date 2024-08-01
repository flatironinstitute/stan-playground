import { FunctionComponent, useCallback } from "react";
import {
  localUrl,
  publicUrl,
  ServerType,
} from "./CompilationServerConnectionControl";
import FormControl from "@mui/material/FormControl";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import { Refresh } from "@mui/icons-material";

type ConfigureCompilationServerDialogProps = {
  stanWasmServerUrl: string;
  setStanWasmServerUrl: (url: string) => void;
  isConnected: boolean;
  onRetry: () => void;
  choice: ServerType;
  setChoice: (choice: ServerType) => void;
};

const ConfigureCompilationServerDialog: FunctionComponent<
  ConfigureCompilationServerDialogProps
> = ({
  stanWasmServerUrl,
  setStanWasmServerUrl,
  isConnected,
  onRetry,
  choice,
  setChoice,
}) => {
  const makeChoice = useCallback(
    (_: unknown, choice: string) => {
      if (choice === "public") {
        setStanWasmServerUrl(publicUrl);
      } else if (choice === "local") {
        setStanWasmServerUrl(localUrl);
      } else if (choice === "custom") {
        setStanWasmServerUrl("");
      } else {
        return;
      }
      setChoice(choice);
    },
    [setChoice, setStanWasmServerUrl],
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
        <RadioGroup value={choice} onChange={makeChoice}>
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

        {choice === "custom" && (
          <div>
            <p>
              <TextField
                variant="standard"
                label="Custom server URL"
                disabled={choice !== "custom"}
                value={stanWasmServerUrl}
                onChange={(e) => setStanWasmServerUrl(e.target.value)}
              />
            </p>
          </div>
        )}
      </FormControl>

      {choice === "local" && (
        <div>
          <p>
            To start a local compilation server{" "}
            <span className="details">({localUrl})</span>:
          </p>
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
            The public server <span className="details">({publicUrl})</span> is
            provided for convenience, but may not be as reliable as a local
            server, depending on the current load and availability.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfigureCompilationServerDialog;
