import { ProjectContext } from "@SpCore/ProjectContextProvider";
import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { createContext } from "react";
import compileStanProgram from "./compileStanProgram";
import {
  publicCompilationServerUrl,
  UserSettingsContext,
} from "@SpSettings/UserSettings";

export type CompileStatus =
  | "preparing"
  | "compiling"
  | "compiled"
  | "failed"
  | "";

type CompileContextType = {
  compileStatus: CompileStatus;
  compileMessage: string;
  compiledMainJsUrl?: string;
  validSyntax: boolean;
  compile: () => void;
  setValidSyntax: (valid: boolean) => void;
  isConnected: boolean;
  retryConnection: () => void;
};

export const CompileContext = createContext<CompileContextType>({
  compileStatus: "",
  compileMessage: "",
  validSyntax: false,
  compile: () => {},
  setValidSyntax: () => {},
  isConnected: false,
  retryConnection: () => {},
});

type CompileContextProviderProps = {
  // none
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

const showOneTimeMessage = (url: string) => {
  if (url !== publicCompilationServerUrl) {
    // if the user opted in to a custom URL, we assume they are good with it...
    return true;
  }

  const alreadyConfirmed = "compileModelUploadMessage";
  if (localStorage.getItem(alreadyConfirmed) === "true") {
    return true;
  }
  if (
    window.confirm(
      "This will upload the main.stan file to the server " +
        "for compilation. All other files remain local.\n" +
        "Do you want to continue? (If you accept, this message will not be shown again.)",
    )
  ) {
    localStorage.setItem(alreadyConfirmed, "true");
    return true;
  }
  return false;
};

const CompileContextProvider: FunctionComponent<
  PropsWithChildren<CompileContextProviderProps>
> = ({ children }) => {
  const { data } = useContext(ProjectContext);
  const [compileStatus, setCompileStatus] = useState<CompileStatus>("");
  const [
    theStanFileContentThasHasBeenCompiled,
    setTheStanFileContentThasHasBeenCompiled,
  ] = useState<string>("");
  const [compileMessage, setCompileMessage] = useState<string>("");
  const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<
    string | undefined
  >(undefined);
  const [validSyntax, setValidSyntax] = useState<boolean>(false);

  useEffect(() => {
    // if the compiled content is not the same as the current content,
    // then the state should not be compiled or failed
    if (data.stanFileContent !== theStanFileContentThasHasBeenCompiled) {
      if (compileStatus === "compiled" || compileStatus === "failed") {
        setCompileStatus("");
        setCompiledMainJsUrl("");
      }
    }
  }, [
    data.stanFileContent,
    theStanFileContentThasHasBeenCompiled,
    compileStatus,
    setCompiledMainJsUrl,
  ]);

  const { stanWasmServerUrl } = useContext(UserSettingsContext);

  const handleCompile = useCallback(async () => {
    if (!showOneTimeMessage(stanWasmServerUrl)) {
      return;
    }

    setCompileStatus("compiling");
    await new Promise((resolve) => setTimeout(resolve, 500)); // for effect
    const onStatus = (msg: string) => {
      setCompileMessage(msg);
    };
    const { mainJsUrl } = await compileStanProgram(
      stanWasmServerUrl,
      data.stanFileContent,
      onStatus,
    );

    setTheStanFileContentThasHasBeenCompiled(data.stanFileContent);
    if (!mainJsUrl) {
      setCompileStatus("failed");
      return;
    }
    setCompiledMainJsUrl(mainJsUrl);
    setCompileStatus("compiled");
  }, [
    data.stanFileContent,
    setCompiledMainJsUrl,
    setCompileStatus,
    stanWasmServerUrl,
  ]);

  const { isConnected, retryConnection } = useIsConnected(stanWasmServerUrl);

  return (
    <CompileContext
      value={{
        compileStatus,
        compileMessage,
        compiledMainJsUrl,
        validSyntax,
        compile: handleCompile,
        setValidSyntax,
        isConnected,
        retryConnection,
      }}
    >
      {children}
    </CompileContext>
  );
};

export default CompileContextProvider;
