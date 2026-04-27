import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  use,
  useEffect,
  useState,
  createContext,
} from "react";

import { useMonaco } from "@monaco-editor/react";

import compileStanProgram from "./compileStanProgram";
import {
  publicCompilationServerUrl,
  UserSettingsContext,
} from "@SpCore/Settings/UserSettings";
import { FileNames } from "@SpCore/Project/FileMapping";

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
  isConnected: boolean;
  retryConnection: () => void;
};

export const CompileContext = createContext<CompileContextType>({
  compileStatus: "",
  compileMessage: "",
  validSyntax: true,
  compile: () => {},
  isConnected: false,
  retryConnection: () => {},
});

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
      } catch {
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

const CompileContextProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const { data } = use(ProjectContext);
  const [compileStatus, setCompileStatus] = useState<CompileStatus>("");
  const [
    theStanFileContentThatHasBeenCompiled,
    setTheStanFileContentThatHasBeenCompiled,
  ] = useState<string>("");
  const [compileMessage, setCompileMessage] = useState<string>("");
  const [compiledMainJsUrl, setCompiledMainJsUrl] = useState<
    string | undefined
  >(undefined);
  const [validSyntax, setValidSyntax] = useState<boolean>(true);

  // set syntax validitiy based on what the LSP returned to the editor
  const monacoInstance = useMonaco();
  const checkMarkers = useCallback(() => {
    if (!monacoInstance) return;
    const error = monacoInstance.editor
      .getModelMarkers({
        resource: monacoInstance.Uri.parse(`file://${FileNames.STANFILE}`),
      })
      .some(
        ({ source, severity }) =>
          source === "stan-language-server" &&
          severity === monacoInstance.MarkerSeverity.Error,
      );
    setValidSyntax(!error);
  }, [monacoInstance, setValidSyntax]);

  useEffect(() => {
    if (!monacoInstance) return;
    const disposable = monacoInstance.editor.onDidChangeMarkers(checkMarkers);
    return () => {
      disposable.dispose();
    };
  }, [checkMarkers, monacoInstance]);

  useEffect(() => {
    // if the compiled content is not the same as the current content,
    // then the state should not be compiled or failed
    if (data.stanFileContent !== theStanFileContentThatHasBeenCompiled) {
      if (compileStatus === "compiled" || compileStatus === "failed") {
        setCompileStatus("");
        setCompiledMainJsUrl("");
      }
    }
  }, [
    data.stanFileContent,
    theStanFileContentThatHasBeenCompiled,
    compileStatus,
    setCompiledMainJsUrl,
  ]);

  const { stanWasmServerUrl } = use(UserSettingsContext);

  const handleCompile = useCallback(async () => {
    if (!showOneTimeMessage(stanWasmServerUrl)) {
      return;
    }

    setCompileStatus("compiling");
    const onStatus = (msg: string) => {
      setCompileMessage(msg);
    };
    const { mainJsUrl } = await compileStanProgram(
      stanWasmServerUrl,
      data.stanFileContent,
      onStatus,
    );

    setTheStanFileContentThatHasBeenCompiled(data.stanFileContent);
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
        isConnected,
        retryConnection,
      }}
    >
      {children}
    </CompileContext>
  );
};

export default CompileContextProvider;
