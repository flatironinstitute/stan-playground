import { Refresh } from "@mui/icons-material";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { FunctionComponent, useCallback, use } from "react";

import {
  localCompilationServerUrl,
  publicCompilationServerUrl,
  UserSettingsContext,
} from "@SpSettings/UserSettings";
import { CompileContext } from "@SpCompilation/CompileContextProvider";

import { serverTypeForUrl } from "./CompilationServerToolbar";

type ConfigureCompilationServerDialogProps = {
  // none
};

const ConfigureCompilationServerDialog: FunctionComponent<
  ConfigureCompilationServerDialogProps
> = () => {
  const { stanWasmServerUrl, setStanWasmServerUrl } = use(UserSettingsContext);
  const { isConnected, retryConnection } = use(CompileContext);

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
      <FormControl>
        <FormLabel id="compilation-server-selection">
          <h3>Compilation server</h3>
        </FormLabel>

        <p>
          While the sampling is performed locally in the browser, a compilation
          server is required to compile the Stan programs.
        </p>

        <RadioGroup value={serverType} onChange={makeChoice}>
          <FormControlLabel
            value="public"
            control={<Radio />}
            label="Public server"
          />
          {serverType === "public" && (
            <FormHelperText>
              The public server{" "}
              <span className="details">({publicCompilationServerUrl})</span> is
              provided for convenience, but may not be as reliable as a local
              server, depending on the current load and availability.
            </FormHelperText>
          )}
          <FormControlLabel
            value="local"
            control={<Radio />}
            label="Local server"
          />
          {serverType === "local" && (
            <FormHelperText>
              To start a local compilation server{" "}
              <span className="details">({localCompilationServerUrl})</span>:
              <pre className="dockerRun">
                docker run -p 8083:8080 -it
                ghcr.io/flatironinstitute/stan-wasm-server:latest
              </pre>
            </FormHelperText>
          )}
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
      <Divider />
      <p>
        {isConnected ? (
          <Typography component="span" color="success.main">
            Connected
          </Typography>
        ) : (
          <Typography component="span" color="error.main">
            Not connected
          </Typography>
        )}
        &nbsp;
        <IconButton
          onClick={retryConnection}
          size="small"
          title="Retry connection"
        >
          <Refresh fontSize="inherit" />
        </IconButton>
      </p>
    </div>
  );
};

export default ConfigureCompilationServerDialog;
