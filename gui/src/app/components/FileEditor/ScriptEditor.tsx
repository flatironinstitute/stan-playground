import { FunctionComponent, RefObject, useCallback, use, useMemo } from "react";

import { Help, PlayArrow } from "@mui/icons-material";
import Box from "@mui/material/Box";
import { Split } from "@geoffcox/react-splitter";
import { useMonaco } from "@monaco-editor/react";
import { type editor } from "monaco-editor";

import { ColorOptions, ToolbarItem } from "@SpComponents/FileEditor/ToolBar";
import { FileNames } from "@SpCore/Project/FileMapping";
import { ProjectContext } from "@SpCore/Project/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/Project/ProjectDataModel";
import { normalizeLineEndings } from "@SpUtil/normalizeLineEndings";
import { InterpreterStatus } from "@SpCore/Scripting/InterpreterTypes";
import TextEditor from "@SpComponents/FileEditor/TextEditor";

const interpreterNames = { python: "pyodide", r: "webR" } as const;

export type ScriptEditorProps = {
  status: InterpreterStatus;
  language: "python" | "r";
  filename: FileNames;
  dataKey: ProjectKnownFiles;
  onRun: (code: string) => void;
  runnable: boolean;
  notRunnableReason?: string;
  onHelp?: () => void;
  contentOnEmpty?: string | HTMLSpanElement;
  consoleRef: RefObject<HTMLDivElement | null>;
};

const ScriptEditor: FunctionComponent<ScriptEditorProps> = ({
  status,
  language,
  filename,
  dataKey,
  onRun,
  runnable,
  notRunnableReason,
  onHelp,
  contentOnEmpty,
  consoleRef,
}) => {
  const { data, update } = use(ProjectContext);

  const content = data[dataKey];
  const editedContent = data.ephemera[dataKey];

  const onSetEditedText = useCallback(
    (content: string) => {
      update({
        type: "editFile",
        content,
        filename: dataKey,
      });
    },
    [dataKey, update],
  );

  const onSaveText = useCallback(() => {
    update({
      type: "commitFile",
      filename: dataKey,
    });
  }, [dataKey, update]);

  const runCode = useCallback(() => {
    onRun(normalizeLineEndings(content));
  }, [content, onRun]);

  const unsavedChanges = useMemo(() => {
    return content !== editedContent;
  }, [content, editedContent]);

  const monacoInstance = useMonaco();

  const runCtrlEnter: editor.IActionDescriptor[] = useMemo(() => {
    if (!monacoInstance) {
      return [];
    }
    return [
      {
        id: "run-script",
        label: "Run Script",
        keybindings: [
          monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
        ],
        run: () => {
          if (runnable && !unsavedChanges) {
            runCode();
          }
        },
      },
    ];
  }, [monacoInstance, runCode, runnable, unsavedChanges]);

  const toolbarItems: ToolbarItem[] = useMemo(() => {
    return makeToolbar({
      status,
      name: interpreterNames[language],
      runnable: runnable && !unsavedChanges,
      notRunnableReason,
      onRun: runCode,
      onHelp,
    });
  }, [
    language,
    notRunnableReason,
    onHelp,
    runCode,
    runnable,
    status,
    unsavedChanges,
  ]);

  return (
    <Split horizontal initialPrimarySize="60%">
      <TextEditor
        label={filename}
        language={language}
        text={content}
        editedText={editedContent}
        onSetEditedText={onSetEditedText}
        onSaveText={onSaveText}
        toolbarItems={toolbarItems}
        contentOnEmpty={contentOnEmpty}
        actions={runCtrlEnter}
      />
      <ConsoleOutputPanel consoleRef={consoleRef} />
    </Split>
  );
};

const makeToolbar = (o: {
  status: InterpreterStatus;
  name: string;
  runnable: boolean;
  notRunnableReason?: string;
  onRun: () => void;
  onHelp?: () => void;
}): ToolbarItem[] => {
  const { status, onRun, runnable, onHelp, name } = o;
  const ret: ToolbarItem[] = [];
  if (onHelp !== undefined) {
    ret.push({
      type: "button",
      tooltip: "Help",
      icon: <Help />,
      onClick: onHelp,
    });
  }
  if (runnable) {
    ret.push({
      type: "button",
      tooltip: "Run code (Ctrl-Enter)",
      label: "Run",
      icon: <PlayArrow />,
      onClick: onRun,
      color: "success.dark",
    });
  } else if (o.notRunnableReason) {
    ret.push({
      type: "text",
      label: o.notRunnableReason,
      color: "error",
    });
  }

  let label: string;
  let color: ColorOptions;
  if (status === "loading") {
    label = `Loading ${name}...`;
    color = "info";
  } else if (status === "installing") {
    label = `Installing packages for ${name}...`;
    color = "info";
  } else if (status === "running") {
    label = "Running...";
    color = "info";
  } else if (status === "completed") {
    label = "Completed";
    color = "success";
  } else if (status === "failed") {
    label = "Failed";
    color = "error";
  } else {
    label = "";
    color = "primary";
  }

  if (label) {
    ret.push({
      type: "text",
      label,
      color,
    });
  }
  return ret;
};

type ConsoleOutputProps = {
  consoleRef: RefObject<HTMLDivElement | null>;
};

const ConsoleOutputPanel: FunctionComponent<ConsoleOutputProps> = ({
  consoleRef,
}) => {
  return (
    <Box
      ref={consoleRef}
      overflow="auto"
      height="100%"
      width="100%"
      sx={[
        // necessary to get styling of the createElement'd divs
        (theme) => ({
          ".stdout": {
            color: theme.palette.info.dark,
          },
          ".stderr": {
            color: theme.palette.error.main,
          },
        }),
      ]}
    />
  );
};

export default ScriptEditor;
