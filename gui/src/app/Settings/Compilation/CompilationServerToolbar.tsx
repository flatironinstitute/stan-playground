import { Cancel, Check } from "@mui/icons-material";

import { FunctionComponent, useContext } from "react";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {
  ServerType,
  localCompilationServerUrl,
  publicCompilationServerUrl,
} from "./Constants";

import { CompileContext } from "./CompileContextProvider";

type CompilationServerConnectionControlProps = {
  openSettings: () => void;
};

const CompilationServerConnectionControl: FunctionComponent<
  CompilationServerConnectionControlProps
> = ({ openSettings }) => {
  const { stanWasmServerUrl, isConnected } = useContext(CompileContext);

  const serverType = serverTypeForUrl(stanWasmServerUrl);

  return (
    <>
      <IconButton onClick={openSettings} color="inherit" size="small">
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
