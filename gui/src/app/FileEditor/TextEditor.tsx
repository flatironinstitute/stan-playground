/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor, loader, useMonaco } from "@monaco-editor/react";
import { Save } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import monacoAddStanLang from "@SpComponents/stanLang";
import { CodeMarker } from "@SpStanc/Linting";
import { editor, MarkerSeverity } from "monaco-editor";
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
};

export type ToolbarItem =
  | {
      type: "button";
      tooltip?: string;
      label?: string;
      icon?: any;
      onClick: () => void;
      color?: string;
    }
  | {
      type: "text";
      label: string;
      color?: string;
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

  /////////////////////////////////////////////////

  // Can't do this in the usual way with monaco editor:
  // See: https://github.com/microsoft/monaco-editor/issues/2947
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!readOnly) {
          onSaveText();
        }
      }
    },
    [onSaveText, readOnly],
  );

  const edited = useMemo(() => {
    return editedText !== text;
  }, [editedText, text]);

  return (
    <div className="EditorWithToolbar" onKeyDown={handleKeyDown}>
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

type ToolbarProps = {
  items: ToolbarItem[];
  label: string;
  onSaveText: () => void;
  edited: boolean;
  readOnly: boolean;
};

const ToolBar: FunctionComponent<ToolbarProps> = ({
  items,
  label,
  onSaveText,
  edited,
  readOnly,
}) => {
  const toolBarItems = useMemo(() => {
    const editorItems: ToolbarItem[] = [];

    if (!readOnly && edited) {
      editorItems.push({
        type: "button",
        icon: <Save />,
        onClick: onSaveText,
        tooltip: "Save file",
        label: "Save",
      });
    }

    if (edited) {
      editorItems.push({
        type: "text",
        label: "Edited",
        color: "red",
      });
    }

    if (readOnly) {
      editorItems.push({
        type: "text",
        label: "Read Only",
        color: "gray",
      });
    }

    return editorItems.concat(items);
  }, [edited, items, onSaveText, readOnly]);

  return (
    <div className="NotSelectable">
      <div className="EditorMenuBar">
        <span className="EditorTitle">{label}</span>
        {toolBarItems &&
          toolBarItems.map((item, i) => (
            <ToolbarItemComponent key={i} item={item} />
          ))}
      </div>
    </div>
  );
};

const ToolbarItemComponent: FunctionComponent<{ item: ToolbarItem }> = ({
  item,
}) => {
  if (item.type === "button") {
    const { onClick, color, label, tooltip, icon } = item;
    if (icon) {
      return (
        <span className="EditorToolbarItem" style={{ color }}>
          <Button
            startIcon={icon}
            onClick={onClick}
            disabled={!onClick}
            color="inherit"
            size="small"
            title={tooltip}
          >
            {label && <span className="ToolbarButtonText">{label}</span>}
          </Button>
        </span>
      );
    } else {
      return (
        <span className="EditorToolbarItem">
          <Link
            onClick={onClick}
            color={color || "gray"}
            component="button"
            underline="none"
            title={tooltip}
          >
            {label}
          </Link>
          &nbsp;&nbsp;&nbsp;
        </span>
      );
    }
  } else if (item.type === "text") {
    return (
      <span
        className="EditorToolbarItem"
        style={{ color: item.color || "gray" }}
        title={item.label}
      >
        {item.label}&nbsp;&nbsp;&nbsp;
      </span>
    );
  } else {
    return <span>unknown toolbar item type</span>;
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
