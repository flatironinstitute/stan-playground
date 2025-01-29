import { Split } from "@geoffcox/react-splitter";
import { AutoFixHigh, Cancel, Help, Settings } from "@mui/icons-material";
import StanCompileResultPanel from "@SpAreas/ModelDataArea/StanCompileResultPanel";
import TextEditor from "@SpComponents/FileEditor/TextEditor";
import { ToolbarItem } from "@SpComponents/FileEditor/ToolBar";
import { stancErrorsToCodeMarkers } from "@SpCore/Stanc/Linting";
import useStanc from "@SpCore/Stanc/useStanc";
import { CompileContext } from "@SpCore/Compilation/CompileContextProvider";
import { FunctionComponent, use, useCallback, useMemo, useState } from "react";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import { FileNames } from "@SpCore/Project/FileMapping";

const ModelEditorPanel: FunctionComponent = () => {
  const { data, update } = use(ProjectContext);

  const onSaveContent = useCallback(() => {
    update({
      type: "commitFile",
      filename: ProjectKnownFiles.STANFILE,
    });
  }, [update]);

  const setEditedFileContent = useCallback(
    (content: string) => {
      update({
        type: "editFile",
        content,
        filename: ProjectKnownFiles.STANFILE,
      });
    },
    [update],
  );

  const { stancErrors, requestFormat } = useStanc(
    "main.stan",
    data.ephemera.stanFileContent,
    setEditedFileContent,
  );

  const { compileStatus, compileMessage, compile, validSyntax, isConnected } =
    use(CompileContext);

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
    if (!validSyntax && !!data.ephemera.stanFileContent) {
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
    } else if (hasWarnings && !!data.ephemera.stanFileContent) {
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
    if (data.ephemera.stanFileContent && validSyntax) {
      ret.push({
        type: "button",
        icon: <AutoFixHigh />,
        tooltip: "Auto format this stan file",
        label: "Auto format",
        onClick: requestFormat,
        color: "info",
      });
    }
    if (
      data.ephemera.stanFileContent &&
      data.ephemera.stanFileContent === data.stanFileContent
    ) {
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
    data.ephemera.stanFileContent,
    data.stanFileContent,
    hasWarnings,
    requestFormat,
    compileStatus,
    isConnected,
    compile,
    compileMessage,
  ]);

  const isCompiling = compileStatus === "compiling";

  const compileResultWindow = syntaxWindowVisible ? (
    <StanCompileResultPanel
      stancErrors={stancErrors}
      onClose={() => setSyntaxWindowVisible(false)}
    />
  ) : (
    <></>
  );

  const editor = (
    <TextEditor
      language="stan"
      label={FileNames.STANFILE}
      text={data.stanFileContent}
      onSaveText={onSaveContent}
      editedText={data.ephemera.stanFileContent}
      onSetEditedText={setEditedFileContent}
      readOnly={isCompiling}
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

export default ModelEditorPanel;
