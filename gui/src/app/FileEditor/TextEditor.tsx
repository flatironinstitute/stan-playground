/* eslint-disable @typescript-eslint/no-explicit-any */
import { SmallIconButton } from "@fi-sci/misc";
import { Editor, loader, useMonaco } from "@monaco-editor/react";
import { Save } from "@mui/icons-material";
import Link from "@mui/material/Link";
import { highlightJsData } from "@SpComponents/stanLang";
import { CodeMarker } from "@SpStanc/Linting";
import { editor, MarkerSeverity } from "monaco-editor";
import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";

loader.init().then((monacoInstance) => {
  console.log("monaco loaded! Setting up stan language");

  monacoInstance.editor.defineTheme("vs-stan", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "stanblock", foreground: "#C9A969", fontStyle: "bold" }, // seems like underscores in tokens are not allowed! (took me a while to figure this out)
      { token: "stanstatement", foreground: "#A8EEF7" },
      { token: "standistribution", foreground: "#9999FF" },
      { token: "stanfunction", foreground: "ffffaa" },
      { token: "stanrangeconstraint", foreground: "#D48331" },
      { token: "stanoperator", foreground: "#A8EEF7" },
      { token: "stantype", foreground: "#BD9BF8" },
      { token: "identifier", foreground: "#DDDDDD" },
      { token: "number", foreground: "#D48331" },
      { token: "string", foreground: "55ff55" },
    ],
    colors: {},
  });

  // use cpp as a base language and then add stan keywords
  const cppDef = monacoInstance.languages
    .getLanguages()
    .filter((l) => l.id === "cpp")[0];

  if (cppDef) {
    (cppDef as any).loader().then((loaded: any) => {
      const cppLang = loaded.language;
      const hjd = highlightJsData();
      const stanLang = { ...cppLang };
      stanLang.tokenizer = { ...cppLang.tokenizer };
      stanLang.tokenizer.root = [...cppLang.tokenizer.root];
      // stanLang.keywords = [...hjd.BLOCKS, ...hjd.STATEMENTS, ...hjd.DISTRIBUTIONS, ...hjd.FUNCTIONS, ...hjd.RANGE_CONSTRAINTS, ...hjd.TYPES]
      stanLang.keywords = [];
      stanLang.stan_blocks = hjd.BLOCKS;
      stanLang.stan_statements = hjd.STATEMENTS;
      stanLang.stan_distributions = hjd.DISTRIBUTIONS;
      stanLang.stan_functions = hjd.FUNCTIONS;
      stanLang.stan_range_constraints = hjd.RANGE_CONSTRAINTS;
      stanLang.stan_types = hjd.TYPES;
      stanLang.tokenizer.root = [
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              "@stan_blocks": "stanblock",
              "@stan_statements": "stanstatement",
              "@stan_distributions": "standistribution",
              "@stan_functions": "stanfunction",
              "@stan_range_constraints": "stanrangeconstraint",
              "@stan_types": "stantype",
              "@default": "identifier",
            },
          },
        ],
        [/~|:|\+=|=|<|>/, "stanoperator"],
        ...stanLang.tokenizer.root,
      ];
      monacoInstance.languages.register({ id: "stan" });
      monacoInstance.languages.setMonarchTokensProvider("stan", stanLang);
    });
  }
});

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
};

export type ToolbarItem =
  | {
      type: "button";
      tooltip?: string;
      label?: string;
      icon?: any;
      onClick?: () => void;
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
  wordWrap,
  toolbarItems,
  language,
  label,
  codeMarkers,
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
  // is it gives us access to the editor instance.
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

  return (
    <div className="EditorWithToolbar" onKeyDown={handleKeyDown}>
      <NotSelectable>
        <div className="EditorMenuBar">
          <span className="EditorTitle">{label}</span>
          &nbsp;&nbsp;&nbsp;
          {!readOnly && text !== editedText && (
            <SmallIconButton
              onClick={onSaveText}
              icon={<Save />}
              title="Save file"
              disabled={text === editedText}
              label="save"
            />
          )}
          &nbsp;&nbsp;&nbsp;
          {editedText !== text && <span className="EditedText">edited</span>}
          &nbsp;&nbsp;&nbsp;
          {readOnly && <span className="ReadOnlyText">read only</span>}
          &nbsp;&nbsp;&nbsp;
          {toolbarItems &&
            toolbarItems.map((item, i) => (
              <ToolbarItemComponent key={i} item={item} />
            ))}
        </div>
      </NotSelectable>
      <Editor
        defaultLanguage={language}
        onChange={handleChange}
        onMount={(editor, _) => setEditor(editor)}
        theme="vs-stan"
        options={{
          readOnly,
          domReadOnly: readOnly,
          wordWrap: wordWrap ? "on" : "off",
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

const ToolbarItemComponent: FunctionComponent<{ item: ToolbarItem }> = ({
  item,
}) => {
  if (item.type === "button") {
    const { onClick, color, label, tooltip, icon } = item;
    if (icon) {
      return (
        <span style={{ color }}>
          <SmallIconButton
            onClick={onClick}
            icon={icon}
            title={tooltip}
            label={label}
            disabled={!onClick}
          />
          &nbsp;&nbsp;&nbsp;
        </span>
      );
    } else {
      if (!onClick) {
        return (
          <span style={{ color: color || "gray" }} title={label}>
            {label}&nbsp;&nbsp;&nbsp;
          </span>
        );
      }
      return (
        <span>
          <Link
            onClick={onClick}
            color={color || "gray"}
            component="button"
            underline="none"
          >
            {label}
          </Link>
          &nbsp;&nbsp;&nbsp;
        </span>
      );
    }
  } else if (item.type === "text") {
    return (
      <span style={{ color: item.color || "gray" }} title={item.label}>
        {item.label}&nbsp;&nbsp;&nbsp;
      </span>
    );
  } else {
    return <span>unknown toolbar item type</span>;
  }
};

const NotSelectable: FunctionComponent<PropsWithChildren> = ({ children }) => {
  return <div className="NotSelectable">{children}</div>;
};

export default TextEditor;
