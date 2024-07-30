/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor, loader, useMonaco } from "@monaco-editor/react";

import monacoAddStanLang from "@SpComponents/stanLang";
import { ToolBar, ToolbarItem } from "@SpComponents/ToolBar";
import { CodeMarker } from "@SpStanc/Linting";
import {
  editor,
  IDisposable,
  KeyCode,
  KeyMod,
  MarkerSeverity,
} from "monaco-editor";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
      severity: toMonacoMarkerSeverity(marker.severity),
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
    if (!editorInstance) return;
    const disposable = editorInstance.addAction({
      id: "save",
      label: "Save",
      keybindings: [KeyMod.CtrlCmd | KeyCode.KeyS],
      run: () => {
        if (!readOnly) {
          onSaveText();
        }
      },
    });
    return () => {
      disposable.dispose();
    };
  }, [editorInstance, onSaveText, readOnly]);

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
        }}
      />
    </div>
  );
};

const toMonacoMarkerSeverity = (
  s: "error" | "warning" | "hint" | "info",
): MarkerSeverity => {
  switch (s) {
    case "error":
      return MarkerSeverity.Error;
    case "warning":
      return MarkerSeverity.Warning;
    case "hint":
      return MarkerSeverity.Hint;
    case "info":
      return MarkerSeverity.Info;
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
        preference: [editor.ContentWidgetPositionPreference.EXACT],
      };
    },
  };
};

export default TextEditor;
