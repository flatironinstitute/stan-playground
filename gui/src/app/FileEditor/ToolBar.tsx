import { FunctionComponent, use, useMemo } from "react";
import { Save } from "@mui/icons-material";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import { styled, useTheme } from "@mui/material/styles";
import { UserSettingsContext } from "@SpSettings/UserSettings";

type Palletes =
  | "primary"
  | "secondary"
  | "error"
  | "warning"
  | "info"
  | "success";

type Variant = "main" | "light" | "dark" | "contrastText";

export type ColorOptions = `${Palletes}.${Variant}` | Palletes;

export type ToolbarItem =
  | {
      type: "button";
      tooltip?: string;
      label?: string;
      icon?: any;
      onClick: () => void;
      color?: ColorOptions;
    }
  | {
      type: "text";
      label: string;
      color?: ColorOptions;
    };

type ToolbarProps = {
  items: ToolbarItem[];
  label: string;
  onSaveText: () => void;
  edited: boolean;
  readOnly: boolean;
};

const EditorMenuBar = styled("div")(({ theme }) => [
  {
    backgroundColor: theme.palette.grey[300],
  },
  theme.applyStyles("dark", {
    backgroundColor: theme.palette.grey[800],
  }),
]);

export const ToolBar: FunctionComponent<ToolbarProps> = ({
  items,
  label,
  onSaveText,
  edited,
  readOnly,
}) => {
  const toolBarItems = useMemo(() => {
    const editorItems: ToolbarItem[] = [];

    if (readOnly) {
      editorItems.push({
        type: "text",
        label: "Read Only",
      });
    } else if (edited) {
      editorItems.push({
        type: "button",
        icon: <Save />,
        onClick: onSaveText,
        tooltip: "Save file (Ctrl-S)",
        label: "Save",
      });
      editorItems.push({
        type: "text",
        label: "Edited",
        color: "error",
      });
    }

    return editorItems.concat(items);
  }, [edited, items, onSaveText, readOnly]);

  return (
    <div className="NotSelectable">
      <EditorMenuBar className="EditorMenuBar">
        <span className="EditorTitle">{label}</span>
        {toolBarItems &&
          toolBarItems.map((item, i) => (
            <ToolbarItemComponent key={i} item={item} />
          ))}
      </EditorMenuBar>
    </div>
  );
};

const ToolbarItemComponent: FunctionComponent<{ item: ToolbarItem }> = ({
  item,
}) => {
  const theme = useTheme();

  const { theme: userTheme } = use(UserSettingsContext);
  let color =
    userTheme === "light" ? theme.palette.grey[700] : theme.palette.grey[400];

  if (item.color) {
    const [pallete_color, color_variant] = item.color.split(".");
    const pallete = theme.vars.palette[pallete_color as Palletes];
    color = pallete[(color_variant ?? "main") as Variant];
  }

  if (item.type === "button") {
    const { onClick, label, tooltip, icon } = item;
    if (icon) {
      return (
        <span className="EditorToolbarItem" style={{ color }}>
          <IconButton
            onClick={onClick}
            disabled={!onClick}
            color="inherit"
            size="small"
            title={tooltip}
          >
            {icon}
            {label && <span className="ToolbarButtonText">{label}</span>}
          </IconButton>
        </span>
      );
    } else {
      return (
        <span className="EditorToolbarItem">
          <Link
            onClick={onClick}
            color={color}
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
      <span className="EditorToolbarItem" style={{ color }} title={item.label}>
        {item.label}&nbsp;&nbsp;&nbsp;
      </span>
    );
  } else {
    return <span>unknown toolbar item type</span>;
  }
};
