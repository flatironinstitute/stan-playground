import { FunctionComponent, useMemo } from "react";
import { Save } from "@mui/icons-material";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";

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

type ToolbarProps = {
  items: ToolbarItem[];
  label: string;
  onSaveText: () => void;
  edited: boolean;
  readOnly: boolean;
};

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
        color: "gray",
      });
    } else if (edited) {
      editorItems.push({
        type: "button",
        icon: <Save />,
        onClick: onSaveText,
        tooltip: "Save file",
        label: "Save",
      });
      editorItems.push({
        type: "text",
        label: "Edited",
        color: "red",
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
