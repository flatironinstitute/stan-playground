import { ProjectContext } from "@SpCore/ProjectContextProvider";
import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CompileContext, CompileStatus } from "@SpCompilation/CompileContext";
import { publicCompilationServerUrl } from "@SpCompilation/Constants";
import compileStanProgram from "./compileStanProgram";

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

const initialStanWasmServerUrl =
  localStorage.getItem("stanWasmServerUrl") || publicCompilationServerUrl;

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

export const CompileContextProvider: FunctionComponent<
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

  const [stanWasmServerUrl, setStanWasmServerUrl] = useState<string>(
    initialStanWasmServerUrl,
  );
  useEffect(() => {
    // persist to local storage
    localStorage.setItem("stanWasmServerUrl", stanWasmServerUrl);
  }, [stanWasmServerUrl]);

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
    <CompileContext.Provider
      value={{
        compileStatus,
        compileMessage,
        compiledMainJsUrl,
        validSyntax,
        compile: handleCompile,
        setValidSyntax,
        stanWasmServerUrl,
        setStanWasmServerUrl,
        isConnected,
        retryConnection,
      }}
    >
      {children}
    </CompileContext.Provider>
  );
};
