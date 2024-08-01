import { Split } from "@geoffcox/react-splitter";
import { AutoFixHigh, Cancel, Help, Settings } from "@mui/icons-material";
import StanCompileResultWindow from "@SpComponents/StanCompileResultWindow";
import TextEditor from "@SpComponents/TextEditor";
import { ToolbarItem } from "@SpComponents/ToolBar";
import compileStanProgram from "@SpStanc/compileStanProgram";
import { stancErrorsToCodeMarkers } from "@SpStanc/Linting";
import useStanc from "@SpStanc/useStanc";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  onDeleteFile?: () => void;
  readOnly: boolean;
  setCompiledUrl: (s: string) => void;
};

type CompileStatus = "preparing" | "compiling" | "compiled" | "failed" | "";

const StanFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
  setCompiledUrl,
}) => {
  const { stancErrors, requestFormat } = useStanc(
    "main.stan",
    editedFileContent,
    setEditedFileContent,
  );

  const validSyntax = useMemo(() => {
    return stancErrors.errors === undefined;
  }, [stancErrors]);

  const hasWarnings = useMemo(() => {
    return stancErrors.warnings && stancErrors.warnings.length > 0;
  }, [stancErrors]);

  const [compileStatus, setCompileStatus] = useState<CompileStatus>("");
  const [
    theStanFileContentThasHasBeenCompiled,
    setTheStanFileContentThasHasBeenCompiled,
  ] = useState<string>("");
  const [compileMessage, setCompileMessage] = useState<string>("");

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
      fileContent,
      onStatus,
    );

    if (!mainJsUrl) {
      setCompileStatus("failed");
      return;
    }
    setCompiledUrl(mainJsUrl);
    setCompileStatus("compiled");
    setTheStanFileContentThasHasBeenCompiled(fileContent);
  }, [fileContent, setCompiledUrl]);

  useEffect(() => {
    // if the compiled content is not the same as the current content,
    // then the state should not be compiled or failed
    if (fileContent !== theStanFileContentThasHasBeenCompiled) {
      if (compileStatus === "compiled" || compileStatus === "failed") {
        setCompileStatus("");
        setCompiledUrl("");
      }
    }
  }, [
    fileContent,
    theStanFileContentThasHasBeenCompiled,
    compileStatus,
    setCompiledUrl,
  ]);

  const [syntaxWindowVisible, setSyntaxWindowVisible] = useState(false);

  const toolbarItems: ToolbarItem[] = useMemo(() => {
    const ret: ToolbarItem[] = [];

    ret.push({
      type: "button",
      icon: <Help />,
      tooltip: "Open Stan Users Guide",
      onClick: () =>
        window.open("https://mc-stan.org/docs/stan-users-guide/", "_blank"),
    });

    // invalid syntax
    if (!validSyntax && !!editedFileContent) {
      ret.push({
        type: "button",
        icon: <Cancel />,
        label: "Syntax error",
        color: "darkred",
        tooltip: "Syntax error in Stan file",
        onClick: () => {
          setSyntaxWindowVisible((v) => !v);
        },
      });
    } else if (hasWarnings && !!editedFileContent) {
      ret.push({
        type: "button",
        icon: <Cancel />,
        label: "Syntax warning",
        color: "blue",
        tooltip: "Syntax warning in Stan file",
        onClick: () => {
          setSyntaxWindowVisible((v) => !v);
        },
      });
    }

    // auto format
    if (!readOnly && editedFileContent && validSyntax) {
      ret.push({
        type: "button",
        icon: <AutoFixHigh />,
        tooltip: "Auto format this stan file",
        label: "Auto format",
        onClick: requestFormat,
        color: "darkblue",
      });
    }
    if (editedFileContent && editedFileContent === fileContent) {
      if (compileStatus !== "compiling") {
        if (validSyntax) {
          ret.push({
            type: "button",
            tooltip: "Compile Stan model",
            label: "Compile",
            icon: <Settings />,
            onClick: handleCompile,
            color: "darkblue",
          });
        }
      }
      if (compileStatus !== "") {
        ret.push({
          type: "text",
          label:
            compileMessage.charAt(0).toUpperCase() + compileMessage.slice(1),
          color:
            compileStatus === "compiled"
              ? "green"
              : compileStatus === "failed"
                ? "red"
                : "black",
        });
      }
    }

    return ret;
  }, [
    editedFileContent,
    fileContent,
    handleCompile,
    requestFormat,
    validSyntax,
    compileStatus,
    compileMessage,
    readOnly,
    hasWarnings,
  ]);

  const isCompiling = compileStatus === "compiling";

  const compileResultWindow = syntaxWindowVisible ? (
    <StanCompileResultWindow
      stancErrors={stancErrors}
      onClose={() => setSyntaxWindowVisible(false)}
    />
  ) : (
    <></>
  );

  const editor = (
    <TextEditor
      language="stan"
      label={fileName}
      text={fileContent}
      onSaveText={onSaveContent}
      editedText={editedFileContent}
      onSetEditedText={setEditedFileContent}
      readOnly={!isCompiling ? readOnly : true}
      toolbarItems={toolbarItems}
      codeMarkers={stancErrorsToCodeMarkers(stancErrors)}
      contentOnEmpty="Begin editing or select an example from the left panel"
    />
  );

  return (
    <Split
      horizontal
      initialPrimarySize={syntaxWindowVisible ? "60%" : "100%"}
      splitterSize={syntaxWindowVisible ? "7px" : "0px"}
    >
      {editor}
      {compileResultWindow}
    </Split>
  );
};

export default StanFileEditor;
