import { Help, PlayArrow } from "@mui/icons-material";
import { SplitDirection, Splitter } from "@SpComponents/Splitter";
import TextEditor, { ToolbarItem } from "@SpComponents/TextEditor";
import { FileNames } from "@SpCore/FileMapping";
import { ProjectContext } from "@SpCore/ProjectContextProvider";
import { ProjectKnownFiles } from "@SpCore/ProjectDataModel";
import {
  FunctionComponent,
  RefObject,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { InterpreterStatus } from "./InterpreterTypes";

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
  consoleRef: RefObject<HTMLDivElement>;
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
  const { data, update } = useContext(ProjectContext);

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
    onRun(content);
  }, [content, onRun]);

  const unsavedChanges = useMemo(() => {
    return content !== editedContent;
  }, [content, editedContent]);

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
    <Splitter direction={SplitDirection.Vertical} initialSizes={[60, 40]}>
      <TextEditor
        label={filename}
        language={language}
        text={content}
        editedText={editedContent}
        onSetEditedText={onSetEditedText}
        onSaveText={onSaveText}
        toolbarItems={toolbarItems}
        contentOnEmpty={contentOnEmpty}
      />
      <ConsoleOutputWindow consoleRef={consoleRef} />
    </Splitter>
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
      tooltip: "Run code to generate data",
      label: "Run",
      icon: <PlayArrow />,
      onClick: onRun,
      color: "black",
    });
  } else if (o.notRunnableReason) {
    ret.push({
      type: "text",
      label: o.notRunnableReason,
      color: "red",
    });
  }

  let label: string;
  let color: string;
  if (status === "loading") {
    label = `Loading ${name}...`;
    color = "blue";
  } else if (status === "installing") {
    label = `Installing packages for ${name}...`;
    color = "blue";
  } else if (status === "running") {
    label = "Running...";
    color = "blue";
  } else if (status === "completed") {
    label = "Completed";
    color = "green";
  } else if (status === "failed") {
    label = "Failed";
    color = "red";
  } else {
    label = "";
    color = "black";
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

type ConsoleOutputWindowProps = {
  consoleRef: RefObject<HTMLDivElement>;
};

const ConsoleOutputWindow: FunctionComponent<ConsoleOutputWindowProps> = ({
  consoleRef,
}) => {
  return <div className="ConsoleOutputArea" ref={consoleRef} />;
};

export default ScriptEditor;
