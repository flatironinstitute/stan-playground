import { ProjectContext } from "@SpCore/ProjectContextProvider";
import compileStanProgram from "@SpStanc/compileStanProgram";
import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CompileContext, CompileStatus } from "./CompileContext";

type CompileContextProviderProps = {
  // none
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

  const handleCompile = useCallback(async () => {
    setCompileStatus("compiling");
    await new Promise((resolve) => setTimeout(resolve, 500)); // for effect
    const onStatus = (msg: string) => {
      setCompileMessage(msg);
    };
    const stanWasmServerUrl =
      localStorage.getItem("stanWasmServerUrl") ||
      "https://trom-stan-wasm-server.magland.org";
    const { mainJsUrl } = await compileStanProgram(
      stanWasmServerUrl,
      data.stanFileContent,
      onStatus,
    );

    if (!mainJsUrl) {
      setCompileStatus("failed");
      return;
    }
    setCompiledMainJsUrl(mainJsUrl);
    setCompileStatus("compiled");
    setTheStanFileContentThasHasBeenCompiled(data.stanFileContent);
  }, [data.stanFileContent, setCompiledMainJsUrl]);

  return (
    <CompileContext.Provider
      value={{
        compileStatus,
        compileMessage,
        compiledMainJsUrl,
        validSyntax,
        compile: handleCompile,
        setValidSyntax,
      }}
    >
      {children}
    </CompileContext.Provider>
  );
};
