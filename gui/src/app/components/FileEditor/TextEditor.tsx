import {
  FunctionComponent,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { UserSettingsContext } from "@SpCore/Settings/UserSettings";
import { CodeMarker } from "@SpCore/Stanc/Linting";
import { unreachable } from "@SpUtil/unreachable";

import { Editor, loader, useMonaco, type Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";

import { ToolBar, ToolbarItem } from "./ToolBar";

import monacoAddStanLang from "./monacoStanLanguage";
// loader from @monaco-editor/react handles the loading of the monaco editor
// importantly, it downloads from a CDN, so we need to make sure we
// only depend on types from the monaco-editor package to avoid
// downloading twice.
loader.init().then(monacoAddStanLang);

type Props = {
  text: string | undefined;
  onSaveText: () => void;
  editedText?: string;
  onSetEditedText: (text: string) => void;
  language: string;
  readOnly?: boolean;
  wordWrap?: boolean;
  toolbarItems?: ToolbarItem[];
  label: string;
  codeMarkers?: CodeMarker[];
  contentOnEmpty?: string | HTMLSpanElement;
  actions?: editor.IActionDescriptor[];
};

const TextEditor: FunctionComponent<Props> = ({
  text,
  onSaveText,
  editedText,
  onSetEditedText,
  readOnly,
  toolbarItems,
  language,
  label,
  codeMarkers,
  contentOnEmpty,
  actions,
}) => {
  const handleChange = useCallback(
    (value: string | undefined) => {
      onSetEditedText(value || "");
    },
    [onSetEditedText],
  );

  //////////////////////////////////////////////////
  // Seems that it is important to set the initial value of the editor
  // this way rather than using defaultValue. The defaultValue approach
  // worked okay until I navigated away and then back to the editors
  // and then everything was blank, and I couldn't figure out what
  // was causing this. But I think this method is more flexible anyway
  // as it gives us access to the editor instance.
  const [editorInstance, setEditor] = useState<
    editor.IStandaloneCodeEditor | undefined
  >(undefined);

  useEffect(() => {
    if (!editorInstance) return;
    if (editedText === undefined) return;
    if (editorInstance.getValue() === editedText) return;
    editorInstance.setValue(editedText);
  }, [editedText, editorInstance]);

  const monacoInstance = useMonaco();

  useEffect(() => {
    if (!monacoInstance) return;
    if (!codeMarkers) return;
    const model = editorInstance?.getModel();
    if (!model) return;

    const modelMarkers = codeMarkers.map((marker) => ({
      ...marker,
      severity: toMonacoMarkerSeverity(marker.severity, monacoInstance),
    }));

    monacoInstance.editor.setModelMarkers(
      model,
      "stan-playground",
      modelMarkers,
    );
  }, [codeMarkers, monacoInstance, editorInstance]);

  useEffect(() => {
    if (!editorInstance) return;
    if (!contentOnEmpty) return;
    if (text || editedText) {
      return;
    }
    const contentWidget = createHintTextContentWidget(contentOnEmpty);
    editorInstance.addContentWidget(contentWidget);
    return () => {
      editorInstance.removeContentWidget(contentWidget);
    };
  }, [text, editorInstance, editedText, contentOnEmpty]);

  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;
    const disposable = editorInstance.addAction({
      id: "save",
      label: "Save",
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      ],
      run: () => {
        if (!readOnly) {
          onSaveText();
        }
      },
    });
    return () => {
      disposable.dispose();
    };
  }, [editorInstance, monacoInstance, onSaveText, readOnly]);

  useEffect(() => {
    if (!editorInstance) return;
    if (!actions) return;
    const disposables: IDisposable[] = [];
    for (const action of actions) {
      disposables.push(editorInstance.addAction(action));
    }
    return () => {
      disposables.forEach((d) => d.dispose());
    };
  }, [actions, editorInstance]);

  const edited = useMemo(() => {
    return editedText !== text;
  }, [editedText, text]);

  const { theme: userTheme } = use(UserSettingsContext);

  const theme = useMemo(
    () => (userTheme === "dark" ? "vs-dark" : "vs"),
    [userTheme],
  );

  return (
    <div className="EditorWithToolbar">
      <ToolBar
        items={toolbarItems || []}
        label={label}
        onSaveText={onSaveText}
        edited={edited}
        readOnly={!!readOnly}
      />
      <Editor
        defaultLanguage={language}
        onChange={handleChange}
        onMount={(editor, _) => setEditor(editor)}
        options={{
          readOnly,
          domReadOnly: readOnly,
          wordWrap: "on",
          minimap: { enabled: false },
          tabSize: 2,
        }}
        theme={theme}
      />
    </div>
  );
};

const toMonacoMarkerSeverity = (
  severity: CodeMarker["severity"],
  monacoInstance: Monaco,
) => {
  switch (severity) {
    case "error":
      return monacoInstance.MarkerSeverity.Error;
    case "warning":
      return monacoInstance.MarkerSeverity.Warning;
    case "hint":
      return monacoInstance.MarkerSeverity.Hint;
    case "info":
      return monacoInstance.MarkerSeverity.Info;
    default:
      return unreachable(severity);
  }
};

const createHintTextContentWidget = (content: string | HTMLSpanElement) => {
  return {
    getDomNode: () => {
      const node = document.createElement("div");
      node.style.width = "max-content";
      node.className = "EditorHintText";
      const spanElement =
        typeof content === "string" ? document.createElement("span") : content;
      if (typeof content === "string") {
        spanElement.textContent = content;
      }
      node.appendChild(spanElement);
      return node;
    },
    getId: () => "hintText",
    getPosition: () => {
      return {
        position: { lineNumber: 1, column: 1 },
        preference: [0 /* editor.ContentWidgetPositionPreference.EXACT */],
      };
    },
  };
};

export default TextEditor;
