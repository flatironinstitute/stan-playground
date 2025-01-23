import { Split } from "@geoffcox/react-splitter";
import { AutoFixHigh, Cancel, Help, Settings } from "@mui/icons-material";
import StanCompileResultWindow from "@SpComponents/StanCompileResultWindow";
import TextEditor from "@SpComponents/TextEditor";
import { ToolbarItem } from "@SpComponents/ToolBar";
import { stancErrorsToCodeMarkers } from "@SpStanc/Linting";
import useStanc from "@SpStanc/useStanc";
import { CompileContext } from "app/Compile/CompileContextProvider";
import { FunctionComponent, useContext, useMemo, useState } from "react";

type Props = {
  fileName: string;
  fileContent: string;
  onSaveContent: () => void;
  editedFileContent: string;
  setEditedFileContent: (text: string) => void;
  onDeleteFile?: () => void;
  readOnly: boolean;
};

const StanFileEditor: FunctionComponent<Props> = ({
  fileName,
  fileContent,
  onSaveContent,
  editedFileContent,
  setEditedFileContent,
  readOnly,
}) => {
  const { stancErrors, requestFormat } = useStanc(
    "main.stan",
    editedFileContent,
    setEditedFileContent,
  );

  const { compileStatus, compileMessage, compile, validSyntax, isConnected } =
    useContext(CompileContext);

  const hasWarnings = useMemo(() => {
    return stancErrors.warnings && stancErrors.warnings.length > 0;
  }, [stancErrors]);

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
        color: "error.dark",
        tooltip: "Syntax error in Stan file",
        onClick: () => {
          setSyntaxWindowVisible((v) => !v);
        },
      });
    } else if (hasWarnings && !!editedFileContent) {
      ret.push({
        type: "button",
        icon: <Cancel />,
        label: "Compiler warning",
        color: "info.dark",
        tooltip: "Warning in Stan file",
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
        color: "info",
      });
    }
    if (editedFileContent && editedFileContent === fileContent) {
      if (compileStatus !== "compiling" && validSyntax && isConnected) {
        ret.push({
          type: "button",
          tooltip: "Compile Stan model",
          label: "Compile",
          icon: <Settings />,
          onClick: compile,
          color: "info.dark",
        });
      }
      if (compileStatus !== "") {
        ret.push({
          type: "text",
          label:
            compileMessage.charAt(0).toUpperCase() + compileMessage.slice(1),
          color:
            compileStatus === "compiled"
              ? "success"
              : compileStatus === "failed"
                ? "error"
                : undefined,
        });
      }
    }

    return ret;
  }, [
    validSyntax,
    editedFileContent,
    hasWarnings,
    readOnly,
    fileContent,
    requestFormat,
    compileStatus,
    isConnected,
    compile,
    compileMessage,
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
